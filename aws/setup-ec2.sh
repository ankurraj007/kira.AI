#!/bin/bash

# ========================================================
# EC2 One-Click Setup Script for Kira.AI
# Copy and Paste this into your EC2 Terminal (via AWS Console)
# ========================================================

echo "🔧 Installing Docker..."
sudo apt-get update
sudo apt-get install -y docker.io awscli
sudo systemctl start docker
sudo systemctl enable docker

# Allow your user to run docker commands without sudo
sudo usermod -aG docker $USER

echo "✅ Setup complete! PLEASE LOG OUT AND LOG BACK IN (or run 'newgrp docker') for changes to take effect."
echo "Then you can run the deployment commands."
