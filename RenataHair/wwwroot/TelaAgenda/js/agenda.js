// =============================================
//  agenda.js — inicialização e controle de data
// =============================================

const API_URL = "";

const AgendaState = {
    dataAtual: new Date(),
    funcionarios: [],
    todosServicos: []
};

// ---- AUTENTICAÇÃO ----

function getToken() {
    return localStorage.getItem("token");
}

function verificarAutenticacao() {
    if (!getToken()) {
        window.location.href = "/TelaLogin/login.html";
    }
}

function logout() {
    localStorage.clear();
    window.location.href = "/TelaLogin/login.html";
}

// ---- FETCH AUTENTICADO ----

function fetchAutenticado(url, options = {}) {
    const token = getToken();

    return fetch(API_URL + url, {
        ...options,
        headers: {
            "Authorization": "Bearer " + token,
            "Content-Type": "application/json"
        }
    }).then(async response => {
        if (response.status === 401) {
            window.location.href = "/TelaLogin/login.html";
            return;
        }

        if (!response.ok) {
            const erroJson = await response.json().catch(() => ({
                message: "Erro interno do servidor"
            }));
            return Promise.reject(erroJson.message);
        }

        return response;
    });
}

// ---- FORMATAÇÃO DE DATA ----

function formatarDataParaAPI(date) {
    const ano = date.getFullYear();
    const mes = String(date.getMonth() + 1).padStart(2, "0");
    const dia = String(date.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
}

function formatarDataParaLabel(date) {
    const diasSemana = [
        "Domingo", "Segunda-feira", "Terça-feira",
        "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"
    ];
    const dia = String(date.getDate()).padStart(2, "0");
    const mes = String(date.getMonth() + 1).padStart(2, "0");
    const ano = date.getFullYear();
    const diaSemana = diasSemana[date.getDay()];
    return `${dia}/${mes}/${ano} ${diaSemana}`;
}

// ---- NAVEGAÇÃO DE DATA ----

function navegarDia(delta) {
    AgendaState.dataAtual.setDate(AgendaState.dataAtual.getDate() + delta);
    atualizarAgenda();
}

function irParaData(valor) {
    if (!valor) return;
    const [ano, mes, dia] = valor.split("-").map(Number);
    AgendaState.dataAtual = new Date(ano, mes - 1, dia);
    atualizarAgenda();
}

function atualizarLabelData() {
    const label = document.getElementById("labelData");
    const inputData = document.getElementById("inputData");

    if (label) label.textContent = formatarDataParaLabel(AgendaState.dataAtual);
    if (inputData) inputData.value = formatarDataParaAPI(AgendaState.dataAtual);
}

// ---- FLUXO PRINCIPAL ----

async function atualizarAgenda() {
    atualizarLabelData();
    const dataStr = formatarDataParaAPI(AgendaState.dataAtual);
    await carregarAgendamentos(dataStr);
}

async function inicializar() {
    verificarAutenticacao();
    criarToastContainer();
    atualizarLabelData();

    mostrarLoading(true);

    try {
        const [funcionarios, servicos] = await Promise.all([
            fetchAutenticado("/api/Funcionarios/todos").then(r => r.json()),
            fetchAutenticado("/api/Servicos").then(r => r.json())
        ]);

        AgendaState.funcionarios = funcionarios;
        AgendaState.todosServicos = servicos;

        if (funcionarios.length === 0) {
            mostrarLoading(false);
            mostrarVazio(true);
            return;
        }

        montarGrid(funcionarios);

        const dataStr = formatarDataParaAPI(AgendaState.dataAtual);
        await carregarAgendamentos(dataStr);

    } catch (erro) {
        console.error("Erro ao inicializar agenda:", erro);
        mostrarLoading(false);
    }
}

function mostrarLoading(visivel) {
    const loading = document.getElementById("agendaLoading");
    const grid = document.getElementById("agendaGrid");
    if (loading) loading.style.display = visivel ? "flex" : "none";
    if (grid) grid.style.display = visivel ? "none" : "grid";
}

function mostrarVazio(visivel) {
    const empty = document.getElementById("agendaEmpty");
    if (empty) empty.style.display = visivel ? "flex" : "none";
}

// ---- TOAST ----

function criarToastContainer() {
    if (document.getElementById("toast-container")) return;
    const container = document.createElement("div");
    container.id = "toast-container";
    document.body.appendChild(container);
}

function mostrarToast(tipo, titulo, mensagem, duracao = 3200) {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const icons = { success: "✓", error: "✗", info: "ℹ" };

    const toast = document.createElement("div");
    toast.className = `toast ${tipo}`;
    toast.innerHTML = `
        <div class="toast-icon">${icons[tipo] || "ℹ"}</div>
        <div class="toast-body">
            <div class="toast-title">${titulo}</div>
            <div class="toast-msg">${mensagem}</div>
        </div>
        <button class="toast-close" onclick="fecharToast(this.parentElement)">×</button>
        <div class="toast-bar" style="animation: toastBar ${duracao}ms linear forwards;"></div>
    `;

    container.appendChild(toast);
    setTimeout(() => fecharToast(toast), duracao);
}

function fecharToast(toast) {
    if (!toast || toast.classList.contains("hide")) return;
    toast.classList.add("hide");
    setTimeout(() => toast.remove(), 300);
}

// ---- INICIALIZAÇÃO ----

document.addEventListener("DOMContentLoaded", inicializar);