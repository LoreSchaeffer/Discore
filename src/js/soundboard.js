const query = require('querystring');
const data = JSON.parse(query.parse(global.location.search)['?data']);

let settings = JSON.parse(decode_b64(data.settings));
let buttons = JSON.parse(decode_b64(data.buttons));

const playPauseBtn = $('#playPauseBtn');
const stopBtn = $('#stopBtn');
const prevBtn = $('#prevBtn');
const nextBtn = $('#nextBtn');
const volumeRange = $('#volume');
const volumeProgress = $('#volumeProgress');
const trackRange = $('#track');
const trackProgress = $('#trackProgress');
const trackRangeSpan = $('#trackRange .thumb-value');
const trackName = $('#trackName');
const playlistBtn = $('#playlistBtn');
const playNowBtn = $('#playNowBtn');

let soundboardRows = 8;
let soundboardCols = 10;
let ctxMenu;
let isPlaying = false;
let isPaused = false;
let isPlaylist = false;
let isDraggingVolume = false;
let isDraggingTrack = false;
let draggingTrackPosition = 0;

navMinimize.on('click', () => {
    ipc.send('minimize', 'main');
});
navMaximize.on('click', () => {
    ipc.send('maximize', 'main');
});
navClose.on('click', () => {
    ipc.send('close', 'main');
});

ipc.on('status', (e, json) => {
    if (!isDraggingVolume) {
        volumeRange.val(json.volume);
        volumeRange.trigger('input');
    }

    isPlaying = json.playing;
    isPaused = json.paused;
    isPlaylist = json.is_playlist;
    updateButtons();
    updatePlayBtn();

    if (json.track != null) {
        trackName.text(json.track.title);

        if (!isDraggingTrack) {
            trackRange.attr('max', json.track.length);
            trackProgress.attr('aria-valuemax', json.track.length);

            trackRange.val(json.track.position);
            trackRange.trigger('input');
        }
    } else {
        trackName.html("&nbsp;");

        if (!isDraggingTrack) {
            trackRange.attr('max', 100);
            trackProgress.attr('aria-valuemax', 100);

            trackRange.val(0);
            trackRange.trigger('input');
        }
    }
});

ipc.on('buttons', (e, btns) => {
    buttons = btns;
    updateSoundboard();
});

$(window).ready(() => {
    soundboardRows = settings.rows;
    soundboardCols = settings.cols;
    volumeRange.val(settings.volume).trigger('changed');

    generateSoundboard();
    updateSoundboard();

    $('.form-range').each(function () {
        const value = $(this).val();
        const progress = $('#' + $(this).attr('id') + 'Progress');
        progress.attr('aria-valuenow', value);
        progress.css('width', value + '%');
    })

    $('#rows').val(soundboardRows);
    $('#cols').val(soundboardCols);
});

$(document).click(() => {
    if (ctxMenu !== undefined) ctxMenu.remove();
});

$(document).contextmenu(() => {
    if (ctxMenu !== undefined) ctxMenu.remove();
});

function generateSoundboard() {
    const soundboardBody = $('#soundboard tbody');
    soundboardBody.empty();

    let id = 0;
    for (let row = 0; row < soundboardRows; row++) {
        const tr = $('<tr></tr>');

        for (let col = 0; col < soundboardCols; col++) {
            tr.append($('<td id="' + id + '" class="sb-btn">Button ' + row + "," + col + "</td>"));
            id++;
        }

        soundboardBody.append(tr);
    }

    const sbBtn = $('.sb-btn');
    sbBtn.click(sbLeftClick);
    sbBtn.contextmenu(sbRightClick);

    sbBtn.css('max-width', $(window).width() / soundboardCols);
}

function sbLeftClick() {
    ipc.send('play_button', $(this).attr('id'));
}

function sbRightClick(e) {
    if (ctxMenu !== undefined) ctxMenu.remove();
    e.stopImmediatePropagation();

    const id = $(this).attr('id');

    const menu = $('<div class="context-menu"></div>');
    const itemContainer = $('<ul></ul>');

    const items = [
        $('<li id="bsCtxPlayNow">Play Now</li>'),
        $('<li id="bsCtxAddToPlaylist">Add to Playlist</li>'),
        $('<li class="spacer"></li>'),
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

    $("#bsCtxPlayNow").click(() => ctxPlayNow(id));
    $("#bsCtxAddToPlaylist").click(() => ctxAddToPlaylist(id));
    $("#bsCtxChooseFile").click(() => ctxChooseFile(id));
    $("#bsCtxSettings").click(() => ctxSettings(id));
    $("#bsCtxClear").click(() => ctxClear(id));
}

function ctxPlayNow(id) {
    console.log("Playing " + id);
}

function ctxAddToPlaylist(id) {
    console.log("Adding " + id + " to playlist");
}

function ctxChooseFile(id) {
    ipc.send('open_media_selector', id);
}

function ctxSettings(id) {
    ipc.send('open_settings', id);
}

function ctxClear(id) {
    console.log("Clearing button " + id);
}

function updateSoundboard() {
    for (let i = 0; i < buttons['buttons'].length; i++) {
        const btn = buttons['buttons'][i];
        const td = $('#' + btn.id);
        td.text(btn.title);
        td.css('background-color', btn.button_color);
        td.css('text_colo', btn.text_color);
    }
}

function updateButtons() {
    if (isPlaying) {
        playPauseBtn.prop('disabled', false);
        stopBtn.prop('disabled', false);
    } else {
        playPauseBtn.prop('disabled', true);
        stopBtn.prop('disabled', true);
    }

    if (isPlaylist) {
        playlistBtn.prop('disabled', false);
        prevBtn.prop('disabled', false);
        nextBtn.prop('disabled', false);
    } else {
        playlistBtn.prop('disabled', true);
        prevBtn.prop('disabled', true);
        nextBtn.prop('disabled', true);
    }
}

function updatePlayBtn() {
    if (isPlaylist) {
        playPauseBtn.removeClass('btn-green');
        playPauseBtn.addClass('btn-yellow');

        playPauseBtn.html('<i class="fas fa-pause"></i>');
    }

    if (isPaused) {
        if (playPauseBtn.hasClass('btn-yellow')) {
            playPauseBtn.removeClass('btn-yellow');
            playPauseBtn.addClass('btn-green');

            playPauseBtn.html('<i class="fas fa-play"></i>');
        }
    } else {
        if (playPauseBtn.hasClass('btn-green')) {
            playPauseBtn.removeClass('btn-green');
            playPauseBtn.addClass('btn-yellow');

            playPauseBtn.html('<i class="fas fa-pause"></i>');
        }
    }

    if (!isPlaying && !isPaused) {
        playPauseBtn.removeClass('btn-yellow');
        playPauseBtn.addClass('btn-green');

        playPauseBtn.html('<i class="fas fa-play"></i>');
    }
}

playPauseBtn.click(() => {
    ipc.send('play_pause');
});

stopBtn.click(() => {
    ipc.send('stop');
});

prevBtn.click(() => {
    ipc.send('previous');
});

nextBtn.click(() => {
    ipc.send('next');
})

numInputSpinner.change(function () {
    const id = $(this).attr('id');
    const val = $(this).val();

    if (id === 'rows') {
        soundboardRows = parseInt(val);
        settings.rows = soundboardRows;
    } else if (id === 'cols') {
        soundboardCols = parseInt(val);
        settings.cols = soundboardCols;
    }

    ipc.send('save_settings', settings);

    generateSoundboard();
    updateSoundboard();
});

playlistBtn.click(() => {
    ipc.send('open_playlist');
});

playNowBtn.click(() => {
    ipc.send('open_media_selector', -1);
});

volumeRange.mousedown(() => {
    isDraggingVolume = true;
});

volumeRange.mouseup(() => {
    isDraggingVolume = false;
});

trackRange.mousedown(() => {
    isDraggingTrack = true;
});

trackRange.mouseup(() => {
    isDraggingTrack = false;
});

volumeRange.on('input', () => {
    if (isDraggingVolume) {
        ipc.send('set_volume', volumeRange.val());
        settings.volume = parseInt(volumeRange.val());
        ipc.send('save_settings', settings);
    }
});

trackRange.on('input', () => {
    trackRangeSpan.text(toTimestamp(trackRange.val()));
    if (isDraggingTrack && Math.abs(draggingTrackPosition - trackRange.val()) > 1000) {
        draggingTrackPosition = trackRange.val();
        ipc.send('set_position', trackRange.val());
    }
});