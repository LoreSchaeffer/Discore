let navMinimize;
let navMaximize;
let navClose;

let hasParent = false;
let isResizable = true;
let winId = -1;
let contextMenu;

const nav = $(`<nav class="navbar navbar-expand navbar-dark background-tertiary fixed-top">
    <div class="container-fluid" id="navbarSupportedContent">
        <span id="navTitle">Discore</span>
        <div id="navProfileContainer"></div>
        <ul id="navRightGroup" class="navbar-nav">
            <li id="navMinimize" class="nav-item"><span class="material-symbols-rounded">remove</span></li>
            <li id="navMaximize" class="nav-item"><span class="material-symbols-rounded">check_box_outline_blank</span></li>
            <li id="navClose" class="nav-item"><span class="material-symbols-rounded">close</span></li>
        </ul>
    </div>
</nav>`);

window.electronAPI.handleReady((event, id, parent, resizable) => {
    winId = id;
    hasParent = parent;
    isResizable = resizable;

    if (hasParent) {
        navMinimize.off('click');
        navMinimize.remove();
    }
    if (!isResizable) {
        navMaximize.off('click');
        navMaximize.remove();
    }
});

$(document).ready(() => {
    $('body').prepend(nav);

    navMinimize = $('#navMinimize');
    navMaximize = $('#navMaximize');
    navClose = $('#navClose');

    if (hasParent) navMinimize.remove();
    if (!isResizable) navMaximize.remove();

    if (!hasParent) navMinimize.click(() => window.electronAPI.minimize(winId));
    if (isResizable) navMaximize.click(() => window.electronAPI.maximize(winId));
    navClose.click(() => window.electronAPI.close(winId));

    $(document).click((e) => hideContextMenu(e));
    $(document).contextmenu((e) => hideContextMenu(e));

    $('.progress').each(function () {
        const container = $(this);
        const min = container.attr('aria-valuemin');
        const max = container.attr('aria-valuemax');
        const value = container.attr('aria-valuenow');
        const disabled = container.attr('disabled') !== undefined;

        const range = $(`<input type="range" class="form-range" min="${min}" max="${max}" value="${value}" step="1">`);
        const progress = $(`<div class="progress-bar"></div>`);

        if (disabled) range.attr('disabled', true);

        container.append(range);
        container.append(progress);

        range.on('input', function () {
            const rangeValue = (range.val() - range.attr('min')) / (range.attr('max') - range.attr('min'));
            const progressWidth = rangeValue * 100 + '%';

            container.attr('aria-valuenow', range.val());

            progress.css('width', progressWidth);
        });

        range.trigger('input');
    });

    $('.number-spinner').each(function () {
        const spinner = $(this);
        const id = spinner.attr('data-for');
        const value = spinner.attr('data-value');
        const min = spinner.attr('data-min');
        const label = spinner.attr('data-label');

        spinner.append(`<span data-for="${id}" class="spinner-element next"><i class="fas fa-plus"></i></span>`);
        spinner.append(`<span data-for="${id}" class="spinner-element prev"><i class="fas fa-minus"></i></span>`);
        spinner.append(`<input id="${id}" type="number" class="number-input num-input-spinner" value="${value}" min="${min}" />`);

        if (label) {
            spinner.before(`<label for="${id}">${label}</label>`);
        }
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

    $('.form-select').mousedown(function (e) {
        e.preventDefault();
    });

    $('.form-select').click(function (e) {
        const select = $(this);

        if (select.hasClass('active')) {
            select.removeClass('active');
            return;
        }

        e.stopPropagation();
        select.addClass('active');

        const items = [];
        select.children('option').each(function() {
            const option = $(this);

            const item = {
                text: option.text(),
                data: option.attr('value'),
                callback: () => {
                    select.val(option.attr('value'));
                    select.removeClass('active');
                }
            };

            if (option.is(':selected')) item.classes = ['selected'];

            items.push(item);
        });

        const ctxMenu = showContextMenu(items, select.position().left, select.position().top + select.outerHeight());
        ctxMenu.addClass('select-menu');
        ctxMenu.css('width', select.outerWidth() + 'px');
    });

    $('.colorpicker').each(function () {
        const container = $(this);
        const input = $(`<input type="color">`);
        if (container.attr('data-id') !== undefined) input.attr('id', container.attr('data-id'));
        const preview = $(`<div class="colorpicker-preview"></div>`);

        preview.css('background-color', input.val());

        container.append(input);
        container.append(preview);

        preview.click(() => input.click());
        input.change(() => {
            preview.css('background-color', input.val());
        });
    });
});

/*
 * items: [
 *   {
 *     text: string,
 *     icon: class (optional),
 *     classes: [](spacer, danger, disabled, ...) (optional),
 *     callback: function (optional,
 *     submenu: [](optional),
 *     data: string (optional)
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
            const ctxItem = $(`<li class="ctx-item${classes !== '' ? ' ' + classes : ''}" data-text="${item.text}">${item.text}</li>`);

            if (item.icon) ctxItem.prepend($(`<span class="material-symbols-rounded">${item.icon}</span>`));
            if (item.data) ctxItem.attr('data-value', item.data);

            if (item.submenu) {
                ctxItem.attr('data-target', 'submenu-' + i);
                ctxItem.append($('<span class="material-symbols-rounded chevron">chevron_right</span>'));

                const submenu = $(`<div id="submenu-${i}" class="context-menu submenu"><ul></ul></div>`);

                for (const subItem of item.submenu) {
                    const subClasses = subItem.classes ? subItem.classes.join(' ') : '';
                    const subCtxItem = $(`<li class="ctx-item ctx-subitem${subClasses !== '' ? ' ' + subClasses : ''}" data-text="${subItem.text}">${subItem.text}</li>`);

                    if (subItem.icon) subCtxItem.prepend($(`<span class="material-symbols-rounded">${subItem.icon}</span>`));

                    subCtxItem.click(() => {
                        if (subCtxItem.hasClass('disabled')) return;
                        if (subItem.callback) {
                            const parentItem = ctxMenu.find(`li[data-target="submenu-${i}"]`);
                            if (subItem.callback(subCtxItem, parentItem)) return;
                        }
                        submenu.remove();
                        ctxMenu.remove();
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
                if (ctxItem.hasClass('ctx-subitem')) return;
                if (item.callback) {
                    if (item.callback(ctxItem)) return;
                }

                ctxMenu.remove();
                $('.submenu').remove();
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
    return ctxMenu;
}

function hideContextMenu(e) {
    if (contextMenu !== undefined) {
        if (e) {
            const target = $(e.target);
            if (target && target.hasClass('ctx-item')) return;
        }

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

function createMenu(id, content) {
    const menuContainer = $('<div class="menu-container"></div>');
    const menuContent = $(`<div id="${id}" class="menu-content"></div>`);
    const exitButton = $('<div class="menu-exit"><span class="material-symbols-rounded">cancel</span><span class="exit-text">ESC</span></div>');

    menuContent.append(content);
    menuContent.append(exitButton);
    menuContainer.append(menuContent);
    $('body').append(menuContainer);

    exitButton.click(() => menuContainer.remove());

    return menuContainer;
}

function setProgressDuration(progress, min, max, value) {
    progress.attr('aria-valuemin', min);
    progress.attr('aria-valuemax', max);
    progress.attr('aria-valuenow', value);

    const range = progress.children('input');
    const progressbar = progress.children('.progress-bar');

    range.attr('min', min);
    range.attr('max', max);
    range.val(value);
    range.trigger('input');
}

function updateProgressValue(progress, value) {
    progress.attr('aria-valuenow', value);

    const range = progress.children('input');

    range.val(value);
    range.trigger('input');
}

function setProgressListener(progress, listener, callback) {
    const range = progress.children('.form-range');
    range.on(listener, callback);
}

function enableProgress(progress) {
    progress.children('input').removeAttr('disabled');
}

function disableProgress(progress) {
    progress.children('input').attr('disabled', '');

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

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };

    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

class Time {
    constructor (time, unit) {
        if (time === undefined || unit === undefined) throw new Error('Time and unit must be defined');
        if (typeof time !== 'number') throw new Error('Time must be a number');
        if (typeof unit !== 'string') throw new Error('Unit must be a string');
        if (unit !== 'ms' && unit !== 's' && unit !== 'm') throw new Error('Unit must be ms, s or m');

        this.time = time;
        this.unit = unit;
    }

    toMilliseconds() {
        if (this.unit === 's') {
            this.time = this.time * 1000;
            this.unit = 'ms';
        } else if (this.unit === 'm') {
            this.time = this.time * 60000;
            this.unit = 'ms';
        }

        return this.time;
    }

    toSeconds() {
        if (this.unit === 'ms') {
            this.time = this.time / 1000;
            this.unit = 's';
        } else if (this.unit === 'm') {
            this.time = this.time * 60;
            this.unit = 's';
        }

        return this.time;
    }

    toMinutes() {
        if (this.unit === 'ms') {
            this.time = this.time / 60000;
            this.unit = 'm';
        } else if (this.unit === 's') {
            this.time = this.time / 60;
            this.unit = 'm';
        }

        return this.time;
    }

    convertUnit(unit) {
        if (unit === 'ms') this.toMilliseconds();
        else if (unit === 's') this.toSeconds();
        else if (unit === 'm') this.toMinutes();

        return this.time;
    }

    setTime(time, unit) {
        this.time = time;
        this.unit = unit;
    }

    isGreaterThan(time, unit) {
        if (unit === 'ms') {
            if (this.unit === 'ms') return this.time > time;
            else if (this.unit === 's') return this.time * 1000 > time;
            else if (this.unit === 'm') return this.time * 60000 > time;
        } else if (unit === 's') {
            if (this.unit === 'ms') return this.time > time * 1000;
            else if (this.unit === 's') return this.time > time;
            else if (this.unit === 'm') return this.time * 60 > time;
        } else if (unit === 'm') {
            if (this.unit === 'ms') return this.time > time * 60000;
            else if (this.unit === 's') return this.time > time * 60;
            else if (this.unit === 'm') return this.time > time;
        }
    }

    sum(time) {
        const unit = time.unit;

        this.toMilliseconds();
        time.toMilliseconds();
        this.time += time.time;

        this.convertUnit(unit);
    }
}