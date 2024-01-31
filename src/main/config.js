const fs = require('fs');
const path = require('path');

const Config = class {
    constructor(root) {
        if (!fs.existsSync(root)) fs.mkdirSync(root);
        this.configPath = path.join(root, 'config.json');
    }

    init() {
        if (!fs.existsSync(this.configPath)) {
            try {
                this.config = DEF_CONFIG;
                this.save();
            } catch (e) {
                return e;
            }
        } else {
            try {
                this.config = JSON.parse(fs.readFileSync(this.configPath));

                let saveNeeded = false;
                for (const key in DEF_CONFIG) {
                    if (!this.config.hasOwnProperty(key)) {
                        this.config[key] = DEF_CONFIG[key];
                        saveNeeded = true;
                    }
                }

                if (saveNeeded) {
                    const result = this.save();
                    if (result) return result;
                }
            } catch (e) {
                return e;
            }
        }
    }

    save() {
        try {
            fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
        } catch (e) {
            return e;
        }
    }
}

const DEF_CONFIG = {
    width: 1366,
    height: 768,
    volume: 50,
    output_device: 'default',
    active_profile: '',
    loop: 'none',
    font_size: 13,
};

module.exports = Config;