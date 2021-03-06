const { app, BrowserWindow, dialog, globalShortcut, ipcMain  } = require('electron')
const path = require('path')
const {IPCLOGINSUCCESS, IPCLOGINERROR} = require('./channel.js')

let win = null

function createWindow () {
  win = new BrowserWindow({
    width: 390,
    height: 350,
    // resizable: false,
    title: "Five-in-a-row",
    icon: "./public/favicon.ico",
    autoHideMenuBar: true,
    backgroundColor: "#fff",
    webPreferences: {
      contextIsolation: false, // 禁用上下文隔离
      preload:  path.join(__dirname, 'preload.js')
    }   
  })
  // win.loadURL('http://localhost:3000/#/')
  win.loadFile("./build/index.html")
  win.isAlwaysOnTop(true)
  // win.openDevTools();
  // console.log('create window')


}

ipcMain.on(IPCLOGINSUCCESS, (event, arg) => {
    win.setContentSize(1200, 800);
    win.setResizable(true);
    win.center();
})

ipcMain.on(IPCLOGINERROR, (event, arg) => {
  win.setContentSize(390, 350);
  win.setResizable(false);
  win.center();
})

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
