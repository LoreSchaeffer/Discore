const {app, BrowserWindow, ipcMain, shell, dialog, globalShortcut} = require('electron');
const {video_basic_info} = require('play-dl');
const fs = require('fs');
const path = require('path');
const play = require('play-dl');
const https = require('https');
const mm = require('music-metadata');
const Config = require('./config');
const Database = require('./database');

const RENDERER_DIR = path.join(__dirname, '..', 'renderer');
const CONFIG_DIR = app.getPath('userData');
const CONFIG = new Config(CONFIG_DIR);
const DB = new Database(CONFIG_DIR);
const windows = {};
let mainWindow;

//TODO Find metadata for local files (eventually using online services)
//TODO Add support for spotify
//TODO Text color not updating when hovered

if (require('electron-squirrel-startup')) {
    app.quit();
}

const startApp = async () => {
    await initConfigs();
    registerGlobalShortcuts();

    mainWindow = new BrowserWindow({
        icon: 'assets/icon.png',
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

    mainWindow.loadFile(path.join(RENDERER_DIR, 'index.html'));

    mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.webContents.send('ready', -1, false, true);
    });

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    mainWindow.on('resize', () => {
        const size = mainWindow.getSize();
        CONFIG.config.width = size[0];
        CONFIG.config.height = size[1];
        CONFIG.save();
    });
};

/* === App Events === */

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

app.on('will-quit', async () => {
    await DB.close();
    globalShortcut.unregisterAll();
});

/* === IPC === */

// Navbar
ipcMain.on('minimize', (event, winId) => {
    getWindow(winId).minimize();
});

ipcMain.on('maximize', (event, winId) => {
    const win = getWindow(winId)
    if (!win.isResizable) return;

    if (win.isMaximized()) win.restore();
    else win.maximize();
});

ipcMain.on('close', (event, winId) => {
    if (winId === -1) {
        mainWindow.close();
        app.quit();
    } else {
        getWindow(winId).close();
        delete windows[winId];
    }
});


// Windows
ipcMain.on('open_browser', async (event, url) => {
    await shell.openExternal(url);
});

ipcMain.on('open_media_selector', (event, profile, row, col, parent, callback) => {
    openModal(parent, 500, 600, false, 'media_selector.html', async (modal) => {
        let button = await DB.getButton(profile, row, col);

        if (button == null) {
            button = {
                row: row,
                col: col,
                profile_id: profile
            };
        }

        modal.webContents.send('button', button);
        if (callback != null) modal.webContents.send('callback', callback);
    });
});

ipcMain.handle('open_file_media_selector', async (event) => {
    return await dialog.showOpenDialog({
        filters: [
            {name: 'Audio', extensions: ['mp3', 'wav', 'ogg']}
        ]
    });
});

ipcMain.on('open_button_settings', (event, profile, row, col) => {
    openModal(-1, 500, 600, false, 'button_settings.html', async (modal) => {
        let button = await DB.getButton(profile, row, col);

        if (button == null) {
            button = {
                row: row,
                col: col,
                profile_id: profile
            };
        }

        modal.webContents.send('button', button);
    });
});

ipcMain.on('open_play_now_window', (event) => {
    openModal(-1, 500, 600, false, 'media_selector.html', (modal) => {
        modal.webContents.send('button', null);
    });
});


// Settings
ipcMain.handle('get_soundboard_settings', () => {
    const settings = {};

    settings.volume = CONFIG.config.volume;
    settings.output_device = CONFIG.config.output_device;
    settings.active_profile = CONFIG.config.active_profile;
    settings.loop = CONFIG.config.loop;
    settings.font_size = CONFIG.config.font_size;

    return settings;
});

ipcMain.on('set_soundboard_size', (event, profile, rows, cols) => {
    DB.resizeProfile(profile, rows, cols);
});

ipcMain.on('set_volume', (event, volume) => {
    CONFIG.config.volume = volume;
    CONFIG.save();
});

ipcMain.on('set_media_output', (event, device) => {
    CONFIG.config.output_device = device;
    CONFIG.save();
});

ipcMain.handle('set_active_profile', (event, profile) => {
    CONFIG.config.active_profile = profile;
    CONFIG.save();

    return DB.getProfile(profile);
});

ipcMain.on('set_loop', (event, loop) => {
    CONFIG.config.loop = loop;
    CONFIG.save();
});

ipcMain.on('set_font_size', (event, size) => {
    CONFIG.config.font_size = size;
    CONFIG.save();
});


// Profiles
ipcMain.handle('get_profiles', () => {
    return DB.getProfiles();
});

ipcMain.handle('create_profile', (event, name) => {
    return new Promise((resolve, reject) => {
        DB.createProfile(name).then((profile) => {
            CONFIG.config.active_profile = profile.id;
            CONFIG.save();
            resolve(profile);
        }).catch(() => {
            reject(false);
        });
    })
});

ipcMain.handle('rename_profile', (event, id, name) => {
    return DB.renameProfile(id, name);
});

ipcMain.handle('delete_profile', (event, id) => {
    return new Promise(async (resolve, reject) => {
        try {
            const profiles = await DB.getProfiles();
            if (profiles.length === 1) {
                console.error("Cannot delete the last remaining profile");
                reject();
            } else {
                await DB.deleteProfile(id);
                const profiles = await DB.getProfiles();
                await DB.deleteButtons(id);
                return resolve(profiles[0]);
            }
        } catch (error) {
            reject(error);
        }
    });
});

ipcMain.handle('import_profile', async (event) => {
    const {filePaths} = await dialog.showOpenDialog({
        title: 'Import profile',
        defaultPath: app.getPath('documents'),
        filters: [
            {
                name: 'JSON',
                extensions: ['json']
            }
        ]
    });

    if (!filePaths || !filePaths[0]) return; //TODO Show error message

    const data = JSON.parse(fs.readFileSync(filePaths[0]));

    if (data.profile == null || data.buttons == null) return; //TODO Show error message

    if (data.profile.name == null || data.profile.name.length === 0) data.profile.name = 'Imported profile';
    const profile = await DB.createProfile(data.profile.name);

    if (data.profile.rows != null && data.profile.rows > 0) profile.rows = data.profile.rows;
    if (data.profile.columns != null && data.profile.columns > 0) profile.columns = data.profile.columns;
    await DB.resizeProfile(profile.id, profile.rows, profile.columns);

    data.buttons.forEach((btn) => {
        if (btn.row == null || btn.col == null) return;
        if (btn.uri == null || btn.uri.length === 0) return;
        if (btn.duration == null || btn.duration <= 0) return;

        const button = btn;
        button.profile_id = profile.id;
        delete button.id;

        DB.addButton(profile.id, button);
    });

    return profile;
});

ipcMain.on('export_profile', async (event, id) => {
    const profile = await DB.getProfile(id);
    if (profile == null) return; //TODO Show error message

    const buttons = await DB.getButtons(id);

    const exportData = {
        profile: profile,
        buttons: buttons
    };

    const {filePath} = await dialog.showSaveDialog({
        title: 'Export profile',
        defaultPath: path.join(app.getPath('documents'), profile.name.replace(/[^a-z0-9]/gi, '_') + '.json'),
        filters: [
            {
                name: 'JSON',
                extensions: ['json']
            }
        ]
    });

    if (!filePath) return; //TODO Show error message

    fs.writeFileSync(filePath, JSON.stringify(exportData, null, 2));
});


// Buttons
ipcMain.handle('get_buttons', (event, profile) => {
    return new Promise(async (resolve, reject) => {
        const buttons = await DB.getButtons(profile);
        initButtons(profile, buttons);
        resolve(buttons);
    });
});

ipcMain.handle('get_button', (event, profile, row, col) => {
    return DB.getButton(profile, row, col);
});

ipcMain.handle('get_track', (event, profile, row, col) => {
    return new Promise(async (resolve, reject) => {
        try {
            const button = await DB.getButton(profile, row, col);
            if (button == null) return resolve(null);

            if (isYouTubeUrl(button.uri)) {
                if (!(await isYouTubeUrlValid(button.url))) {
                    button.url = await getStreamUrl(button.uri);
                    DB.updateButton(profile, button);
                }
            }

            const track = {
                title: button.title,
                uri: button.uri,
                url: button.url != null ? button.url : button.uri,
                duration: button.duration,
                thumbnail: button.thumbnail,
                start_time: button.start_time,
                start_time_unit: button.start_time_unit,
                end_time_type: button.end_time_type,
                end_time: button.end_time,
                end_time_unit: button.end_time_unit
            };

            resolve(track);
        } catch (e) {
            console.log(e);
        }
    });
});

ipcMain.on('set_button', async (event, profile, button, winId) => {
    const btn = await setButton(profile, button);
    if (btn != null) {
        if (winId != null) {
            if (winId !== -1) {
                const win = getWindow(winId);
                if (win != null) win.webContents.send('button_update', btn);
            }
        }

        mainWindow.webContents.send('button_update', btn);
    }
});

ipcMain.handle('swap_buttons', (event, profile, row1, col1, row2, col2) => {
    return new Promise(async (resolve, reject) => {
        let button1 = await DB.getButton(profile, row1, col1);
        let button2 = await DB.getButton(profile, row2, col2);

        if (button1 != null) {
            button1.row = row2;
            button1.col = col2;

            if (button2 != null) await DB.deleteButton(profile, row2, col2);
            DB.moveButton(profile, button1, row1, col1);
        } else {
            button1 = {
                row: row2,
                col: col2,
                profile_id: profile,
                empty: true
            }
        }

        if (button2 != null) {
            button2.row = row1;
            button2.col = col1;

            DB.addButton(profile, button2);
        } else {
            button2 = {
                row: row1,
                col: col1,
                profile_id: profile,
                empty: true
            }
        }

        resolve([button1, button2]);
    });
});

ipcMain.on('delete_button', (event, profile, row, col) => {
    DB.deleteButton(profile, row, col);
});

ipcMain.on('media_selector_button', async (event, profile, button, parent, callback) => {
    if (callback != null) {
        if (callback === 'set_button') button = await setButton(profile, button);
    }

    getWindow(parent).webContents.send('button_update', button);
});


// Misc
ipcMain.handle('search', (event, query) => {
    if (query == null || query.trim() === '') return [];

    try {
        return new Promise(async (resolve, reject) => {
            let videos;

            if (isYouTubeUrl(query)) {
                videos = [(await play.video_basic_info(query)).video_details];
            } else {
                videos = await play.search(query, {limit: 20});
            }

            resolve(videos.map((video) => {
                return {
                    title: video.title,
                    uri: video.url,
                    duration: video.durationInSec * 1000,
                    thumbnail: video.thumbnails[0].url
                }
            }));
        })
    } catch (e) {
        return [];
    }
});

ipcMain.on('play_now', async (event, track) => {
    if (isYouTubeUrl(track.uri)) {
        if (!(await isYouTubeUrlValid(track.url))) {
            track.url = await getStreamUrl(track.uri);
        }
    }

    mainWindow.webContents.send('play_now', track);
});

ipcMain.handle('get_stream_url', (event, uri) => {
    return getStreamUrl(uri);
});


/* === Functions === */

function registerGlobalShortcuts() {
    globalShortcut.register('MediaPlayPause', () => {
        mainWindow.webContents.send('media_play_pause');
    });

    globalShortcut.register('MediaStop', () => {
        mainWindow.webContents.send('media_stop');
    });

    globalShortcut.register('MediaPreviousTrack', () => {
        mainWindow.webContents.send('media_prev');
    });

    globalShortcut.register('MediaNextTrack', () => {
        mainWindow.webContents.send('media_next');
    });
}

async function initConfigs() {
    const result = CONFIG.init();
    if (result) {
        console.error('Error during configs initialization:', result);
        app.quit();
    }

    try {
        const profiles = await DB.getProfiles();
        if (profiles.length === 0) {
            DB.createProfile('Default').then((profile) => {
                CONFIG.config.active_profile = profile.id;
                CONFIG.save();
            }).catch((e) => {
                console.error(e);
                app.quit();
            });
        } else {
            if (profiles.findIndex((profile) => profile.id === CONFIG.config.active_profile) === -1) {
                CONFIG.config.active_profile = profiles[0].id;
                CONFIG.save();
            }
        }
    } catch (e) {
        console.error(e);
        app.quit();
    }
}

function openModal(parent, width, height, resizable, html, onFinish, onShow) {
    const modal = new BrowserWindow({
        parent: getWindow(parent),
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

    modal.loadFile(path.join(RENDERER_DIR, html));

    modal.webContents.on('did-finish-load', () => {
        modal.webContents.send('ready', winId, true, resizable);
        if (parent != null) modal.webContents.send('parent', parent);

        if (onFinish) onFinish(modal);
    });

    modal.once('ready-to-show', async () => {
        modal.show();
        if (onShow) onShow(modal);
    });

    return winId;
}

function getWindow(id) {
    if (id === -1) return mainWindow;
    else return windows[id];
}

function getWindowId(win) {
    if (win === mainWindow) return -1;

    for (const [id, window] of Object.entries(windows)) {
        if (window === win) return id;
    }

    return null;
}

function generateWindowId() {
    for (let id = 0; id < 4096; id++) {
        if (windows[id] == null) return id;
    }

    throw new Error('Too many windows');
}

async function setButton(profile, button) {
    try {
        if (button.url == null) button.url = await getStreamUrl(button.uri);

        const btn = await DB.getButton(profile, button.row, button.col);

        if (btn != null) return await DB.updateButton(profile, button);
        else return await DB.addButton(profile, button);
    } catch (e) {
        console.log(e);
    }
}

async function initButtons(profile, buttons) {
    for (const button of buttons) {
        if (isYouTubeUrl(button.uri)) {
            if (!(await isYouTubeUrlValid(button.url))) {
                button.url = await getStreamUrl(button.uri);
                DB.updateButton(profile, button);
            }
        }
    }
}

async function getStreamUrl(uri) {
    try {
        const stream = await play.stream(uri);
        return stream.url;
    } catch (e) {
        return null;
    }
}

function isYouTubeUrlValid(url) {
    return new Promise((resolve, reject) => {
        if (url == null) resolve(false);

        https.get(url, (res) => {
            if (res.statusCode === 403) resolve(false);
            else resolve(true);
        }).on('error', (error) => {
            resolve(false);
        });
    });
}

function isYouTubeUrl(url) {
    const pattern = /^(http(s)?:\/\/)?((w){3}.)?youtu(be|.be)?(\.com)?\/.+/;
    return pattern.test(url);
}