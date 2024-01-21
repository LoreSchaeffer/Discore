const uri = $('#uri');
const title = $('#title');
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
const preview = $('#preview');
const previewText = $('#previewText');
const startTime = $('#startTime');
const startTimeUnit = $('#startTimeUnit');
const endTime = $('#endTime');
const endTimeUnit = $('#endTimeUnit');
const endTimeType = $('#endTimeType');
const discardBtn = $('#discard');
const saveBtn = $('#save');

let row;
let col;
let button;

/*$(document).ready(() => {
    $('#stylePreview').css('height', $('#styleSettings').height() + 'px');
});

window.electronAPI.handleRC((event, r, c) => {
    row = r;
    col = c;

    $('#buttonTitle').text('Button ' + (row + 1) + ' . ' + (col + 1));
});

window.electronAPI.handleButton((event, b) => {
    button = b;

    uri.val(button.track.uri);
    uri.addClass('active');
    if (button.title) {
        title.val(button.title);
        title.addClass('active');

        previewText.text(button.title);
    }

    if (button.background_color) backgroundColor.val(button.background_color);
    if (button.background_hover_color) backgroundHoverColor.val(button.background_hover_color);
    if (button.text_color) textColor.val(button.text_color);
    if (button.text_hover_color) textHoverColor.val(button.text_hover_color);
    if (button.border_color) borderColor.val(button.border_color);
    if (button.border_hover_color) borderHoverColor.val(button.border_hover_color);

    preview.css('background-color', button.background_color ? button.background_color : 'var(--def-button)');
    preview.css('border-color', button.border_color ? button.border_color : 'transparent');
    previewText.css('color', button.text_color ? button.text_color : 'var(--def-text');

    preview.hover(() => {
        preview.css('background-color', button.background_hover_color ? button.background_hover_color : 'var(--def-button-hover)');
        previewText.css('color', button.text_hover_color ? button.text_hover_color : 'var(--def-text-hover');
        preview.css('border-color', button.border_hover_color ? button.border_hover_color : 'transparent');
    }, () => {
        preview.css('background-color', button.background_color ? button.background_color : 'var(--def-button)');
        preview.css('border-color', button.border_color ? button.border_color : 'transparent');
        previewText.css('color', button.text_color ? button.text_color : 'var(--def-text');
    });

    if (button.start_time) {
        startTimeUnit.val(button.start_time_unit);
        startTime.val(button.start_time);
    }

    if (button.end_type) {
        endTimeType.val(button.end_type);
        endTimeUnit.val(button.end_time_unit);
        endTime.val(button.end_time);
    }

});

window.electronAPI.handleButtonUpdate((event, b) => {
    button.track = b.track;

    button.title = b.track.title;
    title.val(button.title);
    title.addClass('active');

    previewText.text(button.title);
})

$('#openMediaSelector').click(() => {
    window.electronAPI.openMediaSelector(row, col, winId);
});

title.change(() => {
    button.title = title.val();
    previewText.text(button.title);
});

backgroundColor.change(() => {
    button.background_color = backgroundColor.val();
    preview.css('background-color', backgroundColor.val());
});

backgroundHoverColor.change(() => {
    button.background_hover_color = backgroundHoverColor.val();
    preview.hover(() => {
        preview.css('background-color', backgroundHoverColor.val());
    }, () => {
        preview.css('background-color', button.background_color ? button.background_color : 'var(--def-button)');
    })
});

textColor.change(() => {
    button.text_color = textColor.val();
    previewText.css('color', textColor.val());
});

textHoverColor.change(() => {
    button.text_hover_color = textHoverColor.val();
    previewText.hover(() => {
        previewText.css('color', textHoverColor.val());
    }, () => {
        previewText.css('color', button.text_color ? button.text_color : 'var(--def-text');
    })
});

borderColor.change(() => {
    button.border_color = borderColor.val();
    preview.css('border-color', borderColor.val());
});

borderHoverColor.change(() => {
    button.border_hover_color = borderHoverColor.val();
    preview.hover(() => {
        preview.css('border-color', borderHoverColor.val());
    }, () => {
        preview.css('border-color', button.border_color ? button.border_color : 'transparent');
    })
});

backgroundColorReset.click(() => {
    delete button.background_color;
    preview.css('background-color', 'var(--def-button)');
    backgroundColor.val('');
});

backgroundHoverColorReset.click(() => {
    delete button.background_hover_color;
    preview.hover(() => {
        preview.css('background-color', 'var(--def-button-hover)');
    }, () => {
        preview.css('background-color', button.background_color ? button.background_color : 'var(--def-button)');
    });
    backgroundHoverColor.val('');
});

textColorReset.click(() => {
    delete button.text_color;
    previewText.css('color', 'var(--def-text)');
    textColor.val('');
});

textHoverColorReset.click(() => {
    delete button.text_hover_color;
    previewText.hover(() => {
        previewText.css('color', 'var(--def-text-hover)');
    }, () => {
        previewText.css('color', button.text_color ? button.text_color : 'var(--def-text)');
    });
    textHoverColor.val('');
});

borderColorReset.click(() => {
    delete button.border_color;
    preview.css('border-color', 'transparent');
    borderColor.val('');
});

borderHoverColorReset.click(() => {
    delete button.border_hover_color;
    preview.hover(() => {
        preview.css('border-color', 'var(--def-border-hover)');
    }, () => {
        preview.css('border-color', button.border_color ? button.border_color : 'transparent');
    });
    borderHoverColor.val('');
});

startTime.change(() => {
    let time = parseInt(startTime.val());
    if (time < 0) {
        time = 0;
        startTime.val(0);
    } else if (time * getTimeMultiplier(startTimeUnit.val()) > button.track.duration * 1000) {
        time = convertToUnit(startTimeUnit.val(), button.track.duration);
        startTime.val(time);
    }

    button.start_time = time;
    button.start_time_unit = startTimeUnit.val();
});

startTimeUnit.change(() => {
    button.start_time_unit = startTimeUnit.val();
});

endTime.change(() => {
    let time = parseInt(endTime.val());

    if (endTimeType.val() === 'after') {
        if (time < 0) {
            time = 0;
            endTime.val(0);
        } else if (parseInt(startTime.val()) * getTimeMultiplier(startTimeUnit.val()) + time * getTimeMultiplier(endTimeUnit.val()) > button.track.duration * 1000) {
            time = convertToUnit(endTimeUnit.val(), button.track.duration) - convertToUnit(startTimeUnit.val(), parseInt(startTime.val()));
            endTime.val(time);
        }
    } else {
        if (time < 0) {
            time = 0;
            endTime.val(0);
        } else if (time * getTimeMultiplier(endTimeUnit.val()) > button.track.duration * 1000) {
            time = convertToUnit(endTimeUnit.val(), button.track.duration);
            endTime.val(time);
        } else if (time * getTimeMultiplier(endTimeUnit.val()) < parseInt(startTime.val()) * getTimeMultiplier(startTimeUnit.val())) {
            time = convertToUnit(startTimeUnit.val(), parseInt(startTime.val()));
            endTime.val(time);
        }
    }

    button.end_time = time;
    button.end_time_unit = endTimeUnit.val();
    button.end_type = endTimeType.val();
});

endTimeType.change(() => {
    button.end_type = endTimeType.val();
});

endTimeUnit.change(() => {
    button.end_time_unit = endTimeUnit.val();
});

discardBtn.click(() => {
    window.electronAPI.close(winId);
});

saveBtn.click(() => {
    window.electronAPI.updateButton(winId, button);
});

function getTimeMultiplier(val) {
    if (val === 'ms') return 1;
    else if (val === 's') return 1000;
    else if (val === 'm') return 60000;
}

function convertToUnit(unit, duration) {
    if (unit === 'ms') return duration * 1000;
    else if (unit === 's') return duration;
    else if (unit === 'm') return Math.floor(duration / 60);
}*/