const API_URL = ""; // Mantenha o mesmo padrão do seu sistema

function getToken() {
    return localStorage.getItem("token");
}

function verificarAutenticacao() {
    if (!getToken()) window.location.href = "../TelaLogin/login.html";
}

document.addEventListener("DOMContentLoaded", () => {
    verificarAutenticacao();
    configurarMascaras();
});

function configurarMascaras() {
    const precoInput = document.getElementById("preco");
    const tempoInput = document.getElementById("tempo");

    // Máscara de Preço: Ex: 1.234,56
    precoInput.addEventListener("input", (e) => {
        let v = e.target.value.replace(/\D/g, "");
        v = (v / 100).toFixed(2).replace(".", ",");
        v = v.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
        e.target.value = "R$ " + v;
    });

    // Máscara simples para tempo (apenas números)
    tempoInput.addEventListener("input", (e) => {
        e.target.value = e.target.value.replace(/\D/g, "");
    });
}

function salvarServico() {
    const erroDiv = document.getElementById("erro-cadastro");
    if (erroDiv) erroDiv.style.display = "none";

    const nome = document.getElementById("nomeServico").value.trim();
    const tempo = document.getElementById("tempo").value.trim();
    const precoRaw = document.getElementById("preco").value.replace(/\D/g, ""); // Remove R$ e vírgulas

    if (!nome || !tempo || !precoRaw) {
        mostrarErro("Por favor, preencha todos os campos corretamente.");
        return;
    }

    const btn = document.getElementById("btnCadastrarForm");
    btn.innerText = "Salvando...";
    btn.disabled = true;

    const payload = {
        Nome: nome,
        Tempo: parseInt(tempo),
        Preco: parseFloat(precoRaw) / 100
    };

    fetchAutenticado("/api/Servicos", { // Ajuste o endpoint conforme sua API
        method: "POST",
        body: JSON.stringify(payload)
    })
        .then(() => {
            alert("Serviço cadastrado com sucesso!");
            limparFormulario();
        })
        .catch((error) => {
            console.error(error);
            mostrarErro(error || "Falha ao realizar o cadastro.");
        })
        .finally(() => {
            btn.innerText = 'Cadastrar';
            btn.disabled = false;
        });
}

function limparFormulario() {
    document.querySelectorAll('input').forEach(i => i.value = "");
}

function fetchAutenticado(url, options = {}) {
    const token = getToken();
    return fetch(API_URL + url, {
        ...options,
        headers: {
            "Authorization": "Bearer " + token,
            "Content-Type": "application/json"
        }
    }).then(async (response) => {
        if (response.status === 401) window.location.href = "../TelaLogin/login.html";
        if (!response.ok) {
            const erroJson = await response.json().catch(() => ({ message: "Erro interno" }));
            return Promise.reject(erroJson.message);
        }
        return response;
    });
}

function logout() {
    localStorage.clear();
    window.location.href = "../TelaLogin/login.html";
}

function mostrarErro(mensagem) {
    const erroDiv = document.getElementById("erro-cadastro");
    if (erroDiv) {
        erroDiv.innerText = mensagem;
        erroDiv.style.display = "block";
    }
}