const uri = $('#uri');
const title = $('#title');

const startTime = $('#startTime');
const startTimeUnit = $('#startTimeUnit');
const endTimeType = $('#endTimeType');
const endTime = $('#endTime');
const endTimeUnit = $('#endTimeUnit');

const backgroundColor = $('#backgroundColor');
const backgroundColorReset = $('#resetBackgroundColor');
const backgroundHoverColor = $('#backgroundHoverColor');
const backgroundHoverColorReset = $('#resetBackgroundHoverColor');
const textColor = $('#textColor');
const textColorReset = $('#resetTextColor');
const textHoverColor = $('#textHoverColor');
const textHoverColorReset = $('#resetTextHoverColor');
const borderColor = $('#borderColor');
const borderColorReset = $('#resetBorderColor');
const borderHoverColor = $('#borderHoverColor');
const borderHoverColorReset = $('#resetBorderHoverColor');

const discardBtn = $('#discard');
const saveBtn = $('#save');

let row;
let col;
let button;

window.electronAPI.handleButton((event, btn) => {
    button = btn;

    $('#navProfileContainer').prepend($(`<span id="btnTitle">Button ${btn.row + 1} . ${btn.col + 1}</span>`));

    if (button.uri) uri.val(button.uri);
    if (button.title) title.val(button.title);

    if (button.start_time) startTime.val(button.start_time);
    if (button.start_time_unit) startTimeUnit.val(button.start_time_unit);
    if (button.end_time_type) endTimeType.val(button.end_time_type);
    if (button.end_time) endTime.val(button.end_time);
    if (button.end_time_unit) endTimeUnit.val(button.end_time_unit);

    if (button.bg_color) {
        const input = backgroundColor.find('input');
        input.val(button.bg_color);
        input.trigger('change');
    }
    if (button.bg_h_color) {
        const input = backgroundHoverColor.find('input');
        input.val(button.bg_h_color);
        input.trigger('change');
    }
    if (button.txt_color) {
        const input = textColor.find('input');
        input.val(button.txt_color);
        input.trigger('change');
    }
    if (button.txt_h_color) {
        const input = textHoverColor.find('input');
        input.val(button.txt_h_color);
        input.trigger('change');
    }
    if (button.brd_color) {
        const input = borderColor.find('input');
        input.val(button.brd_color);
        input.trigger('change');
    }
    if (button.brd_h_color) {
        const input = borderHoverColor.find('input');
        input.val(button.brd_h_color);
        input.trigger('change');
    }

    createPreview();
});

window.electronAPI.handleButtonUpdate((event, btn) => {
    button = btn;
    console.log(btn);

    uri.val(button.uri);
    title.val(button.title);
    $('#preview .sb-btn-title').text(button.title);
    $('#preview .sb-btn-img').css('background-image', `url("${button.thumbnail}")`);
});

function createPreview() {
    const preview = $(`<div id="preview" class="sb-btn"></div>`);
    const icon = $('<div class="sb-btn-img">');
    const text = $(`<span class="sb-btn-title"></span>`);

    if (button.thumbnail) icon.css('background-image', `url("${button.thumbnail}")`);
    else icon.css('background-image', 'url("images/track.png")');

    if (button.title) text.text(button.title);
    else text.text('Button ' + (button.row + 1) + ' . ' + (button.col + 1));

    if (button.bg_color) preview.css('background-color', button.bg_color);
    else preview.css('background-color', 'var(--def-button)');

    if (button.brd_color) preview.css('border-color', button.brd_color);
    else preview.css('border-color', 'transparent');

    if (button.txt_color) text.css('color', button.txt_color);
    else text.css('color', 'var(--def-text');

    preview.hover(() => {
        if (button.bg_h_color) preview.css('background-color', button.bg_h_color);
        else preview.css('background-color', 'var(--def-button-hover)');

        if (button.brd_h_color) preview.css('border-color', button.brd_h_color);
        else preview.css('border-color', 'transparent');

        if (button.txt_h_color) text.css('color', button.txt_h_color);
        else text.css('color', 'var(--def-text-hover');
    }, () => {
        if (button.bg_color) preview.css('background-color', button.bg_color);
        else preview.css('background-color', 'var(--def-button)');

        if (button.brd_color) preview.css('border-color', button.brd_color);
        else preview.css('border-color', 'transparent');

        if (button.txt_color) text.css('color', button.txt_color);
        else text.css('color', 'var(--def-text');

    });

    preview.append(icon);
    preview.append(text);
    $('#stylePreview').append(preview);
}

$('#openMediaSelector').click(() => {
    window.electronAPI.openMediaSelector(button.profile_id, button.row, button.col, winId);
})

title.change(() => {
    button.title = title.val();
    $('#preview .sb-btn-title').text(button.title);
});

startTime.change(() => {
    const time = new Time(parseInt(startTime.val()), startTimeUnit.val());

    if (time.time < 0) {
        time.time = 0;

        startTime.val(0);
    } else if (time.isGreaterThan(button.duration, 'ms')) {
        time.setTime(button.duration, 'ms');
        time.toSeconds();

        startTime.val(time.time);
        startTimeUnit.val(time.unit);
    }

    button.start_time = time.time;
    button.start_time_unit = time.unit;
});

startTimeUnit.change(() => {
    const time = new Time(parseInt(startTime.val()), button.start_time_unit ? button.start_time_unit : 's');

    time.convertUnit(startTimeUnit.val());

    startTime.val(time.time);

    button.start_time = time.time;
    button.start_time_unit = time.unit;
});

endTimeType.change(() => {
    if (endTimeType.val() === 'at') {
        const eTime = new Time(parseInt(endTime.val()), endTimeUnit.val());

        if (eTime.isGreaterThan(button.duration, 'ms')) {
            eTime.setTime(button.duration, 'ms');
            eTime.toSeconds();

            endTime.val(eTime.time);
            endTimeUnit.val(eTime.unit);

            button.end_time = eTime.time;
            button.end_time_unit = eTime.unit;
        }

        button.end_time_type = 'at';
    } else if (endTimeType.val() === 'after') {
        const eTime = new Time(parseInt(endTime.val()), endTimeUnit.val());
        const sTime = new Time(parseInt(startTime.val()), startTimeUnit.val());

        if (eTime.isGreaterThan(button.duration - sTime.toMilliseconds(), 'ms')) {
            eTime.setTime(button.duration - sTime.toMilliseconds(), 'ms');
            eTime.toSeconds();

            endTime.val(eTime.time);
            endTimeUnit.val(eTime.unit);

            button.end_time = eTime.time;
            button.end_time_unit = eTime.unit;
        }

        button.end_time_type = 'after';
    }
});

endTime.change(() => {
    const eTime = new Time(parseInt(endTime.val()), endTimeUnit.val());

    if (eTime.time < 0) {
        eTime.time = 0;

        endTime.val(0);
    } else {
        if (endTimeType.val() === 'at') {
            if (eTime.isGreaterThan(button.duration, 'ms')) {
                eTime.setTime(button.duration, 'ms');
                eTime.toSeconds();

                endTime.val(eTime.time);
                endTimeUnit.val(eTime.unit);

                button.end_time = eTime.time;
                button.end_time_unit = eTime.unit;
            }
        } else if (endTimeType.val() === 'after') {
            const eTime = new Time(parseInt(endTime.val()), endTimeUnit.val());
            const sTime = new Time(parseInt(startTime.val()), startTimeUnit.val());

            if (eTime.isGreaterThan(button.duration - sTime.toMilliseconds(), 'ms')) {
                eTime.setTime(button.duration - sTime.toMilliseconds(), 'ms');
                eTime.toSeconds();

                endTime.val(eTime.time);
                endTimeUnit.val(eTime.unit);

                button.end_time = eTime.time;
                button.end_time_unit = eTime.unit;
            }
        }
    }
});

endTimeUnit.change(() => {
    const eTime = new Time(parseInt(startTime.val()), button.end_time_unit ? button.end_time_unit : 's');
    eTime.convertUnit(endTimeUnit.val());

    endTime.val(eTime.time);

    button.end_time = eTime.time;
    button.end_time_unit = eTime.unit;
});

backgroundColor.change(() => {
    button.bg_color = backgroundColor.find('input').val();
    $('#preview').css('background-color', button.bg_color);
});

backgroundHoverColor.change(() => {
    button.bg_h_color = backgroundHoverColor.find('input').val();
    $('#preview').hover(() => {
        $('#preview').css('background-color', button.bg_h_color);
    }, () => {
        $('#preview').css('background-color', button.bg_color);
    });

});

textColor.change(() => {
    button.txt_color = textColor.find('input').val();
    $('#preview .sb-btn-title').css('color', button.txt_color);
});

textHoverColor.change(() => {
    button.txt_h_color = textHoverColor.find('input').val();
    $('#preview').hover(() => {
        $('#preview .sb-btn-title').css('color', button.txt_h_color);
    }, () => {
        $('#preview .sb-btn-title').css('color', button.txt_color);
    });

});

borderColor.change(() => {
    button.brd_color = borderColor.find('input').val();
    $('#preview').css('border-color', button.brd_color);
});

borderHoverColor.change(() => {
    button.brd_h_color = borderHoverColor.find('input').val();
    $('#preview').hover(() => {
        $('#preview').css('border-color', button.brd_h_color);
    }, () => {
        $('#preview').css('border-color', button.brd_color);
    });
});

backgroundColorReset.click(() => {
    const input = backgroundColor.find('input');
    input.val('');
    input.trigger('change');

    delete button.bg_color;
    $('#preview').css('background-color', 'var(--def-button)');
});

backgroundHoverColorReset.click(() => {
    const input = backgroundHoverColor.find('input');
    input.val('');
    input.trigger('change');

    delete button.bg_h_color;
    $('#preview').hover(() => {
        $('#preview').css('background-color', 'var(--def-button-hover)');
    }, () => {
        $('#preview').css('background-color', 'var(--def-button)');
    });
});

textColorReset.click(() => {
    const input = textColor.find('input');
    input.val('');
    input.trigger('change');

    delete button.txt_color;
    $('#preview .sb-btn-title').css('color', 'var(--def-text)');
});

textHoverColorReset.click(() => {
    const input = textHoverColor.find('input');
    input.val('');
    input.trigger('change');

    delete button.txt_h_color;
    $('#preview').hover(() => {
        $('#preview .sb-btn-title').css('color', 'var(--def-text-hover)');
    }, () => {
        $('#preview .sb-btn-title').css('color', 'var(--def-text)');
    });
});

borderColorReset.click(() => {
    const input = borderColor.find('input');
    input.val('');
    input.trigger('change');

    delete button.brd_color;
    $('#preview').css('border-color', 'transparent');
});

borderHoverColorReset.click(() => {
    const input = borderHoverColor.find('input');
    input.val('');
    input.trigger('change');

    delete button.brd_h_color;
    $('#preview').hover(() => {
        $('#preview').css('border-color', 'var(--def-border-hover)');
    }, () => {
        $('#preview').css('border-color', 'transparent');
    });
});

discardBtn.click(() => {
    window.electronAPI.close(winId);
});

saveBtn.click(() => {
    window.electronAPI.setButton(button.profile_id, button, winId);
    window.electronAPI.close(winId);
});


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
            this.time = Math.round(this.time / 1000);
            this.unit = 's';
        } else if (this.unit === 'm') {
            this.time = this.time * 60;
            this.unit = 's';
        }

        return this.time;
    }

    toMinutes() {
        if (this.unit === 'ms') {
            this.time = Math.round(this.time / 60000);
            this.unit = 'm';
        } else if (this.unit === 's') {
            this.time = Math.round(this.time / 60);
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
}