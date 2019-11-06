const { execFile }      = require('child_process')
const {ipcMain, dialog} = require('electron')
const fs = require('fs');
const sudo = require('sudo-prompt')
const Store = require('electron-store')
const path  = require('path')
const Notif = require(path.join(__dirname, 'notification.js'))
const md5File = require('md5-file')
const slugify = require('slugify')
const API_LPM = require(path.join(__dirname, 'api.js'))

/**
 * Simple storage
 */
let download = {
  history: new Store({
    name: 'download_history'
  }),
  progress: new Store({
    name: 'download_progress'
  })
}
let detailAppHistory = new Store({
  name: 'detailApp_history'
})
let installationLog = new Store({
  name: 'install_log'
})

function ipcCtrl (conf) {

  let API = new API_LPM(conf.app_config)
  let notif = new Notif(conf.app_config)
  let queue = {};
  
  var errHandler = (err, installation = false, appName) => {
    if (installation) {
      let formatMsg = `[ERROR] ${+new Date} - ${err}`
      if (installationLog.has(appName)) {
        let fetchLog = installationLog.get(appName)
        installationLog.set(appName, fetchLog.push(formatMsg))
      } else {
        installationLog.set(appName, [formatMsg])
      }
    }
    console.log(err)
    notif.info(err, 'LPM - Error!')
    dialog.showErrorBox('Error!', err)
  }
  
  ipcMain.on('clearAppCache', e => {
    download.history.clear()
    download.progress.clear()
    detailAppHistory.clear()
    installationLog.clear()
  })

  /**
   * history detail apps
   */
  ipcMain.on('historyDetailApps', e => {
    e.reply('historyDetailApps', detailAppHistory.get())
  })

  ipcMain.on('deleteHistoryDetailApp', (e, packageName) => {
    detailAppHistory.delete(packageName);
    e.reply('historyDetailApps', detailAppHistory.get())
  })

  /**
   * Search Package
   */
  ipcMain.on('search-api', (e, packageName) => {
    API.searchPackage(packageName.trim()).then((res) => {
      e.reply('search-api', res)
    }, errHandler).catch(errHandler)
  })

  /**
   * List Installed Packages
   */
  ipcMain.on('list-installed', (e) => {
    execFile('apt', ['list', '--installed'], (err, stdout, stderr) => {
      if (err) {
        e.reply('list-installed', 'Failed to fetch installed packages')
        console.log(stderr)
        return
      }
      e.reply('list-installed', stdout)
    })
  })

  /**
   * Detail Package
   */
  ipcMain.on('detail-package', (e, packageName) => {
    API.detailPackage(packageName).then((res) => {
      if (res.status) detailAppHistory.set(packageName, res)
      e.reply('detail-package', res)
    }, errHandler).catch(errHandler)
  })

  ipcMain.on('add-download', (e, packageName) => {
    let dwnHandler = (res) => {
      if (! res.status) {
        notif.info(`${packageName} tidak ditemukan`)
        return
      }
      
      if (! download.progress.has(packageName)) {
        notif.info(`Download ${packageName} telah dimulai.`)
      } else {
        notif.info(`Download ${packageName} dilanjutkan.`)  
      }
      packageName = slugify(res.data.name)
      let appData = res.data

      if (! download.progress.has(packageName)) download.progress.set(packageName, appData)
      conf.dwm.download({
        url: appData.link,
        onProgress: progressCallback
      }, dwnCallback)

      // Download progress handler
      function progressCallback(dProgress, item) {
        let appProgress = download.progress.get(packageName)
        appProgress.progress = dProgress
        appProgress.canResume = item.canResume();
        if (! queue.hasOwnProperty(packageName)) queue[packageName] = item
        download.progress.set(packageName, appProgress)
        conf.mainWindow.webContents.send('download-progress', download.progress.get())
      }

      // Download handler start - end
      function dwnCallback(err, pathInfo) {
        if (err) {
          notif.info(`Download ${packageName} gagal - ${err}`)
          return
        }

        // download complete
        notif.info(`Download ${packageName} selesai`)
        let appProgress = download.progress.get(packageName);
        appProgress.detail.currentMD5 = md5File.sync(pathInfo.filePath)
        packageName = (packageName)
        download.history.set(packageName, {
          created_at: + new Date(),
          savedPath: pathInfo.filePath,
          info: appProgress
        })
        // move from progressStorage to historyStorage
        download.progress.delete(packageName)
        listDownload(e)
      }
    }
    API.getAllDebLink(packageName).then(dwnHandler).catch(errHandler)
  })

  ipcMain.on('cancel-download', (e, packageName) => {
    if (queue.hasOwnProperty(packageName)) {
      queue[packageName].cancel();
      delete queue[packageName];
    }
    download.progress.delete(packageName)
    listDownload(e)
  })

  ipcMain.on('delete-download', (e, packageName) => {
    if (download.history.has(packageName)) {
      download.history.delete(packageName)
    } else if (download.progress.has(packageName)) {
      // queue[packageName].cancel();
      delete queue[packageName]
      download.progress.delete(packageName)
    }
    listDownload(e)
  })

  ipcMain.on('download-list', listDownload)
  function listDownload(e) {
    let history = download.history.get()
    for (app in history) history[app].fileExist = fs.existsSync(history[app].savedPath)
    e.reply('download-list', {
      'progress': download.progress.get(),
      'history': history
    })
  }

  ipcMain.on('show-file', (e, savedPath) => {
    if (! fs.existsSync(savedPath)) {} return errHandler("File tidak ditemukan, mungkin sudah terhapus")
    conf.shell.showItemInFolder(savedPath)
  })

  /**
   * Install App
   */
  ipcMain.on('installApp', (e, appName) => {
    
    let installLog = [];
    if (! download.history.has(appName)) return errHandler("Nama aplikasi tidak ditemukan di download history", true, appName)
    
    let app = download.history.get(appName)

    // check file existance
    if (! fs.existsSync(app.savedPath)) return errHandler("File installer tidak ditemukan!", true, appName)
    installLog.push('[INFO] File alldeb exist.')

    let extractPath = path.resolve(conf.app_config.TEMP_DIR, appName)

    // folder exists? renew it.
    if (fs.existsSync(extractPath)) deleteFolderRecursive(extractPath)
    fs.mkdirSync(extractPath)
    installLog.push(`[INFO] Dir created ${extractPath}`)

    // extract to extractPath && install
    execFile('tar', ['xvzf', app.savedPath, '-C', extractPath], async (err, stdout, stderr) => {
      if (err) {
        console.log(stderr)
        return errHandler(stderr)
      }
      installLog.push(`[INFO] Extract success`)
      notif.info(`Proses extract ke ${extractPath}`)
      sudo.exec(`dpkg -i ${extractPath}/*.deb`, {name: conf.app_config.APP_NAME}, (err, stdout, stderr) => {
        if (err) {
          console.log(stderr)
          notif.info(`Installasi ${appName} gagal!`)
          return errHandler(stderr, true, appName)
        }
        installLog.push(`[INFO] Install Success`)
        console.log(stdout)
        notif.info(`Installasi ${appName} berhasil`)
      })
    })

    installationLog.set(appName, installLog)
  })

  function deleteFolderRecursive(dirPath) {
    if (fs.existsSync(dirPath)) {
      fs.readdirSync(dirPath).forEach((file, index) => {
        const curPath = path.join(dirPath, file);
        if (fs.lstatSync(curPath).isDirectory()) { // recurse
          deleteFolderRecursive(curPath);
        } else { // delete file
          fs.unlinkSync(curPath);
        }
      });
    fs.rmdirSync(dirPath);
  }
};


}

module.exports = ipcCtrl