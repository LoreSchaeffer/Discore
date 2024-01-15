const uriField = $('#uri');
const openFileBtn = $('#openFile');
const searchField = $('#search');
const searchBtn = $('#searchBtn');
const resultsContainer = $('#results');
const discardBtn = $('#discard');
const saveBtn = $('#save');

let row;
let col;

window.electronAPI.handleRC((event, r, c) => {
    row = r;
    col = c;

    if (r != null && c != null) {
        $('#buttonTitle').text('Button ' + (row + 1) + ' . ' + (col + 1));
    } else {
        $('#buttonTitle').text('Play now');
        saveBtn.find('i').removeClass('fa-save').addClass('fa-play');
    }
});

$(document).ready(() => {
    const winHeight = $(window).height() - $('nav').outerHeight(true) - $('#buttons').outerHeight(true);
    const mainContainerChildren = $('#mainContainer').children();
    const searchContainer = $('#searchContainer');

    let searchContainerHeight = winHeight;
    mainContainerChildren.each(function () {
        const child = $(this);
        if (child.attr('id') === 'searchContainer') return;
        searchContainerHeight -= child.outerHeight(true);
    });

    searchContainer.css('height', searchContainerHeight + 'px');

    let resultsContainerHeight = searchContainerHeight;
    searchContainer.children().each(function () {
        const child = $(this);
        if (child.attr('id') === 'search') return;
        resultsContainerHeight -= child.outerHeight(true);
    });
});

openFileBtn.click(async () => {
    window.electronAPI.openMediaDialog().then((result) => {
        uriField.val(result.filePaths[0]);
        uriField.addClass('active');
    });
});

searchBtn.click(() => {
    search();
});

searchField.keypress((e) => {
    if (e.which === 13) search();
});

discardBtn.click(() => {
    window.electronAPI.close(winId);
});

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
    }

    if (row != null && col != null) {
        window.electronAPI.setButton(winId, row, col, uriField.val(), track);
    } else {
        window.electronAPI.playNow(winId, uriField.val(), track);
    }
});

function search() {
    window.electronAPI.search(searchField.val()).then((results) => {
        if (results.length === 0) return;

        $('.result').off('click');
        $('.url').off('click');

        resultsContainer.empty();

        results.forEach((result) => {
            const title = result.title.replaceAll('"', '');
            const url = result.uri;
            const duration = result.duration;
            const thumbnail = result.thumbnail;

            const resultElement = $(`<div class="result" data-title="${title}" data-url="${url}" data-duration="${duration}" data-thumbnail="${thumbnail}"></div>`);
            const thumbnailElement = $('<div class="thumbnail">');
            thumbnailElement.css('background-image', `url(${thumbnail})`);
            resultElement.append(thumbnailElement);
            resultElement.append(`<div class="title-block"><h2 class="title">${title}</h2><p class="url" data-target="${url}">${url}</p></div>`);
            resultElement.append(`<p class="duration">${formatDuration(duration)}</p>`);

            resultsContainer.append(resultElement);
        });

        const resultElements = $('.result');

        resultElements.on('click', function() {
            resultElements.removeClass('active');

            const element = $(this);
            element.addClass('active');

            uriField.addClass('active');
            setTimeout(() => uriField.val(element.attr('data-url')), 200);
        });

        $('.url').on('click', function(e) {
            e.stopPropagation();
            window.electronAPI.openUrl($(this).attr('data-target'));
        });

        try {
            resultsContainer.scrollTo(0, 0);
        } catch (e) {
        }
    });
}