const query = require('querystring');
const id = JSON.parse(query.parse(global.location.search)['?data']).id;
const button = JSON.parse(JSON.parse(query.parse(global.location.search)['?data']).button);
const isBtn = id !== -1;

const src = $('#src');
const srcFile = $('#srcFile');
const dirBtn = $('#dirBtn');
const addToPlaylistBtn = $('#addToPlaylistBtn');
const playNowBtn = $('#playNowBtn');

$(window).ready(() => {
    if (isBtn) {
        addToPlaylistBtn.text('Cancel');
        playNowBtn.text('Save');
        src.val(button.src);
    }

    src.focus();
});

navMinimize.on('click', () => {
    ipc.send('minimize', id);
});
navClose.on('click', () => {
    ipc.send('close_modal', id);
});

dirBtn.click(() => {
    srcFile.trigger('click');
});

srcFile.change(() => {
    src.val(srcFile[0].files[0].path);
});

addToPlaylistBtn.click(() => {
    if (!isBtn) {
        ipc.send('add_to_playlist', src.val());
    }

    ipc.send('close_modal', id);
})

playNowBtn.click(() => {
    if (isBtn) ipc.send('get_track_info', {"src": src.val(), "id": id});
    else ipc.send('play_now', src.val());

    ipc.send('close_modal', id);
});