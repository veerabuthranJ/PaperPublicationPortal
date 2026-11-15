#!/bin/bash
# Quick Deployment Script for Linux/Mac
# This pushes your code to GitHub so you can deploy on Render

echo "========================================"
echo " College Publications - Deploy to Render"
echo "========================================"
echo ""

echo "Pushing code to GitHub..."
git push origin master

if [ $? -eq 0 ]; then
    echo ""
    echo "========================================"
    echo "SUCCESS! Code pushed to GitHub"
    echo "========================================"
    echo ""
    echo "Next steps:"
    echo ""
    echo "1. Setup Database: https://console.neon.tech"
    echo "2. Setup Redis: https://console.upstash.com"
    echo "3. Deploy on Render: https://dashboard.render.com"
    echo ""
    echo "Full instructions: Open RENDER_READY.md"
    echo ""
else
    echo ""
    echo "ERROR: Failed to push to GitHub"
    echo "Make sure you have committed your changes and have internet connection"
    echo ""
fi
