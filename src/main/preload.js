const {contextBridge, ipcRenderer} = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    /* === FROM MAIN PROCESS === */
    // All windows
    handleReady: (callback) => ipcRenderer.on('ready', callback),

    // Main window
    handleButtonUpdate: (callback) => ipcRenderer.on('button_update', callback),
    handlePlayNow: (callback) => ipcRenderer.on('play_now', callback),
    handleMediaPlayPause: (callback) => ipcRenderer.on('media_play_pause', callback),
    handleMediaStop: (callback) => ipcRenderer.on('media_stop', callback),
    handleMediaNext: (callback) => ipcRenderer.on('media_next', callback),
    handleMediaPrev: (callback) => ipcRenderer.on('media_prev', callback),

    // Buttons windows
    handleButton: (callback) => ipcRenderer.on('button', callback),

    /* === TO MAIN PROCESS === */
    // Navbar
    minimize: (winId) => ipcRenderer.send('minimize', winId),
    maximize: (winId) => ipcRenderer.send('maximize', winId),
    close: (winId) => ipcRenderer.send('close', winId),

    // Windows
    openBrowser: (url) => ipcRenderer.send('open_browser', url),
    openMediaSelector: (profile, row, col, winId) => ipcRenderer.send('open_media_selector', profile, row, col, winId),
    openFileMediaSelector: () => ipcRenderer.invoke('open_file_media_selector'),
    openButtonSettings: (profile, row, col) => ipcRenderer.send('open_button_settings', profile, row, col),
    openPlayNowWindow: () => ipcRenderer.send('open_play_now_window'),

    // Settings
    getSoundboardSettings: () => ipcRenderer.invoke('get_soundboard_settings'),
    setSoundboardSize: (width, height) => ipcRenderer.send('set_soundboard_size', width, height),
    setVolume: (volume) => ipcRenderer.send('set_volume', volume),
    setMediaOutput: (device) => ipcRenderer.send('set_media_output', device),
    setActiveProfile: (profile) => ipcRenderer.invoke('set_active_profile', profile),

    // Profiles
    getProfiles: () => ipcRenderer.invoke('get_profiles'),
    createProfile: (name) => ipcRenderer.invoke('create_profile', name),
    renameProfile: (id, name) => ipcRenderer.invoke('rename_profile', id, name),
    deleteProfile: (id) => ipcRenderer.invoke('delete_profile', id),

    // Buttons
    getButtons: (profile) => ipcRenderer.invoke('get_buttons', profile),
    getButton: (profile, row, col) => ipcRenderer.invoke('get_button', profile, row, col),
    setButton: (profile, button) => ipcRenderer.send('set_button', profile, button),
    updateButton: (profile, button) => ipcRenderer.send('update_button', profile, button),
    swapButtons: (profile, row1, col1, row2, col2) => ipcRenderer.invoke('swap_buttons', profile, row1, col1, row2, col2),
    deleteButton: (profile, row, col) => ipcRenderer.send('delete_button', profile, row, col),
    refreshUrl: (profile, row, col) => ipcRenderer.send('refresh_url', profile, row, col),

    // Misc
    search: (query) => ipcRenderer.invoke('search', query),
    playNow: (track) => ipcRenderer.send('play_now', track),
});