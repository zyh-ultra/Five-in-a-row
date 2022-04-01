// 解决react加载electron的问题
// console.log("preload")
global.electron = require('electron');
window.ipcRenderer = require('electron').ipcRenderer;
window.remote = require('electron').remote; 