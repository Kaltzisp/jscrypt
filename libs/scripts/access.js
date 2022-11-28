const serviceLabel = document.getElementById("serviceLabel");
const hiddenKey = document.getElementById("hiddenKey");
const infoText = document.getElementById("infoText");

let secretKey;
window.api.on("secretKey", (event, data) => {
    secretKey = data;
});

window.api.on("accountList", (event, data) => {
    const account = document.getElementById("account");
    for (const i of data) {
        const acc = i.replace(".json", "");
        const node = document.createElement("option");
        node.innerHTML = `<option value=${acc}>${acc}</option>`;
        account.append(node);
    }
});

class Field {
    constructor(id, type) {
        this.node = document.createElement("input");
        this.node.id = id;
        this.node.class = "field";
        this.node.type = type;
        this.node.placeholder = id;
    }

    static br() {
        return document.createElement("br");
    }

    static span(id, text) {
        const node = document.createElement("span");
        node.id = id;
        node.innerText = text;
        return node;
    }
}

function unsetOptions() {
    document.onkeydown = (e) => e;
    document.onkeyup = (e) => e;
}

function newAccount(edit, preset) {
    unsetOptions();
    serviceLabel.innerText = `${edit ? "Edit" : "Add"} account`;
    infoText.innerHTML = "";
    const account = new Field("account", "text").node;
    const user = new Field("username", "text").node;
    const pass = new Field("password", "password", true).node;
    if (preset) {
        account.value = preset.account;
        user.value = preset.user;
    }
    infoText.append(account, Field.br(), Field.br(), user, Field.br(), pass);
    if (edit) {
        pass.focus();
    } else {
        account.focus();
    }
    document.getElementById("keyForm").onsubmit = () => {
        window.api.send("credentials", {
            key: secretKey,
            account: account.value,
            user: user.value,
            pass: pass.value,
            edit
        });
        return false;
    };
}

function viewAccount() {
    unsetOptions();
    serviceLabel.innerText = "View credentials";
    infoText.innerHTML = "";
    window.api.send("getAccounts");
    const account = document.createElement("select");
    account.id = "account";
    account.class = "field";
    infoText.append(account);
    account.focus();
    document.onkeydown = (e) => {
        if (e.code === "Enter") {
            window.api.send("getCredentials", { account: account.value, secretKey });
        }
    };
}

function deleteAccount(account) {
    unsetOptions();
    serviceLabel.innerText = "Account removed";
    infoText.innerHTML = "";
    window.api.send("delAccount", account);
    document.onkeydown = () => {
        window.api.send("secretKey", secretKey);
    };
}

function setOptions() {
    document.onkeydown = (e) => {
        switch (e.code) {
            case "KeyQ": {
                window.close();
                break;
            } case "KeyK": {
                location.replace("../index.html");
                break;
            } case "KeyV": {
                viewAccount();
                break;
            } case "KeyN": {
                newAccount();
                break;
            } case "ShiftLeft": {
                hiddenKey.innerText = secretKey;
                hiddenKey.display = "initial";
                break;
            } default: {
                return e;
            }
        }
        return false;
    };

    document.onkeyup = (e) => {
        if (e.code === "ShiftLeft") {
            hiddenKey.innerText = "";
            hiddenKey.display = "none";
        }
    };
}

setOptions();
document.getElementById("keyForm").onsubmit = () => false;

window.api.on("getCredentials", (event, creds) => {
    infoText.innerHTML = "";
    const user = Field.span("credentials", `username: ${creds.user}`);
    const pass = Field.span("pass", "password: *****");
    infoText.append(Field.br(), user, Field.br(), Field.br(), pass);
    document.onkeydown = (e) => {
        switch (e.code) {
            case "KeyD": {
                deleteAccount(creds.account);
                break;
            } case "KeyE": {
                setTimeout(() => {
                    newAccount(true, creds);
                }, 50);
                break;
            } default: {
                window.api.send("secretKey", secretKey);
            }
        }
    };
});

window.api.on("error", (event, data) => {
    infoText.innerHTML = "";
    infoText.append(Field.br(), Field.span("failText", data));
    document.onkeydown = () => {
        window.api.send("secretKey", secretKey);
    };
});
