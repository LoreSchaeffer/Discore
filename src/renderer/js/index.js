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

let copiedButton = null;
let copiedStyle = null;

/* READY */

$(document).ready(async () => {
    player = new Player();
    player.addEventListener('play', onPlay);
    player.addEventListener('stop', onStop);
    player.addEventListener('pause', onPause);
    player.addEventListener('resume', onResume);
    player.addEventListener('timeupdate', onTimeUpdate);

    sbSettings = await window.electronAPI.getSoundboardSettings();

    window.electronAPI.getProfiles().then((profiles) => {
        profile = profiles.find((p) => p.id === sbSettings.active_profile);

        const profileSelect = $('#navProfileContainer');
        profileSelect.append(`<span id="activeProfile">${profile.name}</span>`);
        profileSelect.append(`<span class="material-symbols-rounded">expand_more</span>`);
        profileSelect.click((e) => showProfileMenu(e));

        generateSoundboard();
    });

    updateProgressValue(volumeSlider, sbSettings.volume);
    player.setOutputDevice(sbSettings.output_device);

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
        window.electronAPI.setVolume(volume);

        const volumeSymbol = volumeBtn.find('.material-symbols-rounded');
        if (volume <= 10) {
            volumeSymbol.text('volume_mute');
        } else if (volume <= 50) {
            volumeSymbol.text('volume_down');
        } else {
            volumeSymbol.text('volume_up');
        }
    });
});

/* LISTENERS */

stopBtn.click(() => {
    //TODO Now buttons are not disabled
    player.stop();
});

prevBtn.click(() => {
    //TODO
});

playPauseBtn.click(() => {
    //TODO Now buttons are not disabled
    player.playPause();
});

nextBtn.click(() => {
    //TODO
});

repeatBtn.click(() => {
    //TODO
});

searchBtn.click(() => {
    //TODO Refactor
    window.electronAPI.openMediaSelector(null, null, winId);
});

playlistBtn.click(() => {
    //TODO
});

mediaOutputBtn.click(showAudioOutputMenu);

volumeBtn.click(() => {
    // TODO volume_off <-> volume
});

settingsBtn.click(() => {
    //TODO
});

/* IPC LISTENERS */

window.electronAPI.handleButtonUpdate((event, button) => fillButton(button));

window.electronAPI.handlePlayNow(async (event, track) => {
    if (track.uri.startsWith('https')) {
        if (track.url == null) return;
    }

    player.play(track, null, track.duration * 1000);
});

window.electronAPI.handleMediaPlayPause(() => player.playPause());

window.electronAPI.handleMediaStop(() => player.stop());

window.electronAPI.handleMediaNext(() => {
    //TODO
});

window.electronAPI.handleMediaPrev(() => {
    //TODO
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

        $('.sb-btn').draggable({
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

    btnImage.css('background-image', button.track.thumbnail ? `url(${button.track.thumbnail})` : 'url("images/track.png")');

    btnElement.css('background-color', button.background_color ? button.background_color : 'var(--def-button)');
    btnElement.css('border-color', button.border_color ? button.border_color : 'transparent');
    btnText.css('color', button.text_color ? button.text_color : 'var(--def-text)');

    btnElement.hover(() => {
        btnElement.css('background-color', button.background_hover_color ? button.background_hover_color : 'var(--def-button-hover)');
        btnElement.css('color', button.text_hover_color ? button.text_hover_color : 'var(--def-text-hover)');
        btnElement.css('border-color', button.border_hover_color ? button.border_hover_color : 'transparent');
    }, () => {
        btnElement.css('background-color', button.background_color ? button.background_color : 'var(--def-button)');
        btnElement.css('border-color', button.border_color ? button.border_color : 'transparent');
        btnText.css('color', button.text_color ? button.text_color : 'var(--def-text)');
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
    const button = await window.electronAPI.getButton(profile.id, parseInt($(this).attr('data-row')), parseInt($(this).attr('data-col')));
    if (button == null) return;

    //TODO

    // const btn = $(this);
    // const row = parseInt(btn.attr('data-row'));
    // const col = parseInt(btn.attr('data-col'));
    //
    // if (isDragging) return;
    //
    // const button = getButton(row, col);
    // if (button == null) return;
    //
    // const track = button.track;
    //
    // if (track.uri.startsWith('https')) {
    //     if (track.url == null) {
    //         button.track.url = await window.electronAPI.getNewUrl(row, col);
    //         if (button.track.url == null) return;
    //     }
    // }
    //
    // let startTime = button.start_time;
    // if (startTime) {
    //     if (button.start_time_unit === 's') startTime *= 1000;
    //     else if (button.start_time === 'm') startTime *= 60000;
    // }
    //
    // let endTime = button.end_time;
    // if (endTime) {
    //     if (button.end_time_unit === 's') endTime *= 1000;
    //     else if (button.end_time === 'm') endTime *= 60000;
    //
    //     if (button.end_type === 'after') endTime = startTime + endTime;
    // }
    //
    // player.play(button.track, startTime, endTime).catch(async (e) => {
    //     if (button.track.uri.startsWith('https')) {
    //         const newUrl = await window.electronAPI.getNewUrl(row, col);
    //         if (newUrl) {
    //             button.track.url = newUrl;
    //             player.play(button.track).catch((e) => {
    //                 console.log('Failed to get a new url');
    //             });
    //         }
    //     }
    // });
}

function sbRightClick(e) {
    e.stopImmediatePropagation();

    const btn = $(this);
    const row = parseInt(btn.attr('data-row'));
    const col = parseInt(btn.attr('data-col'));

    const items = [
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
}

/* CTX MENU CALLBACKS */

function ctxChooseFile(row, col) {
    window.electronAPI.openMediaSelector(profile.id, row, col, winId);
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

    const button = await window.electronAPI.getButton(profile.id, row, col);
    if (button == null) return;

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
    window.electronAPI.updateButton(profile.id, button);
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
    window.electronAPI.updateButton(profile.id, button);
}

function ctxClear(row, col) {
    window.electronAPI.deleteButton(profile.id, row, col);
    setEmptyButton(row, col);
}

/* PLAYER EVENTS */

function onPlay(track) {
    setProgressDuration(progressBar, 0, track.duration, 0);
    enableProgress(progressBar);

    currentTime.text(formatDuration(0));
    currentTime.show();

    duration.text(formatDuration(track.duration));
    duration.show();

    trackName.text(track.title);
    trackSrc.text(track.uri);
    if (track.thumbnail) thumbnail.css('background-image', `url(${track.thumbnail})`);

    trackInfo.css('display', 'flex');

    setPauseButton();
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
}

function onPause() {
    setPlayButton();
}

function onResume() {
    setPauseButton();
}

function onTimeUpdate(time) {
    if (!progressRangeMD) {
        updateProgressValue(progressBar, time);
        currentTime.text(formatDuration(time));
    }
}

/* PLAYER CONTROLS */

function setPlayButton() {
    playPauseBtn.find('.material-symbols-rounded').text('play_circle');
}

function setPauseButton() {
    playPauseBtn.find('.material-symbols-rounded').text('pause_circle');
}

function enableRepeatButton(one) {
    repeatBtn.removeClass('off');

    const symbol = repeatBtn.find('.material-symbols-rounded');
    if (one) symbol.text('repeat_one');
    else symbol.text('repeat');
}

function disableRepeatButton() {
    repeatBtn.addClass('off');
    repeatBtn.find('.material-symbols-rounded').text('repeat');
}

/* SWAP BUTTON */

function swapButtons(draggable, droppable) {
    const draggableRow = parseInt(draggable.attr('data-row'));
    const draggableCol = parseInt(draggable.attr('data-col'));

    const droppableRow = parseInt(droppable.attr('data-row'));
    const droppableCol = parseInt(droppable.attr('data-col'));

    window.electronAPI.swapButtons(profile.id, draggableRow, draggableCol, droppableRow, droppableCol).then((buttons) => {
        //TODO To implement (check if buttons is promise or list)
        // const index1 = buttons.findIndex((btn) => btn.row === row1 && btn.col === col1);
        // const index2 = buttons.findIndex((btn) => btn.row === row2 && btn.col === col2);
        //
        // if (index1 !== -1) {
        //     buttons.splice(index1, 1);
        // }
        //
        // if (index2 !== -1) {
        //     buttons.splice(index2, 1);
        // }
        //
        // if (button1 != null) {
        //     buttons.push(button1);
        //     fillButton(button1);
        // } else {
        //     resetButton(row2, col2);
        // }
        //
        // if (button2 != null) {
        //     buttons.push(button2);
        //     fillButton(button2);
        // } else {
        //     resetButton(row1, col1);
        // }
        //
        // isDragging = false;
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
                    callback: renameProfile
                },
                {
                    text: 'Delete',
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
    });
}

function setNewProfile(newProfile) {
    profile = newProfile;
    sbSettings.active_profile = newProfile.id;
    $('#activeProfile').text(newProfile.name);
    generateSoundboard();
}