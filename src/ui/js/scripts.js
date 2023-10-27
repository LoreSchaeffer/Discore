const navMenu = $('#navMenu');
const navMinimize = $('#navMinimize');
const navMaximize = $('#navMaximize');
const navClose = $('#navClose');

let winId = -1;
let ctxMenu;

navMenu.click(() => window.electronAPI.menu(winId));
navMinimize.click(() => window.electronAPI.minimize(winId));
navMaximize.click(() => window.electronAPI.maximize(winId));
navClose.click(() => window.electronAPI.close(winId));

$(document).click(() => {
    if (ctxMenu !== undefined) ctxMenu.remove();
});

$(document).contextmenu(() => {
    if (ctxMenu !== undefined) ctxMenu.remove();
});

$(document).ready(() => {
    window.electronAPI.handleReady((event, id, hasParent, isResizable) => {
        winId = id;
        if (hasParent) navMinimize.remove();
        if (!isResizable) navMaximize.remove();
    });

    $('.range').each(function () {
        $(this).append('<div class="range-track"></div>');
        updateRangeTrack($(this).children('.form-range'));
    });

    $('.form-range').on('input', function () {
        updateRangeTrack($(this));
    });

    $('.submenu-toggle').hover(function () {
        const toggle = $(this);
        const submenu = $('#' + toggle.attr('data-target'));
        submenu.css('top', toggle.position().top + 'px')
        submenu.css('left', toggle.parent().parent().outerWidth() + (submenu.outerWidth() - submenu.width()) / 2);

        showSubmenu(submenu);
    }, function () {
        const toggle = $(this);
        const submenu = $('#' + toggle.attr('data-target'));
        hideSubmenu(submenu, toggle);
    });

    $('.submenu').hover(function () {
        showSubmenu($(this));
    }, function () {
        const submenu = $(this);
        const toggle = $('.submenu-toggle[data-target="' + submenu.attr('id') + '"]');
        hideSubmenu(submenu, toggle);
    });

    $('.spinner-element.next').click(function () {
        const input = $('#' + $(this).attr('data-for'));
        let newVal = parseInt(input.val()) + 1;
        if (newVal > input.attr('max')) newVal = input.attr('max');
        input.val(newVal);
        input.trigger('change');
    });

    $('.spinner-element.prev').click(function () {
        const input = $('#' + $(this).attr('data-for'));
        let newVal = parseInt(input.val()) - 1;
        if (newVal < input.attr('min')) newVal = input.attr('min');
        input.val(newVal);
        input.trigger('change');
    });

    $('.num-input-spinner').change(function () {
        if ($(this).val() === "") $(this).val(0);
    });
});

function updateRangeTrack(range) {
    const rangeValue = (range.val() - range.attr('min')) / (range.attr('max') - range.attr('min'));
    const rangeTrackWidth = rangeValue * 100 + '%';

    range.parent().find('.range-track').css('width', rangeTrackWidth);
}

function showSubmenu(submenu) {
    submenu.addClass('active');
}

function hideSubmenu(submenu, toggle) {
    setTimeout(function () {
        if (!submenu.is(':hover') && !toggle.is(':hover')) submenu.removeClass('active');
    }, 150);
}

function formatDuration(duration) {
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor(duration / 60) % 60;
    const seconds = duration % 60;

    let formatted = '';
    if (hours > 0) formatted += hours + ':';
    formatted += minutes.toString().padStart(2, '0') + ':';
    formatted += seconds.toString().padStart(2, '0');

    return formatted;
}