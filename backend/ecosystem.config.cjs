module.exports = {
  apps: [
    {
      name: "marineprocure-api",
      script: "src/server.js",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production"
      },
      max_memory_restart: "500M",
      error_file: "./logs/error.log",
      out_file: "./logs/output.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss"
    }
  ]
};
