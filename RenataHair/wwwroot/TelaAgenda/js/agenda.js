var API_URL = window.API_URL || "http://localhost:5020";

const calendarColumns = document.querySelector(".calendar-columns");
const funcionarioSelect = document.getElementById("funcionario");
const servicoSelect = document.getElementById("servico");
const timeColumn = document.getElementById("timeColumn");

let dataAtual = new Date();

let funcionarios = [];
let agendamentos = [];
let carregandoAgendamentos = false;

document.addEventListener("DOMContentLoaded", async () => {
    if (typeof verificarAutenticacao === "function") {
        verificarAutenticacao();
    }

    gerarHorarios();
    atualizarDataHeader();
    configurarNavegacaoData();

    await carregarFuncionarios();
    carregarServicos();
    await carregarAgendamentos();
});

function gerarHorarios() {
    if (!timeColumn) return;
    timeColumn.innerHTML = "";

    for (let hora = 8; hora <= 18; hora++) {
        ["00", "30"].forEach(minuto => {
            if (hora === 18 && minuto === "30") return;

            const horario = document.createElement("div");
            horario.classList.add("time-slot");
            horario.innerText = `${String(hora).padStart(2, "0")}:${minuto}`;
            timeColumn.appendChild(horario);
        });
    }
}

function atualizarDataHeader() {
    const dataTexto = document.getElementById("data-atual");
    if (!dataTexto) return;

    const opcoes = {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    };

    const dataFormatada = dataAtual.toLocaleDateString("pt-BR", opcoes);
    dataTexto.innerText = dataFormatada;
}

function configurarNavegacaoData() {
    const btnAnterior = document.getElementById("btnAnterior");
    const btnProximo = document.getElementById("btnProximo");

    if (btnAnterior && !btnAnterior.dataset.hasListener) {
        btnAnterior.dataset.hasListener = "true";
        btnAnterior.addEventListener("click", async () => {
            if (carregandoAgendamentos) return;
            dataAtual.setDate(dataAtual.getDate() - 1);
            atualizarDataHeader();
            await carregarAgendamentos();
        });
    }

    if (btnProximo && !btnProximo.dataset.hasListener) {
        btnProximo.dataset.hasListener = "true";
        btnProximo.addEventListener("click", async () => {
            if (carregandoAgendamentos) return;
            dataAtual.setDate(dataAtual.getDate() + 1);
            atualizarDataHeader();
            await carregarAgendamentos();
        });
    }
}

async function carregarFuncionarios() {
    try {
        if (typeof fetchAutenticado !== "function") return;
        const response = await fetchAutenticado("/api/Funcionarios");

        if (!response || !response.ok) {
            console.error("Erro ao carregar funcionários:", response?.status);
            return;
        }

        funcionarios = await response.json();
        if (!Array.isArray(funcionarios)) funcionarios = [];

        if (funcionarioSelect) {
            funcionarioSelect.innerHTML = `<option value="">Funcionário</option>`;
            funcionarios.forEach(funcionario => {
                if (!funcionario || !funcionario.id) return;
                const option = document.createElement("option");
                option.value = funcionario.id;
                option.textContent = funcionario.nome || "Sem nome";
                funcionarioSelect.appendChild(option);
            });
        }

        renderizarCabecalhoFuncionarios();
        renderizarColunas();

    } catch (error) {
        console.error("Erro ao carregar funcionários:", error);
    }
}

function renderizarCabecalhoFuncionarios() {
    const calendarTop = document.querySelector(".calendar-top");
    if (!calendarTop) return;

    let html = `<div class="time-column-header"></div>`;

    funcionarios.forEach(funcionario => {
        if (!funcionario) return;
        html += `
            <div class="employee-header">
                ${funcionario.nome || "Sem nome"}
            </div>
        `;
    });

    calendarTop.innerHTML = html;
}

function renderizarColunas() {
    if (!calendarColumns) return;
    calendarColumns.innerHTML = "";

    funcionarios.forEach(funcionario => {
        if (!funcionario || !funcionario.id) return;
        const coluna = document.createElement("div");
        coluna.classList.add("employee-column");
        coluna.id = `funcionario-${funcionario.id}`;
        calendarColumns.appendChild(coluna);
    });
}

async function carregarAgendamentos() {
    if (carregandoAgendamentos) return;
    carregandoAgendamentos = true;

    try {
        const data = formatarDataApi(dataAtual);
        if (typeof fetchAutenticado !== "function") return;
        const response = await fetchAutenticado(`/api/Agendamento?data=${data}`);

        if (!response || !response.ok) {
            console.error("Erro ao buscar agendamentos");
            return;
        }

        agendamentos = await response.json();
        if (!Array.isArray(agendamentos)) agendamentos = [];

        renderizarAgendamentos();

    } catch (error) {
        console.error("Erro ao carregar agendamentos:", error);
    } finally {
        carregandoAgendamentos = false;
    }
}

function renderizarAgendamentos() {
    document.querySelectorAll(".appointment-card").forEach(card => card.remove());

    agendamentos.forEach(agendamento => {
        if (!agendamento || !agendamento.funcionarioId || !agendamento.horaInicio || !agendamento.horaFim) return;

        const coluna = document.getElementById(`funcionario-${agendamento.funcionarioId}`);
        if (!coluna) return;

        const card = document.createElement("div");
        card.classList.add("appointment-card", `funcionario-${agendamento.funcionarioId}`);

        const top = calcularPosicaoHorario(agendamento.horaInicio);
        const altura = calcularAlturaCard(agendamento.horaInicio, agendamento.horaFim);

        card.style.top = `${top}px`;
        card.style.height = `${altura}px`;

        card.innerHTML = `
            <span class="appointment-time">
                ${agendamento.horaInicio} - ${agendamento.horaFim}
            </span>
            <h4>${agendamento.cliente || ""}</h4>
            <p>${agendamento.servico || ""}</p>
            <div class="appointment-actions">
                <i class="fa fa-pen" onclick="editarAgendamento(${agendamento.id})"></i>
                <i class="fa fa-trash" onclick="deletarAgendamento(${agendamento.id})"></i>
            </div>
        `;

        coluna.appendChild(card);
    });
}

function calcularPosicaoHorario(horario) {
    if (!horario || typeof horario !== "string" || !horario.includes(":")) return 0;
    const [hora, minuto] = horario.split(":").map(Number);
    const horaInicial = 8;
    const totalMinutos = ((hora - horaInicial) * 60) + (minuto || 0);

    return (totalMinutos / 60) * 80;
}

function calcularAlturaCard(horaInicio, horaFim) {
    if (!horaInicio || !horaFim || typeof horaInicio !== "string" || typeof horaFim !== "string") return 40;
    const [horaI, minutoI] = horaInicio.split(":").map(Number);
    const [horaF, minutoF] = horaFim.split(":").map(Number);

    const inicio = (horaI * 60) + (minutoI || 0);
    const fim = (horaF * 60) + (minutoF || 0);
    const duracao = fim - inicio;

    return duracao > 0 ? (duracao / 60) * 80 : 40;
}

async function agendar() {
    const elCliente = document.getElementById("cliente");
    const elTelefone = document.getElementById("telefone");
    const elFuncionario = document.getElementById("funcionario");
    const elServico = document.getElementById("servico");
    const elData = document.getElementById("data");
    const elHora = document.getElementById("hora");
    const elTotal = document.getElementById("total");

    if (!elCliente || !elTelefone || !elFuncionario || !elServico || !elData || !elHora) return;

    const cliente = elCliente.value;
    const telefone = elTelefone.value;
    const funcionarioId = elFuncionario.value;
    const servicoId = elServico.value;
    const data = elData.value;
    const hora = elHora.value;
    const total = elTotal ? elTotal.value : "";

    if (!cliente || !telefone || !funcionarioId || !servicoId || !data || !hora) {
        alert("Preencha todos os campos");
        return;
    }

    try {
        if (typeof fetchAutenticado !== "function") return;
        const response = await fetchAutenticado("/api/Agendamento", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                cliente,
                telefone,
                funcionarioId,
                servicoId,
                data,
                hora,
                total
            })
        });

        if (!response || !response.ok) throw new Error();

        limparFormulario();
        await carregarAgendamentos();

    } catch (error) {
        console.error(error);
        alert("Erro ao agendar");
    }
}

async function deletarAgendamento(id) {
    if (!id) return;
    const confirmar = confirm("Deseja excluir o agendamento?");
    if (!confirmar) return;

    try {
        if (typeof fetchAutenticado !== "function") return;
        const response = await fetchAutenticado(`/api/Agendamento/${id}`, {
            method: "DELETE"
        });

        if (!response || !response.ok) throw new Error();

        await carregarAgendamentos();

    } catch (error) {
        console.error(error);
        alert("Erro ao excluir");
    }
}

function editarAgendamento(id) {
    alert("Editar agendamento: " + id);
}

function limparFormulario() {
    const campos = ["cliente", "telefone", "funcionario", "servico", "data", "hora", "total"];
    campos.forEach(id => {
        const elemento = document.getElementById(id);
        if (elemento) elemento.value = "";
    });
}

function formatarDataApi(data) {
    if (!(data instanceof Date) || isNaN(data)) data = new Date();
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const dia = String(data.getDate()).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
}

async function carregarServicos() {
    try {
        if (typeof fetchAutenticado !== "function") return;
        const response = await fetchAutenticado("/api/Servicos");

        if (!response || !response.ok) {
            console.error("Erro ao carregar serviços:", response?.status);
            return;
        }

        const servicos = await response.json();
        if (!Array.isArray(servicos)) return;

        if (servicoSelect) {
            servicoSelect.innerHTML = `<option value="">Serviço</option>`;
            servicos.forEach(servico => {
                if (!servico || !servico.id) return;
                const option = document.createElement("option");
                option.value = servico.id;
                option.textContent = servico.nome || "Sem nome";
                servicoSelect.appendChild(option);
            });
        }

    } catch (error) {
        console.error("Erro ao carregar serviços:", error);
    }
}