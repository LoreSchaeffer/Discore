const fs = require('fs');
const path = require('path');

const Conf = class {
    constructor(root) {
        if (!fs.existsSync(root)) {
            fs.mkdirSync(root);
        }

        this.configPath = path.join(root, 'config.json');
        this.buttonsPath = path.join(root, 'buttons.json');
    }

    init() {
        if (!fs.existsSync(this.configPath)) {
            try {
                fs.writeFileSync(this.configPath, JSON.stringify(DEF_CONFIG, null, 2));
                this.config = DEF_CONFIG;
            } catch (e) {
                return e;
            }
        } else {
            try {
                this.config = JSON.parse(fs.readFileSync(this.configPath));
            } catch (e) {
                return e;
            }
        }

        if (!fs.existsSync(this.buttonsPath)) {
            try {
                fs.writeFileSync(this.buttonsPath, JSON.stringify([], null, 2));
            } catch (e) {
                return e;
            }
        } else {
            try {
                this.buttons = JSON.parse(fs.readFileSync(this.buttonsPath));
            } catch (e) {
                return e;
            }
        }
    }

    getButton(row, col) {
        return this.buttons.find((btn) => btn.row === row && btn.col === col);
    }

    addButton(button) {
        try {
            const index = this.buttons.findIndex((btn) => btn.row === button.row && btn.col === button.col);
            if (index !== -1) this.buttons[index] = button;
            else this.buttons.push(button);
        } catch (e) {
            console.error(e);
        }
    }

    removeButton(row, col) {
        try {
            const index = this.buttons.findIndex((btn) => btn.row === row && btn.col === col);
            if (index !== -1) this.buttons.splice(index, 1);
        } catch (e) {
            console.error(e);
        }
    }

    getSettings() {
        if (this.config.settings) return this.config.settings;
        else return {
            "output_device": ""
        };
    }

    saveConfig() {
        try {
            fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
        } catch (e) {
            return e;
        }
    }

    saveButtons() {
        try {
            fs.writeFileSync(this.buttonsPath, JSON.stringify(this.buttons, null, 2));
        } catch (e) {
            return e;
        }
    }
}

const DEF_CONFIG = {
    width: 1366,
    height: 768,
    rows: 8,
    columns: 10,
    volume: 100
}

module.exports = Conf;