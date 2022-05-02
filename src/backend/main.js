const {app, BrowserWindow, ipcMain} = require('electron');
const path = require('path');
const {Client, Intents} = require('discord.js');
const {joinVoiceChannel, createAudioPlayer, createAudioResource, NoSubscriberBehavior} = require('@discordjs/voice');
const { ytdl } = require('ytdl-core');
const ipc = ipcMain;
const fs = require('fs');

const DEV_TOOLS = true;
const settingsPath = 'settings.json';
const buttonsPath = 'buttons.json';
let mainWin;
const windows = {};
const modals = {};
let playlist = null;
let settings;
let buttons;
let dsClient;
let dsGuild;
let dsPlayer;
let dsConnection;

// Local COMs
ipc.on('minimize', (e, id) => {
    if (id === 'main') {
        mainWin.minimize();
    } else if (id === 'playlist') {
        playlist.minimize();
    } else {
        windows[id].minimize();
    }
});

ipc.on('maximize', (e, id) => {
    if (id === 'main') {
        if (mainWin.isMaximized()) {
            mainWin.restore();
        } else {
            mainWin.maximize();
        }
    } else if (id === 'playlist') {
        if (playlist.isMaximized()) {
            playlist.restore();
        } else {
            playlist.maximize();
        }
    } else {
        const win = windows[id];
        if (win.isMaximized()) {
            win.restore();
        } else {
            win.maximize();
        }
    }
});

ipc.on('close', (e, id) => {
    if (id === 'main') {
        mainWin.close();
        app.quit();
    } else if (id === 'playlist') {
        playlist.close();
        playlist = null;
    } else {
        windows[id].close();
        windows[id] = null;
    }
});

ipc.on('close_modal', (e, id) => {
    modals[id].close();
    modals[id] = null;
});

ipc.on('close_window', (e, id) => {
    windows[id].close();
    windows[id] = null;
});

ipc.on('open_settings', (e, id) => {
    openSettings(id);
});

ipc.on('open_media_selector', (e, id) => {
    openMediaSelector(id);
});

ipc.on('get_buttons', () => {
    mainWin.webContents.send('buttons', buttons);
})

ipc.on('save_settings', (e, s) => {
    settings = s;
    saveStorage(settings, settingsPath);
});

ipc.on('update_button', (e, b) => {
    updateButton(b);
});

ipc.on('open_playlist', () => {
    if (playlist == null) openPlaylist();
});

//Remote COMs
ipc.on('get_status', (e, id) => {
    socket.write(JSON.stringify({
        "type": "cmd",
        "cmd": "get_status",
        "id": id
    }));
});

ipc.on('get_track_info', (e, track) => {
    if (track.src == null || track.src.trim().length === 0) return;
    socket.write(JSON.stringify({
        "type": "cmd",
        "cmd": "get_track",
        "id": track.id,
        "src": track.src
    }));
});

ipc.on('play_now', (e, src) => {
    if (src == null || src.trim().length === 0) return;
    socket.write(JSON.stringify({
        "type": "cmd",
        "cmd": "play_now",
        "src": src
    }));
});

ipc.on('play_button', (e, id) => {
    const btn = getButton(id);
    const src = btn.src;

    if (src == null || src.trim().length === 0) return;

    const volume = btn.volume;
    const crop = btn.crop;

    if (crop) {
        const start = btn.start;
        const startTU = btn.start_tu;
        const endType = btn.stop_type;
        const end = btn.stop;
        const endTU = btn.stop_tu;

        socket.write(JSON.stringify({
            "type": "cmd",
            "cmd": "play_now",
            "src": src,
            "volume": volume,
            "start": start,
            "start_tu": startTU,
            "end": end,
            "end_tu": endTU,
            "end_type": endType
        }));
    } else {
        socket.write(JSON.stringify({
            "type": "cmd",
            "cmd": "play_now",
            "src": src,
            "volume": volume
        }));
    }
});

ipc.on('add_to_playlist', (e, src) => {
    if (src == null || src.trim().length === 0) return;

    socket.write(JSON.stringify({
        "type": "cmd",
        "cmd": "add_to_playlist",
        "src": src
    }));
});

ipc.on('add_button_to_playlist', (e, id) => {
    const btn = getButton(id);
    const src = btn.src;

    if (src == null || src.trim().length === 0) return;

    const volume = btn.volume;
    const crop = btn.crop;

    if (crop) {
        const start = btn.start;
        const startTU = btn.start_tu;
        const endType = btn.stop_type;
        const end = btn.stop;
        const endTU = btn.stop_tu;

        socket.write(JSON.stringify({
            "type": "cmd",
            "cmd": "add_to_playlist",
            "src": src,
            "volume": volume,
            "start": start,
            "start_tu": startTU,
            "end": end,
            "end_tu": endTU,
            "end_type": endType
        }));
    } else {
        socket.write(JSON.stringify({
            "type": "cmd",
            "cmd": "add_to_playlist",
            "src": src,
            "volume": volume
        }));
    }
});

ipc.on('play_pause', () => {
    socket.write(JSON.stringify({
        "type": "cmd",
        "cmd": "play_pause"
    }));
});

ipc.on('stop', () => {
    socket.write(JSON.stringify({
        "type": "cmd",
        "cmd": "stop"
    }));
});

ipc.on('set_volume', (e, volume) => {
    socket.write(JSON.stringify({
        "type": "cmd",
        "cmd": "set_volume",
        "volume": volume
    }));
});

ipc.on('set_position', (e, position) => {
    socket.write(JSON.stringify({
        "type": "cmd",
        "cmd": "set_position",
        "position": position
    }));
});

ipc.on('previous', () => {
    socket.write(JSON.stringify({
        "type": "cmd",
        "cmd": "previous"
    }));
});

ipc.on('next', () => {
    socket.write(JSON.stringify({
        "type": "cmd",
        "cmd": "next"
    }));
});

//

function createWindow() {
    const win = new BrowserWindow({
        icon: 'icon.png',
        width: settings.width,
        height: settings.height,
        minWidth: 1280,
        minHeight: 720,
        frame: false,
        autoHideMenuBar: true,
        show: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    win.loadFile('src/index.html', {
        query: {
            data: JSON.stringify({
                settings: encode_b64(JSON.stringify(settings)),
                buttons: encode_b64(JSON.stringify(settings))
            })
        }
    });

    win.once('ready-to-show', () => {
        win.show();
        if (DEV_TOOLS) win.webContents.openDevTools();
    });

    mainWin = win;
}

function openSettings(id) {
    const win = new BrowserWindow({
        icon: 'icon.png',
        width: 500,
        height: 575,
        resizable: false,
        frame: false,
        autoHideMenuBar: true,
        show: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            devTools: DEV_TOOLS,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    win.loadFile('src/button_settings.html', {query: {'data': '{"id": ' + id + ', "button": "' + JSON.stringify(getButton(id)).replaceAll('"', '\\"') + '" }'}});
    win.once('ready-to-show', () => win.show());

    windows[id] = win;
}

function openMediaSelector(id) {
    const parent = id == null ? mainWin : windows[id];
    if (id == null) id = -1;

    const win = new BrowserWindow({
        parent: parent,
        modal: true,
        icon: 'icon.png',
        width: 500,
        height: 130,
        resizable: false,
        frame: false,
        autoHideMenuBar: true,
        show: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            devTools: DEV_TOOLS,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    win.loadFile('src/media_selector.html', {query: {'data': '{"id": ' + id + ', "button": "' + JSON.stringify(getButton(id)).replaceAll('"', '\\"') + '" }'}});
    win.once('ready-to-show', () => win.show());

    modals[id] = win;
}

function openPlaylist() {
    const win = new BrowserWindow({
        icon: 'icon.png',
        width: 500,
        height: 575,
        minWidth: 500,
        minHeight: 200,
        resizable: true,
        frame: false,
        autoHideMenuBar: true,
        show: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            devTools: DEV_TOOLS,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    win.loadFile('src/playlist.html');
    win.once('ready-to-show', () => win.show());

    playlist = win;
}

function saveStorage(storage, path) {
    fs.writeFileSync(path, JSON.stringify(storage, null, 2));
}

function loadStorage() {
    try {
        if (fs.existsSync(settingsPath)) {
            settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        } else {
            settings = {"rows": 8, "cols": 10, "volume": 100, "width": 1280, "height": 720};
            saveStorage(settings, settingsPath);
        }
    } catch (e) {
        console.log(e);
    }

    try {
        if (fs.existsSync(buttonsPath)) {
            buttons = JSON.parse(fs.readFileSync(buttonsPath, 'utf8'));
        } else {
            buttons = {"buttons": []};
            saveStorage(buttons, buttonsPath);
        }
    } catch (e) {
        console.log(e);
    }
}

function getButton(id) {
    for (let i = 0; i < buttons['buttons'].length; i++) {
        const btn = buttons['buttons'][i];
        if (btn.id == id) return btn;
    }

    return {};
}

function updateButton(b) {
    if (b.title.includes('"')) b.title = b.title.replace('"', "'");
    let found = false;

    for (let i = 0; i < buttons['buttons'].length; i++) {
        const btn = buttons['buttons'][i];
        if (btn.id == b.id) {
            found = true;
            buttons['buttons'][i] = b;
            break;
        }
    }

    if (!found) {
        buttons['buttons'].push(b);
    }

    saveStorage(buttons, buttonsPath);
    mainWin.webContents.send('buttons', buttons);
}

function deleteButton(id) {
    for (let i = 0; i < buttons['buttons'].length; i++) {
        const btn = buttons['buttons'][i];
        if (btn.id == id) {
            buttons['buttons'][i] = null;
            break;
        }
    }

    saveStorage(buttons, buttonsPath);
    mainWin.webContents.send('buttons', buttons);
}

function connectToDiscord() {
    dsClient = new Client({intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES]});

    dsClient.on('ready', () => {
        const members = [];
        getGuilds().forEach(guild => {
            const member = getMember(guild, settings.tag);
            if (member != null) members.push(member);
        });

        let channel;
        members.forEach(member => {
            const voice = member.voice;
            if (voice != null && voice.channel != null) channel = voice.channel;
        });
        dsGuild = channel.guild;

        dsConnection = joinVoiceChannel({
            channelId: channel.id,
            guildId: dsGuild.id,
            adapterCreator: dsGuild.voiceAdapterCreator
        });

        dsPlayer = createAudioPlayer({
            behaviors: {
                noSubscriber: NoSubscriberBehavior.Play
            }
        });

        play("C:\\Users\\lmlor\\Desktop\\Maruko Leader.mp3");
    });

    dsClient.login(settings.token);
}

function play(track) {
    const resource = createAudioResource(track);

    dsPlayer.play(resource);
    dsConnection.subscribe(dsPlayer);
}

function pause() {
    dsPlayer.pause();
}

function playPause() {
    if (dsPlayer.playin)
}

function encode_b64(str) {
    try {
        return btoa(str);
    } catch (err) {
        return Buffer.from(str).toString('base64');
    }
}

function decode_b64(str) {
    try {
        return btoa(str);
    } catch (err) {
        return Buffer.from(str).toString('base64');
    }
}

app.whenReady().then(() => {
    loadStorage();
    createWindow();
    connectToDiscord();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
});

app.on('before-quit', () => {
    if (dsConnection != null) dsConnection.destroy();
});


// Discord
function getGuilds() {
    const guilds = [];
    dsClient.guilds.cache.forEach(g => {
        guilds.push(g);
    });

    return guilds;
}

function getMember(guild, tag) {
    const user = dsClient.users.cache.find(u => u.tag === tag);
    if (user == null) return null;

    const member = guild.members.cache.get(user.id);
    if (member != null) return member;
}