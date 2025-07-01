const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { PythonShell } = require('python-shell');
const fs = require('fs');
const isDev = require('./is-dev.cjs');
const dbConfig = require('./db-config.cjs');
const { store, getUserData, setUserData, clearUserData, getDbConfig, setDbConfig } = require('./store.cjs');

// Setăm numele aplicației
app.name = 'FurniVIA';
if (app.setAboutPanelOptions) {
  app.setAboutPanelOptions({
    applicationName: 'FurniVIA',
    applicationVersion: app.getVersion(),
    copyright: 'Copyright © 2024'
  });
}

let mainWindow;
let pythonProcess = null;
let isAppQuitting = false; // Flag pentru a urmări starea de închidere a aplicației
let isBackendStarted = false; // Flag pentru a urmări dacă backend-ul a pornit

function createWindow() {
  // Calculăm dimensiunile proporționale cu 1920x1000
  const screenSize = require('electron').screen.getPrimaryDisplay().workAreaSize;
  const aspectRatio = 1700 / 1000;

  // Calculăm dimensiunile păstrând proporția 1920x1000
  // Folosim 80% din înălțimea ecranului ca bază
  const height = Math.floor(screenSize.height * 0.8);
  const width = Math.floor(height * aspectRatio);

  mainWindow = new BrowserWindow({
    width: width,
    height: height,
    webPreferences: {
      nodeIntegration: false, // is default value after Electron v5
      contextIsolation: true, // protect against prototype pollution
      preload: path.join(__dirname, 'preload.cjs'),
      // Optimizări pentru performanță
      backgroundThrottling: false, // Previne throttling când aplicația este în background
    },
    icon: path.join(__dirname, '../public/icons/icon.png'),
    // Ascundem meniul standard
    autoHideMenuBar: true,
    // Folosim stilul standard de fereastră Windows
    frame: true,
    titleBarStyle: 'default',
    titleBarOverlay: {
      color: '#121212',
      symbolColor: '#ffffff',
      height: 40
    },
    // Optimizări pentru pornire
    show: false, // Nu afișăm fereastra până când nu e gata
    backgroundColor: '#121212', // Setăm un fundal pentru a evita flash-ul alb
    title: 'FurniVIA'
  });

  // Dezactivăm meniul principal
  mainWindow.setMenu(null);

  // Arătăm fereastra când e gata pentru a evita flash-ul alb
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    // Setăm iconul explicit pentru taskbar (Windows)
    if (process.platform === 'win32') {
      mainWindow.setIcon(path.join(__dirname, '../public/icons/icon.png'));
    }
    // Pornim backend-ul Python după ce fereastra este afișată
    // pentru a îmbunătăți experiența utilizatorului
    if (!isBackendStarted) {
      startPythonBackend();
    }
  });

  // Load the app
  const startUrl = process.env.ELECTRON_START_URL ||
    (isDev
      ? 'http://localhost:5173'
      : `file://${path.join(__dirname, '../dist/index.html')}`);

  mainWindow.loadURL(startUrl);

  // Open DevTools if in dev mode
  if (isDev) {
    // Deschidem DevTools doar după ce aplicația s-a încărcat complet
    mainWindow.webContents.once('did-finish-load', () => {
      mainWindow.webContents.openDevTools();
    });
  }

  // Prevenim închiderea imediată a ferestrei pentru a opri mai întâi procesul Python
  mainWindow.on('close', (e) => {
    if (!isAppQuitting) {
      e.preventDefault();
      console.log('Window closing, stopping Python backend...');

      // Oprim procesul Python și apoi închidem fereastra
      stopPythonBackendWithTimeout().then(() => {
        console.log('Python backend stopped, now closing window');
        isAppQuitting = true;
        mainWindow.close();
      });
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Start Python backend
function startPythonBackend() {
  if (isBackendStarted) return; // Prevenim pornirea multiplă

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
      '--workers', '1',   // Un singur worker pentru aplicația Electron
      '--lifespan', 'off' // Dezactivăm lifespan pentru pornire mai rapidă
    ], {
      cwd: path.join(process.cwd(), '..', 'backend'),
      env: {
        ...process.env,
        ELECTRON_RUN: '1',
        PYTHONUNBUFFERED: '1', // Dezactivăm bufferizarea pentru output mai rapid
        PYTHONDONTWRITEBYTECODE: '1', // Previne crearea fișierelor .pyc
      }
    });

    isBackendStarted = true;

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

    // Flag pentru a urmări dacă procesul a fost oprit intenționat
    pythonProcess.intentionallyKilled = false;

    // Handle process exit
    pythonProcess.on('close', (code) => {
      console.log(`Python backend exited with code ${code}`);
      isBackendStarted = false;

      // Arătăm eroarea doar dacă procesul nu a fost oprit intenționat și codul de ieșire este diferit de 0 și null
      if (!pythonProcess.intentionallyKilled && code !== 0 && code !== null && mainWindow) {
        dialog.showErrorBox(
          'Backend Error',
          `Python backend exited unexpectedly with code ${code}`
        );
      }

      pythonProcess = null;
    });

    // Handle process error
    pythonProcess.on('error', (err) => {
      console.error('Python process error:', err);
      isBackendStarted = false;
      if (mainWindow) {
        dialog.showErrorBox(
          'Backend Error',
          `Python backend error: ${err.message}`
        );
      }
    });

    console.log('Python backend started');
  } catch (error) {
    console.error('Failed to start Python backend:', error);
    isBackendStarted = false;
    dialog.showErrorBox(
      'Backend Error',
      `Failed to start Python backend: ${error.message}`
    );
  }
}

// Stop Python backend
function stopPythonBackend() {
  console.log('Attempting to stop Python backend...');

  // Funcție pentru a verifica și opri orice proces care rulează pe portul 8000
  const checkAndKillPortProcesses = () => {
    return new Promise((resolve) => {
      if (process.platform === 'win32') {
        require('child_process').exec('netstat -ano | findstr :8000', (error, stdout) => {
          if (!error && stdout) {
            const lines = stdout.trim().split('\n');
            const killPromises = [];

            for (const line of lines) {
              const parts = line.trim().split(/\s+/);
              if (parts.length > 4 && line.includes('LISTENING')) {
                const pid = parts[parts.length - 1];
                console.log(`Found process on port 8000 with PID ${pid}, attempting to kill`);

                killPromises.push(new Promise((killResolve) => {
                  require('child_process').exec(`taskkill /pid ${pid} /F`, (err) => {
                    if (err) {
                      console.log(`Process ${pid} might have already been terminated: ${err.message}`);
                    } else {
                      console.log(`Successfully killed process ${pid}`);
                    }
                    killResolve();
                  });
                }));
              }
            }

            // Așteptăm terminarea tuturor proceselor de kill
            Promise.all(killPromises).then(() => {
              console.log('All port 8000 processes have been addressed');
              resolve();
            });
          } else {
            console.log('No processes found on port 8000');
            resolve();
          }
        });
      } else {
        // Pe alte platforme
        resolve();
      }
    });
  };

  // Procesul principal de oprire
  return new Promise((resolve) => {
    if (pythonProcess) {
      try {
        console.log(`Attempting to terminate Python process with PID ${pythonProcess.pid}`);

        // Marcăm procesul ca fiind oprit intenționat pentru a evita afișarea erorii
        pythonProcess.intentionallyKilled = true;

        if (process.platform === 'win32') {
          // Verificăm mai întâi dacă procesul mai există
          const { exec } = require('child_process');

          // Prima încercăm să terminăm procesul direct
          try {
            pythonProcess.kill('SIGTERM');
            console.log('SIGTERM sent to Python process');
          } catch (killError) {
            console.log(`Error sending SIGTERM to process: ${killError.message}`);
          }

          // Apoi folosim taskkill pentru a ne asigura că toate procesele copil sunt oprite
          exec(`taskkill /pid ${pythonProcess.pid} /T /F`, (error) => {
            if (error) {
              console.log(`Process might have already been terminated: ${error.message}`);
            } else {
              console.log('Python backend stopped with taskkill');
            }

            // Verificăm și alte procese pe portul 8000
            checkAndKillPortProcesses().then(() => {
              pythonProcess = null;
              resolve();
            });
          });
        } else {
          // On Unix-like systems
          pythonProcess.kill();
          console.log('Python process killed on Unix-like system');
          pythonProcess = null;
          resolve();
        }
      } catch (err) {
        console.log(`Error during Python process cleanup: ${err.message}`);
        pythonProcess = null;

        // Verificăm și alte procese pe portul 8000
        checkAndKillPortProcesses().then(resolve);
      }
    } else {
      console.log('No Python process reference found, checking for orphaned processes');
      // Verificăm dacă există vreun proces care rulează pe portul 8000
      checkAndKillPortProcesses().then(resolve);
    }
  });
}

// Funcție pentru a opri procesul Python cu timeout
function stopPythonBackendWithTimeout(timeout = 2000) {
  return new Promise((resolve) => {
    // Setăm un timer pentru a preveni blocarea aplicației
    const timeoutId = setTimeout(() => {
      console.log(`Timeout reached (${timeout}ms) while stopping Python backend, continuing anyway`);
      resolve();
    }, timeout);

    // Încercăm să oprim procesul Python
    stopPythonBackend()
      .then(() => {
        clearTimeout(timeoutId); // Anulăm timeout-ul dacă procesul s-a oprit cu succes
        resolve();
      })
      .catch((err) => {
        console.log(`Error stopping Python backend: ${err?.message || 'Unknown error'}`);
        clearTimeout(timeoutId);
        resolve(); // Continuăm oricum
      });
  });
}

// IPC handlers for database configuration
ipcMain.handle('get-db-config', () => {
  return getDbConfig();
});

ipcMain.handle('save-db-config', async (event, config) => {
  try {
    // Test the connection before saving
    await dbConfig.testConnection(config);

    // Save the configuration if connection test passes
    dbConfig.saveDbConfig(config);

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
  // Verificăm dacă există deja procese care rulează pe portul 8000 și le oprim
  if (process.platform === 'win32') {
    require('child_process').exec('netstat -ano | findstr :8000', (error, stdout) => {
      if (!error && stdout) {
        const lines = stdout.trim().split('\n');
        let foundProcess = false;

        for (const line of lines) {
          const parts = line.trim().split(/\s+/);
          if (parts.length > 4 && line.includes('LISTENING')) {
            foundProcess = true;
            const pid = parts[parts.length - 1];
            console.log(`Found existing process on port 8000 with PID ${pid}, killing it before starting`);
            require('child_process').exec(`taskkill /pid ${pid} /F`, (err) => {
              if (err) {
                console.error(`Failed to kill process ${pid}:`, err);
              } else {
                console.log(`Successfully killed existing process ${pid}`);
              }
            });
          }
        }

        // Așteptăm puțin pentru a ne asigura că portul este eliberat
        setTimeout(() => {
          startPythonBackend();
          createWindow();
        }, foundProcess ? 1000 : 0);
      } else {
        // Niciun proces nu rulează pe portul 8000, pornim normal
        startPythonBackend();
        createWindow();
      }
    });
  } else {
    // Pe alte platforme, pornim normal
    startPythonBackend();
    createWindow();
  }

  // Set up IPC handlers for database config
  ipcMain.handle('getDbConfig', () => {
    return getDbConfig();
  });

  ipcMain.handle('setDbConfig', (event, config) => {
    return setDbConfig(config);
  });

  // Set up IPC handlers for user data
  ipcMain.handle('getUserData', () => {
    return getUserData();
  });

  ipcMain.handle('setUserData', (event, userData) => {
    return setUserData(userData);
  });

  ipcMain.handle('clearUserData', () => {
    clearUserData();
    return null;
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // Marcăm aplicația ca fiind în proces de închidere
    isAppQuitting = true;

    // Oprim procesul Python înainte de a închide aplicația
    stopPythonBackendWithTimeout().then(() => {
      console.log('Python backend stopped, now quitting app');
      app.quit();
    });
  }
});

app.on('before-quit', () => {
  isAppQuitting = true;
  stopPythonBackendWithTimeout(1000); // Timeout mai scurt pentru before-quit
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
