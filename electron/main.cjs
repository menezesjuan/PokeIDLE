const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;

// YouTube PiP-style miniplayer dimensions
const CORNER_WIDTH = 440;
const CORNER_HEIGHT = 260;
const EXPANDED_HEIGHT = 560;

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

  // Position exactly at the bottom-right corner right above the taskbar (like YouTube PiP)
  const initialX = Math.max(10, screenWidth - CORNER_WIDTH - 20);
  const initialY = Math.max(10, screenHeight - CORNER_HEIGHT - 10);

  mainWindow = new BrowserWindow({
    title: 'PokeIDLE - Miniplayer',
    width: CORNER_WIDTH,
    height: CORNER_HEIGHT,
    minWidth: 380,
    minHeight: 180,
    x: initialX,
    y: initialY,
    alwaysOnTop: true, // Pinned on top by default like PiP!
    frame: true,
    resizable: true,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
      backgroundThrottling: false,
    },
    backgroundColor: '#0b0f19',
  });

  const distPath = path.join(__dirname, '../dist/index.html');
  if (fs.existsSync(distPath)) {
    mainWindow.loadFile(distPath);
  } else {
    mainWindow.loadURL('http://localhost:5173');
  }

  // Bring to front
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // IPC listeners
  ipcMain.on('toggle-always-on-top', (event, shouldPin) => {
    if (mainWindow) {
      mainWindow.setAlwaysOnTop(shouldPin, 'floating');
    }
  });

  ipcMain.on('set-compact-mode', (event, isCompact) => {
    if (mainWindow) {
      const currentBounds = mainWindow.getBounds();
      const { height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;
      const targetHeight = isCompact ? CORNER_HEIGHT : EXPANDED_HEIGHT;
      const targetY = Math.max(20, screenHeight - targetHeight - 10);

      mainWindow.setBounds({
        x: currentBounds.x,
        y: targetY,
        width: currentBounds.width,
        height: targetHeight,
      });
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
