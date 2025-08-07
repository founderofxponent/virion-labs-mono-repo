const http = require('http');

class HealthServer {
  constructor(port = 8080, logger) {
    this.port = port;
    this.logger = logger;
    this.server = null;
  }

  start() {
    this.server = http.createServer((req, res) => {
      if (req.url === '/health' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          status: 'healthy', 
          service: 'discord-bot-mvp',
          timestamp: new Date().toISOString()
        }));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not Found' }));
      }
    });

    this.server.listen(this.port, '0.0.0.0', () => {
      this.logger?.info(`Health server running on port ${this.port}`);
    });
  }

  stop() {
    if (this.server) {
      this.server.close();
    }
  }
}

module.exports = { HealthServer };