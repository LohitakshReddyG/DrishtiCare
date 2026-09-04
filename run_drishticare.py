"""
DrishtiCare - Unified Launcher Script
Starts FastAPI backend on http://localhost:8000 and Vite React frontend on http://localhost:5173.
"""

import os
import sys
import subprocess
import time
import webbrowser

def main():
    print("=========================================================")
    print("  DrishtiCare — Explainable AI DR Screening & Telemedicine")
    print("  Smart India Hackathon 2026 · Problem Statement 26038")
    print("=========================================================")
    
    root_dir = os.path.dirname(os.path.abspath(__file__))
    backend_cmd = [sys.executable, "-m", "uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
    frontend_cmd = "npm run dev"

    print("\n[1/2] Starting FastAPI Backend on http://localhost:8000 ...")
    backend_proc = subprocess.Popen(backend_cmd, cwd=root_dir)

    time.sleep(2)

    print("\n[2/2] Starting React Frontend on http://localhost:5173 ...")
    frontend_dir = os.path.join(root_dir, "frontend")
    frontend_proc = subprocess.Popen(frontend_cmd, cwd=frontend_dir, shell=True)

    print("\n" + "=" * 55)
    print("  Application Running Successfully!")
    print("  - Frontend UI:  http://localhost:5173")
    print("  - Backend API:  http://localhost:8000/docs")
    print("=========================================================\n")

    try:
        backend_proc.wait()
        frontend_proc.wait()
    except KeyboardInterrupt:
        print("\nStopping DrishtiCare servers...")
        backend_proc.terminate()
        frontend_proc.terminate()

if __name__ == "__main__":
    main()
