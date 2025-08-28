module.exports = {
  apps: [
    {
      name: 'wordmash-frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      cwd: '/app',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    },
    {
      name: 'wordmash-server',
      script: 'websocket-server.js',
      cwd: '/app/server',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 4568
      }
    }
  ]
};