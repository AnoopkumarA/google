
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  toggleStealthMode: (enable) => ipcRenderer.invoke('toggle-stealth-mode', enable),
  resizeWindow: (width, height) => ipcRenderer.invoke('resize-window', width, height),
  captureScreen: () => ipcRenderer.invoke('capture-screen'),
  writeToClipboard: (text) => require('electron').clipboard.writeText(text),
  onTriggerAnalysis: (callback) => ipcRenderer.on('trigger-screen-analysis', callback),
  isStealthSupported: async () => true, // Assume supported in Native app
  env: {
    API_KEY: process.env.API_KEY || process.env.REACT_APP_API_KEY
  }
});
