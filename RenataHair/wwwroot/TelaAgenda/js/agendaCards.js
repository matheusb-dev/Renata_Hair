// =============================================
//  agendaCards.js — busca e renderiza os cards
// =============================================

/**
 * Busca os agendamentos do dia e renderiza os cards na grade
 */
async function carregarAgendamentos(dataStr) {
    mostrarLoading(true);
    limparCards();

    try {
        const response = await fetchAutenticado(`/api/Agendamentos?data=${dataStr}`);
        const agendamentos = await response.json();

        mostrarLoading(false);

        agendamentos.forEach(ag => renderizarCard(ag));

    } catch (erro) {
        console.error("Erro ao carregar agendamentos:", erro);
        mostrarLoading(false);
    }
}

/**
 * Remove todos os cards existentes da grade
 * (sem destruir a estrutura da grade)
 */
function limparCards() {
    document.querySelectorAll(".agendamento-card").forEach(card => card.remove());
}

/**
 * Renderiza um card de agendamento na célula correta da grade
 *
 * O card é posicionado de forma absoluta dentro da coluna do funcionário,
 * usando top e height calculados a partir da hora início/fim.
 */
function renderizarCard(agendamento) {
    // Encontra a célula âncora (primeira célula do funcionário neste horário)
    const celulaAncora = getCelula(agendamento.funcionarioId, agendamento.horaInicio);

    if (!celulaAncora) {
        // Agendamento fora do intervalo visível da grade
        return;
    }

    const { top, height } = calcularPosicaoCard(
        agendamento.horaInicio,
        agendamento.horaFim
    );

    // Cria o card
    const card = document.createElement("div");
    card.className = "agendamento-card";
    card.dataset.id = agendamento.id;

    // Posiciona relativo à coluna inteira do funcionário
    // O card é inserido na célula de início mas usa position absolute
    // para se estender pelos slots seguintes
    card.style.top = "2px";
    card.style.height = `${height}px`;

    // Conteúdo do card
    const servicosTexto = agendamento.servicos.join(", ");

    card.innerHTML = `
        <div class="card-horario">${agendamento.horaInicio}–${agendamento.horaFim}</div>
        <div class="card-cliente">${agendamento.cliente}</div>
        <div class="card-servicos">${servicosTexto}</div>
        <div class="card-acoes">
            <button class="card-btn" title="Editar" onclick="editarAgendamento(${agendamento.id}, event)">
                <i class="fa fa-pen"></i>
            </button>
            <button class="card-btn" title="Excluir" onclick="excluirAgendamento(${agendamento.id}, event)">
                <i class="fa fa-trash"></i>
            </button>
        </div>
    `;

    celulaAncora.appendChild(card);
}

/**
 * Abre o modal preenchido com os dados do agendamento para edição
 */
async function editarAgendamento(id, event) {
    // Impede que o clique propague para a célula (que abriria modal de novo)
    event.stopPropagation();

    try {
        const response = await fetchAutenticado(`/api/Agendamentos/${id}`);
        const agendamento = await response.json();
        abrirModalEdicao(agendamento);
    } catch (erro) {
        alert("Erro ao buscar agendamento: " + erro);
    }
}

/**
 * Exclui um agendamento após confirmação
 */
async function excluirAgendamento(id, event) {
    event.stopPropagation();

    if (!confirm("Deseja excluir este agendamento?")) return;

    try {
        await fetchAutenticado(`/api/Agendamentos/${id}`, {
            method: "DELETE"
        });

        // Recarrega os cards do dia atual
        const dataStr = formatarDataParaAPI(AgendaState.dataAtual);
        await carregarAgendamentos(dataStr);

    } catch (erro) {
        alert("Erro ao excluir agendamento: " + erro);
    }
}