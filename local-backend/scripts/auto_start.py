#!/usr/bin/env python3
"""
VNStock AI v3.0 - Auto Start Script
=====================================
Khoi dong toan bo he thong chi bang 1 lenh:
  1. Tim Node.js tu dong
  2. Kill process cu (tranh port conflict)
  3. Build frontend (neu can)
  4. Start backend (port 3004) - serve static dist/
  5. Start Cloudflare tunnel
  6. Parse tunnel URL tu stdout
  7. Cap nhat Telegram webhook
  8. Mo browser voi tunnel URL
  9. Health check + ghi log
  10. Giu script chay de giu cac process song

Usage: python auto_start.py
"""

import subprocess
import sys
import os
import time
import json
import re
import socket
import webbrowser
import urllib.request
import urllib.error
from pathlib import Path

# === CONFIG ===
APP_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BACKEND_DIR = os.path.join(APP_DIR, "local-backend")
DIST_DIR = os.path.join(APP_DIR, "dist")
TUNNEL_EXE = os.path.join(BACKEND_DIR, "cloudflared.exe")
LOG_FILE = os.path.join(APP_DIR, "auto-start.log")

# Node.js search paths
NODE_SEARCH_PATHS = [
    r"C:\Users\{}\AppData\Local\Programs\kimi-desktop\resources\resources\runtime".format(os.environ.get('USERNAME', 'user')),
    r"C:\Program Files\nodejs",
    r"C:\Program Files (x86)\nodejs",
    r"C:\Users\{}\AppData\Roaming\kimi-desktop\daimon-bundle\runtime".format(os.environ.get('USERNAME', 'user')),
]

# Credentials
TELEGRAM_TOKEN = "7055879874:AAE8PmCuPMMV7uyIiamDBNN5xZgWBctYIVc"
TELEGRAM_CHAT_ID = "6226786681"

# Colors
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    RESET = '\033[0m'

def log(msg, level="info"):
    """Log to console and file"""
    timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
    prefix = f"[{timestamp}]"
    
    if level == "ok":
        colored = f"{Colors.GREEN}{prefix} {msg}{Colors.RESET}"
    elif level == "error":
        colored = f"{Colors.RED}{prefix} {msg}{Colors.RESET}"
    elif level == "warn":
        colored = f"{Colors.YELLOW}{prefix} {msg}{Colors.RESET}"
    elif level == "highlight":
        colored = f"{Colors.CYAN}{prefix} {msg}{Colors.RESET}"
    else:
        colored = f"{Colors.BLUE}{prefix} {msg}{Colors.RESET}"
    
    print(colored, flush=True)
    
    # Write to log file
    try:
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(f"{prefix} [{level.upper()}] {msg}\n")
    except Exception:
        pass

def find_nodejs():
    """Find node.exe and npm.cmd automatically"""
    node_exe = None
    npm_cmd = None
    
    # Check common paths
    for path in NODE_SEARCH_PATHS:
        node = os.path.join(path, "node.exe")
        npm = os.path.join(path, "npm.cmd")
        if os.path.exists(node):
            node_exe = node
            if os.path.exists(npm):
                npm_cmd = npm
            else:
                npm = os.path.join(path, "npm.exe")
                if os.path.exists(npm):
                    npm_cmd = npm
            break
    
    # Fallback: try PATH
    if not node_exe:
        for cmd in ["node.exe", "node"]:
            try:
                result = subprocess.run([cmd, "--version"], capture_output=True, text=True, timeout=5)
                if result.returncode == 0:
                    node_exe = cmd
                    break
            except Exception:
                pass
    
    if not npm_cmd and node_exe:
        for cmd in ["npm.cmd", "npm"]:
            try:
                result = subprocess.run([cmd, "--version"], capture_output=True, text=True, timeout=5)
                if result.returncode == 0:
                    npm_cmd = cmd
                    break
            except Exception:
                pass
    
    return node_exe, npm_cmd

def kill_existing_processes():
    """Kill existing Node.js processes and free port 3004 + 5173"""
    log("Dang tat cac process cu (node.exe, cloudflared.exe, python.exe)...", "warn")
    
    # Phase 0: Kill NOT RESPONDING processes first (most stubborn)
    log("  Phase 0: Kill NOT RESPONDING processes...", "warn")
    for proc_name in ["node.exe", "cloudflared.exe", "python.exe", "cmd.exe"]:
        try:
            os.system(f'taskkill /F /FI "STATUS eq NOT RESPONDING" /IM {proc_name} >nul 2>&1')
        except Exception:
            pass
    time.sleep(1)
    
    # Phase 1: Kill by process name using os.system (no subprocess hang)
    log("  Phase 1: Kill by process name...", "warn")
    for proc_name in ["node.exe", "cloudflared.exe", "python.exe"]:
        try:
            # Kill 3 times with increasing force
            for _ in range(3):
                os.system(f"taskkill /F /T /IM {proc_name} >nul 2>&1")
                time.sleep(0.5)
        except Exception:
            pass
    time.sleep(2)
    
    # Phase 2: Kill by PID using netstat + taskkill (for stubborn processes)
    log("  Phase 2: Kill by PID from netstat...", "warn")
    def kill_port_process(port):
        try:
            # Use os.popen instead of subprocess to avoid hang
            fp = os.popen(f'netstat -ano | findstr :{port}')
            lines = fp.read().strip().split('\n')
            fp.close()
            for line in lines:
                parts = line.strip().split()
                if len(parts) >= 5 and ('LISTENING' in line or 'ESTABLISHED' in line):
                    pid = parts[-1]
                    if pid.isdigit():
                        log(f"    Tim thay process PID {pid} tren port {port}", "warn")
                        # Kill with /T (terminate tree) and /F (force)
                        for _ in range(3):
                            os.system(f"taskkill /F /T /PID {pid} >nul 2>&1")
                            time.sleep(0.5)
        except Exception as e:
            log(f"    Loi kill port {port}: {e}", "warn")
    
    kill_port_process(3004)
    kill_port_process(5173)
    time.sleep(2)
    
    # Phase 3: Kill all node.exe using wmic (nuclear option)
    log("  Phase 3: Nuclear option (wmic)...", "warn")
    try:
        os.system("wmic process where \"name='node.exe'\" delete >nul 2>&1")
        os.system("wmic process where \"name='cloudflared.exe'\" delete >nul 2>&1")
        os.system("wmic process where \"name='python.exe'\" delete >nul 2>&1")
    except Exception:
        pass
    time.sleep(2)
    
    # Phase 4: PowerShell nuclear option (most reliable on Windows)
    log("  Phase 4: PowerShell Stop-Process...", "warn")
    try:
        ps_cmd = (
            'powershell -Command "'
            'Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force; '
            'Get-Process cloudflared -ErrorAction SilentlyContinue | Stop-Process -Force; '
            'Get-Process python -ErrorAction SilentlyContinue | Stop-Process -Force; '
            '"'
        )
        os.system(ps_cmd + " >nul 2>&1")
    except Exception:
        pass
    time.sleep(2)
    
    # Phase 5: Verify ports are free with extended retry
    log("  Phase 5: Verify ports free...", "warn")
    ports_to_check = [3004, 5173]
    all_free = True
    
    for port in ports_to_check:
        port_free = False
        for attempt in range(10):  # Increased from 8 to 10
            try:
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(2)
                result = sock.connect_ex(('localhost', port))
                sock.close()
                if result != 0:
                    log(f"    Port {port} da tu do", "ok")
                    port_free = True
                    break
                else:
                    log(f"    Port {port} van dang su dung (lan thu {attempt+1}/10)...", "warn")
                    # Try killing again with all methods
                    os.system("taskkill /F /T /IM node.exe >nul 2>&1")
                    os.system("taskkill /F /T /IM cloudflared.exe >nul 2>&1")
                    kill_port_process(port)
                    time.sleep(2 if attempt < 5 else 4)
            except Exception as e:
                log(f"    Loi kiem tra port {port}: {e}", "error")
                time.sleep(1)
        
        if not port_free:
            log(f"    KHONG THE giai phong port {port} hoan toan!", "error")
            log(f"    Phuong an khac phuc:", "warn")
            log(f"      1. Mo Task Manager → tim node.exe/cloudflared.exe → End Task", "warn")
            log(f"      2. Hoac chay: taskkill /F /IM node.exe && taskkill /F /IM cloudflared.exe", "warn")
            log(f"      3. Hoac restart may tinh", "warn")
            all_free = False
    
    if not all_free:
        log("Mot so port van bi chiem. Se co gang khoi dong nhung co the gap loi...", "warn")
    
    return all_free

def build_frontend(npm_cmd):
    """Build frontend if needed"""
    log("Kiem tra can build frontend khong...")
    
    if not os.path.exists(DIST_DIR):
        log("dist/ khong ton tai. Can build frontend.", "warn")
        need_build = True
    else:
        # Check if src is newer than dist
        need_build = False
        try:
            dist_mtime = max(
                os.path.getmtime(os.path.join(root, f))
                for root, _, files in os.walk(DIST_DIR)
                for f in files
            )
            src_dir = os.path.join(APP_DIR, "src")
            if os.path.exists(src_dir):
                src_mtime = max(
                    os.path.getmtime(os.path.join(root, f))
                    for root, _, files in os.walk(src_dir)
                    for f in files if f.endswith(('.tsx', '.ts', '.css', '.html', '.js'))
                )
                root_index = os.path.join(APP_DIR, "index.html")
                if os.path.exists(root_index):
                    src_mtime = max(src_mtime, os.path.getmtime(root_index))
                
                if src_mtime > dist_mtime:
                    diff_min = round((src_mtime - dist_mtime) / 60)
                    log(f"Source da thay doi {diff_min} phut sau lan build cuoi. Dang build lai...", "warn")
                    need_build = True
                else:
                    log("dist/ da moi nhat. Khong can build.", "ok")
        except Exception as e:
            log(f"Loi kiem tra build freshness: {e}", "warn")
            need_build = True
    
    if need_build:
        log("Dang build frontend (npm run build)...")
        try:
            result = subprocess.run(
                [npm_cmd, "run", "build"],
                cwd=APP_DIR,
                capture_output=True,
                text=True,
                timeout=180
            )
            if result.returncode != 0:
                log(f"Build that bai:\n{result.stderr}", "error")
                return False
            
            # Count files
            file_count = 0
            total_size = 0
            for root, _, files in os.walk(DIST_DIR):
                for f in files:
                    file_count += 1
                    total_size += os.path.getsize(os.path.join(root, f))
            
            size_mb = round(total_size / 1024 / 1024, 2)
            log(f"Build thanh cong! {file_count} files, {size_mb} MB", "ok")
            return True
        except subprocess.TimeoutExpired:
            log("Build timeout (180s)", "error")
            return False
        except Exception as e:
            log(f"Build loi: {e}", "error")
            return False
    
    return True

def start_backend(node_exe):
    """Start Node.js backend server"""
    log("Dang khoi dong backend (port 3004)...")
    server_path = os.path.join(BACKEND_DIR, "server.js")
    
    if not os.path.exists(server_path):
        log(f"Khong tim thay server.js: {server_path}", "error")
        return None
    
    try:
        proc = subprocess.Popen(
            [node_exe, server_path],
            cwd=BACKEND_DIR,
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
                        log(f"Backend OK (v{data.get('version', '?')})", "ok")
                        return proc
            except Exception:
                time.sleep(1)
        
        log("Backend da khoi dong nhung health check chua thanh cong", "warn")
        return proc
        
    except Exception as e:
        log(f"Loi khoi dong backend: {e}", "error")
        return None

def start_frontend_dev(node_exe, npm_cmd):
    """Start Vite frontend dev server (port 5173)"""
    log("Dang khoi dong frontend dev server (port 5173)...")
    
    if not npm_cmd:
        log("Khong tim thay npm. Bo qua frontend dev server.", "warn")
        return None
    
    # Check node_modules exists
    node_modules = os.path.join(APP_DIR, "node_modules")
    if not os.path.exists(node_modules):
        log("node_modules khong ton tai. Dang chay npm install...", "warn")
        try:
            result = subprocess.run(
                [npm_cmd, "install"],
                cwd=APP_DIR,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                timeout=180
            )
            if result.returncode != 0:
                log(f"npm install that bai: {result.stderr[:200]}", "error")
                return None
            log("npm install thanh cong", "ok")
        except Exception as e:
            log(f"npm install loi: {e}", "error")
            return None
    
    try:
        proc = subprocess.Popen(
            [npm_cmd, "run", "dev"],
            cwd=APP_DIR,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            creationflags=subprocess.CREATE_NEW_CONSOLE if sys.platform == "win32" else 0
        )
        
        # Wait for dev server to start
        time.sleep(5)
        
        # Check if port 5173 is open
        for attempt in range(5):
            try:
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(2)
                result = sock.connect_ex(('localhost', 5173))
                sock.close()
                if result == 0:
                    log("Frontend dev server OK (port 5173)", "ok")
                    return proc
            except Exception:
                pass
            time.sleep(1)
        
        log("Frontend dev server da khoi dong nhung port 5173 chua san sang", "warn")
        return proc
        
    except Exception as e:
        log(f"Loi khoi dong frontend dev: {e}", "error")
        return None

def start_tunnel():
    """Start Cloudflare tunnel and parse public URL"""
    log("Dang khoi dong Cloudflare tunnel...")
    
    if not os.path.exists(TUNNEL_EXE):
        log(f"Khong tim thay cloudflared.exe: {TUNNEL_EXE}", "warn")
        log("Tai ve tu: https://github.com/cloudflare/cloudflared/releases", "warn")
        return None, None
    
    try:
        proc = subprocess.Popen(
            [TUNNEL_EXE, "tunnel", "--url", "http://localhost:3004"],
            cwd=BACKEND_DIR,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            creationflags=subprocess.CREATE_NEW_CONSOLE if sys.platform == "win32" else 0
        )
        
        # Parse tunnel URL from stdout
        tunnel_url = None
        start_time = time.time()
        
        log("Dang cho tunnel URL (toi da 30 giay)...")
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
            log(f"Tunnel URL: {tunnel_url}", "highlight")
        else:
            log("Tunnel da khoi dong nhung khong the parse URL. Xem cua so tunnel.", "warn")
        
        return proc, tunnel_url
        
    except Exception as e:
        log(f"Loi khoi dong tunnel: {e}", "error")
        return None, None

def update_telegram_webhook(tunnel_url):
    """Update Telegram webhook with tunnel URL"""
    if not tunnel_url:
        log("Khong co tunnel URL, bo qua cap nhat webhook", "warn")
        return False
    
    webhook_url = f"{tunnel_url}/api/telegram/webhook"
    log(f"Dang cap nhat Telegram webhook: {webhook_url}")
    
    try:
        # First delete existing webhook to avoid 400 error
        try:
            del_req = urllib.request.Request(
                f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/deleteWebhook",
                method="POST",
                headers={"Content-Type": "application/json"},
                data=json.dumps({"drop_pending_updates": True}).encode()
            )
            with urllib.request.urlopen(del_req, timeout=15) as resp:
                del_data = json.loads(resp.read())
                if del_data.get("ok"):
                    log("Da xoa webhook cu", "ok")
        except Exception as e:
            log(f"Khong the xoa webhook cu: {e}", "warn")
        
        # Now set new webhook
        req = urllib.request.Request(
            f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/setWebhook",
            method="POST",
            headers={"Content-Type": "application/json"},
            data=json.dumps({"url": webhook_url}).encode()
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read())
            if data.get("ok"):
                log("Telegram webhook da cap nhat", "ok")
                return True
            else:
                log(f"Webhook that bai: {data.get('description', 'unknown')}", "warn")
                return False
    except Exception as e:
        log(f"Loi cap nhat webhook: {e}", "warn")
        return False

def open_browser(url):
    """Open browser with the given URL"""
    log(f"Dang mo trinh duyet: {url}")
    try:
        webbrowser.open(url)
        log("Da mo trinh duyet", "ok")
        return True
    except Exception as e:
        log(f"Khong the mo trinh duyet: {e}", "warn")
        return False

def test_endpoints():
    """Test all important endpoints"""
    log("Dang test cac endpoint...")
    
    tests = [
        ("Health", "http://localhost:3004/api/health"),
        ("Health All", "http://localhost:3004/api/health/all"),
        ("Registry", "http://localhost:3004/api/registry"),
        ("Templates", "http://localhost:3004/api/report-templates"),
        ("Settings", "http://localhost:3004/api/db/settings"),
        ("NotebookLM Status", "http://localhost:3004/api/notebooklm/status"),
        ("n8n Test", "http://localhost:3004/api/n8n/test"),
    ]
    
    results = []
    for name, url in tests:
        try:
            req = urllib.request.Request(url, method="GET")
            with urllib.request.urlopen(req, timeout=5) as resp:
                status = "OK" if resp.status == 200 else f"HTTP {resp.status}"
                results.append((name, status, True))
        except Exception as e:
            results.append((name, f"FAIL ({str(e)[:30]})", False))
    
    for name, status, ok in results:
        level = "ok" if ok else "warn"
        log(f"  {name}: {status}", level)
    
    all_ok = all(ok for _, _, ok in results)
    if all_ok:
        log("Tat ca endpoint OK", "ok")
    else:
        log("Mot so endpoint that bai", "warn")
    
    return all_ok

def print_summary(tunnel_url):
    """Print summary of all access channels"""
    print()
    print("=" * 60)
    log(f"{Colors.CYAN}VNStock AI v3.0 DA SAN SANG!{Colors.RESET}", "highlight")
    print("=" * 60)
    print()
    
    if tunnel_url:
        log(f"{Colors.GREEN}TRUY CAP TU XA (moi thiet bi):{Colors.RESET}", "highlight")
        log(f"  {Colors.CYAN}{tunnel_url}{Colors.RESET}", "highlight")
        print()
    
    log(f"{Colors.BLUE}TRUY CAP LOCAL (may nay):{Colors.RESET}", "info")
    log(f"  Frontend: http://localhost:5173", "info")
    log(f"  Backend API: http://localhost:3004", "info")
    print()
    
    log(f"{Colors.YELLOW}TELEGRAM BOT:{Colors.RESET}", "info")
    log(f"  @HuuVangbot", "info")
    print()
    
    log(f"{Colors.YELLOW}GITHUB PAGES (chi giao dien):{Colors.RESET}", "info")
    log(f"  https://seeyeahall.github.io/vnstock-ai/", "info")
    print()
    
    print("=" * 60)
    log("LUU Y QUAN TRONG:", "warn")
    log("  - Giua cua so backend mo de API hoat dong", "warn")
    log("  - Giua cua so tunnel mo de truy cap tu xa", "warn")
    log("  - URL tunnel thay doi moi lan khoi dong lai", "warn")
    log("  - Nhan Ctrl+C de dung tat ca dich vu", "warn")
    print("=" * 60)
    print()

def main():
    print()
    print("=" * 60)
    print("  VNStock AI v3.0 - Auto Start")
    print("  Backend + Tunnel + Browser")
    print("=" * 60)
    print()
    
    # Clear log file
    try:
        with open(LOG_FILE, "w", encoding="utf-8") as f:
            f.write(f"VNStock AI v3.0 Auto Start Log - {time.strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write("=" * 60 + "\n")
    except Exception:
        pass
    
    # Step 1: Find Node.js
    log("Buoc 1/8: Tim Node.js...")
    node_exe, npm_cmd = find_nodejs()
    
    if not node_exe:
        log("KHONG TIM THAY Node.js!", "error")
        log("Da tim o:", "error")
        for p in NODE_SEARCH_PATHS:
            log(f"  - {p}", "error")
        log("Vui long cai dat Node.js hoac them vao PATH", "error")
        log("Phuong an khac phuc:", "warn")
        log("  1. Cai dat Node.js tu https://nodejs.org", "warn")
        log("  2. Hoac chay thu cong: cd local-backend && node server.js", "warn")
        input("Nhan Enter de thoat...")
        return 1
    
    log(f"Node.js: {node_exe}", "ok")
    if npm_cmd:
        log(f"npm: {npm_cmd}", "ok")
    else:
        log("npm khong tim thay. Frontend dev server se khong khoi dong.", "warn")
        log("Phuong an khac phuc: Cai dat Node.js day du (co kem npm)", "warn")
    
    # Step 2: Kill existing processes
    log("Buoc 2/8: Tat cac process cu...")
    kill_existing_processes()
    
    # Step 3: Build frontend
    log("Buoc 3/8: Build frontend...")
    if npm_cmd:
        build_frontend(npm_cmd)
    else:
        log("Bo qua build (khong co npm)", "warn")
    
    # Step 4: Start backend
    log("Buoc 4/8: Khoi dong backend...")
    backend_proc = start_backend(node_exe)
    if not backend_proc:
        log("KHONG THE KHOI DONG BACKEND!", "error")
        log("Kiem tra: node server.js trong local-backend/ de xem loi chi tiet", "warn")
        input("Nhan Enter de thoat...")
        return 1
    
    # Step 5: Start frontend dev server
    log("Buoc 5/8: Khoi dong frontend dev server...")
    frontend_proc = start_frontend_dev(node_exe, npm_cmd)
    if not frontend_proc:
        log("Frontend dev server khong khoi dong duoc. Se dung static dist/ tu backend.", "warn")
    
    # Step 6: Start tunnel
    log("Buoc 6/8: Khoi dong Cloudflare tunnel...")
    tunnel_proc, tunnel_url = start_tunnel()
    
    # Step 7: Update webhook
    log("Buoc 7/8: Cap nhat Telegram webhook...")
    if tunnel_url:
        update_telegram_webhook(tunnel_url)
    
    # Step 8: Open browser and test
    log("Buoc 8/8: Mo trinh duyet va test...")
    
    # Open browser with localhost:5173 (dev server) for best experience
    # Fallback to tunnel URL if dev server not available
    if frontend_proc:
        browser_url = "http://localhost:5173"
    else:
        browser_url = tunnel_url if tunnel_url else "http://localhost:3004"
    open_browser(browser_url)
    
    # Test endpoints
    time.sleep(2)
    test_endpoints()
    
    # Print summary
    print_summary(tunnel_url)
    
    # Keep running
    log("Dang giu cac dich vu hoat dong... (Ctrl+C de dung)")
    try:
        while True:
            time.sleep(1)
            
            # Check if backend died
            if backend_proc and backend_proc.poll() is not None:
                log("Backend da tat. Dang khoi dong lai...", "warn")
                backend_proc = start_backend(node_exe)
            
            # Check if frontend dev server died
            if frontend_proc and frontend_proc.poll() is not None:
                log("Frontend dev server da tat. Dang khoi dong lai...", "warn")
                frontend_proc = start_frontend_dev(node_exe, npm_cmd)
            
            # Check if tunnel died
            if tunnel_proc and tunnel_proc.poll() is not None:
                log("Tunnel da tat. Dang khoi dong lai...", "warn")
                tunnel_proc, tunnel_url = start_tunnel()
                if tunnel_url:
                    update_telegram_webhook(tunnel_url)
    
    except KeyboardInterrupt:
        print()
        log("Dang tat cac dich vu...", "warn")
        if backend_proc:
            backend_proc.terminate()
            log("Backend da tat", "ok")
        if frontend_proc:
            frontend_proc.terminate()
            log("Frontend dev server da tat", "ok")
        if tunnel_proc:
            tunnel_proc.terminate()
            log("Tunnel da tat", "ok")
        log("Tam biet!", "ok")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
