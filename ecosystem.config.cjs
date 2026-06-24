module.exports = {
  apps: [
    {
      name: 'fitness-guide-api',
      cwd: '/var/www/fitness-guide/server',
      script: 'src/index.js',
      exec_mode: 'fork',
      instances: 1,
      env: {
        NODE_ENV: 'production',
        PORT: '3000',
        DB_PATH: '/var/www/fitness-guide/server/data/fitness.db',
      },
      max_memory_restart: '300M',
    },
  ],
}
