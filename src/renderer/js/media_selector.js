const uriField = $('#uri');
const openFileBtn = $('#openFile');
const searchField = $('#search');
const searchBtn = $('#searchBtn');
const resultsContainer = $('#results');
const discardBtn = $('#discard');
const saveBtn = $('#save');

let button = null;
let newButton = false;

window.electronAPI.handleButton((event, btn, isNew) => {
    button = btn;
    newButton = isNew;

    if (btn != null) {
        $('#navProfileContainer').prepend($(`<span id="btnTitle">Button ${btn.row + 1} . ${btn.col + 1}</span>`));
    } else {
        $('#navProfileContainer').prepend($(`<span id="btnTitle">Play now</span>`));
        saveBtn.html('<span class="material-symbols-rounded">play</span>Play');
    }
});

$(document).ready(() => {
    const height = $(window).height() - resultsContainer.offset().top - $('#buttons').outerHeight(true) - 22;
    resultsContainer.css('height', height + 'px');
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

        if (newButton) window.electronAPI.setButton(winId, button);
        else window.electronAPI.updateButton(winId, button);

        window.electronAPI.close(winId);
    } else {
        window.electronAPI.playNow(winId, track);
        window.electronAPI.close(winId);
    }
});

function search() {
    resultsContainer.find('.result').off('click');
    resultsContainer.find('.url').off('click');
    resultsContainer.empty();

    window.electronAPI.search(searchField.val()).then((results) => {
        results.forEach(createResult);

        $('.result').on('click', function () {
            const element = $(this);
            if (element.hasClass('active')) return;

            elements.removeClass('active');
            element.addClass('active');
        });

        $('.url').on('click', function(e) {
            e.stopPropagation();
            window.electronAPI.openBrowser($(this).attr('data-target'));
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
    resultElement.append(`<p class="duration">${formatDuration(track.duration)}</p>`);

    resultsContainer.append(resultElement);
}