const {
  app,
  dialog,
  ipcMain,
  BrowserWindow,
} = require('electron')
const path = require('path')
const DownloadMgr = require('electron-download-manager')
const Notif = require(path.join(__dirname, 'notification.js'))
const ipcCtrl = require(path.join(__dirname, 'ipcCtrl.js'))

var APP_DIR = app.getPath('userData')
var PACKAGE_DIR = path.join(APP_DIR, 'archive')
var VIEW_DIR = path.resolve(__dirname, '..', 'Web')

const app_config = {
  APP_DIR: APP_DIR,
  APP_NAME: 'Laos Package Manager',
  API_URL: 'https://lpm-api.zhanang.id'
}

let mainWindow;

function appInit() {
  DownloadMgr.register({
    downloadFolder: PACKAGE_DIR
  });

  createWindow()
  ipcCtrl(app_config)
}


/**
 * Splash Screen
 */
function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 600,
    height: 400,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, 'preload.js')
    },
    type: 'splash',
    position: 'center',
    
  })
  splashWindow.loadFile(path.join(VIEW_DIR, 'splash.html'))
  splashWindow.webContents.on('did-finish-load', () => {
    splashWindow.show()
  })
  splashWindow.on('closed', () => {
    splashWindow = null;
  })

  return splashWindow
}

/**
 * Main Window
 */
function createWindow() {
  splashWindow = createSplashWindow()
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    parent: true,
    show: false,
    webPreferences: {
      nodeIntegration: true
    }
  })

  mainWindow.setTitle(app_config.APP_NAME)
  mainWindow.loadFile( path.join(VIEW_DIR, 'index.html') )
  mainWindow.webContents.openDevTools()
  mainWindow.on('close', function () {
    mainWindow = null;
  })

  mainWindow.webContents.on('did-finish-load', () => {
    setTimeout(() => {
      splashWindow != null ? splashWindow.close() : null
      mainWindow.show()
    }, 2e3);
  })
}

app.on('ready', appInit)

app.on('window-all-closed', function () {
  if (process.platform != 'darwin') app.quit();
});

app.on('active', function () {
  if (mainWindow == null) createWindow();
})
