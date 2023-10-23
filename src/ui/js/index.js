const playPauseBtn = $('#playPause');
const stopBtn = $('#stop');
const volumeRange = $('#volume');
const progressRange = $('#progress');
const trackRange = $('#track');
const rowsInput = $('#rows');
const colsInput = $('#cols');

let buttons = [];
let rows = 0;
let cols = 0;
let ctxMenu;

$(document).ready(() => {
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
});

function createSoundboard() {
    const soundboard = $('#soundboard');
    soundboard.empty();

    soundboard.css('grid-template-rows', 'repeat(' + rows + ', 1fr)');
    soundboard.css('grid-template-columns', 'repeat(' + cols + ', 1fr)');

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const btn = $(`<div class="sb-btn" data-row="${row}" data-col="${col}"></div>`);
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


    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {

        }
    }
}

function sbLeftClick() {
    //ipc.send('play_button', $(this).attr('id'));
}

function sbRightClick(e) {
    if (ctxMenu !== undefined) ctxMenu.remove();
    e.stopImmediatePropagation();

    const id = $(this).attr('id');

    const menu = $('<div class="context-menu"></div>');
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

    $("#bsCtxChooseFile").click(() => ctxChooseFile(id));
    $("#bsCtxSettings").click(() => ctxSettings(id));
    $("#bsCtxClear").click(() => ctxClear(id));
}

function ctxChooseFile(id) {
    ipc.send('open_media_selector', id);
}

function ctxSettings(id) {
    console.log("Settings button " + id);
}

function ctxClear(id) {
    console.log("Clearing button " + id);
}

playPauseBtn.click(() => {
    console.log('Play/Pause');
});

stopBtn.click(() => {
    console.log('Stop');
});

volumeRange.on('input', () => {
    console.log('Volume: ' + volumeRange.val());
});

trackRange.mouseup(() => {
    console.log('Track: ' + trackRange.val());
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