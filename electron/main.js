const { app, BrowserWindow, Menu, dialog, globalShortcut, Tray, Notification, ipcMain } = require('electron');
const path = require('path');
const isDev = !app.isPackaged && process.USE_BUILTIN !== '1';

let mainWindow;
let tray;

// Helper to find Vite dev server URL
function getDevServerUrl() {
  return new Promise((resolve) => {
    const ports = [5173, 5174, 5175];
    const attempt = (index) => {
      if (index >= ports.length) {
        resolve(null);
        return;
      }
      const port = ports[index];
      const http = require('http');
      const request = http.get(
        {
          hostname: 'localhost',
          port: port,
          path: '/',
          timeout: 1000,
        },
        (res) => {
          if (res.statusCode === 200) {
            resolve(`http://localhost:${port}`);
          } else {
            attempt(index + 1);
          }
        }
      );
      request.on('error', () => {
        attempt(index + 1);
      });
      request.on('timeout', () => {
        request.destroy();
        attempt(index + 1);
      });
    };
    attempt(0);
  });
}

function createWindow(url) {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : undefined,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false,
      contentSecurityPolicy: isDev ?
        "default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' http://localhost:* http://127.0.0.1:*;" :
        "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self' http://localhost:5000;"
    }
  });

  // Load URL based on environment
  mainWindow.loadURL(url);

  // Open DevTools in development
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  return mainWindow;
}

function createTray() {
  // Create tray icon
  const iconPath = path.join(__dirname, 'icons', 'icon.png');
  tray = new Tray(iconPath);
  tray.setToolTip('Sentinel HR Simulation');

  const trayMenu = Menu.buildFromTemplate([
    {
      label: 'Show Sentinel',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    {
      label: 'New Session',
      click: () => {
        // TODO: Implement new session logic
        mainWindow.webContents.send('new-session');
      }
    },
    {
      label: 'Resume Last Session',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
          mainWindow.webContents.send('resume-last-session');
        }
      }
    },
    {
      label: 'View Active Sessions',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
          // TODO: Navigate to sessions page
          mainWindow.webContents.send('navigate-sessions');
        }
      }
    },
    {
      label: 'Settings',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
          // TODO: Navigate to settings page
          mainWindow.webContents.send('navigate-settings');
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Quit Sentinel',
      click: () => {
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(trayMenu);

  // Handle tray clicks
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });

  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Session',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            // TODO: Implement new session logic
            mainWindow.webContents.send('new-session');
          }
        },
        {
          label: 'Export Report',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            // TODO: Implement export report logic
            mainWindow.webContents.send('export-report');
          }
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        {
          label: 'Undo',
          accelerator: 'CmdOrCtrl+Z',
          role: 'undo'
        },
        {
          label: 'Redo',
          accelerator: 'CmdOrCtrl+Y',
          role: 'redo'
        },
        { type: 'separator' },
        {
          label: 'Cut',
          accelerator: 'CmdOrCtrl+X',
          role: 'cut'
        },
        {
          label: 'Copy',
          accelerator: 'CmdOrCtrl+C',
          role: 'copy'
        },
        {
          label: 'Paste',
          accelerator: 'CmdOrCtrl+V',
          role: 'paste'
        },
        { type: 'separator' },
        {
          label: 'Select All',
          accelerator: 'CmdOrCtrl+A',
          role: 'selectall'
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Zoom In',
          accelerator: 'CmdOrCtrl+=',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('zoom-in');
            }
          }
        },
        {
          label: 'Zoom Out',
          accelerator: 'CmdOrCtrl+-',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('zoom-out');
            }
          }
        },
        {
          label: 'Actual Size',
          accelerator: 'CmdOrCtrl+0',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('zoom-reset');
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Toggle Sidebar',
          accelerator: 'CmdOrCtrl+B',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('toggle-sidebar');
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Full Screen',
          accelerator: 'CmdOrCtrl+F',
          click: () => {
            if (mainWindow) {
              mainWindow.setFullscreen(!mainWindow.isFullscreen());
            }
          }
        },
        {
          label: 'Developer Tools',
          accelerator: 'CmdOrCtrl+Alt+I',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.toggleDevTools();
            }
          }
        }
      ]
    },
    {
      label: 'Session',
      submenu: [
        {
          label: 'New Simulation',
          accelerator: 'CmdOrCtrl+Shift+N',
          click: () => {
            // TODO: Implement new simulation logic
            mainWindow.webContents.send('new-simulation');
          }
        },
        {
          label: 'Pause/Resume',
          accelerator: 'CmdOrCtrl+Shift+P',
          click: () => {
            // TODO: Implement pause/resume logic
            mainWindow.webContents.send('pause-resume-simulation');
          }
        },
        {
          label: 'Stop Current',
          accelerator: 'CmdOrCtrl+Shift+X',
          click: () => {
            // TODO: Implement stop logic
            mainWindow.webContents.send('stop-simulation');
          }
        },
        { type: 'separator' },
        {
          label: 'Export Transcript',
          accelerator: 'CmdOrCtrl+Shift+E',
          click: () => {
            // TODO: Implement transcript export logic
            mainWindow.webContents.send('export-transcript');
          }
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Documentation',
          accelerator: 'F1',
          click: () => {
            // TODO: Open documentation
            mainWindow.webContents.send('open-documentation');
          }
        },
        {
          label: 'Tutorials',
          accelerator: 'CmdOrCtrl+Shift+T',
          click: () => {
            // TODO: Open tutorials
            mainWindow.webContents.send('open-tutorials');
          }
        },
        { type: 'separator' },
        {
          label: 'Check for Updates',
          accelerator: 'CmdOrCtrl+Shift+U',
          click: () => {
            // TODO: Implement update checking
            mainWindow.webContents.send('check-updates');
          }
        },
        {
          label: 'About Sentinel',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About Sentinel',
              message: 'Sentinel HR Simulation Suite\nVersion 0.0.0\n\nA comprehensive HR training and simulation platform.'
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(async () => {
  let url;
  if (isDev) {
    const devUrl = await getDevServerUrl();
    if (devUrl) {
      url = devUrl;
    } else {
      console.warn('Could not connect to Vite dev server, falling back to built version');
      url = path.join(__dirname, '../frontend/dist/index.html');
    }
  } else {
    url = path.join(__dirname, '../frontend/dist/index.html');
  }
  mainWindow = createWindow(url);
  // Native menu removed - using custom titlebar instead
  // createMenu();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createWindow(url);
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle IPC messages from renderer
const fs = require('fs');

ipcMain.handle('save-file', async (event, data) => {
  try {
    const { filePath } = await dialog.showSaveDialog({
      defaultPath: `sentinel-report-${Date.now()}.pdf`,
      filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
    });

    if (filePath) {
      // Here you would implement the actual file writing logic
      // For now, we'll just return the path
      // fs.writeFileSync(filePath, data); // Uncomment when implementing
      return { success: true, filePath };
    }
    return { success: false, error: 'No file selected' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('open-file', async (event) => {
  try {
    const { filePaths } = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
    });

    if (filePaths.length > 0) {
      // Here you would implement the actual file reading logic
      // const data = fs.readFileSync(filePaths[0]); // Uncomment when implementing
      return { success: true, filePath: filePaths[0] };
    }
    return { success: false, error: 'No file selected' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});



// Handle notification requests from renderer
ipcMain.handle('show-notification', async (event, { title, options }) => {
  try {
    const notification = new Notification({
      title: title,
      body: options.body || '',
      // Additional options can be added here if needed
      // silent: options.silent,
      // urgency: options.urgency,
    });

    notification.show();

    // Handle notification click if needed
    notification.on('click', () => {
      // Optional: handle notification click
      // mainWindow.show();
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to show notification:', error);
    return { success: false, error: error.message };
  }
});

// Global shortcuts
app.whenReady().then(() => {
  // Register global shortcuts
  globalShortcut.register('CmdOrCtrl+N', () => {
    if (mainWindow) {
      mainWindow.webContents.send('new-session');
    }
  });

  globalShortcut.register('CmdOrCtrl+S', () => {
    if (mainWindow) {
      mainWindow.webContents.send('export-report');
    }
  });

  globalShortcut.register('CmdOrCtrl+Q', () => {
    app.quit();
  });

  globalShortcut.register('CmdOrCtrl+,', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
      mainWindow.webContents.send('navigate-settings');
    }
  });

  globalShortcut.register('F1', () => {
    if (mainWindow) {
      mainWindow.webContents.send('open-documentation');
    }
  });

  globalShortcut.register('CmdOrCtrl+Alt+I', () => {
    if (mainWindow) {
      mainWindow.webContents.toggleDevTools();
    }
  });

  globalShortcut.register('CmdOrCtrl+Z', () => {
    if (mainWindow) {
      mainWindow.webContents.send('undo');
    }
  });

  globalShortcut.register('CmdOrCtrl+Y', () => {
    if (mainWindow) {
      mainWindow.webContents.send('redo');
    }
  });

  globalShortcut.register('CmdOrCtrl+F', () => {
    if (mainWindow) {
      mainWindow.webContents.send('find');
    }
  });

  globalShortcut.register('CmdOrCtrl+A', () => {
    if (mainWindow) {
      mainWindow.webContents.send('select-all');
    }
  });

  globalShortcut.register('CmdOrCtrl+B', () => {
    if (mainWindow) {
      mainWindow.webContents.send('toggle-sidebar');
    }
  });

  globalShortcut.register('CmdOrCtrl+Shift+N', () => {
    if (mainWindow) {
      mainWindow.webContents.send('new-simulation');
    }
  });

  globalShortcut.register('CmdOrCtrl+Shift+P', () => {
    if (mainWindow) {
      mainWindow.webContents.send('pause-resume-simulation');
    }
  });

  globalShortcut.register('CmdOrCtrl+Shift+X', () => {
    if (mainWindow) {
      mainWindow.webContents.send('stop-simulation');
    }
  });

  globalShortcut.register('CmdOrCtrl+Shift+E', () => {
    if (mainWindow) {
      mainWindow.webContents.send('export-transcript');
    }
  });
});

// Clean up global shortcuts on app quit
app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});