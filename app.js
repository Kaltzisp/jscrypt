const path = require("path");
const fs = require("fs");
const electron = require("electron");
const cipher = require("crypto-js");
const assert = require("assert");

const app = electron.app;
const io = electron.ipcMain;

app.whenReady().then(() => {
    const window = new electron.BrowserWindow({
        width: 400,
        height: 400,
        resizable: false,
        webPreferences: {
            preload: path.join(__dirname, "libs", "preload.js")
        }
    });
    const storePath = `${app.getPath("userData")}/store`;

    window.loadFile("index.html");

    io.on("secretKey", (event, data) => {
        window.loadFile("libs/access.html").then(() => {
            window.webContents.send("secretKey", data);
        });
    });

    io.on("credentials", (event, data) => {
        if (fs.existsSync(`${storePath}/${data.account}.json`) && !data.edit) {
            return window.webContents.send("error", "Credentials already exist.");
        }
        electron.clipboard.writeText(data.pass, "selection");
        const usalt = cipher.lib.WordArray.random(32).toString(cipher.enc.Base64);
        const psalt = cipher.lib.WordArray.random(32).toString(cipher.enc.Base64);
        fs.writeFileSync(`${storePath}/${data.account}.json`, JSON.stringify({
            usalt,
            psalt,
            user: cipher.AES.encrypt(usalt + data.user, data.key).toString(),
            pass: cipher.AES.encrypt(psalt + data.pass, data.key).toString()
        }), "utf8");
        window.loadFile("libs/access.html").then(() => {
            window.webContents.send("secretKey", data.key);
        });
    });

    io.on("getCredentials", (event, data) => {
        let ciphertext;
        try {
            ciphertext = fs.readFileSync(`${storePath}/${data.account}.json`, "utf8");
        } catch (e) {
            return window.webContents.send("error", `No such account: ${data.account}`);
        }
        const store = JSON.parse(ciphertext);
        let user; let pass;
        try {
            user = cipher.AES.decrypt(store.user, data.secretKey).toString(cipher.enc.Utf8).substring(store.usalt.length);
            pass = cipher.AES.decrypt(store.pass, data.secretKey).toString(cipher.enc.Utf8).substring(store.psalt.length);
            assert(user.length > 0);
            assert(pass.length > 0);
        } catch (e) {
            return window.webContents.send("error", "Invalid decryption key.");
        }
        electron.clipboard.writeText(pass, "selection");
        const creds = {
            account: data.account,
            user
        };
        window.webContents.send("getCredentials", creds);
    });

    io.on("delAccount", (event, account) => {
        if (fs.existsSync(`${storePath}/${account}.json`)) {
            fs.unlink(`${storePath}/${account}.json`, () => {
                console.log(`Credentials for ${account} were removed.`);
            });
        }
    });

    io.on("getAccounts", () => {
        const files = fs.readdirSync(storePath);
        window.webContents.send("accountList", files);
    });
});

app.on("window-all-closed", () => {
    app.quit();
});
