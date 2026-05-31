const API_URL = "";

function getToken() {
    return localStorage.getItem("token");
}

function verificarAutenticacao() {
    if (!getToken()) {
        window.location.href = "/TelaLogin/login.html";
    }
}

document.addEventListener("DOMContentLoaded", () => {
    verificarAutenticacao();
});

function logout() {
    localStorage.clear();
    window.location.href = "/TelaLogin/login.html";
}
