const {ipcRenderer} = require('electron');
const ipc = ipcRenderer;

const navMinimize = $('#navMinimize');
const navMaximize = $('#navMaximize');
const navClose = $('#navClose');
const numInputSpinner = $('.num-input-spinner');

function encode_b64(str) {
    return window.btoa(unescape(encodeURIComponent(str)));
}

function decode_b64(str) {
    return decodeURIComponent(escape(window.atob(str)));
}

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

function showSubmenu(submenu) {
    submenu.addClass('active');
}

function hideSubmenu(submenu, toggle) {
    setTimeout(function () {
        if (!submenu.is(':hover') && !toggle.is(':hover')) submenu.removeClass('active');
    }, 150);
}

$('.form-range').on('input', function () {
    const value = $(this).val();
    const progress = $('#' + $(this).attr('id') + 'Progress');
    progress.attr('aria-valuenow', value);
    progress.css('width', (value / progress.attr('aria-valuemax') * 100 + 0.5) + '%');
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

numInputSpinner.change(function () {
    if ($(this).val() === "") $(this).val(0);
});

function pad(num, size) {
    num = num.toString();
    while (num.length < size) num = "0" + num;
    return num;
}

function toTimestamp(ms) {
    let seconds = Math.floor(ms / 1000);
    let hours = Math.floor(seconds / 3600);
    if (hours !== 0) seconds -= hours * 3600;
    let minutes = Math.floor(seconds / 60);
    if (minutes !== 0) seconds -= minutes * 60;

    return (hours !== 0 ? pad(hours, 2) + ":" : "") + pad(minutes, 2) + ":" + pad(seconds, 2);
}