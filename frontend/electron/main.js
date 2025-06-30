const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const { PythonShell } = require('python-shell');
const fs = require('fs');
const { getDbConfig, saveDbConfig, testConnection } = require('./db-config');
const Store = require('electron-store');

// Create a store for user data
const store = new Store({
  name: 'user-data',
  encryptionKey: 'viarom-suppliers-app-secret-key'
});

let mainWindow;
let pythonProcess = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../public/vite.svg'),
    // Add a custom titlebar for better appearance
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#2f3241',
      symbolColor: '#74b1be',
      height: 32
    }
  });

  // Load the app
  const startUrl = isDev 
    ? 'http://localhost:5173' 
    : `file://${path.join(__dirname, '../dist/index.html')}`;
  
  mainWindow.loadURL(startUrl);

  // Open DevTools if in dev mode
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
    stopPythonBackend();
  });
}

// Start Python backend
function startPythonBackend() {
  const dbConfig = getDbConfig();
  
  // Determine the path to the Python script
  let scriptPath;
  if (isDev) {
    scriptPath = path.join(process.cwd(), '..', 'backend', 'main.py');
  } else {
    scriptPath = path.join(process.resourcesPath, 'backend', 'main.py');
  }

  // Check if the file exists
  if (!fs.existsSync(scriptPath)) {
    dialog.showErrorBox(
      'Backend Error',
      `Could not find Python backend at: ${scriptPath}`
    );
    return;
  }

  // Set up environment variables for the Python process
  const options = {
    mode: 'text',
    pythonOptions: ['-u'], // unbuffered output
    env: {
      DATABASE_URL: dbConfig.url,
      ELECTRON_RUN: '1'
    }
  };

  // Start the Python process
  try {
    pythonProcess = PythonShell.run(scriptPath, options, (err) => {
      if (err) {
        console.error('Python backend error:', err);
        dialog.showErrorBox(
          'Backend Error',
          `Failed to start Python backend: ${err.message}`
        );
      }
    });

    // Listen for messages from the Python process
    pythonProcess.on('message', (message) => {
      console.log('Python message:', message);
      // You can send messages to the renderer here if needed
      if (mainWindow) {
        mainWindow.webContents.send('python-message', message);
      }
    });

    pythonProcess.on('error', (err) => {
      console.error('Python process error:', err);
    });

    console.log('Python backend started');
  } catch (error) {
    console.error('Failed to start Python backend:', error);
    dialog.showErrorBox(
      'Backend Error',
      `Failed to start Python backend: ${error.message}`
    );
  }
}

// Stop Python backend
function stopPythonBackend() {
  if (pythonProcess) {
    pythonProcess.kill();
    pythonProcess = null;
    console.log('Python backend stopped');
  }
}

// IPC handlers for database configuration
ipcMain.handle('get-db-config', () => {
  return getDbConfig();
});

ipcMain.handle('save-db-config', async (event, config) => {
  try {
    // Test the connection before saving
    await testConnection(config);
    
    // Save the configuration if connection test passes
    saveDbConfig(config);
    
    // Restart Python backend with new config
    stopPythonBackend();
    startPythonBackend();
    
    return { success: true };
  } catch (error) {
    console.error('Database connection test failed:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to connect to database' 
    };
  }
});

// IPC handler for file dialog
ipcMain.handle('open-file-dialog', async (event, options) => {
  try {
    const { filePaths, canceled } = await dialog.showOpenDialog(options);
    
    if (canceled || filePaths.length === 0) {
      return [];
    }
    
    // Return file information for each selected file
    return filePaths.map(filePath => {
      const stats = fs.statSync(filePath);
      return {
        path: filePath,
        name: path.basename(filePath),
        size: stats.size,
        lastModified: stats.mtime
      };
    });
  } catch (error) {
    console.error('File dialog error:', error);
    throw error;
  }
});

// IPC handlers for user data
ipcMain.handle('get-user-data', () => {
  return store.get('userData');
});

ipcMain.handle('set-user-data', (event, userData) => {
  store.set('userData', userData);
  return true;
});

ipcMain.handle('clear-user-data', () => {
  store.delete('userData');
  return true;
});

// App lifecycle events
app.on('ready', () => {
  createWindow();
  startPythonBackend();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    stopPythonBackend();
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
    if (!pythonProcess) {
      startPythonBackend();
    }
  }
}); 