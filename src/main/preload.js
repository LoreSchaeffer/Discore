const {contextBridge, ipcRenderer} = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    /* === FROM MAIN PROCESS === */
    // All windows
    handleReady: (callback) => ipcRenderer.on('ready', callback),

    // Main window
    handleButtonUpdate: (callback) => ipcRenderer.on('button_update', callback),
    handleButtonSwap: (callback) => ipcRenderer.on('button_swap', callback),
    handlePlayNow: (callback) => ipcRenderer.on('play_now', callback),
    handleMediaPlayPause: (callback) => ipcRenderer.on('media_play_pause', callback),
    handleMediaStop: (callback) => ipcRenderer.on('media_stop', callback),
    handleMediaNext: (callback) => ipcRenderer.on('media_next', callback),
    handleMediaPrev: (callback) => ipcRenderer.on('media_prev', callback),

    // Buttons windows
    handleRC: (callback) => ipcRenderer.on('rc', callback),
    handleButton: (callback) => ipcRenderer.on('button', callback),

    /* === TO MAIN PROCESS === */
    // Navbar
    minimize: (winId) => ipcRenderer.send('minimize', winId),
    maximize: (winId) => ipcRenderer.send('maximize', winId),
    close: (winId) => ipcRenderer.send('close', winId),

    // Windows
    openBrowser: (url) => ipcRenderer.send('open_browser', url),
    openMediaSelector: (row, col, winId) => ipcRenderer.send('open_media_selector', row, col, winId),
    openFileMediaSelector: () => ipcRenderer.invoke('open_file_media_selector'),
    openButtonSettings: (row, col) => ipcRenderer.send('open_button_settings', row, col),
    openPlayNowWindow: () => ipcRenderer.send('open_play_now_window'),
    closeWindow: (winId) => ipcRenderer.send('close_window', winId),

    // Settings
    getSoundboardSettings: () => ipcRenderer.invoke('get_soundboard_settings'),
    setSoundboardSize: (width, height) => ipcRenderer.send('set_soundboard_size', width, height),
    setVolume: (volume) => ipcRenderer.send('set_volume', volume),
    setMediaOutput: (device) => ipcRenderer.send('set_media_output', device),

    // Profiles
    getProfiles: () => ipcRenderer.invoke('get_profiles'),
    createProfile: (name) => ipcRenderer.invoke('create_profile', name),
    deleteProfile: (id) => ipcRenderer.send('delete_profile', id),

    // Buttons
    getButtons: (profile) => ipcRenderer.invoke('get_buttons', profile),
    getButton: (profile, row, col) => ipcRenderer.invoke('get_button', profile, row, col),
    setButton: (profile, button) => ipcRenderer.send('set_button', profile, button),
    updateButton: (profile, button) => ipcRenderer.send('update_button', profile, button),
    swapButtons: (profile, row1, col1, row2, col2) => ipcRenderer.send('swap_buttons', profile, row1, col1, row2, col2),
    refreshUrl: (profile, row, col) => ipcRenderer.send('refresh_url', profile, row, col),
});