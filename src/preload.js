const {contextBridge, ipcRenderer} = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    menu: () => ipcRenderer.send('menu'),
    minimize: () => ipcRenderer.send('minimize'),
    maximize: () => ipcRenderer.send('maximize'),
    close: () => ipcRenderer.send('close'),
    getSoundboardSize: () => ipcRenderer.invoke('get_soundboard_size'),
    setSoundboardSize: (size) => ipcRenderer.send('set_soundboard_size', size),
    getVolume: () => ipcRenderer.invoke('get_volume'),
    setVolume: (volume) => ipcRenderer.send('set_volume', volume),
    getButtons: () => ipcRenderer.send('get_buttons'),
})