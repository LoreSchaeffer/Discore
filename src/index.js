const {app, BrowserWindow, ipcMain} = require('electron');
const path = require('path');
const Conf = require('./conf');

const DEV_TOOLS = true;
const CONFIG = new Conf("conf");

if (require('electron-squirrel-startup')) {
    app.quit();
}

const startApp = () => {
    initSettings();

    const mainWindow = new BrowserWindow({
        icon: 'icon.png',
        width: CONFIG.config.width,
        height: CONFIG.config.height,
        minWidth: 1280,
        minHeight: 720,
        frame: false,
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        }
    });

    mainWindow.loadFile(path.join(__dirname, 'ui', 'index.html'));
    if (DEV_TOOLS) mainWindow.webContents.openDevTools();

    mainWindow.on('resize', () => {
        const size = mainWindow.getSize();
        CONFIG.config.width = size[0];
        CONFIG.config.height = size[1];
        CONFIG.saveConfig();
    });

    ipcMain.on('minimize', () => {
        mainWindow.minimize();
    });

    ipcMain.on('maximize', () => {
        if (mainWindow.isMaximized()) {
            mainWindow.restore();
        } else {
            mainWindow.maximize();
        }
    });

    ipcMain.on('close', () => {
        mainWindow.close();
        app.quit();
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

ipcMain.on('menu', () => {
    console.log('Menu');
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

ipcMain.on('get_buttons', () => {

});

function initSettings() {
    const e = CONFIG.init();
    if (e) {
        console.error('Errore durante l\'inizializzazione delle impostazioni:', e);
        app.quit();
    }
}