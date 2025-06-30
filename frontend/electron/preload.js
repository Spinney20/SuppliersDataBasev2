const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'api', {
    getDbConfig: () => ipcRenderer.invoke('get-db-config'),
    saveDbConfig: (config) => ipcRenderer.invoke('save-db-config', config),
    onPythonMessage: (callback) => {
      ipcRenderer.on('python-message', (_, message) => callback(message));
      return () => {
        ipcRenderer.removeListener('python-message', callback);
      };
    },
    // Add file dialog functionality
    openFileDialog: (options) => ipcRenderer.invoke('open-file-dialog', options),
    getUserData: () => ipcRenderer.invoke('get-user-data'),
    setUserData: (userData) => ipcRenderer.invoke('set-user-data', userData),
    clearUserData: () => ipcRenderer.invoke('clear-user-data'),
    isElectron: true
  }
); 