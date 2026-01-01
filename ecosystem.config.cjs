require('dotenv').config({ path: '.env.local' });

module.exports = {
  apps: [
    {
      name: 'ncwarn',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p ' + (process.env.PORT || 3015),
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
      },
      env_production: {
        NODE_ENV: 'production',
      },
      error_file: '/var/log/pm2/ncwarn.err.log',
      out_file: '/var/log/pm2/ncwarn.out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      restart_delay: 1000,
      exp_backoff_restart_delay: 100,
    },
    {
      name: 'ncwarn-workers',
      script: 'node_modules/.bin/tsx',
      args: 'scripts/run-ingests.mjs --schedule',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '256M',
      env: {
        NODE_ENV: 'production',
      },
      error_file: '/var/log/pm2/ncwarn-workers.err.log',
      out_file: '/var/log/pm2/ncwarn-workers.out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      autorestart: true,
      restart_delay: 5000,
    },
  ],
};
