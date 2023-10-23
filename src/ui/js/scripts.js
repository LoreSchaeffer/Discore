const navMenu = $('#navMenu');
const navMinimize = $('#navMinimize');
const navMaximize = $('#navMaximize');
const navClose = $('#navClose');

navMenu.click(() => window.electronAPI.menu());
navMinimize.click(() => window.electronAPI.minimize());
navMaximize.click(() => window.electronAPI.maximize());
navClose.click(() => window.electronAPI.close());

$(document).click(() => {
    if (ctxMenu !== undefined) ctxMenu.remove();
});

$(document).contextmenu(() => {
    if (ctxMenu !== undefined) ctxMenu.remove();
});

$(document).ready(() => {
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