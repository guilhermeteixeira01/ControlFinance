const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const http = require('http');

// Inicia o servidor Node interno (server.js) numa porta aleatória
let serverPort = 3131;
let mainWindow = null;

function startServer() {
  // Reutiliza o server.js original, apenas importado aqui
  process.env.PORT = serverPort;
  require('./server.js');
}

function waitForServer(callback, tries = 0) {
  http.get(`http://localhost:${serverPort}/api/dados`, () => {
    callback();
  }).on('error', () => {
    if (tries < 30) setTimeout(() => waitForServer(callback, tries + 1), 200);
    else console.error('Servidor não respondeu a tempo');
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 960,
    height: 720,
    minWidth: 600,
    minHeight: 500,
    title: 'Controle Financeiro',
    backgroundColor: '#07070f',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'icon.png'),
  });

  mainWindow.loadURL(`http://localhost:${serverPort}`);

  // Abre links externos no navegador, não no app
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  startServer();
  waitForServer(() => createWindow());

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
