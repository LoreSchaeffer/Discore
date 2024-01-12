const {contextBridge, ipcRenderer} = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    handleReady: (callback) => ipcRenderer.on('ready', callback),
    handleRC: (callback) => ipcRenderer.on('rc', callback),
    handleButtonUpdate: (callback) => ipcRenderer.on('button_update', callback),
    handleButtonSwap: (callback) => ipcRenderer.on('button_swap', callback),
    handleOutputDevice: (callback) => ipcRenderer.on('output_device', callback),
    handleButton: (callback) => ipcRenderer.on('button', callback),

    menu: (winId) => ipcRenderer.send('menu', winId),
    minimize: (winId) => ipcRenderer.send('minimize', winId),
    maximize: (winId) => ipcRenderer.send('maximize', winId),
    close: (winId) => ipcRenderer.send('close', winId),
    getSoundboardSize: () => ipcRenderer.invoke('get_soundboard_size'),
    setSoundboardSize: (size) => ipcRenderer.send('set_soundboard_size', size),
    getVolume: () => ipcRenderer.invoke('get_volume'),
    setVolume: (volume) => ipcRenderer.send('set_volume', volume),
    getButtons: () => ipcRenderer.invoke('get_buttons'),
    openMediaSelector: (row, col, winId) => ipcRenderer.send('open_media_selector', row, col, winId),
    search: (query) => ipcRenderer.invoke('search', query),
    openUrl: (url) => ipcRenderer.send('open_url', url),
    openMediaDialog: () => ipcRenderer.invoke('open_media_dialog'),
    setButton: (winId, row, col, uri, track) => ipcRenderer.send('set_button', winId, row, col, uri, track),
    swapButtons: (row1, col1, row2, col2) => ipcRenderer.send('swap_buttons', row1, col1, row2, col2),
    getSettings: () => ipcRenderer.invoke('get_settings'),
    saveSettings: (winId, settings) => ipcRenderer.send('save_settings', winId, settings),
    getNewUrl: (row, col) => ipcRenderer.invoke('get_new_url', row, col),
    getOutputDevice: () => ipcRenderer.invoke('get_output_device'),
    openButtonSettings: (row, col) =>  ipcRenderer.send('open_button_settings', row, col),
    updateButton: (winId, button) => ipcRenderer.send('update_button', winId, button),
})