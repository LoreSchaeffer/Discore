const Discord = require("discord.js");
const {Player} = require("discord-music-player");
const {Client, Intents} = require("discord.js");
const {ToadScheduler, SimpleIntervalJob, Task} = require('toad-scheduler');
const fs = require('fs');

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
        this.tag = tag;
        this.win = win;
        this.volume = volume;
        this.ready = false;
        this.guild = null;
        this.channel = null;

        this.client = new Discord.Client({intents: [
                Intents.FLAGS.GUILDS,
                Intents.FLAGS.GUILD_MESSAGES,
                Intents.FLAGS.GUILD_VOICE_STATES
            ]
        });

        this.client.player = new Player(this.client, {
            leaveOnEmpty: true
        });

        this.queue = null;

        this.client.on('ready', () => {
            this.ready = true;
            this.channel = this.findMemberChannel(tag);
        });

        this.client.login(token);
    }

    play(track) {
        let queue = this.client.player.createQueue("669899820592267273");
        queue.join("725665817529942501").then(() => {
            queue.play("C:\\Users\\lmlor\\Desktop\\Jim Yosef - Let You Go _ IMPOSSIBLE REMIX.mp3").catch(_ => {
                if(!queue)
                    queue.stop();
            });
        });
        //let song = await

        queue.setVolume(50);

        setTimeout(() => queue.seek(30000), 2000);
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
    }

    getMember(guild, tag) {
        const user = this.client.users.cache.find(u => u.tag === tag);
        if (user == null) return null;

        const member = guild.members.cache.get(user.id);
        if (member != null) return member;
    }

    findMemberChannel(tag) {
        let channel;

        this.client.guilds.cache.forEach(guild => {
            const member = this.getMember(guild, tag);
            if (member == null) return;

            const voice = member.voice;
            if (voice == null || voice.channel == null) return;
            channel = voice.channel;
        });

        return channel;
    }
}

module.exports = Discord;