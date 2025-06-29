const { contextBridge, ipcRenderer } = require('electron');

// Cache pentru a evita apeluri IPC repetate
const cache = {
  dbConfig: null,
  userData: null,
  cacheTime: {
    dbConfig: 0,
    userData: 0
  },
  // Timpul de expirare a cache-ului (în milisecunde)
  TTL: {
    dbConfig: 60 * 1000, // 1 minut
    userData: 30 * 1000  // 30 secunde
  }
};

// Funcții helper pentru cache
const getCachedData = async (key, fetchFn) => {
  const now = Date.now();
  // Dacă avem date în cache și nu au expirat, le returnăm
  if (cache[key] && (now - cache.cacheTime[key] < cache.TTL[key])) {
    return cache[key];
  }
  
  // Altfel, obținem date noi
  try {
    const data = await fetchFn();
    // Actualizăm cache-ul
    cache[key] = data;
    cache.cacheTime[key] = now;
    return data;
  } catch (error) {
    console.error(`Error fetching ${key}:`, error);
    // Dacă avem date în cache, le returnăm chiar dacă au expirat
    if (cache[key]) {
      return cache[key];
    }
    throw error;
  }
};

// Invalidare cache
const invalidateCache = (key) => {
  cache[key] = null;
  cache.cacheTime[key] = 0;
};

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'api', {
    // Canale de comunicare optimizate
    send: (channel, data) => {
      // whitelist channels
      const validChannels = ['toMain'];
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, data);
      }
    },
    receive: (channel, func) => {
      const validChannels = ['fromMain'];
      if (validChannels.includes(channel)) {
        // Deliberately strip event as it includes `sender` 
        ipcRenderer.on(channel, (event, ...args) => func(...args));
      }
    },
    // Database config methods - cu cache
    getDbConfig: () => getCachedData('dbConfig', () => ipcRenderer.invoke('getDbConfig')),
    setDbConfig: (config) => {
      // Invalidăm cache-ul când setăm o nouă configurație
      invalidateCache('dbConfig');
      return ipcRenderer.invoke('setDbConfig', config);
    },
    
    // User data methods - cu cache
    getUserData: () => getCachedData('userData', () => ipcRenderer.invoke('getUserData')),
    setUserData: (userData) => {
      // Invalidăm cache-ul când setăm date noi
      invalidateCache('userData');
      return ipcRenderer.invoke('setUserData', userData);
    },
    clearUserData: () => {
      // Invalidăm cache-ul când ștergem datele
      invalidateCache('userData');
      return ipcRenderer.invoke('clearUserData');
    },
    
    // Flag to indicate we're running in Electron
    isElectron: true,
    
    // Versiune pentru debugging
    version: '1.0.0'
  }
); 