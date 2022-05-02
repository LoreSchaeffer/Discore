const query = require('querystring');
const id = JSON.parse(query.parse(global.location.search)['?data']).id;
const button = JSON.parse(JSON.parse(query.parse(global.location.search)['?data']).button);

const srcFile = $('#srcFile');
const dirBtn = $('#dirBtn');
const title = $('#title');
const src = $('#src');
const volume = $('#volume');
const btnTxt = $('#btnTxt');
const btnColor = $('#btnColor');
const rstBtnColor = $('#rstBtnColor');
const txtColor = $('#txtColor');
const rstTxtColor = $('#rstTxtColor');
const enableCropping = $('#enableCropping');
const start = $('#start');
const startTU = $('#startTU');
const endPos = $('#endPos');
const end = $('#end');
const endTU = $('#endTU');
//const hotkey = $('#');
const preview = $('#previewBtn');
const cancel = $('#cancelBtn');
const save = $('#saveBtn');

navMinimize.on('click', () => {
    ipc.send('minimize', id);
});
navClose.on('click', () => {
    ipc.send('close', id);
});

$(window).ready(() => {
    title.text('Button ' + id);
    src.val(button.src).addClass('active');
    volume.val(button.volume != null ? button.volume : 0);
    btnTxt.val(button.title).addClass('active');
    if (button.button_color != null) btnColor.val(button.button_color);
    if (button.text_color) txtColor.val(button.text_color);
    button.crop ? enableCropping.prop('checked', true) : enableCropping.prop('checked', false);
    start.val(button.start);
    startTU.val(button.start_tu);
    endPos.val(button.stop_type);
    end.val(button.stop);
    endTU.val(button.stop_tu);
    //hotkey

    if (button.crop) {
        start.attr('disabled', false);
        startTU.attr('disabled', false);
        endPos.attr('disabled', false);
        end.attr('disabled', false);
        endTU.attr('disabled', false);
    } else {
        start.attr('disabled', true);
        startTU.attr('disabled', true);
        endPos.attr('disabled', true);
        end.attr('disabled', true);
        endTU.attr('disabled', true);
    }
});

dirBtn.click(() => {
    srcFile.trigger('click');
});

srcFile.change(() => {
    src.val(srcFile.val());
})

rstBtnColor.click(() => {
    btnColor.val('#2F3136');
});

rstTxtColor.click(() => {
    txtColor.val('#ABABAB');
});

enableCropping.prop('checked', () => {
    if (button.crop) {
        start.attr('disabled', false);
        startTU.attr('disabled', false);
        endPos.attr('disabled', false);
        end.attr('disabled', false);
        endTU.attr('disabled', false);
    } else {
        start.attr('disabled', true);
        startTU.attr('disabled', true);
        endPos.attr('disabled', true);
        end.attr('disabled', true);
        endTU.attr('disabled', true);
    }
});

preview.click(() => {

});

cancel.click(() => {
    ipc.send('close_window', id);
});

save.click(() => {
    button.src = src.val();
    button.volume = parseInt(volume.val());
    button.title = btnTxt.val();
    button.button_color = btnColor.val();
    button.text_color = txtColor.val();
    button.crop = enableCropping.prop('checked');
    button.start = parseInt(start.val());
    button.start_tu = startTU.val();
    button.stop_type = endPos.val();
    button.stop = parseInt(end.val());
    button.stop_tu = endTU.val();
    //Hotkey

    ipc.send('update_button', button);
    ipc.send('close_window', id);
});