const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');

const fs = require('fs');

let mainWindow = null;
const isDev = process.env.NODE_ENV === 'development' || process.argv.includes('--dev');

function createWindow() {
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: 900,
    height: 480,
    minWidth: 640,
    minHeight: 180,
    x: Math.round((screenWidth - 900) / 2),
    y: screenHeight - 520, // Positioned near bottom like a taskbar companion
    frame: true,
    alwaysOnTop: false,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
    backgroundColor: '#111827',
  });

  const distPath = path.join(__dirname, '../dist/index.html');
  if (!isDev && fs.existsSync(distPath)) {
    mainWindow.loadFile(distPath);
  } else {
    mainWindow.loadURL('http://localhost:5173');
  }

  // IPC listeners
  ipcMain.on('toggle-always-on-top', (event, shouldPin) => {
    if (mainWindow) {
      mainWindow.setAlwaysOnTop(shouldPin, 'floating');
    }
  });

  ipcMain.on('set-compact-mode', (event, isCompact) => {
    if (mainWindow) {
      const currentBounds = mainWindow.getBounds();
      if (isCompact) {
        mainWindow.setSize(currentBounds.width, 210);
      } else {
        mainWindow.setSize(currentBounds.width, 560);
      }
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
