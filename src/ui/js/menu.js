const audioOutput = $("#audioOutput");

const testAudio = $("#testAudio");
const discardBtn = $("#discard");
const saveBtn = $("#save");

let settings;

$(document).ready(async () => {
    settings = await window.electronAPI.getSettings();

    const devices = await navigator.mediaDevices.enumerateDevices();
    devices.forEach((device) => {
        if (device.kind !== 'audiooutput') return;

        const option = $(`<option value="${device.deviceId}">${device.label}</option>`);
        audioOutput.append(option);
    });

    setValues();
});

function setValues() {
    if (settings.output_device && settings.output_device !== '') {
        audioOutput.val(settings.output_device);
        audioOutput.trigger('input');
    }
}

audioOutput.on('input', function () {
    settings.output_device = audioOutput.val();
});

testAudio.click(() => {
    const audio = new Audio('audio/test.mp3');
    audio.setSinkId(settings.output_device).then(() => {
        audio.play();
    });
});

discardBtn.click(() => {
    window.electronAPI.close(winId);
});

saveBtn.click(() => {
    window.electronAPI.saveSettings(winId, settings);
});