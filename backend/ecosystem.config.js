// PM2 Process Manager Config
// Usage: pm2 start ecosystem.config.js --env production
module.exports = {
  apps: [
    {
      name:         'caretica-backend',
      script:       'server.js',
      instances:    'max',           // use all CPU cores
      exec_mode:    'cluster',
      watch:        false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'development',
        PORT: 3001,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      error_file:  './logs/err.log',
      out_file:    './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      restart_delay: 3000,
      max_restarts: 10,
    },
  ],
}
