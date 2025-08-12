const http = require('http');

class HealthServer {
  constructor(port = 8080, logger) {
    this.port = port;
    this.logger = logger;
    this.server = null;
  }

  start() {
    this.server = http.createServer((req, res) => {
      const url = new URL(req.url, `http://${req.headers.host}`);
      
      if (req.method === 'GET') {
        switch (url.pathname) {
          case '/health':
          case '/':
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
              status: 'healthy', 
              service: 'discord-bot-mvp',
              timestamp: new Date().toISOString(),
              uptime: process.uptime()
            }));
            break;
            
          case '/ping':
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
              message: 'pong',
              timestamp: new Date().toISOString()
            }));
            break;
            
          case '/status':
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
              status: 'alive',
              service: 'discord-bot-mvp',
              timestamp: new Date().toISOString(),
              uptime: process.uptime(),
              memory: process.memoryUsage(),
              pid: process.pid
            }));
            break;
            
          default:
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Not Found' }));
        }
      } else {
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Method Not Allowed' }));
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