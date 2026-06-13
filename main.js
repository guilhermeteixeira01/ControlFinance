const { app, BrowserWindow, shell, dialog, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const http = require('http');

let serverPort = 3131;
let mainWindow = null;

// ── Configuração do auto-updater ──
autoUpdater.autoDownload = true;          // baixa em background
autoUpdater.autoInstallOnAppQuit = true;  // instala quando o app fechar

function setupUpdater() {
  // Verifica atualizações silenciosamente ao iniciar
  autoUpdater.checkForUpdatesAndNotify();

  autoUpdater.on('update-available', (info) => {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Atualização disponível',
      message: `Versão ${info.version} disponível! Baixando em background...`,
      buttons: ['OK']
    });
  });

  autoUpdater.on('update-downloaded', (info) => {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Atualização pronta',
      message: `Versão ${info.version} baixada. O app será atualizado ao fechar.`,
      buttons: ['Reiniciar agora', 'Mais tarde']
    }).then(result => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
  });

  autoUpdater.on('error', (err) => {
    console.error('Erro no auto-updater:', err);
  });
}

function startServer() {
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

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Inicia verificação de updates depois da janela abrir
  setTimeout(() => setupUpdater(), 3000);
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