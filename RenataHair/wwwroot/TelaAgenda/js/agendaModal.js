// =============================================
//  agendaModal.js — modal de criar/editar agendamento
// =============================================

let agendamentoEditandoId = null;

// ---- ABRIR / FECHAR ----

function abrirModalNovo(funcionarioId = null, horaInicio = null) {
    agendamentoEditandoId = null;

    document.getElementById("modalTitulo").textContent = "Novo Agendamento";
    limparModal();
    preencherFuncionarios();
    preencherClientes();

    document.getElementById("modalData").value = formatarDataParaAPI(AgendaState.dataAtual);

    if (funcionarioId) {
        document.getElementById("modalFuncionario").value = funcionarioId;
        atualizarServicosDoFuncionario(funcionarioId);
    }

    if (horaInicio) {
        document.getElementById("modalHoraInicio").value = horaInicio;
    }

    document.getElementById("modalOverlay").classList.add("aberto");
}

function abrirModalEdicao(agendamento) {
    agendamentoEditandoId = agendamento.id;

    document.getElementById("modalTitulo").textContent = "Editar Agendamento";
    limparModal();
    preencherFuncionarios();
    preencherClientes();

    document.getElementById("modalData").value = agendamento.data;
    document.getElementById("modalHoraInicio").value = agendamento.horaInicio;
    document.getElementById("modalFuncionario").value = agendamento.funcionarioId;
    document.getElementById("modalCliente").value = agendamento.clienteId;

    atualizarServicosDoFuncionario(agendamento.funcionarioId, agendamento.servicos);

    document.getElementById("modalOverlay").classList.add("aberto");
}

function fecharModal() {
    document.getElementById("modalOverlay").classList.remove("aberto");
    agendamentoEditandoId = null;
}

function fecharModalSeForaDoConteudo(event) {
    if (event.target === document.getElementById("modalOverlay")) {
        fecharModal();
    }
}

// ---- PREENCHIMENTO DOS SELECTS ----

function preencherFuncionarios() {
    const select = document.getElementById("modalFuncionario");
    select.innerHTML = '<option value="">Selecione o funcionário</option>';

    AgendaState.funcionarios.forEach(func => {
        const option = document.createElement("option");
        option.value = func.id;
        option.textContent = func.nome;
        select.appendChild(option);
    });
}

async function preencherClientes() {
    const select = document.getElementById("modalCliente");
    select.innerHTML = '<option value="">Carregando...</option>';

    try {
        const response = await fetchAutenticado("/api/Clientes");
        const clientes = await response.json();

        select.innerHTML = '<option value="">Selecione o cliente</option>';

        clientes.forEach(cliente => {
            const option = document.createElement("option");
            option.value = cliente.id;
            option.textContent = cliente.nome;
            select.appendChild(option);
        });

    } catch (erro) {
        select.innerHTML = '<option value="">Erro ao carregar clientes</option>';
        console.error("Erro ao carregar clientes:", erro);
    }
}

// ---- SERVIÇOS ----

function onFuncionarioChange() {
    const funcionarioId = parseInt(document.getElementById("modalFuncionario").value);

    if (!funcionarioId) {
        renderizarServicosVazio();
        aplicarLimiteTurno(null);
        return;
    }

    const funcionario = AgendaState.funcionarios.find(f => f.id === funcionarioId);
    aplicarLimiteTurno(funcionario);
    atualizarServicosDoFuncionario(funcionarioId);
}

function aplicarLimiteTurno(funcionario) {
    const input = document.getElementById("modalHoraInicio");

    if (!funcionario || funcionario.pj) {
        input.min = "";
        input.max = "";
        return;
    }

    const turnos = (funcionario.turno || "")
        .split(",")
        .map(t => t.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));

    const limites = {
        manha: { min: "06:00", max: "11:30" },
        tarde: { min: "12:00", max: "17:30" },
        noite: { min: "18:00", max: "20:00" } // ✅ limite máximo às 20:00
    };

    if (turnos.length > 1) {
        input.min = "";
        input.max = "";
        return;
    }

    const limite = limites[turnos[0]];
    if (limite) {
        input.min = limite.min;
        input.max = limite.max;

        if (input.value && (input.value < limite.min || input.value > limite.max)) {
            input.value = "";
        }
    } else {
        input.min = "";
        input.max = "";
    }
}

function atualizarServicosDoFuncionario(funcionarioId, servicosSelecionados = []) {
    const funcionario = AgendaState.funcionarios.find(f => f.id === funcionarioId);

    if (!funcionario || !funcionario.servicos || funcionario.servicos.length === 0) {
        renderizarServicosVazio("Este funcionário não possui serviços cadastrados");
        return;
    }

    const servicosDoFuncionario = AgendaState.todosServicos.filter(s =>
        funcionario.servicos.includes(s.nome)
    );

    renderizarServicos(servicosDoFuncionario, servicosSelecionados);
    atualizarTotal();
}

function renderizarServicos(servicos, servicosSelecionados = []) {
    const lista = document.getElementById("servicosLista");
    lista.innerHTML = "";

    servicos.forEach(servico => {
        const jaSelecionado = servicosSelecionados.includes(servico.nome);

        const item = document.createElement("div");
        item.className = "servico-check-item" + (jaSelecionado ? " selecionado" : "");
        item.dataset.servicoId = servico.id;
        item.dataset.servicoPreco = servico.preco;
        item.dataset.servicoNome = servico.nome;

        item.innerHTML = `
            <i class="fa fa-check" style="font-size:11px; display:${jaSelecionado ? "inline" : "none"}"></i>
            ${servico.nome}
        `;

        item.addEventListener("click", () => toggleServico(item));
        lista.appendChild(item);
    });
}

function renderizarServicosVazio(msg = "Selecione um funcionário primeiro") {
    const lista = document.getElementById("servicosLista");
    lista.innerHTML = `<span class="servicos-placeholder">${msg}</span>`;
    atualizarTotal();
}

function toggleServico(item) {
    const selecionado = item.classList.toggle("selecionado");
    const icone = item.querySelector("i");
    if (icone) icone.style.display = selecionado ? "inline" : "none";
    atualizarTotal();
}

function getServicosSelecionadosIds() {
    return Array.from(
        document.querySelectorAll(".servico-check-item.selecionado")
    ).map(item => parseInt(item.dataset.servicoId));
}

function atualizarTotal() {
    const total = Array.from(
        document.querySelectorAll(".servico-check-item.selecionado")
    ).reduce((soma, item) => soma + parseFloat(item.dataset.servicoPreco || 0), 0);

    document.getElementById("modalTotal").textContent =
        total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// ---- SALVAR ----

async function salvarAgendamento() {
    esconderErroModal();

    const clienteId = parseInt(document.getElementById("modalCliente").value);
    const funcionarioId = parseInt(document.getElementById("modalFuncionario").value);
    const data = document.getElementById("modalData").value;
    const horaInicio = document.getElementById("modalHoraInicio").value;
    const servicosIds = getServicosSelecionadosIds();

    if (!clienteId) return mostrarErroModal("Selecione o cliente.");
    if (!funcionarioId) return mostrarErroModal("Selecione o funcionário.");
    if (!data) return mostrarErroModal("Informe a data.");
    if (!horaInicio) return mostrarErroModal("Informe a hora de início.");
    if (servicosIds.length === 0) return mostrarErroModal("Selecione pelo menos um serviço.");

    const [horaNum, minutos] = horaInicio.split(":").map(Number);
    if (minutos !== 0 && minutos !== 30) {
        return mostrarErroModal("O horário deve ser em intervalos de 30 minutos (ex: 09:00 ou 09:30).");
    }

    // ✅ Validação do limite máximo de 20:00
    if (horaNum > 20 || (horaNum === 20 && minutos > 0)) {
        return mostrarErroModal("O horário máximo de agendamento é 20:00.");
    }

    const funcionario = AgendaState.funcionarios.find(f => f.id === funcionarioId);
    if (funcionario && !funcionario.pj) {
        const turnos = (funcionario.turno || "")
            .split(",")
            .map(t => t.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));

        const dentroDoTurno = turnos.some(turno =>
            (turno === "manha" && horaNum >= 6 && horaNum < 12) ||
            (turno === "tarde" && horaNum >= 12 && horaNum < 18) ||
            (turno === "noite" && horaNum >= 18 && horaNum <= 20) // ✅ limite máximo às 20:00
        );

        if (!dentroDoTurno) {
            return mostrarErroModal(
                `Este funcionário só pode ser agendado no(s) turno(s): ${funcionario.turno}.`
            );
        }
    }

    const payload = {
        ClienteId: clienteId,
        FuncionarioId: funcionarioId,
        Data: data,
        HoraInicio: horaInicio,
        ServicosIds: servicosIds
    };

    const btn = document.getElementById("btnSalvarModal");
    btn.disabled = true;
    btn.textContent = "Salvando...";

    try {
        if (agendamentoEditandoId) {
            await fetchAutenticado(`/api/Agendamentos/${agendamentoEditandoId}`, {
                method: "PUT",
                body: JSON.stringify(payload)
            });
            fecharModal();
            mostrarToast("success", "Agendamento atualizado!", "As alterações foram salvas com sucesso.");
        } else {
            await fetchAutenticado("/api/Agendamentos", {
                method: "POST",
                body: JSON.stringify(payload)
            });
            fecharModal();
            mostrarToast("success", "Agendamento criado!", "O agendamento foi salvo com sucesso.");
        }

        const dataStr = formatarDataParaAPI(AgendaState.dataAtual);
        await carregarAgendamentos(dataStr);

    } catch (erro) {
        mostrarErroModal(erro || "Erro ao salvar agendamento.");
    } finally {
        btn.disabled = false;
        btn.textContent = "Salvar";
    }
}

// ---- UTILITÁRIOS DO MODAL ----

function limparModal() {
    document.getElementById("modalCliente").value = "";
    document.getElementById("modalFuncionario").value = "";
    document.getElementById("modalData").value = "";
    document.getElementById("modalHoraInicio").value = "";
    renderizarServicosVazio();
    esconderErroModal();
    atualizarTotal();
}

function mostrarErroModal(mensagem) {
    const erroDiv = document.getElementById("modal-erro");
    erroDiv.textContent = mensagem;
    erroDiv.style.display = "block";
}

function esconderErroModal() {
    const erroDiv = document.getElementById("modal-erro");
    erroDiv.style.display = "none";
    erroDiv.textContent = "";
}