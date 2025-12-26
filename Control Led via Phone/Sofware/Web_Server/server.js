const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const os = require('os');

const app = express();
const port = 3001;

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/send', (req, res) => {
  const bits = req.body.bits;

  // Kiểm tra đúng 8 bit
  if (!bits || !/^[01]{8}$/.test(bits)) {
    return res.status(400).send('Invalid bit string. Must be 8 bits of 0/1.');
  }

  // Chuyển binary → integer
  const value = parseInt(bits, 2); // Ví dụ "10110111" → 183

  const cmd = `./main -n ${value}`;
  console.log(`Executing: ${cmd}`);

  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${stderr}`);
      return res.status(500).send(`Error sending UART data.`);
    }
    console.log(`FPGA -> ${stdout.trim()}`);
    res.send(stdout);
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const host = '0.0.0.0';
app.listen(port, host, () => {
  const ip = getLocalIP();
  console.log(`UART Web Server running at: http://${ip}:${port}`);
});
