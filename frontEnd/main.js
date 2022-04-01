const { app, BrowserWindow, dialog, globalShortcut, ipcMain  } = require('electron')
const path = require('path')
const {IPCMESSAGETEST} = require('./channel.js')

function createWindow () {
  const win = new BrowserWindow({
    width: 1500,
    height: 800,
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
  win.loadURL('http://localhost:3000/#/test')
  win.isAlwaysOnTop(true)
  win.openDevTools();
  console.log('create window')


}

ipcMain.on(IPCMESSAGETEST, (event, arg) => {
    dialog.showOpenDialog({ 
      title: arg,
      properties: [ 'openFile'],
      filters: [
        // { name: 'Images', extensions: ['jpg', 'png', 'gif'] },
        // { name: 'Movies', extensions: ['mkv', 'avi', 'mp4'] },
        // { name: 'Custom File Type', extensions: ['as'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    })
    .then(res => {
      // console.log(res);
      event.sender.send("ss", res)
    })
    
})

app.whenReady().then(() => {
  createWindow();
  let ret = globalShortcut.register("ctrl+j", () => {
      dialog.showMessageBox({
        title: "Five-in-a-row",
        message: "Five-in-a-row Message",
        detail: "Five-in-a-row Detail",
      });
  })

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
