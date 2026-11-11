module.exports = {
  apps: [
    {
      name: 'fast-equb-backend',
      cwd: './backend',
      script: 'server.js',
      instances: 1,
      exec_mode: 'fork',
      node_args: '--max-old-space-size=384',
      max_memory_restart: '420M',
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
};
