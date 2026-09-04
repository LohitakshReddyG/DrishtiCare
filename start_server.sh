#!/bin/bash
echo "Starting DR Screening Prototype Local Server on http://localhost:8085..."
cd /Users/devendrakumar/.gemini/antigravity/scratch/dr-explainable-ai
python3 -m http.server 8085
