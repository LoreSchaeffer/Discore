const fs = require('fs');
const path = require('path');
const {Sequelize, DataTypes} = require('sequelize');

const ROWS = 8;
const COLS = 10;

const Database = class {
    constructor(root) {
        if (!fs.existsSync(root)) fs.mkdirSync(root);
        this.sequelize = new Sequelize({
            dialect: 'sqlite',
            storage: path.join(root, 'database.db'),
            logging: false
        });

        this.Profile = this.sequelize.define('profile', {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false
            },
            rows: {
                type: DataTypes.INTEGER,
                defaultValue: ROWS
            },
            columns: {
                type: DataTypes.INTEGER,
                defaultValue: COLS
            }
        }, {
            indexes: [
                {
                    unique: true,
                    fields: ['id']
                }
            ],
            timestamps: false
        });

        this.Button = this.sequelize.define('button', {
            row: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            col: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            txt_color: {
                type: DataTypes.STRING
            },
            txt_h_color: {
                type: DataTypes.STRING
            },
            bg_color: {
                type: DataTypes.STRING
            },
            bg_h_color: {
                type: DataTypes.STRING
            },
            brd_color: {
                type: DataTypes.STRING
            },
            brd_h_color: {
                type: DataTypes.STRING
            },
            btn_title: {
                type: DataTypes.STRING
            },
            title: {
                type: DataTypes.STRING
            },
            uri: {
                type: DataTypes.STRING,
                allowNull: false
            },
            url: {
                type: DataTypes.STRING
            },
            duration: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            thumbnail: {
                type: DataTypes.STRING
            },
            start_time: {
                type: DataTypes.BIGINT
            },
            start_time_unit: {
                type: DataTypes.STRING
            },
            end_time_type: {
                type: DataTypes.STRING
            },
            end_time: {
                type: DataTypes.BIGINT
            },
            end_time_unit: {
                type: DataTypes.STRING
            },
        }, {
            indexes: [
                {
                    unique: true,
                    fields: ['profile_id', 'row', 'col'],
                },
                {
                    fields: ['profile_id', 'row', 'col']
                }
            ],
            timestamps: false
        });

        this.Profile.hasMany(this.Button);
        this.Button.belongsTo(this.Profile, {foreignKey: 'profile_id'});

        this.sequelize.sync();
    }

    async getProfiles() {
        try {
            return (await this.Profile.findAll())
                .map(profile => profile.get({plain: true}));
        } catch (e) {
            console.error(e);
            return null;
        }
    }

    async getProfile(id) {
        try {
            const profile = await this.Profile.findByPk(id);
            if (!profile) return null;
            return profile.get({plain: true});
        } catch (e) {
            console.error(e);
            return null;
        }
    }

    async createProfile(name) {
        try {
            return (await this.Profile.create({name: name})).get({plain: true});
        } catch (e) {
            console.error(e);
            return null;
        }
    }

    async renameProfile(id, name) {
        try {
            const profile = await this.Profile.findByPk(id);
            profile.name = name;
            await profile.save();
            return profile.get({plain: true});
        } catch (e) {
            console.error(e);
        }
    }

    async resizeProfile(id, rows, cols) {
        try {
            const profile = await this.Profile.findByPk(id);
            profile.rows = rows;
            profile.columns = cols;
            await profile.save();
            return profile.get({plain: true});
        } catch (e) {
            console.error(e);
        }
    }

    async deleteProfile(id) {
        try {
            const profile = await this.Profile.findByPk(id);
            if (!profile) return;
            await profile.destroy();
        } catch (e) {
            console.error(e);
        }
    }

    async getButtons(profile) {
        try {
            return (await this.Button.findAll({where: {profile_id: profile}}))
                .map(button => button.get({plain: true}));
        } catch (e) {
            console.error(e);
            return null;
        }
    }

    async getButton(profile, row, col) {
        try {
            const button = await this.Button.findOne({where: {profile_id: profile, row: row, col: col}});
            if (!button) return null;
            return button.get({plain: true});
        } catch (e) {
            console.error(e);
            return null;
        }
    }

    async addButton(profile, button) {
        try {
            return (await this.Button.create({
                row: button.row,
                col: button.col,
                txt_color: button.txt_color || null,
                txt_h_color: button.txt_h_color || null,
                bg_color: button.bg_color || null,
                bg_h_color: button.bg_h_color || null,
                brd_color: button.brd_color || null,
                brd_h_color: button.brd_h_color || null,
                btn_title: button.btn_title || null,
                title: button.title || null,
                uri: button.uri,
                url: button.url || null,
                duration: button.duration,
                thumbnail: button.thumbnail || null,
                profile_id: profile
            })).get({plain: true});
        } catch (e) {
            console.error(e);
            return null;
        }
    }

    async updateButton(profile, button) {
        try {
            const [updated] = await this.Button.update({
                btn_title: button.btn_title || null,
                txt_color: button.txt_color || null,
                txt_h_color: button.txt_h_color || null,
                bg_color: button.bg_color || null,
                bg_h_color: button.bg_h_color || null,
                brd_color: button.brd_color || null,
                brd_h_color: button.brd_h_color || null,
                title: button.title || null,
                uri: button.uri,
                url: button.url || null,
                duration: button.duration,
                thumbnail: button.thumbnail || null,
                start_time: button.start_time || null,
                start_time_unit: button.start_time_unit || null,
                end_time_type: button.end_time_type || null,
                end_time: button.end_time || null,
                end_time_unit: button.end_time_unit || null,
            }, {
                where: {profile_id: profile, row: button.row, col: button.col}
            });

            if (!updated) throw new Error('Button not found');

            return (await this.Button.findOne({where: {profile_id: profile, row: button.row, col: button.col}}))
                .get({plain: true});
        } catch (error) {
            console.error(error);
        }
    }

    async moveButton(profile, button, oldRow, oldCol) {
        try {
            const [updated] = await this.Button.update({
                btn_title: button.btn_title || null,
                txt_color: button.txt_color || null,
                txt_h_color: button.txt_h_color || null,
                bg_color: button.bg_color || null,
                bg_h_color: button.bg_h_color || null,
                brd_color: button.brd_color || null,
                brd_h_color: button.brd_h_color || null,
                title: button.title || null,
                uri: button.uri,
                url: button.url || null,
                duration: button.duration,
                thumbnail: button.thumbnail || null,
                start_time: button.start_time || null,
                start_time_unit: button.start_time_unit || null,
                end_time_type: button.end_time_type || null,
                end_time: button.end_time || null,
                end_time_unit: button.end_time_unit || null,
                row: button.row,
                col: button.col
            }, {
                where: {profile_id: profile, row: oldRow, col: oldCol}
            });

            if (!updated) throw new Error('Button not found');
        } catch (error) {
            console.error(error);
        }
    }

    async deleteButton(profile, row, col) {
        try {
            const button = await this.Button.findOne({where: {profile_id: profile, row: row, col: col}});
            if (!button) return;
            await button.destroy();
        } catch (e) {
            console.error(e);
        }
    }

    async deleteButtons(profile) {
        try {
            await this.Button.destroy({where: {profile_id: profile}});
        } catch (e) {
            console.error(e);
        }
    }

    async close() {
        await this.sequelize.close();
    }
};

module.exports = Database;