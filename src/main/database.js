const fs = require('fs');
const path = require('path');
const {v4: uuidv4} = require("uuid");
const sqlite3 = require('sqlite3').verbose();

const ROWS = 8;
const COLS = 10;

const Database = class {
    constructor(root) {
        if (!fs.existsSync(root)) fs.mkdirSync(root);
        this.db = new sqlite3.Database(path.join(root, 'database.db'));

        this.db.serialize(() => {
            this.db.run('PRAGMA foreign_keys = ON');
            this.db.run('CREATE TABLE IF NOT EXISTS buttons (row INTEGER NOT NULL, col INTEGER NOT NULL, btn_title TEXT, txt_color TEXT, txt_h_color TEXT, bg_color TEXT, bg_h_color TEXT, brd_color TEXT, brd_h_color TEXT, title TEXT, uri TEXT NOT NULL, url TEXT, duration INTEGER NOT NULL, thumbnail TEXT, profile BLOB NOT NULL, PRIMARY KEY (row, col), FOREIGN KEY(profile) REFERENCES profiles(id))');
            this.db.run(`CREATE TABLE IF NOT EXISTS profiles (id BLOB NOT NULL, name TEXT NOT NULL, rows INTEGER NOT NULL DEFAULT ${ROWS}, columns INTEGER NOT NULL DEFAULT ${COLS}, PRIMARY KEY (id))`);
        });
    }

    getProfiles() {
        return new Promise((resolve, reject) => {
            const stmt = this.db.prepare('SELECT * FROM profiles');
            stmt.all([], (e, rows) => {
                if (e) reject(e);
                else resolve(rows);
            });
            stmt.finalize();
        });
    }

    getProfile(id) {
        return new Promise((resolve, reject) => {
            const stmt = this.db.prepare('SELECT * FROM profiles WHERE id = ?');
            stmt.get([id], (e, row) => {
                if (e) reject(e);
                else resolve(row);
            });
            stmt.finalize();
        });
    }

    createProfile(name) {
        const id = this.randomUUID();

        return new Promise((resolve, reject) => {
            const stmt = this.db.prepare('INSERT INTO profiles (id, name) VALUES (?, ?)');
            stmt.run([id, name], (e) => {
                if (e) reject(e);
                else resolve({id: id, name: name, rows: ROWS, columns: COLS});
            });
            stmt.finalize();
        });
    }

    renameProfile(id, name) {
        return new Promise((resolve, reject) => {
            const stmt = this.db.prepare('UPDATE profiles SET name = ? WHERE id = ?');
            stmt.run([name, id], (e) => {
                if (e) reject(e);
                else resolve({id: id, name: name});
            });
            stmt.finalize();
        });
    }

    deleteProfile(id) {
        return new Promise((resolve, reject) => {
            let stmt = this.db.prepare('DELETE FROM buttons WHERE profile = ?');
            stmt.run([id], (e) => {
                if (e) reject(e);
            });
            stmt.finalize();

            stmt = this.db.prepare('DELETE FROM profiles WHERE id = ?');
            stmt.run([id], (e) => {
                if (e) reject(e);
            });
            stmt.finalize();

            resolve();
        });
    }

    getButtons(profile) {
        return new Promise((resolve, reject) => {
            const stmt = this.db.prepare('SELECT * FROM buttons WHERE profile = ?');
            stmt.all([profile], (e, rows) => {
                if (e) reject(e);
                else resolve(rows);
            });
            stmt.finalize();
        });
    }

    getButton(profile, row, col) {
        return new Promise((resolve, reject) => {
            const stmt = this.db.prepare('SELECT * FROM buttons WHERE profile = ? AND row = ? AND col = ?');
            stmt.get([profile, row, col], (e, row) => {
                if (e) reject(e);
                else resolve(row);
            });
            stmt.finalize();
        });
    }

    addButton(profile, button) {
        return new Promise((resolve, reject) => {
            const stmt = this.db.prepare('INSERT INTO buttons (row, col, btn_title, txt_color, txt_h_color, bg_color, bg_h_color, brd_color, brd_h_color, title, uri, url, duration, thumbnail, profile) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
            const params = [
                button.row,
                button.col,
                button.btn_title,
                button.txt_color,
                button.txt_h_color,
                button.bg_color,
                button.bg_h_color,
                button.brd_color,
                button.brd_h_color,
                button.title,
                button.uri,
                button.url,
                button.duration,
                button.thumbnail,
                profile
            ];

            stmt.run(params, (e) => {
                if (e) {
                    reject(e);
                } else {
                    resolve();
                }
            });
            stmt.finalize();
        });
    }

    updateButton(profile, button) {
        return new Promise((resolve, reject) => {
            const stmt = this.db.prepare('UPDATE buttons SET btn_title = ?, txt_color = ?, txt_h_color = ?, bg_color = ?, bg_h_color = ?, brd_color = ?, brd_h_color = ?, title = ?, uri = ?, url = ?, duration = ?, thumbnail = ? WHERE profile = ? AND row = ? AND col = ?');
            const params = [
                button.row,
                button.col,
                button.btn_title,
                button.txt_color,
                button.txt_h_color,
                button.bg_color,
                button.bg_h_color,
                button.brd_color,
                button.brd_h_color,
                button.title,
                button.uri,
                button.url,
                button.duration,
                button.thumbnail,
                profile
            ];

            stmt.run(params, (e) => {
                if (e) {
                    reject(e);
                } else {
                    resolve();
                }
            });
            stmt.finalize();
        });
    }

    deleteButton(profile, row, col) {
        return new Promise((resolve, reject) => {
            const stmt = this.db.prepare('DELETE FROM buttons WHERE profile = ? AND row = ? AND col = ?');
            stmt.run([profile, row, col], (e) => {
                if (e) {
                    reject(e);
                } else {
                    resolve();
                }
            });
            stmt.finalize();
        });
    }

    close() {
        this.db.close();
    }

    randomUUID() {
        return uuidv4();
    }
};

module.exports = Database;