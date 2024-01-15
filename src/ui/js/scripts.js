let navMenu;
let navMinimize;
let navMaximize;
let navClose;

let winId = -1;
let contextMenu;

const nav = $(`<nav class="navbar navbar-expand navbar-dark bg-dark fixed-top">
    <div class="container-fluid" id="navbarSupportedContent">
        <ul id="navLeftGroup" class="navbar-nav">
            <li id="navMenu" class="nav-item"><i class="fa-solid fa-bars"></i></li>
        </ul>
        <span>Discore</span>
        <ul id="navRightGroup" class="navbar-nav">
            <li id="navMinimize" class="nav-item"><i class="fa-solid fa-minus"></i></li>
            <li id="navMaximize" class="nav-item"><i class="fa-regular fa-square"></i></li>
            <li id="navClose" class="nav-item"><i class="fa-solid fa-xmark"></i></li>
        </ul>
    </div>
</nav>`);

$(document).ready(() => {
    $('body').prepend(nav);

    navMenu = $('#navMenu');
    navMinimize = $('#navMinimize');
    navMaximize = $('#navMaximize');
    navClose = $('#navClose');

    navMenu.click(() => window.electronAPI.menu(winId));
    navMinimize.click(() => window.electronAPI.minimize(winId));
    navMaximize.click(() => window.electronAPI.maximize(winId));
    navClose.click(() => window.electronAPI.close(winId));

    window.electronAPI.handleReady((event, id, hasParent, isResizable) => {
        winId = id;

        if (hasParent) navMinimize.remove();
        if (!isResizable) navMaximize.remove();
    });

    $(document).click(() => hideContextMenu());
    $(document).contextmenu(() => hideContextMenu());

    $('.range').each(function () {
        $(this).append('<div class="range-track"></div>');
        updateRangeTrack($(this).children('.form-range'));
    });

    $('.form-range').on('input', function () {
        updateRangeTrack($(this));
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

    /*
     * items: [
     *   {
     *     text: string,
     *     icon: class (optional),
     *     classes: [](spacer, danger, disabled, submenu-toggle ...) (optional),
     *     callback: function (optional,
     *     submenu: [](optional)
     *   }
     * ]
     */
function showContextMenu(items, posX, posY) {
    hideContextMenu();

    if (items == null || posX == null || posY == null) return;

    const ctxMenu = $(`<div class="context-menu"><ul></ul></div>`);
    const submenus = [];

    for (let i = 0; i < items.length; i++) {
        const item = items[i];

        if (item.classes != null && item.classes.includes('spacer')) {
            ctxMenu.children('ul').append('<li class="spacer"></li>');
        } else {
            const classes = item.classes ? item.classes.join(' ') : '';
            const ctxItem = $(`<li ${classes !== '' ? 'class="' + classes + '"' : ''}>${item.text}</li>`);

            if (item.icon) ctxItem.prepend($('<i class="' + item.icon + '"></i>'));

            if (item.classes != null && item.classes.includes('submenu-toggle')) {
                ctxItem.attr('data-target', 'submenu-' + i);
                ctxItem.append($('<i class="fa-solid fa-chevron-right"></i>'));

                const submenu = $(`<div id="submenu-${i}" class="context-menu submenu"><ul></ul></div>`);

                for (const subItem of item.submenu) {
                    const subClasses = subItem.classes ? subItem.classes.join(' ') : '';
                    const subCtxItem = $(`<li ${subClasses !== '' ? 'class="' + subClasses + '"' : ''}>${subItem.text}</li>`);

                    if (subItem.icon) subCtxItem.prepend($('<i class="' + subItem.icon + '"></i>'));

                    subCtxItem.click(() => {
                        if (subCtxItem.hasClass('disabled')) return;
                        if (subItem.callback) subItem.callback();
                        submenu.remove();
                    });

                    submenu.children('ul').append(subCtxItem);
                }

                $('body').append(submenu);

                ctxItem.hover(() => {
                    submenu.addClass('active');
                }, () => {
                    hideSubmenu(submenu, ctxItem);
                });

                submenu.hover(() => {
                    submenu.addClass('active');
                }, () => {
                    hideSubmenu(submenu, ctxItem);
                });

                submenus.push([ctxItem, submenu]);
            }

            ctxItem.click(() => {
                if (ctxItem.hasClass('disabled')) return;
                if (ctxItem.hasClass('submenu-toggle')) return;
                if (item.callback) item.callback();
                ctxMenu.remove();
            });
            ctxMenu.children('ul').append(ctxItem);
        }
    }

    ctxMenu.css('top', posY + 'px');
    ctxMenu.css('left', posX + 'px');

    $('body').append(ctxMenu);

    const menuWidth = ctxMenu.outerWidth();
    const menuHeight = ctxMenu.outerHeight();

    if (posX + menuWidth > $(window).width()) ctxMenu.css('left', posX - menuWidth + 'px');
    if (posY + menuHeight > $(window).height()) ctxMenu.css('top', posY - menuHeight + 'px');

    for (const [ctxItem, submenu] of submenus) {
        submenu.css('top', (ctxMenu.position().top + ctxItem.position().top) + 'px');

        if (ctxMenu.position().left + menuWidth + 3 + submenu.outerWidth() > $(window).width()) {
            submenu.css('left', (ctxMenu.position().left - submenu.outerWidth() - 3) + 'px');
        } else {
            submenu.css('left', (ctxMenu.position().left + menuWidth + 3) + 'px');
        }
    }

    contextMenu = ctxMenu;
}

function hideContextMenu() {
    if (contextMenu !== undefined) {
        contextMenu.find('li').off('click');
        contextMenu.find('.submenu-toggle').off('hover');
        contextMenu.remove();
    }
}

function showSubmenu(submenu) {
    submenu.addClass('active');
}

function hideSubmenu(submenu, toggle) {
    setTimeout(function () {
        if (!submenu.is(':hover') && !toggle.is(':hover')) submenu.removeClass('active');
    }, 150);
}

function updateRangeTrack(range) {
    const rangeValue = (range.val() - range.attr('min')) / (range.attr('max') - range.attr('min'));
    const rangeTrackWidth = rangeValue * 100 + '%';

    range.parent().find('.range-track').css('width', rangeTrackWidth);
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