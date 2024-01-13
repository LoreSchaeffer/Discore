const {app, BrowserWindow, ipcMain, shell, dialog} = require('electron');
const {video_basic_info} = require('play-dl');
const path = require('path');
const play = require('play-dl');
const mm = require('music-metadata');
const Conf = require('./conf');

const DEV_TOOLS = false;
const CONFIG = new Conf("conf");

const windows = {};
let mainWindow;

//TODO Manage media buttons

if (require('electron-squirrel-startup')) {
    app.quit();
}

const startApp = () => {
    initSettings();

    mainWindow = new BrowserWindow({
        icon: 'icon.png',
        width: CONFIG.config.width,
        height: CONFIG.config.height,
        minWidth: 1080,
        minHeight: 720,
        frame: false,
        autoHideMenuBar: true,
        show: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        }
    });

    mainWindow.loadFile(path.join(__dirname, 'ui', 'index.html'));

    mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.webContents.send('ready', -1, false, true);
    });

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        if (DEV_TOOLS) mainWindow.webContents.openDevTools();
    });

    mainWindow.on('resize', () => {
        const size = mainWindow.getSize();
        CONFIG.config.width = size[0];
        CONFIG.config.height = size[1];
        CONFIG.saveConfig();
    });
};

app.on('ready', startApp);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        startApp();
    }
});

ipcMain.on('menu', (event, winId) => {
    if (winId !== -1) return;

    openModal(mainWindow, 600, 200, false, 'menu.html');
});

ipcMain.on('minimize', (event, winId) => {
    if (winId === -1) mainWindow.minimize();
    else windows[winId].minimize();
});

ipcMain.on('maximize', (event, winId) => {
    if (winId === -1) {
        if (mainWindow.isMaximized()) {
            mainWindow.restore();
        } else {
            mainWindow.maximize();
        }
    } else {
        const win = windows[winId];
        if (!win.isResizable()) return;

        if (win.isMaximized()) {
            win.restore();
        } else {
            win.maximize();
        }
    }
});

ipcMain.on('close', (event, winId) => {
    if (winId === -1) {
        mainWindow.close();
        app.quit();
    } else {
        windows[winId].close();
        delete windows[winId];
    }
});

ipcMain.on('open_media_selector', (event, row, col, winId) => {
    openModal(windows[winId], 500, 600, false, 'media_selector.html', (modal) => {
        modal.webContents.send('rc', row, col);
    });
});

ipcMain.handle('get_soundboard_size', () => {
    return [CONFIG.config.rows, CONFIG.config.columns];
});

ipcMain.on('set_soundboard_size', (event, size) => {
    CONFIG.config.rows = size[0];
    CONFIG.config.columns = size[1];
    CONFIG.saveConfig();
});

ipcMain.handle('get_volume', () => {
    return CONFIG.config.volume;
});

ipcMain.on('set_volume', (event, volume) => {
    CONFIG.config.volume = volume;
    CONFIG.saveConfig();
});

ipcMain.handle('get_buttons', () => {
    return CONFIG.buttons;
});

ipcMain.handle('search', async (event, query) => {
    if (query == null || query.trim() === '') return [];

    try {
        return (await play.search(query, {limit: 20})).map((info) => {
            return {
                title: info.title,
                uri: info.url,
                duration: info.durationInSec,
                thumbnail: info.thumbnails[0].url
            }
        });
    } catch (e) {
        console.error(e);
        return [];
    }
});

ipcMain.on('open_url', (event, url) => {
    shell.openExternal(url);
});

ipcMain.handle('open_media_dialog', async () => {
    return await dialog.showOpenDialog({
        filters: [
            {name: 'Audio', extensions: ['mp3', 'wav', 'ogg']}
        ]
    })
});

ipcMain.on('set_button', async (event, winId, row, col, uri, track) => {
    if (winId === null) {
        CONFIG.removeButton(row, col);
        CONFIG.saveButtons();
        return;
    }

    windows[winId].close();
    delete windows[winId];

    if (track != null) {
        try {
            const stream = await play.stream(track.uri);
            track.url = stream.url;
        } catch (e) {
            console.log(e);
        }
    } else {
        track = {
            title: '',
            uri: uri,
            duration: 0,
            thumbnail: ''
        }

        if (isYouTubeUrl(uri)) {
            const info = await video_basic_info(uri);
            track.title = info.video_details.title;
            track.uri = uri;
            track.duration = info.video_details.durationInSec;
            track.thumbnail = info.video_details.thumbnails[0].url;
        } else {
            try {
                const meta = await mm.parseFile(uri);
                if (meta != null) {
                    if (meta.common.title != null) track.title = meta.common.title;
                    else track.title = path.basename(uri);
                    track.duration = Math.round(meta.format.duration);
                }
            } catch (e) {
                console.log(e);
            }
        }
    }

    track.title = track.title.trim();

    const button = {
        row: row,
        col: col,
        title: track.title,
        track: track
    };

    CONFIG.addButton(button);
    CONFIG.saveButtons();

    mainWindow.webContents.send('button_update', button);
});

ipcMain.on('swap_buttons', async (event, row1, col1, row2, col2) => {
    const button1 = CONFIG.getButton(row1, col1);
    const button2 = CONFIG.getButton(row2, col2);

    CONFIG.removeButton(row1, col1);
    CONFIG.removeButton(row2, col2);

    if (button1 != null) {
        button1.row = row2;
        button1.col = col2;
        CONFIG.addButton(button1);
    }

    if (button2 != null) {
        button2.row = row1;
        button2.col = col1;
        CONFIG.addButton(button2);
    }

    CONFIG.saveButtons();

    mainWindow.webContents.send('button_swap', button1, button2, row1, col1, row2, col2);
});

ipcMain.handle('get_settings', () => {
    return CONFIG.getSettings();
});

ipcMain.on('save_settings', (event, winId, settings) => {
    if (CONFIG.config.settings.output_device !== settings.output_device) {
        mainWindow.webContents.send('output_device', settings.output_device);
    }

    CONFIG.config.settings = settings;
    CONFIG.saveConfig();

    windows[winId].close();
    delete windows[winId];
});

ipcMain.handle('get_new_url', async (event, row, col) => {
    const button = CONFIG.getButton(row, col);
    if (button == null) return null;

    try {
        button.track.url = (await play.stream(button.track.uri)).url;
        CONFIG.addButton(button);
        CONFIG.saveButtons();

        return button.track.url;
    } catch (e) {
        console.log(e);
    }
});

ipcMain.handle('get_output_device', () => {
    return CONFIG.config.settings.output_device != null ? CONFIG.config.settings.output_device : 'default';
});

ipcMain.on('open_button_settings', (event, row, col) => {
    openModal(mainWindow, 500, 600, false, 'button_settings.html', (modal) => {
        modal.webContents.send('rc', row, col);
        modal.webContents.send('button', CONFIG.getButton(row, col));
    });
});

ipcMain.on('update_button', (event, winId, button) => {
    if (winId != null) {
        windows[winId].close();
        delete windows[winId];
    }

    CONFIG.addButton(button);
    CONFIG.saveButtons();

    mainWindow.webContents.send('button_update', button);
});

function initSettings() {
    const e = CONFIG.init();
    if (e) {
        console.error('Errore durante l\'inizializzazione delle impostazioni:', e);
        app.quit();
    }
}

function openModal(parent, width, height, resizable, html, onFinish, onShow) {
    const modal = new BrowserWindow({
        parent: parent,
        modal: true,
        icon: 'icon.png',
        width: width,
        height: height,
        resizable: resizable,
        frame: false,
        autoHideMenuBar: true,
        show: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        }
    });

    const winId = generateWindowId();
    windows[winId] = modal;

    modal.loadFile(path.join(__dirname, 'ui', html));

    modal.webContents.on('did-finish-load', () => {
        modal.webContents.send('ready', winId, true, resizable);
        if (onFinish) onFinish(modal);
    });

    modal.once('ready-to-show', async () => {
        modal.show();
        if (DEV_TOOLS) modal.webContents.openDevTools();
        if (onShow) onShow(modal);
    });

    return modal;
}

function generateWindowId() {
    for (let id = 0; id < 4096; id++) {
        if (windows[id] == null) return id;
    }

    throw new Error('Too many windows');
}

function isYouTubeUrl(url) {
    const pattern = /^(http(s)?:\/\/)?((w){3}.)?youtu(be|.be)?(\.com)?\/.+/;
    return pattern.test(url);
}