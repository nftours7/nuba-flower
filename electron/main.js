import { app, BrowserWindow } from 'electron';
import path from 'path';
import url from 'url';

// In the main process.
function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
    },
    icon: path.join(__dirname, '../dist/favicon.ico'),
    autoHideMenuBar: true,
  });

  const startUrl = process.env.ELECTRON_START_URL || url.format({
    pathname: path.join(__dirname, '../dist/index.html'),
    protocol: 'file:',
    slashes: true,
  });

  // and load the index.html of the app.
  mainWindow.loadURL(startUrl);

  // Open the DevTools only in development
  if (process.env.ELECTRON_START_URL) {
    mainWindow.webContents.openDevTools();
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
