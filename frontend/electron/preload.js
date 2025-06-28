const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'electronAPI', {
    getDbConfig: () => ipcRenderer.invoke('get-db-config'),
    saveDbConfig: (config) => ipcRenderer.invoke('save-db-config', config),
    onPythonMessage: (callback) => {
      ipcRenderer.on('python-message', (_, message) => callback(message));
      return () => {
        ipcRenderer.removeListener('python-message', callback);
      };
    },
    isElectron: true
  }
); 