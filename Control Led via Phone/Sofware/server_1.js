const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');

const port = 3001;

// Lấy IP LAN
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address;
    }
  }
  return 'localhost';
}

// Serve file static
function serveStaticFile(filePath, res) {
  const ext = path.extname(filePath).toLowerCase();
  const types = {
    '.html': 'text/html',
    '.css':  'text/css',
    '.js':   'application/javascript',
    '.png':  'image/png',
    '.jpg':  'image/jpeg'
  };

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      return res.end('File not found');
    }
    res.writeHead(200, { 'Content-Type': types[ext] || 'text/plain' });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const url = req.url;

  // --- Serve index.html ---
  if (req.method === 'GET' && url === '/') {
    return serveStaticFile(path.join(__dirname, 'public', 'index.html'), res);
  }

  // --- Serve static files in /public ---
  if (req.method === 'GET' && url.startsWith('/')) {
    const filePath = path.join(__dirname, 'public', url);
    if (fs.existsSync(filePath)) return serveStaticFile(filePath, res);
  }

  // --- Handle POST /send ---
  if (req.method === 'POST' && url === '/send') {
    let body = '';

    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
      try {
        const json = JSON.parse(body);
        const bits = json.bits;

        // Validate bit string
        if (!bits || !/^[01]{8}$/.test(bits)) {
          res.writeHead(400);
          return res.end('Invalid bit string. Must be 8 bits of 0/1.');
        }

        const value = parseInt(bits, 2);
        const cmd = `./main -n ${value}`;
        console.log(`Executing: ${cmd}`);

        exec(cmd, (error, stdout, stderr) => {
          if (error) {
            console.error(`Error: ${stderr}`);
            res.writeHead(500);
            return res.end('Error sending UART data.');
          }
          console.log(`FPGA -> ${stdout.trim()}`);
          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end(stdout);
        });
      } catch (err) {
        res.writeHead(500);
        res.end('Invalid JSON.');
      }
    });
    return;
  }

  // --- 404 fallback ---
  res.writeHead(404);
  res.end('Not Found');
});

// Start server
server.listen(port, '0.0.0.0', () => {
  const ip = getLocalIP();
  console.log(`UART Web Server (no Express) running at: http://${ip}:${port}`);
});
