const API_URL = "http://localhost:5020";

verificarAutenticacao();

function getToken() {
    return localStorage.getItem("token");
}

function logout() {
    const token = getToken();

    fetch(`${API_URL}/api/Auth/logout`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    }).finally(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("usuario");

        window.location.href = "/TelaLogin/login.html";
    });
}

function fetchAutenticado(url, options = {}) {
    const token = getToken();

    if (!token) {
        window.location.href = "/TelaLogin/login.html";

        return Promise.reject("Sem token");
    }

    options.headers = {
        ...options.headers,
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
    };

    return fetch(`${API_URL}${url}`, options)
        .then(response => {

            if (response.status === 401) {

                localStorage.removeItem("token");
                localStorage.removeItem("usuario");

                window.location.href = "/TelaLogin/login.html";

                return Promise.reject("Token expirado");
            }

            return response;
        });
}

// Verifica se está autenticado ao carregar qualquer página protegida
function verificarAutenticacao() {

    const token = getToken();

    if (!token) {
        window.location.href = "/TelaLogin/login.html";
    }
}