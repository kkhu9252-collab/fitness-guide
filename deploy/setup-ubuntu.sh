#!/usr/bin/env bash
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  echo "Please run as root: sudo bash deploy/setup-ubuntu.sh"
  exit 1
fi

apt-get update
apt-get install -y ca-certificates curl gnupg nginx rsync

if ! command -v node >/dev/null 2>&1 || ! node -e "import('node:sqlite')" >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
  apt-get install -y nodejs
fi

npm install -g pm2

mkdir -p /var/www/fitness-guide
mkdir -p /var/backups/fitness-guide

echo "Server packages are ready."
echo "Next: upload the project to /var/www/fitness-guide, then run deploy/deploy-on-server.sh."
