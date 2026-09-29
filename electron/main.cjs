const { app, BrowserWindow, ipcMain, screen, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

// Memory & Background Optimizations
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=96'); // Low memory cap

let mainWindow = null;
let tray = null;

const COMPACT_HEIGHT = 225;
const EXPANDED_HEIGHT = 560;
const WINDOW_WIDTH = 860;

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

  mainWindow = new BrowserWindow({
    width: WINDOW_WIDTH,
    height: COMPACT_HEIGHT, // Default to compact taskbar strip!
    minWidth: 640,
    minHeight: 180,
    x: Math.round((screenWidth - WINDOW_WIDTH) / 2),
    y: screenHeight - COMPACT_HEIGHT, // Docked right above Windows taskbar!
    frame: true,
    alwaysOnTop: true, // Floats above other windows by default like Taskbar Hero
    resizable: true,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
      backgroundThrottling: false, // Keep idling smoothly while user works
    },
    backgroundColor: '#0b0f19',
  });

  const distPath = path.join(__dirname, '../dist/index.html');
  if (fs.existsSync(distPath)) {
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
      const targetHeight = isCompact ? COMPACT_HEIGHT : EXPANDED_HEIGHT;
      const { height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;
      
      // If expanding, shift Y up so it doesn't clip below taskbar
      const newY = Math.max(20, screenHeight - targetHeight);
      mainWindow.setBounds({
        x: currentBounds.x,
        y: newY,
        width: currentBounds.width,
        height: targetHeight,
      });
    }
  });

  ipcMain.on('dock-to-taskbar', () => {
    if (mainWindow) {
      const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;
      mainWindow.setBounds({
        x: Math.round((screenWidth - WINDOW_WIDTH) / 2),
        y: screenHeight - COMPACT_HEIGHT,
        width: WINDOW_WIDTH,
        height: COMPACT_HEIGHT,
      });
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createTray() {
  // Simple 16x16 pixel icon for tray
  const icon = nativeImage.createFromBuffer(
    Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAZElEQVQ4T2NkoBAwUqifYdQACi6AMd3d3f9B+BsDA4M5VpyRkZHxPyMDw38oHzmNggwgw4CoY0QYYBTEyDCACq4h1QACfgbGf8gGQzE4zYIuBvFpYEAymAAYkGgKDIj0MwxjAMZkGAg5+q19AAAAAElFTkSuQmCC',
      'base64'
    )
  );

  tray = new Tray(icon);
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Mostrar / Ocultar PokeIDLE',
      click: () => {
        if (mainWindow) {
          mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
        }
      },
    },
    {
      label: 'Encaixar na Barra de Tarefas (Dock)',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;
          mainWindow.setBounds({
            x: Math.round((screenWidth - WINDOW_WIDTH) / 2),
            y: screenHeight - COMPACT_HEIGHT,
            width: WINDOW_WIDTH,
            height: COMPACT_HEIGHT,
          });
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Sair do PokeIDLE',
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setToolTip('PokeIDLE - Taskbar Companion');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (mainWindow) {
      mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
    }
  });
}

app.whenReady().then(() => {
  createWindow();
  createTray();

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
