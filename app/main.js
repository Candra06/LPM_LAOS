const {
  app,
  dialog,
  ipcMain,
  BrowserWindow
} = require('electron')
const path = require('path')
const DownloadMgr = require('electron-download-manager')

var APP_DIR = app.getPath('userData')
var PACKAGE_DIR = path.join(APP_DIR, 'archive')
var API_LPM = require(path.join(__dirname, 'api.js'))
var VIEW_DIR = path.resolve(__dirname, '..', 'Web')

const app_config = {
  APP_DIR: APP_DIR,
  APP_NAME: 'Laos Package Manager',
  API_URL: 'https://lpm-api.zhanang.id'
}
const API = new API_LPM(app_config)

let mainWindow;
DownloadMgr.register({
  downloadFolder: PACKAGE_DIR
});

var errHandler = (err) => {
  dialog.showErrorBox('Error!', err)
}

ipcMain.on('search-api', (e, arg) => {
  API.searchPackage(arg).then((res) => {
    e.reply('search-api', res)
  }, errHandler)
})

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
  splashWindow.on('closed', function () {
    splashWindow = null;
  })
  
  ipcMain.on('online-status', (e, status) => {
    e.returnValue = (status ? 'available' : 'unavailable')
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

app.on('ready', createWindow)

app.on('window-all-closed', function () {
  if (process.platform != 'darwin') app.quit();
});

app.on('active', function () {
  if (mainWindow == null) createWindow();
})