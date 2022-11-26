document.getElementById("keyForm").onsubmit = () => {
    const secretKey = document.getElementById("secretKey");
    window.api.send("secretKey", secretKey.value);
    return false;
};
