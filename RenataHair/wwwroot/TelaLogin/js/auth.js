const API_URL = "http://localhost:5020";

function getToken() {
    return localStorage.getItem("token");
}

/* =========================
   VERIFICA AUTENTICAÇÃO
========================= */
function verificarAutenticacao() {
    const token = getToken();

    if (!token) {
        window.location.href = "/TelaLogin/login.html";
    }
}

/* =========================
   LOGOUT
========================= */
function logout() {
    const token = getToken();

    fetch(API_URL + "/api/Auth/logout", {
        method: "POST",
        headers: {
            "Authorization": "Bearer " + token
        }
    }).finally(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("usuario");

        window.location.href = "/TelaLogin/login.html";
    });
}

/* =========================
   FETCH AUTENTICADO (VERSÃO SEGURA)
========================= */
function fetchAutenticado(url, options = {}) {
    const token = getToken();

    if (!token) {
        window.location.href = "/TelaLogin/login.html";
        return Promise.reject("Sem token");
    }

    return fetch(API_URL + url, {
        ...options,
        headers: {
            "Authorization": "Bearer " + token,
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    }).then(async (response) => {

        // 🔴 Token inválido ou expirado
        if (response.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("usuario");

            window.location.href = "/TelaLogin/login.html";
            return Promise.reject("Token expirado");
        }

        // 🔴 Outros erros da API (IMPORTANTE pra debug)
        if (!response.ok) {
            const text = await response.text();
            console.error("Erro na API:", response.status, text);
            throw new Error("Erro na API: " + response.status);
        }

        return response;
    });
}