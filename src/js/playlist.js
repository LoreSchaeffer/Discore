const playlist = $('#playlist');

navMinimize.on('click', () => {
    ipc.send('minimize', 'playlist');
});
navMaximize.on('click', () => {
    ipc.send('maximize', 'playlist');
});
navClose.on('click', () => {
    ipc.send('close', 'playlist');
});

ipc.on('status', (e, json) => {
    playlist.empty();
    json.playlist.forEach(track => {
        playlist.append(generateTrack(track));
    });
});

$(window).ready(() => {
    ipc.send('get_status', null);
});

function generateTrack(track) {
    let thumb;
    if (track.uri.toLowerCase().includes("youtube.com") || track.uri.toLowerCase().includes("youtu.be")) {
        let id = track.uri.substring(track.uri.toLowerCase().indexOf('v=') + 2);
        if (id.includes("&")) id = id.substring(id.indexOf('&'));

        thumb = 'https://img.youtube.com/vi/%s/maxresdefault.jpg'.replace('%s', id);
    } else {
        thumb = 'images/track.png';
    }

    let html = '<li>\n' +
    '                <div class="track">\n' +
    '                    <div class="row">\n' +
    '                        <div class="track-data col-10">\n' +
    '                            <img src="' + thumb + '" class="track-image img-fluid" alt="track">\n' +
    '                            <div class="track-info">\n' +
    '                                <h1 class="track-title">' + track.title + '</h1>\n' +
    '                                <h2 class="track-author">' + track.author + '</h2>\n' +
    '                                <p class="track-length">' + toTimestamp(track.length) + '</p>\n' +
    '                            </div>\n' +
    '                        </div>\n' +
    '                        <div class="col-2">\n' +
    '                            <div class="track-icons">\n' +
    '                                <div class="row">\n' +
    '                                    <div class="col-6">\n' +
    '                                        <button class="btn btn-primary btn-green btn-track"><i class="fas fa-play"></i></button>\n' +
    '                                    </div>\n' +
    '                                    <div class="col-6">\n' +
    '                                        <button class="btn btn-primary btn-red btn-track"><i class="fas fa-trash"></i></button>\n' +
    '                                    </div>\n' +
    '                                    <div class="col-6">\n' +
    '                                        <button class="btn btn-primary btn-blue btn-track"><i class="fas fa-arrow-up"></i></button>\n' +
    '                                    </div>\n' +
    '                                    <div class="col-6">\n' +
    '                                        <button class="btn btn-primary btn-blue btn-track"><i class="fas fa-arrow-down"></i></button>\n' +
    '                                    </div>\n' +
    '                                </div>\n' +
    '                            </div>\n' +
    '                        </div>\n' +
    '                    </div>\n' +
    '                </div>\n' +
    '            </li>'

    return $(html);
}