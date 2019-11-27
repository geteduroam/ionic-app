#!/bin/bash

echo "Installing basic tools..."
apt-get upgrade -qq
apt-get update -qq -y
apt install -qq -y apt-transport-https \
    ca-certificates \
    curl \
    gnupg-agent \
    software-properties-common


echo "Installing Docker..."
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
add-apt-repository \
   "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
   $(lsb_release -cs) \
   stable"
apt-get update -qq
apt-get install -qq docker-ce docker-ce-cli containerd.io
usermod -aG docker ${USER}

echo "Installing Docker Compose..."
curl -L "https://github.com/docker/compose/releases/download/1.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose


reboot now