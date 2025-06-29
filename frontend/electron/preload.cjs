const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'api', {
    send: (channel, data) => {
      // whitelist channels
      let validChannels = ['toMain'];
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, data);
      }
    },
    receive: (channel, func) => {
      let validChannels = ['fromMain'];
      if (validChannels.includes(channel)) {
        // Deliberately strip event as it includes `sender` 
        ipcRenderer.on(channel, (event, ...args) => func(...args));
      }
    },
    // Database config methods
    getDbConfig: () => ipcRenderer.invoke('getDbConfig'),
    setDbConfig: (config) => ipcRenderer.invoke('setDbConfig', config),
    
    // User data methods
    getUserData: () => ipcRenderer.invoke('getUserData'),
    setUserData: (userData) => ipcRenderer.invoke('setUserData', userData),
    clearUserData: () => ipcRenderer.invoke('clearUserData'),
    
    // Flag to indicate we're running in Electron
    isElectron: true
  }
); 