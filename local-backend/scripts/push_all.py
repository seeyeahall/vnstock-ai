#!/usr/bin/env python3
"""
Push All Script for VNStock AI v3.0
Tự động hóa toàn bộ quy trình deploy:
1. Build frontend
2. Start backend
3. Create Cloudflare tunnel
4. Push GitHub Pages
5. Update Telegram webhook
6. Open browser
7. Test endpoints

Usage: python push_all.py
"""
import subprocess
import sys
import os
import time
import json
import re
import webbrowser
import urllib.request
import urllib.error

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APP_DIR = os.path.dirname(BASE_DIR)
NODE_DIR = r"C:\Users\NHVANG\AppData\Local\Programs\kimi-desktop\resources\resources\runtime"
NPM_CMD = os.path.join(NODE_DIR, "npm.cmd")
NODE_CMD = os.path.join(NODE_DIR, "node.exe")
TUNNEL_EXE = os.path.join(BASE_DIR, "cloudflared.exe")

# Credentials
TELEGRAM_TOKEN = "7055879874:AAE8PmCuPMMV7uyIiamDBNN5xZgWBctYIVc"
TELEGRAM_CHAT_ID = "6226786681"
GITHUB_REPO = "seeyeahall/vnstock-ai"

# Colors for terminal output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'

def log(step, msg, status="info"):
    prefix = f"[{step}/7]"
    if status == "ok":
        print(f"{Colors.GREEN}{prefix} {msg}{Colors.RESET}")
    elif status == "error":
        print(f"{Colors.RED}{prefix} {msg}{Colors.RESET}")
    elif status == "warn":
        print(f"{Colors.YELLOW}{prefix} {msg}{Colors.RESET}")
    else:
        print(f"{Colors.BLUE}{prefix} {msg}{Colors.RESET}")

def run_cmd(cmd, cwd=None, timeout=120, shell=False):
    """Run a command and return (stdout, stderr, returncode)"""
    try:
        if isinstance(cmd, str):
            cmd = cmd.split()
        result = subprocess.run(
            cmd,
            cwd=cwd or APP_DIR,
            capture_output=True,
            text=True,
            timeout=timeout,
            shell=shell
        )
        return result.stdout, result.stderr, result.returncode
    except subprocess.TimeoutExpired:
        return "", "Timeout", -1
    except Exception as e:
        return "", str(e), -1

def step1_build():
    """Build frontend with npm"""
    log(1, "Building frontend (npm run build)...")
    
    # Check if build is needed
    import shutil
    dist_dir = os.path.join(APP_DIR, "dist")
    src_dir = os.path.join(APP_DIR, "src")
    
    if os.path.exists(dist_dir) and os.path.exists(src_dir):
        dist_mtime = max(
            os.path.getmtime(os.path.join(root, f))
            for root, _, files in os.walk(dist_dir)
            for f in files
        )
        src_mtime = max(
            os.path.getmtime(os.path.join(root, f))
            for root, _, files in os.walk(src_dir)
            for f in files if f.endswith(('.tsx', '.ts', '.css', '.html', '.js'))
        )
        root_index = os.path.join(APP_DIR, "index.html")
        if os.path.exists(root_index):
            src_mtime = max(src_mtime, os.path.getmtime(root_index))
        
        if dist_mtime >= src_mtime:
            log(1, f"Build is already fresh (dist newer than src). Skipping build.", "ok")
            return True
        else:
            diff_min = round((src_mtime - dist_mtime) / 60)
            log(1, f"Source changed {diff_min} min after last build. Rebuilding...", "warn")
    
    stdout, stderr, rc = run_cmd([NPM_CMD, "run", "build"], cwd=APP_DIR, timeout=180)
    if rc != 0:
        log(1, f"Build failed:\n{stderr}", "error")
        return False
    
    # Check dist exists
    if not os.path.exists(dist_dir):
        log(1, "dist/ folder not found after build", "error")
        return False
    
    # Count files and total size
    file_count = 0
    total_size = 0
    for root, _, files in os.walk(dist_dir):
        for f in files:
            file_count += 1
            total_size += os.path.getsize(os.path.join(root, f))
    
    size_mb = round(total_size / 1024 / 1024, 2)
    log(1, f"Build complete. {file_count} files, {size_mb} MB in dist/", "ok")
    return True

def step2_start_backend():
    """Start Node.js backend"""
    log(2, "Starting backend on port 3004...")
    server_path = os.path.join(BASE_DIR, "server.js")
    
    proc = subprocess.Popen(
        [NODE_CMD, server_path],
        cwd=BASE_DIR,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        creationflags=subprocess.CREATE_NEW_CONSOLE if sys.platform == "win32" else 0
    )
    
    # Wait for server to start
    time.sleep(4)
    
    # Health check
    for attempt in range(5):
        try:
            req = urllib.request.Request("http://localhost:3004/api/health", method="GET")
            with urllib.request.urlopen(req, timeout=5) as resp:
                if resp.status == 200:
                    data = json.loads(resp.read())
                    log(2, f"Backend OK (v{data.get('version', '?')})", "ok")
                    return proc
        except Exception:
            time.sleep(1)
    
    log(2, "Backend health check failed, but process started", "warn")
    return proc

def step3_start_tunnel():
    """Start Cloudflare tunnel and parse public URL"""
    log(3, "Starting Cloudflare tunnel...")
    
    if not os.path.exists(TUNNEL_EXE):
        log(3, "cloudflared.exe not found, skipping tunnel", "warn")
        return None, None
    
    proc = subprocess.Popen(
        [TUNNEL_EXE, "tunnel", "--url", "http://localhost:3004"],
        cwd=BASE_DIR,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        creationflags=subprocess.CREATE_NEW_CONSOLE if sys.platform == "win32" else 0
    )
    
    # Parse tunnel URL from stdout (with timeout)
    tunnel_url = None
    start_time = time.time()
    
    while time.time() - start_time < 30:
        line = proc.stdout.readline()
        if not line:
            time.sleep(0.5)
            continue
        
        # cloudflared output: "https://abc123.trycloudflare.com"
        match = re.search(r'(https://[\w-]+\.trycloudflare\.com)', line)
        if match:
            tunnel_url = match.group(1)
            break
        
        # Alternative pattern
        match2 = re.search(r'https://[\w-]+\.trycloudflare\.com', line)
        if match2:
            tunnel_url = match2.group(0)
            break
    
    if tunnel_url:
        log(3, f"Tunnel URL: {tunnel_url}", "ok")
    else:
        log(3, "Tunnel started but could not parse URL (check console)", "warn")
    
    return proc, tunnel_url

def step4_push_ghpages():
    """Push dist/ to gh-pages branch"""
    log(4, "Pushing to GitHub Pages...")
    
    # Stash current work
    run_cmd(["git", "stash"], cwd=APP_DIR, timeout=10)
    
    # Checkout gh-pages
    stdout, stderr, rc = run_cmd(["git", "checkout", "gh-pages"], cwd=APP_DIR, timeout=10)
    if rc != 0 and "already exists" not in stderr:
        log(4, f"Could not checkout gh-pages: {stderr}", "warn")
        run_cmd(["git", "checkout", "upgrade-v3.0"], cwd=APP_DIR, timeout=10)
        run_cmd(["git", "stash", "pop"], cwd=APP_DIR, timeout=10)
        return False
    
    # Copy dist files to root
    dist_dir = os.path.join(APP_DIR, "dist")
    if not os.path.exists(dist_dir):
        log(4, "dist/ not found", "error")
        run_cmd(["git", "checkout", "upgrade-v3.0"], cwd=APP_DIR, timeout=10)
        return False
    
    # Copy files (skip node_modules, local-backend, etc.)
    import shutil
    for item in os.listdir(dist_dir):
        src = os.path.join(dist_dir, item)
        dst = os.path.join(APP_DIR, item)
        
        if os.path.isdir(src):
            if os.path.exists(dst):
                shutil.rmtree(dst)
            shutil.copytree(src, dst)
        else:
            shutil.copy2(src, dst)
    
    # Commit and push
    run_cmd(["git", "add", "."], cwd=APP_DIR, timeout=10)
    stdout, stderr, rc = run_cmd(
        ["git", "commit", "-m", f"deploy: {time.strftime('%Y-%m-%d %H:%M:%S')}"],
        cwd=APP_DIR, timeout=10
    )
    
    if rc != 0 and "nothing to commit" not in stderr:
        log(4, f"Commit issue: {stderr}", "warn")
    
    stdout, stderr, rc = run_cmd(["git", "push", "origin", "gh-pages"], cwd=APP_DIR, timeout=30)
    if rc != 0:
        log(4, f"Push failed: {stderr}", "error")
        run_cmd(["git", "checkout", "upgrade-v3.0"], cwd=APP_DIR, timeout=10)
        run_cmd(["git", "stash", "pop"], cwd=APP_DIR, timeout=10)
        return False
    
    log(4, "GitHub Pages deployed! https://seeyeahall.github.io/vnstock-ai/", "ok")
    
    # Switch back
    run_cmd(["git", "checkout", "upgrade-v3.0"], cwd=APP_DIR, timeout=10)
    run_cmd(["git", "stash", "pop"], cwd=APP_DIR, timeout=10)
    return True

def step5_update_webhook(tunnel_url):
    """Update Telegram webhook"""
    log(5, "Updating Telegram webhook...")
    
    if not tunnel_url:
        log(5, "No tunnel URL, skipping webhook update", "warn")
        return False
    
    webhook_url = f"{tunnel_url}/api/telegram/webhook"
    
    try:
        req = urllib.request.Request(
            f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/setWebhook",
            method="POST",
            headers={"Content-Type": "application/json"},
            data=json.dumps({"url": webhook_url}).encode()
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read())
            if data.get("ok"):
                log(5, f"Webhook set: {webhook_url}", "ok")
                return True
            else:
                log(5, f"Webhook failed: {data.get('description', 'unknown')}", "warn")
                return False
    except Exception as e:
        log(5, f"Webhook error: {e}", "warn")
        return False

def step6_open_browser(tunnel_url):
    """Open browser with both local and tunnel URLs"""
    log(6, "Opening browser...")
    
    try:
        # Open local first
        webbrowser.open("http://localhost:3004")
        
        # Open tunnel URL if available
        if tunnel_url:
            time.sleep(1)
            webbrowser.open(tunnel_url)
        
        log(6, "Browser opened", "ok")
        return True
    except Exception as e:
        log(6, f"Could not open browser: {e}", "warn")
        return False

def step7_test():
    """Test all endpoints"""
    log(7, "Testing endpoints...")
    
    tests = [
        ("Health", "http://localhost:3004/api/health"),
        ("Health All", "http://localhost:3004/api/health/all"),
        ("Registry", "http://localhost:3004/api/registry"),
        ("Templates", "http://localhost:3004/api/report-templates"),
        ("Settings", "http://localhost:3004/api/db/settings"),
    ]
    
    results = []
    for name, url in tests:
        try:
            req = urllib.request.Request(url, method="GET")
            with urllib.request.urlopen(req, timeout=5) as resp:
                status = "OK" if resp.status == 200 else f"HTTP {resp.status}"
                results.append(f"  {name}: {status}")
        except Exception as e:
            results.append(f"  {name}: FAIL ({str(e)[:30]})")
    
    for r in results:
        print(f"    {r}")
    
    all_ok = all("OK" in r for r in results)
    if all_ok:
        log(7, "All endpoints OK", "ok")
    else:
        log(7, "Some endpoints failed (see above)", "warn")
    
    return all_ok

def main():
    print(f"\n{'='*60}")
    print(f"  VNStock AI v3.0 — Push All")
    print(f"  Build → Backend → Tunnel → GitHub Pages → Webhook → Browser → Test")
    print(f"{'='*60}\n")
    
    # Step 1: Build
    if not step1_build():
        print(f"\n{Colors.RED}Push All aborted at Step 1.{Colors.RESET}")
        return 1
    
    # Step 2: Start Backend
    backend_proc = step2_start_backend()
    
    # Step 3: Start Tunnel
    tunnel_proc, tunnel_url = step3_start_tunnel()
    
    # Step 4: Push GitHub Pages
    step4_push_ghpages()
    
    # Step 5: Update Webhook
    step5_update_webhook(tunnel_url)
    
    # Step 6: Open Browser
    step6_open_browser(tunnel_url)
    
    # Step 7: Test
    step7_test()
    
    # Summary
    print(f"\n{'='*60}")
    print(f"  {Colors.GREEN}Push All Complete!{Colors.RESET}")
    print(f"  Local:     http://localhost:3004")
    if tunnel_url:
        print(f"  Tunnel:    {tunnel_url}")
    print(f"  GitHub:    https://seeyeahall.github.io/vnstock-ai/")
    print(f"  Telegram:  @HuuVangbot")
    print(f"{'='*60}")
    print(f"\n  Press Ctrl+C to stop backend and tunnel.")
    
    # Keep running
    try:
        while True:
            time.sleep(1)
            if backend_proc and backend_proc.poll() is not None:
                print(f"\n{Colors.YELLOW}Backend exited. Restarting...{Colors.RESET}")
                backend_proc = step2_start_backend()
    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}Shutting down...{Colors.RESET}")
        if backend_proc:
            backend_proc.terminate()
        if tunnel_proc:
            tunnel_proc.terminate()
        print(f"{Colors.GREEN}Stopped.{Colors.RESET}")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
