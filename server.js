const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

// Em produção Electron, salva dados na pasta do usuário (fora do .asar)
let userDataPath;
try {
  const { app: eApp } = require('electron');
  userDataPath = eApp.getPath('userData');
} catch {
  userDataPath = __dirname;
}

const DATA_FILE = path.join(userDataPath, 'dados.json');

if (!fs.existsSync(DATA_FILE)) {
  const seed = path.join(__dirname, 'dados.json');
  let initial;
  if (fs.existsSync(seed)) {
    const seedData = JSON.parse(fs.readFileSync(seed, 'utf8'));
    // Zera todos os pagamentos na primeira cópia
    if (seedData.gastos) seedData.gastos.forEach(g => g.pago = 0);
    initial = JSON.stringify(seedData, null, 2);
  } else {
    initial = JSON.stringify({ orcamento: 1400, gastos: [] }, null, 2);
  }
  fs.writeFileSync(DATA_FILE, initial);
}

const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json'
};

const server = http.createServer((req, res) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  if (req.method === 'OPTIONS') { res.writeHead(204, headers); return res.end(); }

  if (req.method === 'GET' && req.url === '/api/dados') {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    res.writeHead(200, { ...headers, 'Content-Type': 'application/json' });
    return res.end(data);
  }

  if (req.method === 'POST' && req.url === '/api/dados') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const parsed = JSON.parse(body);
        fs.writeFileSync(DATA_FILE, JSON.stringify(parsed, null, 2));
        res.writeHead(200, { ...headers, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.writeHead(400, headers);
        res.end(JSON.stringify({ erro: 'JSON inválido' }));
      }
    });
    return;
  }

  let filePath = req.url === '/' ? '/index.html' : req.url;
  filePath = path.join(__dirname, filePath);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    res.writeHead(200, { ...headers, 'Content-Type': MIME[ext] || 'text/plain' });
    return res.end(fs.readFileSync(filePath));
  }

  res.writeHead(404, headers);
  res.end('Not found');
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
