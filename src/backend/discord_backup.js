//const {Client, Intents} = require('discord.js');
//const {joinVoiceChannel, createAudioPlayer, entersState, NoSubscriberBehavior, AudioPlayerStatus, createAudioResource, VoiceConnectionStatus} = require('@discordjs/voice');
//const playdl = require('play-dl');
//const ytdl = require('ytdl-core');
const { ToadScheduler, SimpleIntervalJob, Task } = require('toad-scheduler');
const fs = require('fs');
//const mm = require('music-metadata');

/*playdl.getFreeClientID().then(() => playdl.setToken({
    useragent: ['Discore/1.0 (https://multicoredev.it/discore)']
}));*/

const scheduler = new ToadScheduler();

function isValidHttpUrl(string) {
    let url;

    try {
        url = new URL(string);
    } catch (e) {
        return false;
    }

    return url.protocol === "http:" || url.protocol === "https:";
}

function isValidFilePath(string) {
    try {
        return fs.existsSync(string);
    } catch (e) {
        return false;
    }
}

class Discord {
    constructor(token, tag, win, volume) {

    }

    /*constructor(token, tag, win, volume) {
        this.token = token;
        this.tag = tag;
        this.win = win;
        this.volume = volume;

        this.ready = false;
        this.client = null;
        this.connection = null;
        this.player = null;
        this.resource = null;
        this.owner = null;
        this.guild = null;
        this.channel = null;
        this.playing = false;
        this.paused = false;
        this.queue = new Map();
        this.updateJob = null;
    }

    async connect() {
        this.client = new Client({intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES]});
        await this.client.login(this.token);
    }

    disconnect() {
        if (this.connection != null) {
            this.ready = false;
            this.connection.destroy();
            this.connection = null;
        }
    }

    joinChannel() {
        this.ready = false;

        this.channel = this.findMemberChannel(this.tag);
        if (this.channel == null) return;

        this.guild = this.channel.guild;

        this.connection = joinVoiceChannel({
            channelId: this.channel.id,
            guildId: this.guild.id,
            adapterCreator: this.guild.voiceAdapterCreator
        });

        this.connection.on('stateChange', (oldState, newState) => {
            this.ready = newState.status === 'ready';
        });

        this.connection.on('error', (e) => console.warn(e));

        this.player = createAudioPlayer({
            behaviors: {
                noSubscriber: NoSubscriberBehavior.Play
            }
        });

        this.player.on(AudioPlayerStatus.Playing, () => {
            this.playing = true;
            this.paused = false;

            this.win.webContents.send('player_status', {playing: this.playing, paused: this.paused});
            this.startSendingUpdates();
        });
        this.player.on(AudioPlayerStatus.Paused, () => {
            this.paused = true;

            this.stopSendingUpdates();
            this.win.webContents.send('player_status', {playing: this.playing, paused: this.paused});
        });
        this.player.on(AudioPlayerStatus.Idle, () => {
            this.playing = false;
            this.paused = false;
            this.resource = null;

            this.stopSendingUpdates();
            this.win.webContents.send('player_status', {playing: this.playing, paused: this.paused});
        });
        this.player.on('error', (e) => {
            this.playing = false;
            this.paused = false;
            this.resource = null;

            this.stopSendingUpdates();
            this.win.webContents.send('player_status', {playing: this.playing, paused: this.paused});

            console.warn(e);
        });
    }

    async play(track) {
        if (this.channel == null || this.channel !== this.findMemberChannel(this.tag)) {
            this.joinChannel();
            await entersState(this.connection, VoiceConnectionStatus.Ready, 20e3)
        }

        if (isValidHttpUrl(track)) {
            const source = await playdl.stream(track);
            const info = await ytdl.getBasicInfo(track);
            this.resource = createAudioResource(source.stream, {
                inputType: source.type,
                inlineVolume: true,
                metadata: {
                    type: 'url',
                    meta: info
                }
            });
        } else if (isValidFilePath(track)) {
            const md = await mm.parseFile(track, {duration: true});
            this.resource = createAudioResource(track, {
                inlineVolume: true,
                metadata: {
                    type: 'file',
                    meta: md,
                    title: track.substring(track.lastIndexOf('/') + 1).substring(0, track.lastIndexOf('.'))
                }
            });
        } else {
            const search = await playdl.search(track, {limit: 1});
            const source = await playdl.stream(search[0].url);
            const info = await ytdl.getBasicInfo(search[0].url);
            this.resource = createAudioResource(source.stream, {
                inputType: source.type,
                inlineVolume: true,
                metadata: {
                    type: 'url',
                    meta: info
                }
            });
        }

        if (this.resource == null) return;

        this.player.play(this.resource);

        this.connection.subscribe(this.player);
        this.resource.volume.setVolume(this.volume / 100);

        this.playing = true;
        this.paused = false;
    }

    pause() {
        if (!this.playing) return;
        this.player.pause();
    }

    unpause() {
        if (!this.playing || !this.paused) return;
        this.player.unpause();
    }

    playPause() {
        if (!this.playing) return;

        if (this.paused) this.unpause();
        else this.pause();
    }

    stop() {
        if (!this.playing) return;
        this.player.stop();

        this.stopSendingUpdates();
        scheduler.stop();
    }

    setVolume(volume) {
        this.volume = volume;

        if (this.resource == null) return;
        this.resource.volume.setVolume(volume / 100);
    }

    seekTo(time) {
        if (!this.playing) return;
        this.resource.seekTo(time);

        //this.connection.play(this.resource, {seek: time / 1000})
    }

    startSendingUpdates() {
        this.stopSendingUpdates();

        const task = new Task('player_update', async () => {
            const meta = this.resource.metadata;

            let length;
            let title;

            if (meta.type === 'url') {
                length = this.resource.metadata.meta.videoDetails.lengthSeconds * 1000;
                title = meta.meta.videoDetails.title;
            } else if (meta.type === 'file') {
                length = this.resource.metadata.meta.format.duration * 1000;
                title = meta.title;
            }

            this.win.webContents.send('player_update', {
                track: title,
                current_progress: this.resource.playbackDuration,
                total_length: length
            });
        });

        this.updateJob = new SimpleIntervalJob({milliseconds: 10, runImmediately: true}, task, 'player_update');
        scheduler.addSimpleIntervalJob(this.updateJob);
    }

    stopSendingUpdates() {
        try {
            scheduler.stopById('player_update');
            scheduler.removeById('player_update');
        } catch (e) {}

        this.updateJob = null;
    }*/

    getGuilds() {
        const guilds = [];
        this.client.guilds.cache.forEach(g => {
            guilds.push(g);
        });

        return guilds;
    }

    getMember(guild, tag) {
        const user = this.client.users.cache.find(u => u.tag === tag);
        if (user == null) return null;

        const member = guild.members.cache.get(user.id);
        if (member != null) return member;
    }

    findMemberChannel(tag) {
        const members = [];
        this.getGuilds().forEach(guild => {
            const member = this.getMember(guild, tag);
            if (member != null) members.push(member);
        });

        let channel;
        members.forEach(member => {
            const voice = member.voice;
            if (voice != null && voice.channel != null) channel = voice.channel;
        });

        return channel;
    }
}

module.exports = Discord;