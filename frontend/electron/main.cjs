const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { PythonShell } = require('python-shell');
const fs = require('fs');
const isDev = require('./is-dev.cjs');
const { getDbConfig, saveDbConfig, testConnection } = require('./db-config.cjs');

let mainWindow;
let pythonProcess = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    },
    icon: path.join(__dirname, '../public/vite.svg'),
    // Folosim stilul standard de fereastră Windows
    frame: true,
    titleBarStyle: 'default',
    titleBarOverlay: false
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

  // Start the Python process using spawn from child_process
  try {
    const { spawn } = require('child_process');
    
    // Get Python executable path
    let pythonPath = 'python'; // default
    if (process.platform === 'win32') {
      pythonPath = 'python'; // on Windows, use 'python' or 'py'
    }
    
    console.log('Starting Python backend...');
    
    // Folosim direct uvicorn cu flag-uri pentru pornire rapidă
    pythonProcess = spawn(pythonPath, [
      '-m', 
      'uvicorn', 
      'main:app', 
      '--host', 
      '127.0.0.1', 
      '--port', 
      '8000',
      '--no-access-log', // Eliminăm logurile de acces pentru pornire mai rapidă
      '--workers', '1'    // Un singur worker pentru aplicația Electron
    ], {
      cwd: path.join(process.cwd(), '..', 'backend'),
      env: {
        ...process.env,
        DATABASE_URL: dbConfig.url,
        ELECTRON_RUN: '1',
        PYTHONUNBUFFERED: '1' // Dezactivăm bufferizarea pentru output mai rapid
      }
    });

    // Handle stdout
    pythonProcess.stdout.on('data', (data) => {
      const message = data.toString().trim();
      console.log('Python stdout:', message);
      if (mainWindow) {
        mainWindow.webContents.send('python-message', message);
      }
    });

    // Handle stderr
    pythonProcess.stderr.on('data', (data) => {
      console.error('Python stderr:', data.toString());
    });

    // Handle process exit
    pythonProcess.on('close', (code) => {
      console.log(`Python backend exited with code ${code}`);
      pythonProcess = null;
      
      // Show error if process exited with non-zero code
      if (code !== 0 && mainWindow) {
        dialog.showErrorBox(
          'Backend Error',
          `Python backend exited unexpectedly with code ${code}`
        );
      }
    });

    // Handle process error
    pythonProcess.on('error', (err) => {
      console.error('Python process error:', err);
      dialog.showErrorBox(
        'Backend Error',
        `Python backend error: ${err.message}`
      );
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
    if (process.platform === 'win32') {
      // On Windows, we need to kill the process tree
      require('child_process').exec(`taskkill /pid ${pythonProcess.pid} /T /F`, (error) => {
        if (error) {
          console.error('Error killing Python process:', error);
        } else {
          console.log('Python backend stopped');
        }
      });
    } else {
      // On Unix-like systems
      pythonProcess.kill();
    }
    pythonProcess = null;
    console.log('Python backend stopping...');
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

// App lifecycle events
app.whenReady().then(() => {
  // Pornim backend-ul Python mai devreme, înainte de a crea fereastra
  startPythonBackend();
  
  // Apoi creăm fereastra
  createWindow();
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
  }
}); 