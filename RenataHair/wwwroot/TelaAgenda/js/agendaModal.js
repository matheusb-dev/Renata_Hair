// =============================================
//  agendaModal.js — modal de criar/editar agendamento
// =============================================

// Guarda o ID do agendamento sendo editado (null = novo)
let agendamentoEditandoId = null;

// ---- ABRIR / FECHAR ----

/**
 * Abre o modal para criar um novo agendamento.
 * @param {number|null} funcionarioId  - pré-seleciona o funcionário (vem do clique na célula)
 * @param {string|null} horaInicio     - pré-preenche a hora (vem do clique na célula)
 */
function abrirModalNovo(funcionarioId = null, horaInicio = null) {
    agendamentoEditandoId = null;

    document.getElementById("modalTitulo").textContent = "Novo Agendamento";
    limparModal();
    preencherFuncionarios();
    preencherClientes();

    // Pré-preenche data com o dia atual da agenda
    document.getElementById("modalData").value = formatarDataParaAPI(AgendaState.dataAtual);

    // Pré-preenche funcionário e hora se vieram do clique na célula
    if (funcionarioId) {
        document.getElementById("modalFuncionario").value = funcionarioId;
        atualizarServicosDoFuncionario(funcionarioId);
    }

    if (horaInicio) {
        document.getElementById("modalHoraInicio").value = horaInicio;
    }

    document.getElementById("modalOverlay").classList.add("aberto");
}

/**
 * Abre o modal preenchido para editar um agendamento existente.
 * @param {object} agendamento - dados retornados pelo GET /api/Agendamentos/{id}
 */
function abrirModalEdicao(agendamento) {
    agendamentoEditandoId = agendamento.id;

    document.getElementById("modalTitulo").textContent = "Editar Agendamento";
    limparModal();
    preencherFuncionarios();
    preencherClientes();

    // Preenche os campos
    document.getElementById("modalData").value = agendamento.data;
    document.getElementById("modalHoraInicio").value = agendamento.horaInicio;
    document.getElementById("modalFuncionario").value = agendamento.funcionarioId;
    document.getElementById("modalCliente").value = agendamento.clienteId;

    // Carrega serviços do funcionário e marca os já selecionados
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

/**
 * Chamado quando o funcionário é alterado no select do modal.
 * Recarrega a lista de serviços filtrando pelos que o funcionário realiza.
 */
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

/**
 * Aplica min/max no input de hora conforme o turno do funcionário.
 * Funcionários PJ ou sem turno definido ficam sem restrição.
 * Funcionários com múltiplos turnos ficam sem restrição (back-end valida).
 *
 * Turnos (espelhando a validação do back-end):
 *   Manhã → 06:00–11:30
 *   Tarde  → 12:00–17:30
 *   Noite  → 18:00–23:30
 */
function aplicarLimiteTurno(funcionario) {
    const input = document.getElementById("modalHoraInicio");

    if (!funcionario || funcionario.pj) {
        input.min = "";
        input.max = "";
        return;
    }

    // ✅ Suporte a múltiplos turnos — split por vírgula
    const turnos = (funcionario.turno || "")
        .split(",")
        .map(t => t.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));

    const limites = {
        manha: { min: "06:00", max: "11:30" },
        tarde: { min: "12:00", max: "17:30" },
        noite: { min: "18:00", max: "23:30" }
    };

    // Com múltiplos turnos não aplica limite — o back-end valida
    if (turnos.length > 1) {
        input.min = "";
        input.max = "";
        return;
    }

    const limite = limites[turnos[0]];
    if (limite) {
        input.min = limite.min;
        input.max = limite.max;

        // Se o valor atual estiver fora do turno, limpa o campo
        if (input.value && (input.value < limite.min || input.value > limite.max)) {
            input.value = "";
        }
    } else {
        input.min = "";
        input.max = "";
    }
}

/**
 * Filtra os serviços disponíveis para o funcionário selecionado
 * e renderiza os chips de seleção.
 *
 * @param {number} funcionarioId
 * @param {string[]} servicosSelecionados - nomes dos serviços já selecionados (para edição)
 */
function atualizarServicosDoFuncionario(funcionarioId, servicosSelecionados = []) {
    const funcionario = AgendaState.funcionarios.find(f => f.id === funcionarioId);

    if (!funcionario || !funcionario.servicos || funcionario.servicos.length === 0) {
        renderizarServicosVazio("Este funcionário não possui serviços cadastrados");
        return;
    }

    // Cruza os nomes dos serviços do funcionário com os IDs do catálogo completo
    const servicosDoFuncionario = AgendaState.todosServicos.filter(s =>
        funcionario.servicos.includes(s.nome)
    );

    renderizarServicos(servicosDoFuncionario, servicosSelecionados);
    atualizarTotal();
}

/**
 * Renderiza os chips de serviço na lista do modal
 */
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

/**
 * Alterna a seleção de um serviço no modal
 */
function toggleServico(item) {
    const selecionado = item.classList.toggle("selecionado");
    const icone = item.querySelector("i");
    if (icone) icone.style.display = selecionado ? "inline" : "none";
    atualizarTotal();
}

/**
 * Retorna os IDs dos serviços selecionados no modal
 */
function getServicosSelecionadosIds() {
    return Array.from(
        document.querySelectorAll(".servico-check-item.selecionado")
    ).map(item => parseInt(item.dataset.servicoId));
}

/**
 * Atualiza o total estimado somando os preços dos serviços selecionados
 */
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

    // Validações básicas no front
    if (!clienteId) return mostrarErroModal("Selecione o cliente.");
    if (!funcionarioId) return mostrarErroModal("Selecione o funcionário.");
    if (!data) return mostrarErroModal("Informe a data.");
    if (!horaInicio) return mostrarErroModal("Informe a hora de início.");
    if (servicosIds.length === 0) return mostrarErroModal("Selecione pelo menos um serviço.");

    // Valida que o horário é em intervalos de 30 minutos (00 ou 30)
    const [horaNum, minutos] = horaInicio.split(":").map(Number);
    if (minutos !== 0 && minutos !== 30) {
        return mostrarErroModal("O horário deve ser em intervalos de 30 minutos (ex: 09:00 ou 09:30).");
    }

    // ✅ Valida turno do funcionário no front — suporta múltiplos turnos ex: "Tarde, Noite"
    const funcionario = AgendaState.funcionarios.find(f => f.id === funcionarioId);
    if (funcionario && !funcionario.pj) {
        const turnos = (funcionario.turno || "")
            .split(",")
            .map(t => t.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));

        const dentroDoTurno = turnos.some(turno =>
            (turno === "manha" && horaNum >= 6 && horaNum < 12) ||
            (turno === "tarde" && horaNum >= 12 && horaNum < 18) ||
            (turno === "noite" && horaNum >= 18 && horaNum <= 23)
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
            // Edição
            await fetchAutenticado(`/api/Agendamentos/${agendamentoEditandoId}`, {
                method: "PUT",
                body: JSON.stringify(payload)
            });
        } else {
            // Criação
            await fetchAutenticado("/api/Agendamentos", {
                method: "POST",
                body: JSON.stringify(payload)
            });
        }

        fecharModal();

        // Recarrega os cards do dia
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