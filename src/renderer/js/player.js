const Player = class {
    constructor() {
        this.eventHandlers = {};
        this.audio = new Audio();
        this.queue = [];
        this.index = 0;
        this.currentTrack = null;
        this.playingQueue = false;
        this.isPlaying = false;
        this.isPaused = false;
        this.isSeeking = false;
        this.startTime = 0;
        this.endTime = 0;
        this.repeat = 'none';

        this.audio.addEventListener('abort', () => {
            console.log('abort');
        });

        this.audio.addEventListener('ended', () => {
            this.dispatchEvent('ended', this.currentTrack, this.queue);

            this.isPlaying = false;

            if (this.queue.length !== 0) {
                this._clearTrack();

                if (this.repeat === 'one') {
                    this.currentTrack = this.queue[this.index];
                    this._play();
                } else if (this.repeat === 'none' && this.index === this.queue.length - 1) {
                } else {
                    this.next();
                }
            } else {
                if (this.repeat === 'all' || this.repeat === 'one') this._play();
                else this._clearTrack();
            }
        });

        this.audio.addEventListener('error', () => {
            console.log('error');
        });

        this.audio.addEventListener('pause', () => {
            if (this.isPlaying) {
                this.isPaused = true;
                this.dispatchEvent('pause');
            }
        });

        this.audio.addEventListener('playing', () => {
            this.isPlaying = true;

            if (this.isPaused) {
                this.isPaused = false;
                this.dispatchEvent('resume');
            } else {
                let duration = this.currentTrack.duration;
                if (this.startTime !== 0) duration -= this.startTime;
                if (this.endTime !== 0) duration -= (this.currentTrack.duration - this.endTime);

                this.dispatchEvent('play', this.currentTrack, duration);
            }
        });

        this.audio.addEventListener('seeked', () => {
            this.isSeeking = false;
        });

        this.audio.addEventListener('timeupdate', () => {
            this._timeupdate();
        });
    }

    addToQueue(track) {
        this.queue.push(track);
        this.dispatchEvent('queued', this.queue);
    }

    clearQueue() {
        this.queue = [];
        this.index = 0;
        this.playingQueue = false;
    }

    next() {
        if (this.queue.length === 0) return;

        this.index++;
        if (this.repeat === 1 && this.index >= this.queue.length) this.index = 0;

        this.playingQueue = true;
        this.currentTrack = this.queue[this.index];
        this._play();
    }

    previous() {
        if (this.queue.length === 0) return;

        this.index--;
        if (this.index < 0) this.index = this.queue.length - 1;

        this.playingQueue = true;
        this.currentTrack = this.queue[this.index];
        this._play();
    }

    repeat(mode) {
        this.repeat = mode;
    }

    play() {
        if (this.isPlaying) this.stop();

        if (this.queue.length === 0) return;

        this.currentTrack = this.queue[this.index];
        this.playingQueue = true;
        this._play();
    }

    playNow(track) {
        if (this.isPlaying) this.stop();

        this.playingQueue = false;
        this.currentTrack = track;
        this._play();
    }

    stop() {
        if (this.currentTrack == null) return;

        this.isPlaying = false;
        this.isPaused = false;
        this.audio.pause();
        this._clearTrack();

        this.dispatchEvent('stop', this.queue);
    }

    playPause() {
        if (this.isPlaying) {
            if (this.isPaused) this.resume();
            else this.pause();
        } else {
            this.play();
        }
    }

    pause() {
        this.audio.pause();
    }

    resume() {
        this.audio.play();
    }

    seekTo(time) {
        this.isSeeking = true;
        this.audio.currentTime = time / 1000;
    }


    setVolume(volume) {
        this.audio.volume = volume / 100;
    }

    setOutputDevice(deviceId) {
        this.audio.setSinkId(deviceId).catch((e) => {
        });
    }

    _play() {
        if (this.currentTrack.end_time && this.currentTrack.end_time_unit && this.currentTrack.end_time_type && this.currentTrack.end_time !== 0) {
            let endTime;

            if (this.currentTrack.end_time_type === 'after') {
                endTime = new Time(this.currentTrack.end_time, this.currentTrack.end_time_unit);
                if (this.currentTrack.startTime && this.currentTrack.startTime !== 0) endTime.sum(new Time(this.currentTrack.start_time, this.currentTrack.start_time_unit));
            } else if (this.currentTrack.end_time_type === 'at') {
                endTime = new Time(this.currentTrack.end_time, this.currentTrack.end_time_unit);
            }

            this.audio.src = this.currentTrack.url + '#t=,' + endTime.toSeconds();
            this.endTime = endTime.toMilliseconds();
        } else {
            this.audio.src = this.currentTrack.url;
        }

        this.audio.load();

        if (this.currentTrack.start_time && this.currentTrack.start_time_unit && this.currentTrack.start_time !== 0) {
            const startTime = new Time(this.currentTrack.start_time, this.currentTrack.start_time_unit);
            this.audio.currentTime = startTime.toSeconds();
            this.startTime = startTime.toMilliseconds();
        }

        this.audio.play();
    }

    _timeupdate() {
        if (!this.isPlaying) return;
        if (this.isPaused) return;
        if (this.isSeeking) return;

        const currentTime = Math.round(this.audio.currentTime * 1000);

        if (this.endTime !== 0 && currentTime >= this.endTime) {
            this.audio.dispatchEvent(new Event('ended'));
            return;
        }

        this.dispatchEvent('timeupdate', currentTime - this.startTime);
    }

    _clearTrack() {
        this.audio.currentTime = 0;
        this.currentTrack = null;
        this.startTime = 0;
        this.endTime = 0;
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

    dispatchEvent(eventName, ...eventData) {
        if (this.eventHandlers[eventName]) {
            this.eventHandlers[eventName].forEach(handler => {
                handler(...eventData);
            });
        }
    }
}