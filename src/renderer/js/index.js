const soundboard = $('#soundboard');
const trackInfo = $('#trackInfo');
const thumbnail = $('#thumbnail');
const trackName = $('#trackName');
const trackSrc = $('#trackSrc');

const stopBtn = $('#stop');
const prevBtn = $('#previous');
const playPauseBtn = $('#playPause');
const nextBtn = $('#next');
const repeatBtn = $('#repeat');

const currentTime = $('#currentTime');
const progressBar = $('#progressBar');
const duration = $('#duration');

const searchBtn = $('#search');
const mediaOutputBtn = $('#mediaOutput');
const playlistBtn = $('#playlist');
const volumeBtn = $('#volume');
const volumeSlider = $('#volumeSlider');
const settingsBtn = $('#settings');

let sbSettings = null;
let profile = null;
let player;

let progressRangeMD = false;
let isDragging = false;
let dragSuccess = null;
let muted = false;

let copiedButton = null;
let copiedStyle = null;

let playlist;
let settings;

/* READY */

$(document).ready(async () => {
    player = new Player();
    player.addEventListener('play', onPlay);
    player.addEventListener('stop', onStop);
    player.addEventListener('pause', onPause);
    player.addEventListener('resume', onResume);
    player.addEventListener('timeupdate', onTimeUpdate);
    player.addEventListener('ended', onEnded);
    player.addEventListener('queued', onQueued);

    sbSettings = await window.electronAPI.getSoundboardSettings();
    player.setVolume(sbSettings.volume);

    switch (sbSettings.loop) {
        case "none":
            repeatBtn.find('span').text('repeat');
            repeatBtn.addClass('off');
            break;
        case "all":
            repeatBtn.find('span').text('repeat');
            repeatBtn.removeClass('off');
            break;
        case "one":
            repeatBtn.find('span').text('repeat_one');
            repeatBtn.removeClass('off');
            break;
    }

    window.electronAPI.getProfiles().then((profiles) => {
        profile = profiles.find((p) => p.id === sbSettings.active_profile);

        const profileSelect = $('#navProfileContainer');
        profileSelect.append(`<span id="activeProfile">${profile.name}</span>`);
        profileSelect.append(`<span class="material-symbols-rounded">expand_more</span>`);
        profileSelect.click((e) => showProfileMenu(e));

        generateSoundboard();
    });

    updateProgressValue(volumeSlider, sbSettings.volume);
    setVolumeIcon(sbSettings.volume);
    player.setOutputDevice(sbSettings.output_device);

    trackSrc.click(() => {
        window.electronAPI.openBrowser(trackSrc.text());
    });

    setProgressListener(progressBar, 'mousedown', () => {
        progressRangeMD = true;
    });
    setProgressListener(progressBar, 'mouseup', () => {
        progressRangeMD = false;
        player.seekTo(progressBar.attr('aria-valuenow'));
    });
    setProgressListener(volumeSlider, 'input', () => {
        const volume = volumeSlider.attr('aria-valuenow');
        player.setVolume(volume);

        if (muted) return;

        window.electronAPI.setVolume(volume);
        sbSettings.volume = volume;
        setVolumeIcon(volume);
    });
});

/* LISTENERS */

stopBtn.click(() => {
    if (stopBtn.hasClass('disabled')) return;
    player.stop();
});

prevBtn.click(() => {
    if (prevBtn.hasClass('disabled')) return;
    player.previous();
});

playPauseBtn.click(() => {
    if (playPauseBtn.hasClass('disabled')) return;
    player.playPause();
});

nextBtn.click(() => {
    if (nextBtn.hasClass('disabled')) return;
    player.next();
});

repeatBtn.click(() => {
    if (repeatBtn.hasClass('disabled')) return;

    switch (sbSettings.loop) {
        case "none":
            repeatBtn.find('span').text('repeat');
            repeatBtn.removeClass('off');
            sbSettings.loop = "all";
            break;
        case "all":
            repeatBtn.find('span').text('repeat_one');
            repeatBtn.removeClass('off');
            sbSettings.loop = "one";
            break;
        case "one":
            repeatBtn.find('span').text('repeat');
            repeatBtn.addClass('off');
            sbSettings.loop = "none";
            break;
    }

    window.electronAPI.setLoop(sbSettings.loop);
    player.loop(sbSettings.loop);
});

searchBtn.click(() => {
    window.electronAPI.openPlayNowWindow();
});

playlistBtn.click(showPlaylist);

mediaOutputBtn.click(showAudioOutputMenu);

volumeBtn.click(() => {
    if (muted) {
        muted = false;
        setVolumeIcon(sbSettings.volume);
        updateProgressValue(volumeSlider, sbSettings.volume);
    } else {
        muted = true;
        volumeBtn.find('.material-symbols-rounded').text('volume_off');
        updateProgressValue(volumeSlider, 0);
    }
});

settingsBtn.click(showSettings);

$(document).on('wheel', (e) => {
    if (!e.ctrlKey) return;

    if (e.originalEvent.deltaY < 0) sbSettings.font_size += 1;
    else sbSettings.font_size -= 1;

    window.electronAPI.setFontSize(sbSettings.font_size);
    $('.sb-btn').find('span').css({
        'font-size': sbSettings.font_size + 'px',
        'line-height': sbSettings.font_size + 'px'
    });
});

/* IPC LISTENERS */

window.electronAPI.handleButtonUpdate((event, button) => fillButton(button));

window.electronAPI.handlePlayNow(async (event, track) => {
    if (track == null) return;
    player.playNow(track);
});

window.electronAPI.handleMediaPlayPause(() => player.playPause());

window.electronAPI.handleMediaStop(() => player.stop());

window.electronAPI.handleMediaNext(() => {
    player.next();
});

window.electronAPI.handleMediaPrev(() => {
    player.previous();
});

/* SOUNDBOARD GENERATION */

function generateSoundboard() {
    let buttons = $('.sb-btn');
    buttons.unbind('click');
    buttons.unbind('contextmenu');

    soundboard.empty();

    soundboard.css('grid-template-rows', 'repeat(' + profile.rows + ', 1fr)');
    soundboard.css('grid-template-columns', 'repeat(' + profile.columns + ', 1fr)');

    for (let row = 0; row < profile.rows; row++) {
        for (let col = 0; col < profile.columns; col++) {
            setEmptyButton(row, col);
        }
    }

    buttons = $('.sb-btn');
    buttons.click(sbLeftClick);
    buttons.contextmenu(sbRightClick);

    fillSoundboard();
}

function fillSoundboard() {
    window.electronAPI.getButtons(profile.id).then((buttons) => {
        buttons.forEach(fillButton);

        const btns = $('.sb-btn');
        btns.find('span').css({
            'font-size': sbSettings.font_size + 'px',
            'line-height': sbSettings.font_size + 'px'
        });

        btns.draggable({
            scroll: false,
            revert: true,
            revertDuration: 0,
            snap: true,
            snapMode: 'inner',
            snapTolerance: 10,
            stack: '.sb-btn',
            start: function () {
                isDragging = true;
                dragSuccess = false;
            },
            stop: function () {
                if (!dragSuccess) isDragging = false;
                dragSuccess = null;
            }
        }).droppable({
            accept: '.sb-btn',
            hoverClass: 'dropping',
            tolerance: 'pointer',
            drop: function (e, ui) {
                dragSuccess = true;

                swapButtons(ui.draggable, $(this));
            }
        });
    });
}

function fillButton(button) {
    const btnElement = $(`#btn-${button.row}-${button.col}`);
    const btnText = btnElement.find('.sb-btn-title');
    let btnImage = btnElement.find('.sb-btn-img');

    btnText.text(button.title);

    btnImage.css('background-image', button.thumbnail ? `url(${button.thumbnail})` : 'url("images/track.png")');

    btnElement.css('background-color', button.bg_color ? button.bg_color : 'var(--def-button)');
    btnElement.css('border-color', button.brd_color ? button.brd_color : 'transparent');
    btnText.css('color', button.txt_color ? button.txt_color : 'var(--def-text)');

    btnElement.hover(() => {
        btnElement.css('background-color', button.bg_h_color ? button.bg_h_color : 'var(--def-button-hover)');
        btnElement.css('color', button.txt_h_color ? button.txt_h_color : 'var(--def-text-hover)');
        btnElement.css('border-color', button.brd_h_color ? button.brd_h_color : 'transparent');
    }, () => {
        btnElement.css('background-color', button.bg_color ? button.bg_color : 'var(--def-button)');
        btnElement.css('border-color', button.brd_color ? button.brd_color : 'transparent');
        btnText.css('color', button.txt_color ? button.txt_color : 'var(--def-text)');
    });
}

function setEmptyButton(row, col) {
    let btn = $(`#btn-${row}-${col}`);
    let icon = btn.find('.sb-btn-img');
    let text = btn.find('.sb-btn-title');
    const reset = btn.length !== 0;

    const buttonTitle = `Button ${row + 1} . ${col + 1}`;

    if (!reset) {
        btn = $(`<div id="btn-${row}-${col}" class="sb-btn" data-row="${row}" data-col="${col}"></div>`);
        icon = $('<div class="sb-btn-img">');
        text = $(`<span class="sb-btn-title"></span>`);

        btn.append(icon);
        btn.append(text);
        soundboard.append(btn);
    }

    icon.css('background-image', 'url("images/track.png")');
    text.text(buttonTitle);
    btn.css('background-color', '');
    btn.css('border-color', '');
    text.css('color', '');
}

/* BUTTON EVENTS */

async function sbLeftClick() {
    if (isDragging) return;

    const track = await window.electronAPI.getTrack(profile.id, parseInt($(this).attr('data-row')), parseInt($(this).attr('data-col')));
    if (track == null) return;
    player.playNow(track);
}

function sbRightClick(e) {
    const btn = $(this);
    const row = parseInt(btn.attr('data-row'));
    const col = parseInt(btn.attr('data-col'));

    const items = [
        {
            text: 'Play now',
            callback: () => sbLeftClick.call(btn)
        },
        {
            text: 'Add to queue',
            callback: () => ctxAddToQueue(row, col)
        },
        {
            classes: ['spacer']
        },
        {
            text: 'Choose File',
            callback: () => ctxChooseFile(row, col)
        },
        {
            text: 'Settings',
            callback: () => ctxSettings(row, col)
        },
        {
            classes: ['spacer']
        },
        {
            text: 'Copy Button',
            callback: () => ctxCopyButton(row, col)
        },
        {
            text: 'Paste Button',
            classes: (copiedButton == null ? ['disabled'] : []),
            callback: () => ctxPasteButton(row, col)
        },
        {
            classes: ['spacer']
        },
        {
            text: 'Copy Style',
            callback: () => ctxCopyStyle(row, col)
        },
        {
            text: 'Paste Style',
            classes: (copiedStyle == null ? ['disabled'] : []),
            callback: () => ctxPasteStyle(row, col)
        },
        {
            classes: ['spacer']
        },
        {
            text: 'Clear',
            classes: ['danger'],
            callback: () => ctxClear(row, col)
        }
    ];

    showContextMenu(items, e.pageX, e.pageY);
    e.stopImmediatePropagation();
}

/* CTX MENU CALLBACKS */

async function ctxAddToQueue(row, col) {
    const track = await window.electronAPI.getTrack(profile.id, row, col);
    if (track == null) return;
    player.addToQueue(track);
}

function ctxChooseFile(row, col) {
    window.electronAPI.openMediaSelector(profile.id, row, col, winId, 'set_button');
}

function ctxSettings(row, col) {
    window.electronAPI.openButtonSettings(profile.id, row, col);
}

async function ctxCopyButton(row, col) {
    const button = await window.electronAPI.getButton(profile.id, row, col);
    if (button == null) return;

    copiedButton = {
        btn_title: button.btn_title,
        txt_color: button.txt_color,
        txt_h_color: button.txt_h_color,
        bg_color: button.bg_color,
        bg_h_color: button.bg_h_color,
        brd_color: button.brd_color,
        brd_h_color: button.brd_h_color,
        title: button.title,
        uri: button.uri,
        url: button.url,
        duration: button.duration,
        thumbnail: button.thumbnail
    }
}

async function ctxPasteButton(row, col) {
    if (copiedButton == null) return;

    let button = await window.electronAPI.getButton(profile.id, row, col);
    if (button == null) {
        button = {
            row: row,
            col: col,
            profile_id: profile.id,
        };
    }

    button.btn_title = copiedButton.btn_title;
    button.txt_color = copiedButton.txt_color;
    button.txt_h_color = copiedButton.txt_h_color;
    button.bg_color = copiedButton.bg_color;
    button.bg_h_color = copiedButton.bg_h_color;
    button.brd_color = copiedButton.brd_color;
    button.brd_h_color = copiedButton.brd_h_color;
    button.title = copiedButton.title;
    button.uri = copiedButton.uri;
    button.url = copiedButton.url;
    button.duration = copiedButton.duration;
    button.thumbnail = copiedButton.thumbnail;

    fillButton(button);
    window.electronAPI.setButton(profile.id, button);
}

async function ctxCopyStyle(row, col) {
    const button = await window.electronAPI.getButton(profile.id, row, col);
    if (button == null) return;

    copiedStyle = {
        txt_color: button.txt_color,
        txt_h_color: button.txt_h_color,
        bg_color: button.bg_color,
        bg_h_color: button.bg_h_color,
        brd_color: button.brd_color,
        brd_h_color: button.brd_h_color,
    };
}

async function ctxPasteStyle(row, col) {
    if (copiedStyle == null) return;

    const button = await window.electronAPI.getButton(profile.id, row, col);
    if (button == null) return;

    button.txt_color = copiedStyle.txt_color;
    button.txt_h_color = copiedStyle.txt_h_color;
    button.bg_color = copiedStyle.bg_color;
    button.bg_h_color = copiedStyle.bg_h_color;
    button.brd_color = copiedStyle.brd_color;
    button.brd_h_color = copiedStyle.brd_h_color;

    fillButton(button);
    await window.electronAPI.setButton(profile.id, button);
}

function ctxClear(row, col) {
    window.electronAPI.deleteButton(profile.id, row, col);
    setEmptyButton(row, col);
}

/* PLAYER EVENTS */

function onPlay(track, trackDuration) {
    setProgressDuration(progressBar, 0, trackDuration, 0);
    enableProgress(progressBar);

    currentTime.text(formatDuration(0));
    currentTime.show();

    duration.text(formatDuration(trackDuration / 1000));
    duration.show();

    trackName.text(track.title);
    trackSrc.text(track.uri);
    if (track.thumbnail) thumbnail.css('background-image', `url(${track.thumbnail})`);

    trackInfo.css('display', 'flex');

    stopBtn.removeClass('disabled');
    playPauseBtn.removeClass('disabled');

    setPauseButton();

    if (playlist != null) showPlaylist();
}

function onStop() {
    updateProgressValue(progressBar, 0);
    setProgressDuration(progressBar, 0, 0, 0);
    disableProgress(progressBar);

    currentTime.text(formatDuration(0));
    currentTime.hide();

    duration.text(formatDuration(0));
    duration.hide();

    trackName.text('');
    trackSrc.text('');
    thumbnail.css('background-image', 'url("images/track.png")');

    trackInfo.hide();

    setPlayButton();
    if (player.queue.length === 0) {
        playPauseBtn.addClass('disabled');
        stopBtn.addClass('disabled');
    }

    if (playlist != null) hidePlaylist();
}

function onPause() {
    setPlayButton();

    if (playlist != null) showPlaylist();
}

function onResume() {
    setPauseButton();

    if (playlist != null) showPlaylist();
}

function onTimeUpdate(time) {
    if (!progressRangeMD) {
        updateProgressValue(progressBar, time);
        currentTime.text(formatDuration(Math.round(time / 1000)));
    }
}

function onEnded() {
    if (player.queue.length === 0) onStop();
    else if (playlist != null) showPlaylist();
}

function onQueued(queue) {
    if (queue.length !== 0) {
        prevBtn.removeClass('disabled');
        playPauseBtn.removeClass('disabled');
        nextBtn.removeClass('disabled');
    }
}

/* PLAYER CONTROLS */

function setPlayButton() {
    playPauseBtn.find('.material-symbols-rounded').text('play_circle');
}

function setPauseButton() {
    playPauseBtn.find('.material-symbols-rounded').text('pause_circle');
}

function setVolumeIcon(volume) {
    const volumeSymbol = volumeBtn.find('.material-symbols-rounded');
    if (volume <= 10) {
        volumeSymbol.text('volume_mute');
    } else if (volume <= 50) {
        volumeSymbol.text('volume_down');
    } else {
        volumeSymbol.text('volume_up');
    }
}

/* SWAP BUTTON */

function swapButtons(draggable, droppable) {
    const row1 = parseInt(draggable.attr('data-row'));
    const col1 = parseInt(draggable.attr('data-col'));

    const row2 = parseInt(droppable.attr('data-row'));
    const col2 = parseInt(droppable.attr('data-col'));

    window.electronAPI.swapButtons(profile.id, row1, col1, row2, col2).then(([button1, button2]) => {
        if (button1.empty) setEmptyButton(button1.row, button1.col);
        else fillButton(button1);

        if (button2.empty) setEmptyButton(button2.row, button2.col);
        else fillButton(button2);
    });
}

/* AUDIO DEVICES */

async function showAudioOutputMenu() {
    const items = [];

    const devices = await navigator.mediaDevices.enumerateDevices();
    devices.forEach((device) => {
        if (device.kind !== 'audiooutput') return;
        if (device.deviceId === 'default' || device.deviceId === 'communications') return;

        const selected = device.deviceId === sbSettings.output_device;

        const item = {
            text: device.label,
            data: device.deviceId,
            icon: selected ? 'done' : 'volume_up',
            callback: changeAudioOutput
        };
        if (selected) item.classes = ['active'];

        items.push(item);
    });

    items.push({classes: ['spacer']});

    items.push({
        text: 'Test Playback',
        icon: 'play_arrow',
        callback: testPlayback
    });

    const ctxMenu = showContextMenu(items, 0, 0);
    ctxMenu.addClass('media-output-ctx-menu');
    ctxMenu.css('left', `calc(100% - ${ctxMenu.outerWidth() + 8}px)`);
    ctxMenu.css('top', (mediaOutputBtn.offset().top - ctxMenu.outerHeight() - 8) + 'px');
}

function changeAudioOutput(ctxItem) {
    const oldActive = contextMenu.find('.active');
    oldActive.removeClass('active');
    oldActive.find('.material-symbols-rounded').text('volume_up');

    ctxItem.addClass('active');
    ctxItem.find('.material-symbols-rounded').text('done');

    const deviceId = ctxItem.attr('data-value');
    player.setOutputDevice(deviceId);

    window.electronAPI.setMediaOutput(deviceId);
    return true;
}

function testPlayback(ctxItem) {
    const audio = new Audio('audio/test.mp3');
    try {
        audio.setSinkId(ctxItem.parent().find('.active').attr('data-value')).then(async () => {
            await audio.play();
        });
    } catch (e) {
        console.error(e);
    }

    return true;
}

/* PLAYLIST */

function showPlaylist(e) {
    if (playlist != null) playlist.remove();
    if (settings != null) hideSettings(e);
    if (contextMenu != null) hideContextMenu(e);

    const queue = player.queue;

    playlist = $(`<div id="playlistMenu"></div>`);

    if (queue.length === 0) {
        playlist.append('<p id="emptyPlaylist">Playlist is empty</p>');
    } else {
        const header = $(`<div id="playlistHeader"></div>`);
        const clear = $(`<div id="clearPlaylist"><span>Clear</span><span class="material-symbols-rounded playlist-close">close</span></div>`);
        header.append(clear);
        playlist.append(header);


        const playlistContainer = $('<div id="playlistContainer"></div>');
        playlist.append(playlistContainer);

        if (!player.playingQueue && player.currentTrack != null) {
            createPlaylistItem(player.currentTrack, null, playlistContainer);
            playlist.append('<div class="playlist-divider"></div>');
        }

        for (let i = 0; i < queue.length; i++) {
            const item = createPlaylistItem(queue[i], i, playlistContainer);

            item.click(() => {
                player.playNowFromQueue(i);
            });

            item.find('.playlist-item-remove').click((e) => {
                player.removeFromQueue(i);
                e.stopPropagation();
                hidePlaylist();
            });
        }

        clear.click(() => {
            if (player.playingQueue) player.stop();
            player.clearQueue();
        });
    }

    $('body').append(playlist);
    playlist.css('left', `calc(100% - ${playlist.outerWidth() + 8}px)`);
    playlist.css('top', (playlistBtn.offset().top - playlist.outerHeight() - 8) + 'px');

    $(document).click(() => hidePlaylist());
    $(document).contextmenu(() => hidePlaylist());

    if (e != null) e.stopPropagation();
}

function createPlaylistItem(track, index, container) {
    const item = $(`<div class="playlist-item" data-index="${index != null ? index : 'none'}"></div>`);
    const icon = $(`<div class="playlist-item-icon"></div>`);
    const titleContainer = $(`<div class="playlist-item-title-container"></div>`);
    const title = $(`<p class="playlist-item-title">${track.title}</p>`);
    const remove = $(`<span class="material-symbols-rounded playlist-item-remove">delete</span>`);

    item.append(icon);
    titleContainer.append(title);
    item.append(titleContainer);
    item.append(remove);
    container.append(item);

    if (player.index === index && player.playingQueue && player.isPlaying) item.addClass('active');
    else if (!player.playingQueue && index === null) item.addClass('active');

    icon.css('background-image', track.thumbnail ? `url(${track.thumbnail})` : 'url("images/track.png")');

    item.hover(() => {
        const containerWidth = titleContainer.outerWidth();
        const titleLength = title.text().length;

        const speed = (titleLength / containerWidth) * 10000;

        scrollTitle(title, speed);
    }, () => {
        title.stop();
        title.scrollLeft(0);
    });

    return item;
}

function scrollTitle(title, speed) {
    title.animate({scrollLeft: title.outerWidth()}, speed, 'linear', function () {
        title.animate({scrollLeft: 0}, speed, 'linear', function () {
            scrollTitle(title, speed);
        });
    });
}

function hidePlaylist() {
    if (playlist != null) {
        playlist.off('click');
        playlist.off('contextmenu');

        playlist.find('.playlist-item').off('click');
        playlist.find('.playlist-item').off('hover');

        playlist.find('.playlist-item-remove').off('click');

        playlist.find('#clearPlaylist').off('click');

        playlist.remove();
        playlist = null;
    }
}

/* SETTINGS */

function showSettings(e) {
    if (settings != null) settings.remove();
    if (playlist != null) hidePlaylist(e);
    if (contextMenu != null) hideContextMenu(e);

    settings = $(`<div id="settingsMenu"></div>`);

    const rowsInputRow = $(`<div class="input-row"></div>`);
    rowsInputRow.append(`<label for="rows" class="col-form-label">Rows</label>`);
    const rowsInputContainer = $(`<div class="input-container"></div>`);
    const inputRows = $(`<input id="rows" type="number" class="form-control form-control-sm" value="${profile.rows}" min="1" step="1"/>`);
    const rowsDecrease = $(`<span class="material-symbols-rounded num-input-editor">remove</span>`);
    const rowsIncrease = $(`<span class="material-symbols-rounded num-input-editor">add</span>`);

    rowsInputContainer.append(rowsDecrease);
    rowsInputContainer.append(inputRows);
    rowsInputContainer.append(rowsIncrease);
    rowsInputRow.append(rowsInputContainer);
    settings.append(rowsInputRow);

    const columnsInputRow = $(`<div class="input-row"></div>`);
    columnsInputRow.append(`<label for="columns" class="col-form-label">Columns</label>`);
    const columnsInputContainer = $(`<div class="input-container"></div>`);
    const inputColumns = $(`<input id="columns" type="number" class="form-control form-control-sm" value="${profile.columns}" min="1" step="1"/>`);
    const columnsDecrease = $(`<span class="material-symbols-rounded num-input-editor">remove</span>`);
    const columnsIncrease = $(`<span class="material-symbols-rounded num-input-editor">add</span>`);

    columnsInputContainer.append(columnsDecrease);
    columnsInputContainer.append(inputColumns);
    columnsInputContainer.append(columnsIncrease);
    columnsInputRow.append(columnsInputContainer);
    settings.append(columnsInputRow);

    inputRows.change(() => {
        profile.rows = parseInt(inputRows.val());
        updateSoundboardSize();
    });

    rowsDecrease.click(() => {
        if (profile.rows <= 1) return;
        inputRows.val(profile.rows - 1);
        inputRows.trigger('change');
    });

    rowsIncrease.click(() => {
        inputRows.val(profile.rows + 1);
        inputRows.trigger('change');
    });

    inputColumns.change(() => {
        profile.columns = parseInt(inputColumns.val());
        updateSoundboardSize();
    });

    columnsDecrease.click(() => {
        if (profile.columns <= 1) return;
        inputColumns.val(profile.columns - 1);
        inputColumns.trigger('change');
    });

    columnsIncrease.click(() => {
        inputColumns.val(profile.columns + 1);
        inputColumns.trigger('change');
    });

    $('body').append(settings);
    settings.css('left', `calc(100% - ${settings.outerWidth() + 8}px)`);
    settings.css('top', (settingsBtn.offset().top - settings.outerHeight() - 8) + 'px');

    $(document).click((e) => {
        if ($(e.target).closest('#settingsMenu').length) return;
        hideSettings();
    });
    $(document).contextmenu((e) => {
        if ($(e.target).closest('#settingsMenu').length) return;
        hideSettings();
    });

    if (e != null) e.stopPropagation();
}

function hideSettings() {
    if (settings != null) {
        settings.off('click');
        settings.off('contextmenu');

        settings.find('input').off('change');
        settings.find('.num-input-editor').off('click');

        settings.remove();
        settings = null;
    }
}

function updateSoundboardSize() {
    window.electronAPI.setSoundboardSize(profile.id, profile.rows, profile.columns);
    generateSoundboard();
}

/* PROFILES */

async function showProfileMenu(e) {
    e.stopPropagation();
    const items = [];

    const profileSelect = $('#navProfileContainer');
    const profiles = await window.electronAPI.getProfiles();

    profiles.forEach((profile) => {
        const item = {
            text: profile.name,
            data: profile.id,
            icon: profile.id === sbSettings.active_profile ? 'radio_button_checked' : 'radio_button_unchecked',
            submenu: [
                {
                    text: 'Rename',
                    icon: 'edit',
                    callback: renameProfile
                },
                {
                    text: 'Export',
                    icon: 'output',
                    callback: exportProfile
                },
                {
                    text: 'Delete',
                    icon: 'delete',
                    classes: ['danger'],
                    callback: deleteProfile
                }
            ],
            callback: changeProfile
        }

        if (profile.id === sbSettings.active_profile) item.classes = ['active'];

        items.push(item);
    });

    items.push({classes: ['spacer']});
    items.push({
        text: 'Import Profile',
        icon: 'input',
        callback: importProfile
    });
    items.push({
        text: 'New Profile',
        icon: 'add',
        callback: createProfile
    });

    const ctxMenu = showContextMenu(items, profileSelect.offset().left, profileSelect.offset().top + profileSelect.outerHeight() + 8);
    ctxMenu.addClass('profiles-ctx-menu');
}

function changeProfile(ctxItem) {
    window.electronAPI.setActiveProfile(ctxItem.attr('data-value')).then((profile) => {
        setNewProfile(profile);
    });
}

function createProfile() {
    const content = '<h4>Create new profile</h4><div class="row form-row"><div class="col-auto"><label for="name" class="col-form-label">Name</label></div><div class="col-auto"><input id="name" type="text" class="form-control form-control-sm"></div></div><button id="createProfile" class="btn btn-success btn-image"><span class="material-symbols-rounded">save</span>Save</button>';
    const menu = createMenu('newProfile', content);

    $('#createProfile').click(() => {
        const nameField = $('#name');
        const name = nameField.val().trim();
        if (name === '') {
            nameField.addClass('invalid');
            setTimeout(() => {
                nameField.removeClass('invalid');
            }, 5000);
        }

        window.electronAPI.createProfile(name).then((profile) => {
            setNewProfile(profile);
            menu.remove();
        }).catch(() => {
            //TODO Show error alert
        });
    });
}

function renameProfile(ctxItem, parentItem) {
    const content = `<h4>Rename Profile</h4><div class="row form-row"><div class="col-auto"><label for="name" class="col-form-label">Name</label></div><div class="col-auto"><input id="name" type="text" class="form-control form-control-sm" value="${parentItem.attr('data-text')}"></div></div><button id="createProfile" class="btn btn-success btn-image"><span class="material-symbols-rounded">save</span>Save</button>`;
    const menu = createMenu('newProfile', content);

    $('#createProfile').click(() => {
        const nameField = $('#name');
        const name = nameField.val().trim();
        if (name === '') {
            nameField.addClass('invalid');
            setTimeout(() => {
                nameField.removeClass('invalid');
            }, 5000);
        }

        window.electronAPI.renameProfile(parentItem.attr('data-value'), name).then((profile) => {
            profile.name = name;
            $('#activeProfile').text(profile.name);
            menu.remove();
        }).catch(() => {
            //TODO Show error alert
        });
    });
}

function deleteProfile(ctxItem, parentItem) {
    window.electronAPI.deleteProfile(parentItem.attr('data-value')).then((profile) => {
        if (profile) setNewProfile(profile);
    }).catch(() => {
        console.log('error');
    });
}

function setNewProfile(newProfile) {
    profile = newProfile;
    sbSettings.active_profile = newProfile.id;
    window.electronAPI.setActiveProfile(newProfile.id);
    $('#activeProfile').text(newProfile.name);
    generateSoundboard();
}

function importProfile() {
    window.electronAPI.importProfile().then((profile) => {
        setNewProfile(profile);
    });
}

function exportProfile(ctxItem, parentItem) {
    window.electronAPI.exportProfile(parentItem.attr('data-value'));
}