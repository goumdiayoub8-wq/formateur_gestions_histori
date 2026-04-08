const { execFileSync } = require('node:child_process');

const DB_CONFIG = {
  host: process.env.PLAYWRIGHT_DB_HOST || '127.0.0.1',
  port: process.env.PLAYWRIGHT_DB_PORT || '3307',
  name: process.env.PLAYWRIGHT_DB_NAME || 'gestion_formateurs',
  user: process.env.PLAYWRIGHT_DB_USER || 'app',
  password: process.env.PLAYWRIGHT_DB_PASSWORD || 'app',
};

function runMysql(query) {
  return execFileSync(
    'mysql',
    [
      '--batch',
      '--raw',
      '--skip-column-names',
      '-h',
      DB_CONFIG.host,
      '-P',
      String(DB_CONFIG.port),
      '-u',
      DB_CONFIG.user,
      '-D',
      DB_CONFIG.name,
      '-e',
      query,
    ],
    {
      encoding: 'utf8',
      env: {
        ...process.env,
        MYSQL_PWD: DB_CONFIG.password,
      },
    },
  ).trim();
}

function clearAuthThrottleRecords() {
  runMysql('DELETE FROM request_throttles;');
}

module.exports = {
  DB_CONFIG,
  runMysql,
  clearAuthThrottleRecords,
};
