const API_URL = "";

function getToken() {
    return localStorage.getItem("token");
}

function verificarAutenticacao() {
    if (!getToken()) window.location.href = "/TelaLogin/login.html";
}

document.addEventListener("DOMContentLoaded", () => {
    verificarAutenticacao();
    configurarMascaras();
});

function toggleDropdown(id) {
    const dropdown = document.getElementById(id);
    if (dropdown) dropdown.classList.toggle('active');
}

function selecionarOpcao(dropdownId, labelId, texto, valor) {
    document.getElementById(labelId).innerText = texto;
    const inputOculto = document.querySelector(`#${dropdownId} input[type="hidden"]`);
    if (inputOculto) inputOculto.value = valor;
    toggleDropdown(dropdownId);
}

document.addEventListener('click', function (e) {
    document.querySelectorAll('.dropdown-custom').forEach(d => {
        if (!d.contains(e.target)) d.classList.remove('active');
    });
});

function configurarMascaras() {
    const cpfInput = document.getElementById("cpf");
    const telefoneInput = document.getElementById("telefone");

    if (cpfInput) {
        cpfInput.addEventListener("input", (e) => {
            let v = e.target.value.replace(/\D/g, "");
            if (v.length > 11) v = v.slice(0, 11);
            v = v.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
            e.target.value = v;
        });
    }

    if (telefoneInput) {
        telefoneInput.addEventListener("input", (e) => {
            let v = e.target.value.replace(/\D/g, "");
            if (v.length > 11) v = v.slice(0, 11);
            v = v.length > 10 ? v.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3") : v.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3");
            e.target.value = v;
        });
    }
}

function salvarCliente() {
    const erroDiv = document.getElementById("erro-cadastro");
    if (erroDiv) erroDiv.style.display = "none";

    const nome = document.getElementById("nome").value.trim();
    const cpf = document.getElementById("cpf").value;
    const telefone = document.getElementById("telefone").value;

    if (!nome || !cpf || !telefone) {
        mostrarErro("Por favor, preencha os campos obrigatórios (Nome, CPF e Telefone).");
        return;
    }

    const btn = document.getElementById("btnCadastrarForm");
    if (btn) { btn.innerText = "Salvando..."; btn.disabled = true; }

    const payload = {
        Nome: nome,
        Cpf: cpf,
        Telefone: telefone,
        Email: document.getElementById("email").value.trim() || null,
        Endereco: document.getElementById("endereco").value.trim() || null,
        Premium: document.getElementById("premium").value === "true"
    };

    fetchAutenticado("/api/Clientes", {
        method: "POST",
        body: JSON.stringify(payload)
    })
        .then(() => {
            alert("Cliente cadastrado com sucesso!");
            limparFormulario();
        })
        .catch((error) => {
            console.error(error);
            mostrarErro(error || "Falha ao realizar o cadastro.");
        })
        .finally(() => {
            if (btn) { btn.innerHTML = 'Cadastrar'; btn.disabled = false; }
        });
}

function limparFormulario() {
    document.querySelectorAll('input[type="text"], input[type="email"]').forEach(i => i.value = "");
    document.getElementById("premium").value = "false";
    document.getElementById("selected-premium-label").innerText = "Premium";
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
        if (response.status === 401) window.location.href = "/TelaLogin/login.html";
        if (!response.ok) {
            const erroJson = await response.json().catch(() => ({ message: "Erro interno" }));
            return Promise.reject(erroJson.message);
        }
        return response;
    });
}

function logout() {
    localStorage.clear();
    window.location.href = "/TelaLogin/login.html";
}

function mostrarErro(mensagem) {
    const erroDiv = document.getElementById("erro-cadastro");
    if (erroDiv) {
        erroDiv.innerText = mensagem;
        erroDiv.style.display = "block";
    }
}