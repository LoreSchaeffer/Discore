const uriField = $('#uri');
const openFileBtn = $('#openFile');
const searchField = $('#search');
const searchBtn = $('#searchBtn');
const resultsContainer = $('#results');
const discardBtn = $('#discard');
const saveBtn = $('#save');

let parentId = -1;
let button = null;
let callback = null;

const player = new Audio();
let playingPreview = false;

window.electronAPI.handleButton((event, btn) => {
    button = btn;

    if (btn != null) {
        $('#navProfileContainer').prepend($(`<span id="btnTitle">Button ${btn.row + 1} . ${btn.col + 1}</span>`));
    } else {
        $('#navProfileContainer').prepend($(`<span id="btnTitle">Play now</span>`));
        saveBtn.html('<span class="material-symbols-rounded">play_arrow</span>Play');
    }
});

window.electronAPI.handleParent((event, id) => {
    parentId = id;
});

window.electronAPI.handleCallback((event, c) => {
    callback = c;
});

$(document).ready(() => {
    const height = $(window).height() - resultsContainer.offset().top - $('#buttons').outerHeight(true) - 22;
    resultsContainer.css('height', height + 'px');

    window.electronAPI.getSoundboardSettings().then((settings) => {
        player.volume = settings.volume / 100;
        player.setSinkId(settings.outputDevice).catch((e) => {});
    });
});

openFileBtn.click(async () => {
    window.electronAPI.openFileMediaSelector().then((result) => {
        uriField.val(result.filePaths[0]);
    });
});

searchBtn.click(search);

searchField.keypress((e) => {
    if (e.which === 13) search();
});

discardBtn.click(() => window.electronAPI.close(winId));

saveBtn.click(() => {
    let track;

    const activeResult = $('.result.active');
    if (activeResult.length > 0) {
        track = {
            title: activeResult.attr('data-title'),
            uri: activeResult.attr('data-url'),
            duration: parseInt(activeResult.attr('data-duration')),
            thumbnail: activeResult.attr('data-thumbnail'),
        };
    } else {
        track = {
            uri: uriField.val(),
        };
    }

    if (button != null) {
        button.title = track.title;
        button.uri = track.uri;
        button.duration = track.duration;
        button.thumbnail = track.thumbnail;

        window.electronAPI.mediaSelectorButton(button.profile_id, button, parentId, callback);
    } else {
        window.electronAPI.playNow(track);
    }

    window.electronAPI.close(winId);
});

function search() {
    resultsContainer.find('.result').off('click');
    resultsContainer.find('.url').off('click');
    resultsContainer.empty();

    window.electronAPI.search(searchField.val()).then((results) => {
        results.forEach(createResult);

        const elements = $('.result');
        elements.on('click', function () {
            const element = $(this);
            if (element.hasClass('active')) return;

            elements.removeClass('active');
            element.addClass('active');
        });

        $('.url').on('click', function(e) {
            e.stopPropagation();
            window.electronAPI.openBrowser($(this).attr('data-target'));
        });

        const previewButtons = $('.preview');

        previewButtons.on('click', async function(e) {
            const button = $(this);

            if (button.text() === 'pause') {
                player.pause();
                previewButtons.text('play_arrow');
            } else {
                previewButtons.text('play_arrow');
                button.text('pause');

                player.src = await window.electronAPI.getStreamUrl(button.parent().attr('data-url'));
                player.load();
                player.play();
            }

            e.stopPropagation();
        });

        try {
            resultsContainer.scrollTo(0, 0);
        } catch (e) {
        }
    });
}

function createResult(track) {
    const resultElement = $(`<div class="result" data-title="${escapeHtml(track.title)}" data-url="${track.uri}" data-duration="${track.duration}" data-thumbnail="${track.thumbnail}"></div>`);

    const thumbnailElement = $('<div class="thumbnail">');
    thumbnailElement.css('background-image', `url(${track.thumbnail})`);

    resultElement.append(thumbnailElement);
    resultElement.append(`<div class="title-block"><h2 class="title">${escapeHtml(track.title)}</h2><p class="url" data-target="${track.uri}">${track.uri}</p></div>`);
    resultElement.append(`<p class="duration">${formatDuration(track.duration / 1000)}</p>`);
    resultElement.append(`<span class="material-symbols-rounded preview">play_arrow</span>`)

    resultsContainer.append(resultElement);
}