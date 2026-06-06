// =============================================
//  agenda.js — inicialização e controle de data
// =============================================

const API_URL = "";

// Estado global da agenda
const AgendaState = {
    dataAtual: new Date(),
    funcionarios: [],   // lista completa com serviços
    todosServicos: []   // lista completa de serviços com IDs
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
    // Retorna YYYY-MM-DD
    const ano = date.getFullYear();
    const mes = String(date.getMonth() + 1).padStart(2, "0");
    const dia = String(date.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
}

function formatarDataParaLabel(date) {
    // Retorna "26/03/2026 Quinta-feira"
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
    // valor vem como "YYYY-MM-DD" do input date
    const [ano, mes, dia] = valor.split("-").map(Number);
    AgendaState.dataAtual = new Date(ano, mes - 1, dia);
    atualizarAgenda();
}

function atualizarLabelData() {
    const label = document.getElementById("labelData");
    const inputData = document.getElementById("inputData");

    if (label) {
        label.textContent = formatarDataParaLabel(AgendaState.dataAtual);
    }

    if (inputData) {
        inputData.value = formatarDataParaAPI(AgendaState.dataAtual);
    }
}

// ---- FLUXO PRINCIPAL ----

async function atualizarAgenda() {
    atualizarLabelData();
    const dataStr = formatarDataParaAPI(AgendaState.dataAtual);
    await carregarAgendamentos(dataStr);
}

async function inicializar() {
    verificarAutenticacao();
    atualizarLabelData();

    mostrarLoading(true);

    try {
        // Carrega funcionários e serviços em paralelo
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

        // Monta a grade com os funcionários
        montarGrid(funcionarios);

        // Carrega os agendamentos do dia atual
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

// ---- INICIALIZAÇÃO ----

document.addEventListener("DOMContentLoaded", inicializar);