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

window.electronAPI.handleButtonUpdate((event, button) => {
    const index = buttons.findIndex((btn) => btn.row === button.row && btn.col === button.col);
    if (index !== -1) buttons[index] = button;
    else buttons.push(button);
    fillButton(button);
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
}

function fillButton(button) {
    const btnElement = $(`#btn-${button.row}-${button.col}`);
    if (button.background_color !== '') btnElement.css('background-color', button.background_color);
    if (button.border_color !== '') btnElement.css('border-color', button.border_color);

    const btnText = btnElement.find('.sb-btn-title');
    btnText.text(button.title);
    if (button.text_color !== '') btnText.css('color', button.text_color);
}

async function sbLeftClick() {
    const btn = $(this);
    const row = parseInt(btn.attr('data-row'));
    const col = parseInt(btn.attr('data-col'));

    const button = getButton(row, col);
    if (button == null) return;

    const track = button.track;

    if (track.uri.startsWith('https')) {
        if (track.url == null) {
            button.track.url = await window.electronAPI.getNewUrl(row, col);
        }
    }

    player.play(button.track);
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
        $('<li id="bsCtxClear" class="danger">Clear</li>')
    ];

    items.forEach((item) => itemContainer.append(item));
    menu.append(itemContainer);

    menu.css("position", "absolute");
    menu.css("top", e.pageY + "px");
    menu.css("left", e.pageX + "px")

    $('body').append(menu);

    ctxMenu = menu;

    $("#bsCtxChooseFile").click(() => ctxChooseFile(row, col));
    $("#bsCtxSettings").click(() => ctxSettings(row, col));
    $("#bsCtxClear").click(() => ctxClear(row, col));
}

function ctxChooseFile(row, col) {
    window.electronAPI.openMediaSelector(row, col);
}

function ctxSettings(row, col) {
    console.log("Settings button " + row + " . " + col);
}

function ctxClear(row, col) {
    window.electronAPI.setButton(null, row, col, null, null);
    const btn = $(`#btn-${row}-${col}`);
    btn.css('background-color', '');
    btn.css('border-color', '');

    const btnText = btn.find('.sb-btn-title');
    btnText.text(`Button ${row + 1} . ${col + 1}`);
    btnText.css('color', '');
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

    if (track.thumbnail != null) thumbnail.css('background-image', `url(${track.thumbnail})`);
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