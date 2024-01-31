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
let sbSettings;

$(document).ready(async () => {
    sbSettings = await window.electronAPI.getSoundboardSettings();
});

window.electronAPI.handleButton((event, btn) => {
    button = btn;

    $('#navProfileContainer').prepend($(`<span id="btnTitle">Button ${btn.row + 1} . ${btn.col + 1}</span>`));

    if (button.uri) uri.val(button.uri);
    if (button.title) title.val(button.title);

    if (button.start_time) startTime.val(button.start_time);
    else startTime.val(0);

    if (button.start_time_unit) startTimeUnit.val(button.start_time_unit);
    else startTimeUnit.val('s');

    if (button.end_time_type) endTimeType.val(button.end_time_type);
    else endTimeType.val('after');

    if (button.end_time) endTime.val(button.end_time);
    else endTime.val(0);

    if (button.end_time_unit) endTimeUnit.val(button.end_time_unit);
    else endTimeUnit.val('s');

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

    text.css({
        'font-size': sbSettings.font_size + 'px',
        'line-height': sbSettings.font_size + 'px'
    });
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
        }

        button.end_time = eTime.time;
        button.end_time_unit = eTime.unit;
        button.end_time_type = 'at';
    } else if (endTimeType.val() === 'after') {
        const eTime = new Time(parseInt(endTime.val()), endTimeUnit.val());
        const sTime = new Time(parseInt(startTime.val()), startTimeUnit.val());

        if (eTime.isGreaterThan(button.duration - sTime.toMilliseconds(), 'ms')) {
            eTime.setTime(button.duration - sTime.toMilliseconds(), 'ms');
            eTime.toSeconds();

            endTime.val(eTime.time);
            endTimeUnit.val(eTime.unit);
        }

        button.end_time = eTime.time;
        button.end_time_unit = eTime.unit;
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

            button.end_time = eTime.time;
            button.end_time_unit = eTime.unit;
        } else if (endTimeType.val() === 'after') {
            const eTime = new Time(parseInt(endTime.val()), endTimeUnit.val());
            const sTime = new Time(parseInt(startTime.val()), startTimeUnit.val());

            if (eTime.isGreaterThan(button.duration - sTime.toMilliseconds(), 'ms')) {
                eTime.setTime(button.duration - sTime.toMilliseconds(), 'ms');
                eTime.toSeconds();

                endTime.val(eTime.time);
                endTimeUnit.val(eTime.unit);
            }

            button.end_time = eTime.time;
            button.end_time_unit = eTime.unit;
        }
    }

    if (!button.end_time_type) button.end_time_type = endTimeType.val();
});

endTimeUnit.change(() => {
    const eTime = new Time(parseInt(startTime.val()), button.end_time_unit ? button.end_time_unit : 's');
    eTime.convertUnit(endTimeUnit.val());

    endTime.val(eTime.time);

    button.end_time = eTime.time;
    button.end_time_unit = eTime.unit;
});

/* STYLE */

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

/* END OF STYLE */

discardBtn.click(() => {
    window.electronAPI.close(winId);
});

saveBtn.click(() => {
    window.electronAPI.setButton(button.profile_id, button, winId);
    window.electronAPI.close(winId);
});