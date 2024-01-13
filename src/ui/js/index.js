const thumbnail = $('#thumbnail');
const playPauseBtn = $('#playPause');
const stopBtn = $('#stop');
const volumeRange = $('#volume');
const progressRange = $('#progress');
const progressThumb = progressRange.parent().find('.thumb .thumb-value');
const trackName = $('#trackName');
const rowsInput = $('#rows');
const colsInput = $('#cols');

let buttons = [];
let rows = 0;
let cols = 0;
let player;
let progressRangeMD = false;
let isDragging = false;
let dragSuccess = null;
let copiedStyle = null;

$(document).ready(() => {
    player = new Player();
    player.addEventListener('play', onPlay);
    player.addEventListener('stop', onStop);
    player.addEventListener('pause', onPause);
    player.addEventListener('resume', onResume);
    player.addEventListener('timeupdate', onTimeUpdate);

    window.electronAPI.getSoundboardSize().then((size) => {
        rows = size[0];
        cols = size[1];
        rowsInput.val(rows);
        colsInput.val(cols);

        createSoundboard();
    });

    window.electronAPI.getVolume().then((volume) => {
        volumeRange.val(volume);
        volumeRange.trigger('input');
    });

    window.electronAPI.getOutputDevice().then((deviceId) => {
        player.setOutputDevice(deviceId);
    });
});

$(document).on('wheel', (e) => {
    if (e.originalEvent.ctrlKey) {
        const buttons = $('.sb-btn');

        let size = parseInt(buttons.css('font-size'));
        if (e.originalEvent.deltaY < 0) size++;
        else size--;

        buttons.css('font-size', size + 'px');
    }
});

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

window.electronAPI.handleOutputDevice((event, deviceId) => {
    player.setOutputDevice(deviceId);
});

function createSoundboard() {
    const soundboard = $('#soundboard');
    soundboard.empty();

    soundboard.css('grid-template-rows', 'repeat(' + rows + ', 1fr)');
    soundboard.css('grid-template-columns', 'repeat(' + cols + ', 1fr)');

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const btn = $(`<div id="btn-${row}-${col}" class="sb-btn" data-row="${row}" data-col="${col}"></div>`);
            btn.append($(`<span class="sb-btn-title">Button ${row + 1} . ${col + 1}</span>`));
            soundboard.append(btn);
        }
    }

    const sbBtn = $('.sb-btn');
    sbBtn.click(sbLeftClick);
    sbBtn.contextmenu(sbRightClick);

    fillSoundboard();
}

function fillSoundboard() {
    window.electronAPI.getButtons().then((btns) => {
        buttons = btns;
        buttons.forEach(fillButton);
    });

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

    btnText.text(button.title);

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
    if (ctxMenu !== undefined) ctxMenu.remove();
    e.stopImmediatePropagation();

    const btn = $(this);
    const row = parseInt(btn.attr('data-row'));
    const col = parseInt(btn.attr('data-col'));

    const menu = $('<div class="context-menu" data-row></div>');
    const itemContainer = $('<ul></ul>');

    const items = [
        $('<li id="bsCtxChooseFile">Choose File</li>'),
        $('<li id="bsCtxSettings">Settings</li>'),
        $('<li class="spacer"></li>'),
        $('<li id="bsCtxCopyStyle">Copy Style</li>'),
        $('<li id="bsCtxPasteStyle">Paste Style</li>'),
        $('<li class="spacer"></li>'),
        $('<li id="bsCtxClear" class="danger">Clear</li>')
    ];

    items.forEach((item) => itemContainer.append(item));
    menu.append(itemContainer);

    menu.css("position", "absolute");
    menu.css("top", e.pageY + "px");
    menu.css("left", e.pageX + "px")

    $('body').append(menu);

    if (copiedStyle == null) {
        $('#bsCtxPasteStyle').addClass('disabled');
    }

    ctxMenu = menu;

    $("#bsCtxChooseFile").click(() => ctxChooseFile(row, col));
    $("#bsCtxSettings").click(() => ctxSettings(row, col));
    $("#bsCtxCopyStyle").click(() => ctxCopyStyle(row, col));
    $("#bsCtxPasteStyle").click(() => ctxPasteStyle(row, col));
    $("#bsCtxClear").click(() => ctxClear(row, col));
}

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

playPauseBtn.click(() => {
    player.playPause();
});

stopBtn.click(() => {
    player.stop();
});

volumeRange.on('input', () => {
    player.setVolume(volumeRange.val());
    window.electronAPI.setVolume(volumeRange.val());
});

progressRange.mousedown(() => {
    progressRangeMD = true;
});

progressRange.mouseup(() => {
    progressRangeMD = false;
    player.seekTo(progressRange.val());
});

progressRange.on('input', () => {
    progressThumb.text(formatDuration(progressRange.val()));
});

rowsInput.change(() => {
    rows = rowsInput.val();
    window.electronAPI.setSoundboardSize([rows, cols]);
    createSoundboard();
});

colsInput.change(() => {
    cols = colsInput.val();
    window.electronAPI.setSoundboardSize([rows, cols]);
    createSoundboard();
});

function onPlay(track) {
    progressRange.attr('max', track.duration);
    progressRange.attr('value', 0);
    progressRange.attr('disabled', false);

    trackName.text(track.title);

    if (track.thumbnail) thumbnail.css('background-image', `url(${track.thumbnail})`);
    thumbnail.css('opacity', 1);

    setPauseButton();
    playPauseBtn.removeClass('btn-disabled');
    stopBtn.removeClass('btn-disabled');
}

function onStop() {
    trackName.html('&nbsp;');
    progressRange.val(0);
    progressRange.trigger('input');
    progressRange.attr('max', 0);
    progressRange.attr('disabled', true);

    thumbnail.css('background-image', 'url("images/track.png")');
    thumbnail.css('opacity', 0.5);

    setPlayButton();
    playPauseBtn.addClass('btn-disabled');
    stopBtn.addClass('btn-disabled');
}

function onPause() {
    setPlayButton();
}

function onResume() {
    setPauseButton();
}

function onTimeUpdate(time) {
    if (!progressRangeMD) {
        progressRange.val(time);
        progressRange.trigger('input');
    }
}

function setPlayButton() {
    playPauseBtn.css('background-color', 'var(--green)');
    playPauseBtn.find('i').removeClass('fa-pause');
    playPauseBtn.find('i').addClass('fa-play');
}

function setPauseButton() {
    playPauseBtn.css('background-color', 'var(--orange)');
    playPauseBtn.find('i').removeClass('fa-play');
    playPauseBtn.find('i').addClass('fa-pause');
}