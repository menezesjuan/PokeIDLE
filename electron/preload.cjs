const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  toggleAlwaysOnTop: (shouldPin) => ipcRenderer.send('toggle-always-on-top', shouldPin),
  setCompactMode: (isCompact) => ipcRenderer.send('set-compact-mode', isCompact),
  dockToTaskbar: () => ipcRenderer.send('dock-to-taskbar'),
  isElectron: true,
});
