const Player = class {
    constructor() {
        this.eventHandlers = {};
        this.audio = new Audio();
        this.queue = [];
        this.index = 0;
        this.currentTrack = null;
        this.isPlaying = false;
        this.loop = 0; // 0: none, 1: loop all, 2: loop one

        this.audio.addEventListener('timeupdate', this.timeupdate.bind(this));
        this.audio.addEventListener('play', () => {
            this.isPlaying = true;
            this.dispatchEvent('play', this.currentTrack);
        });
    }

    addToQueue(track) {
        this.queue.push(track);
    }

    clearQueue() {
        this.queue = [];
        this.index = 0;
    }

    next() {
        this.index++;
        if (this.loop === 1 && this.index >= this.queue.length) this.index = 0;
    }

    previous() {
        this.index--;
        if (this.index < 0) this.index = this.queue.length - 1;
    }

    loop(mode) {
        this.loop = mode;
    }

    async play() {
        if (this.isPlaying) this.stop();

        if (this.queue.length === 0) return;

        this.currentTrack = this.queue[this.index];
        await this._play();
    }

    async playNow(track) {
        if (this.isPlaying) this.stop();

        this.currentTrack = track;
        await this._play();
    }

    async _play() {
        this.audio.src = this.currentTrack.url;
        this.audio.load();

        if (this.currentTrack.start_time) {
            const startTime = new Time(this.currentTrack.start_time, this.currentTrack.start_time_unit);
            if (this.currentTrack.startTime) this.audio.currentTime = startTime.toSeconds();
        }

        this.audio.play();
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

    seekTo(time) {
        this.audio.currentTime = time;
    }


    setVolume(volume) {
        this.audio.volume = volume / 100;
    }

    setOutputDevice(deviceId) {
        this.audio.setSinkId(deviceId).catch((e) => {});
    }


    timeupdate() {
        if (!this.isPlaying) return;

        // const currentTime = Math.round(this.audio.currentTime) + 1;
        // this.dispatchEvent('timeupdate', currentTime);
        //
        // if (this.currentTrack == null) return;
        // if (currentTime >= this.currentTrack.duration) this.stop();
        // if (this.audio.currentTime * 1000 >= this.endTime) this.stop();
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