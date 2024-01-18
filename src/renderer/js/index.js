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
let player;

let progressRangeMD = false;
let isDragging = false;
let dragSuccess = null;

let copiedStyle = null;

$(document).ready(async () => {
    player = new Player();
    player.addEventListener('play', onPlay);
    player.addEventListener('stop', onStop);
    player.addEventListener('pause', onPause);
    player.addEventListener('resume', onResume);
    player.addEventListener('timeupdate', onTimeUpdate);

    sbSettings = await window.electronAPI.getSoundboardSettings();

    window.electronAPI.getProfiles().then((profiles) => {
        const activeProfileName = profiles.find((p) => p.id === sbSettings.active_profile).name;

        const profileSelect = $('#navProfileContainer');
        profileSelect.append(`<span id="activeProfile">${activeProfileName}</span>`);
        profileSelect.append(`<span class="material-symbols-rounded">expand_more</span>`);

        profileSelect.click((e) => showProfileMenu(e));
    });

    updateProgressValue(volumeSlider, sbSettings.volume);
    player.setOutputDevice(sbSettings.output_device);

    //createSoundboard();

    /*const rowsInput = $('#rows');
    const colsInput = $('#cols');

    rowsInput.change(() => {
        rows = rowsInput.val();
        window.electronAPI.setSoundboardSize([rows, cols]);
        createSoundboard();
    });

    colsInput.change(() => {
        cols = colsInput.val();
        window.electronAPI.setSoundboardSize([rows, cols]);
        createSoundboard();
    });*/

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

// Listeners

/*$(document).on('wheel', (e) => {
    if (e.originalEvent.ctrlKey) {
        const buttons = $('.sb-btn');

        let size = parseInt(buttons.css('font-size'));
        if (e.originalEvent.deltaY < 0) size++;
        else size--;

        buttons.css('font-size', size + 'px');
        buttons.css('line-height', size + 'px');
    }
});*/

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

mediaOutputBtn.click(async () => {
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
});

volumeBtn.click(() => {
    // TODO volume_off <-> volume
});

settingsBtn.click(() => {
    //TODO
});


// Electron listeners

window.electronAPI.handleButtonUpdate((event, button) => {
    const index = buttons.findIndex((btn) => btn.row === button.row && btn.col === button.col);
    if (index !== -1) buttons[index] = button;
    else buttons.push(button);
    fillButton(button);
});

window.electronAPI.handleButtonSwap((event, button1, button2, row1, col1, row2, col2) => {
    const index1 = buttons.findIndex((btn) => btn.row === row1 && btn.col === col1);
    const index2 = buttons.findIndex((btn) => btn.row === row2 && btn.col === col2);

    if (index1 !== -1) {
        buttons.splice(index1, 1);
    }

    if (index2 !== -1) {
        buttons.splice(index2, 1);
    }

    if (button1 != null) {
        buttons.push(button1);
        fillButton(button1);
    } else {
        resetButton(row2, col2);
    }

    if (button2 != null) {
        buttons.push(button2);
        fillButton(button2);
    } else {
        resetButton(row1, col1);
    }

    isDragging = false;
});

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

// Soundboard generation

function createSoundboard() {
    const soundboard = $('#soundboard');
    soundboard.empty();

    soundboard.css('grid-template-rows', 'repeat(' + sbSettings.rows + ', 1fr)');
    soundboard.css('grid-template-columns', 'repeat(' + sbSettings.cols + ', 1fr)');

    for (let row = 0; row < sbSettings.rows; row++) {
        for (let col = 0; col < sbSettings.cols; col++) {
            const btn = $(`<div id="btn-${row}-${col}" class="sb-btn" data-row="${row}" data-col="${col}"></div>`);
            btn.append($(`<div class="sb-btn-img">`));
            btn.append($(`<span class="sb-btn-title">Button ${row + 1} . ${col + 1}</span>`));

            btn.find('.sb-btn-img').css('background-image', 'url("images/track.png")');

            soundboard.append(btn);
        }
    }

    const sbBtn = $('.sb-btn');
    sbBtn.click(sbLeftClick);
    sbBtn.contextmenu(sbRightClick);

    fillSoundboard();
}

function fillSoundboard() {
    sbSettings.buttons.forEach(fillButton);

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
        stop: function (event, ui) {
            if (!dragSuccess) isDragging = false;
            dragSuccess = null;
        }
    }).droppable({
        accept: '.sb-btn',
        hoverClass: 'dropping',
        tolerance: 'pointer',
        drop: function (e, ui) {
            dragSuccess = true;

            const draggable = ui.draggable;
            const draggableRow = parseInt(draggable.attr('data-row'));
            const draggableCol = parseInt(draggable.attr('data-col'));
            const draggableButton = getButton(draggableRow, draggableCol);

            const droppable = $(this);
            const droppableRow = parseInt(droppable.attr('data-row'));
            const droppableCol = parseInt(droppable.attr('data-col'));
            const droppableButton = getButton(droppableRow, droppableCol);

            if (draggableButton == null && droppableButton == null) {
                return;
            } else if (draggableButton == null && droppableButton != null) {
                droppableButton.row = draggableRow;
                droppableButton.col = draggableCol;
            } else if (draggableButton != null && droppableButton == null) {
                draggableButton.row = droppableRow;
                draggableButton.col = droppableCol;
            } else if (draggableButton != null && droppableButton != null) {
                draggableButton.row = droppableRow;
                draggableButton.col = droppableCol;

                droppableButton.row = draggableRow;
                droppableButton.col = draggableCol;
            }

            window.electronAPI.swapButtons(draggableRow, draggableCol, droppableRow, droppableCol);
        }
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

function resetButton(row, col) {
    const btnElement = $(`#btn-${row}-${col}`);
    const btnText = btnElement.find('.sb-btn-title');

    btnText.text(`Button ${row + 1} . ${col + 1}`);

    btnElement.css('background-color', '');
    btnElement.css('border-color', '');
    btnText.css('color', '');
}

async function sbLeftClick() {
    const btn = $(this);
    const row = parseInt(btn.attr('data-row'));
    const col = parseInt(btn.attr('data-col'));

    if (isDragging) return;

    const button = getButton(row, col);
    if (button == null) return;

    const track = button.track;

    if (track.uri.startsWith('https')) {
        if (track.url == null) {
            button.track.url = await window.electronAPI.getNewUrl(row, col);
            if (button.track.url == null) return;
        }
    }

    let startTime = button.start_time;
    if (startTime) {
        if (button.start_time_unit === 's') startTime *= 1000;
        else if (button.start_time === 'm') startTime *= 60000;
    }

    let endTime = button.end_time;
    if (endTime) {
        if (button.end_time_unit === 's') endTime *= 1000;
        else if (button.end_time === 'm') endTime *= 60000;

        if (button.end_type === 'after') endTime = startTime + endTime;
    }

    player.play(button.track, startTime, endTime).catch(async (e) => {
        if (button.track.uri.startsWith('https')) {
            const newUrl = await window.electronAPI.getNewUrl(row, col);
            if (newUrl) {
                button.track.url = newUrl;
                player.play(button.track).catch((e) => {
                    console.log('Failed to get a new url');
                });
            }
        }
    });
}

function getButton(row, col) {
    return buttons.find((btn) => btn.row === row && btn.col === col);
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

// Context menu callbacks

function ctxChooseFile(row, col) {
    window.electronAPI.openMediaSelector(row, col, winId);
}

function ctxSettings(row, col) {
    window.electronAPI.openButtonSettings(row, col);
}

function ctxCopyStyle(row, col) {
    const button = getButton(row, col);
    if (button == null) return;

    copiedStyle = {
        background_color: button.background_color,
        border_color: button.border_color,
        text_color: button.text_color,
        background_hover_color: button.background_hover_color,
        border_hover_color: button.border_hover_color,
        text_hover_color: button.text_hover_color
    };
}

function ctxPasteStyle(row, col) {
    const button = getButton(row, col);
    if (button == null) return;
    if (copiedStyle == null) return;

    button.background_color = copiedStyle.background_color;
    button.border_color = copiedStyle.border_color;
    button.text_color = copiedStyle.text_color;
    button.background_hover_color = copiedStyle.background_hover_color;
    button.border_hover_color = copiedStyle.border_hover_color;
    button.text_hover_color = copiedStyle.text_hover_color;

    window.electronAPI.updateButton(null, button);
}

function ctxClear(row, col) {
    window.electronAPI.setButton(null, row, col, null, null);
    const btn = $(`#btn-${row}-${col}`);
    btn.css('background-color', '');
    btn.css('border-color', '');

    const btnText = btn.find('.sb-btn-title');
    btnText.text(`Button ${row + 1} . ${col + 1}`);
    btnText.css('color', '');

    buttons = buttons.filter((btn) => btn.row !== row && btn.col !== col);
}

// Player events

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

// Player controls

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

function changeAudioOutput(ctxItem) {
    const oldActive = contextMenu.find('.active');
    oldActive.removeClass('active');
    oldActive.find('.material-symbols-rounded').text('volume_up');

    ctxItem.addClass('active');
    ctxItem.find('.material-symbols-rounded').text('done');

    const deviceId = ctxItem.attr('data-value');
    player.setOutputDevice(deviceId);

    //TODO Send update to main process
    return true;
}

function testPlayback(ctxItem) {
    const audio = new Audio('audio/test.mp3');
    audio.setSinkId(ctxItem.parent().find('.active').attr('data-value')).then(async () => {
        await audio.play();
    });

    return true;
}

// Profiles
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
    const profile = {
        id: ctxItem.attr('data-value'),
        name: ctxItem.attr('data-text'),
    };

    window.electronAPI.setActiveProfile(profile.id);
    setNewProfile(profile);
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
            setNewProfile(profile);
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

function setNewProfile(profile) {
    sbSettings.active_profile = profile.id;
    $('#activeProfile').text(profile.name);
    //TODO Rebuild soundboard
}