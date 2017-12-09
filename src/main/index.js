'use strict'

import {app, BrowserWindow, Menu, ipcMain} from 'electron'
import { autoUpdater } from 'electron-updater'

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

let mainWindow
const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080`
  : `file://${__dirname}/index.html`

// 菜单模版
const menusTemplate = []

// mac os
if (process.platform === 'darwin') {
  const appName = app.getName()
  const appVersion = app.getVersion()

  menusTemplate.unshift({
    label: appName,
    submenu: [{
    //   label: `关于${appName}`,
    //   role: 'about'
    // }, {
      label: `当前版本${appVersion}`,
      enabled: false
    }, {
      label: '检查更新',
      key: 'checkForUpdate',
      click: () => {
        autoUpdater.checkForUpdates()
      }
    }, {
      label: '正在检查更新...',
      enabled: false,
      visible: false,
      key: 'checkingForUpdate'
    }, {
      label: '重启并安装更新',
      visible: false,
      key: 'restartToUpdate',
      click: () => {
        autoUpdater.quitAndInstall()
      }
    }, {
      type: 'separator'
    }, {
      label: `退出${appName}`,
      accelerator: 'Command+Q',
      click: () => {
        app.quit()
      }
    }]
  })
}

// windows os
if (process.platform === 'win32') {

}

function createWindow () {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    height: 600,
    minHeight: 600,
    useContentSize: true,
    width: process.env.NODE_ENV === 'development' ? 1000 : 888,
    minWidth: 700,
    titleBarStyle: 'hidden',
    frame: false,
    show: true,
    webPreferences: {
      webSecurity: false
    }
  })

  mainWindow.loadURL(winURL)

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // 设置菜单
  if (!menusTemplate.length) return

  const menu = Menu.buildFromTemplate(menusTemplate)
  Menu.setApplicationMenu(menu)
}

/**
 * 发送自动更新相关状态
 * @param {*} text 更新描述
 */
function sendAutoUpdateStatus (text) {
  mainWindow.webContents.send('autoUpdateStatus', text)
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

ipcMain.on('checkUpdate', (event, arg) => {
  autoUpdater.checkForUpdates()
})

/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */
autoUpdater.on('checking-for-update', () => {
  sendAutoUpdateStatus('正在检查更新...')
})

autoUpdater.on('update-available', (info) => {
  sendAutoUpdateStatus('发现新版本～')
})

autoUpdater.on('update-not-available', (info) => {
  sendAutoUpdateStatus('已经是最新版本~')
})

autoUpdater.on('error', (errInfo) => {
  sendAutoUpdateStatus(`更新出错：${errInfo}`)
})

autoUpdater.on('download-progress', (processObj) => {
  let text = `速度：${processObj.bytesPerSecond}，已下载${processObj.percent}（${processObj.transferred}/${processObj.total}）`

  sendAutoUpdateStatus(text)
})

autoUpdater.on('update-downloaded', () => {
  sendAutoUpdateStatus('下载完成，准备安装...')
  autoUpdater.quitAndInstall()
})

app.on('ready', () => {
  createWindow()
})
