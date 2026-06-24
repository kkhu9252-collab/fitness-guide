#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/var/www/fitness-guide"
APP_USER="${APP_USER:-www-data}"

cd "$APP_DIR"

if [ ! -f server/.env ]; then
  cat > server/.env <<'ENV'
PORT=3000
ADMIN_PASSWORD=replace-with-a-strong-password-before-first-start
DB_PATH=/var/www/fitness-guide/server/data/fitness.db
ENV
  echo "Created server/.env. Edit ADMIN_PASSWORD before first production start."
  exit 1
fi

if grep -q "replace-with-a-strong-password" server/.env; then
  echo "Please edit server/.env and set a strong ADMIN_PASSWORD before deploying."
  exit 1
fi

npm ci
npm test --workspace client
npm test --workspace server
npm run build --workspace client

mkdir -p server/data
chown -R "$APP_USER":"$APP_USER" server/data

cp deploy/nginx-fitness-guide.conf /etc/nginx/sites-available/fitness-guide
ln -sfn /etc/nginx/sites-available/fitness-guide /etc/nginx/sites-enabled/fitness-guide
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

pm2 startOrReload ecosystem.config.cjs --env production
pm2 save
pm2 startup systemd -u root --hp /root >/tmp/fitness-guide-pm2-startup.log 2>&1 || true

echo "Deployment complete."
echo "Open http://YOUR_SERVER_IP and http://YOUR_SERVER_IP/admin"
