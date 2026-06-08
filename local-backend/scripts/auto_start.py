#!/usr/bin/env python3
"""
Auto Start Script for VNStock AI Backend
Starts: Node.js backend + Cloudflare tunnel + opens browser
"""
import subprocess
import sys
import os
import time
import json
import webbrowser

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
TUNNEL_EXE = os.path.join(BASE_DIR, "cloudflared.exe")

def log(msg):
    print(f"[AutoStart] {msg}", flush=True)

def kill_existing_processes():
    """Kill existing Node.js processes and free port 3004"""
    log("Killing existing Node.js processes...")
    try:
        subprocess.run(["taskkill", "/F", "/IM", "node.exe"], 
                       capture_output=True, timeout=10)
        time.sleep(2)
    except Exception:
        pass
    
    # Verify port 3004 is free
    import socket
    for attempt in range(5):
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(2)
            result = sock.connect_ex(('localhost', 3004))
            sock.close()
            if result != 0:
                log("Port 3004 is free")
                return True
            else:
                log(f"Port 3004 still in use (attempt {attempt+1}/5), retrying...")
                time.sleep(2)
                try:
                    subprocess.run(["taskkill", "/F", "/IM", "node.exe"], 
                                   capture_output=True, timeout=5)
                except Exception:
                    pass
        except Exception as e:
            log(f"Socket check error: {e}")
            time.sleep(1)
    
    log("Could not fully free port 3004, but will try to start anyway")
    return False

def start_backend():
    log("Starting Node.js backend on port 3004...")
    server_path = os.path.join(BASE_DIR, "server.js")
    proc = subprocess.Popen(
        ["node", server_path],
        cwd=BASE_DIR,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        creationflags=subprocess.CREATE_NEW_CONSOLE if sys.platform == "win32" else 0
    )
    # Wait a moment for server to start
    time.sleep(3)
    # Quick health check
    try:
        import urllib.request
        req = urllib.request.Request("http://localhost:3004/api/health", method="GET")
        with urllib.request.urlopen(req, timeout=5) as resp:
            if resp.status == 200:
                log("Backend health check: OK")
                return proc
    except Exception as e:
        log(f"Backend health check failed: {e}")
    return proc

def start_tunnel():
    log("Starting Cloudflare tunnel...")
    if not os.path.exists(TUNNEL_EXE):
        log("cloudflared.exe not found, skipping tunnel")
        return None
    proc = subprocess.Popen(
        [TUNNEL_EXE, "tunnel", "--url", "http://localhost:3004"],
        cwd=BASE_DIR,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        creationflags=subprocess.CREATE_NEW_CONSOLE if sys.platform == "win32" else 0
    )
    time.sleep(8)
    log("Tunnel started (check console for public URL)")
    return proc

def open_browser():
    log("Opening browser...")
    try:
        webbrowser.open("http://localhost:3004")
    except Exception as e:
        log(f"Could not open browser: {e}")

def main():
    log("=== VNStock AI Auto Start ===")
    
    # Kill existing processes first
    kill_existing_processes()
    
    backend_proc = start_backend()
    tunnel_proc = start_tunnel()
    open_browser()

    log("All services started. Press Ctrl+C to stop.")
    try:
        while True:
            time.sleep(1)
            # Check if backend died
            if backend_proc and backend_proc.poll() is not None:
                log("Backend process exited. Restarting...")
                backend_proc = start_backend()
    except KeyboardInterrupt:
        log("Shutting down...")
        if backend_proc:
            backend_proc.terminate()
        if tunnel_proc:
            tunnel_proc.terminate()
        log("Stopped.")

if __name__ == "__main__":
    main()
