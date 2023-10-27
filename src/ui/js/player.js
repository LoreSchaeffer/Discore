const Player = class {
    constructor() {
        this.eventHandlers = {};
        this.audio = new Audio();
        this.currentTrack = null;
        this.isPlaying = false;

        this.audio.addEventListener('timeupdate', this.timeupdate.bind(this));
        this.audio.addEventListener('play', () => {
            this.isPlaying = true;
            this.dispatchEvent('play', this.currentTrack);
        });
    }

    async play(track) {
        if (this.currentTrack != null) this.stop();
        this.currentTrack = track;
        let src;

        if (track.uri.startsWith('https')) {
            src = track.url;
        } else {
            src = track.uri;
        }

        this.audio.src = src;
        this.audio.load();
        await this.audio.play();
    }

    stop() {
        this.audio.pause();
        this.audio.currentTime = 0;

        this.isPlaying = false;
        this.currentTrack = null;

        this.dispatchEvent('stop');
    }

    playPause() {
        if (this.isPlaying) this.pause();
        else this.resume();
    }

    pause() {
        this.audio.pause();
        this.isPlaying = false;
        this.dispatchEvent('pause');
    }

    resume() {
        this.audio.play().then(() => {
            this.isPlaying = true;
            this.dispatchEvent('resume');
        });
    }

    setVolume(volume) {
        this.audio.volume = volume / 100;
    }

    seekTo(time) {
        this.audio.currentTime = time;
    }

    setOutputDevice(deviceId) {
        this.audio.setSinkId(deviceId);
    }

    timeupdate() {
        const currentTime = Math.round(this.audio.currentTime) + 1;
        this.dispatchEvent('timeupdate', currentTime);

        if (this.currentTrack == null) return;
        if (currentTime === this.currentTrack.duration) this.stop();
    }

    addEventListener(eventName, handler) {
        if (!this.eventHandlers[eventName]) {
            this.eventHandlers[eventName] = [];
        }
        this.eventHandlers[eventName].push(handler);
    }

    removeEventListener(eventName, handler) {
        if (this.eventHandlers[eventName]) {
            const index = this.eventHandlers[eventName].indexOf(handler);
            if (index !== -1) {
                this.eventHandlers[eventName].splice(index, 1);
            }
        }
    }

    dispatchEvent(eventName, eventData) {
        if (this.eventHandlers[eventName]) {
            this.eventHandlers[eventName].forEach(handler => {
                handler(eventData);
            });
        }
    }
}