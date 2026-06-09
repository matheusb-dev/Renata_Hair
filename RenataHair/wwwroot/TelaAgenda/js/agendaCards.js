// =============================================
//  agendaCards.js — busca e renderiza os cards
// =============================================

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

function limparCards() {
    document.querySelectorAll(".agendamento-card").forEach(card => card.remove());
}

function renderizarCard(agendamento) {
    const celulaAncora = getCelula(agendamento.funcionarioId, agendamento.horaInicio);

    if (!celulaAncora) return;

    const { top, height } = calcularPosicaoCard(
        agendamento.horaInicio,
        agendamento.horaFim
    );

    const card = document.createElement("div");
    card.className = "agendamento-card";
    card.dataset.id = agendamento.id;

    card.style.top = "2px";
    card.style.height = `${height}px`;

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

async function editarAgendamento(id, event) {
    event.stopPropagation();

    try {
        const response = await fetchAutenticado(`/api/Agendamentos/${id}`);
        const agendamento = await response.json();
        abrirModalEdicao(agendamento);
    } catch (erro) {
        mostrarToast("error", "Erro ao carregar", erro || "Não foi possível buscar o agendamento.");
    }
}

function excluirAgendamento(id, event) {
    event.stopPropagation();
    abrirModalConfirmacao(id);
}

// ---- MODAL DE CONFIRMAÇÃO ----

function abrirModalConfirmacao(id) {
    let overlay = document.getElementById("modalConfirmOverlay");

    if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "modalConfirmOverlay";
        overlay.className = "modal-confirm-overlay";
        overlay.innerHTML = `
            <div class="modal-confirm-box">
                <div class="modal-confirm-header">
                    <div class="modal-confirm-icon">
                        <i class="fa fa-trash"></i>
                    </div>
                    <h3>Excluir agendamento</h3>
                </div>
                <div class="modal-confirm-body">
                    <p>Tem certeza que deseja excluir este agendamento? Esta ação não poderá ser desfeita.</p>
                </div>
                <div class="modal-confirm-footer">
                    <button class="btn-confirm-cancelar" onclick="fecharModalConfirmacao()">Cancelar</button>
                    <button class="btn-confirm-excluir" id="btnConfirmExcluir">Sim, excluir</button>
                </div>
            </div>
        `;
        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) fecharModalConfirmacao();
        });
        document.body.appendChild(overlay);
    }

    document.getElementById("btnConfirmExcluir").onclick = () => confirmarExclusao(id);
    overlay.classList.add("aberto");
}

function fecharModalConfirmacao() {
    const overlay = document.getElementById("modalConfirmOverlay");
    if (overlay) overlay.classList.remove("aberto");
}

async function confirmarExclusao(id) {
    const btn = document.getElementById("btnConfirmExcluir");
    btn.disabled = true;
    btn.textContent = "Excluindo...";

    try {
        await fetchAutenticado(`/api/Agendamentos/${id}`, {
            method: "DELETE"
        });

        fecharModalConfirmacao();
        mostrarToast("success", "Agendamento excluído!", "O agendamento foi removido com sucesso.");

        const dataStr = formatarDataParaAPI(AgendaState.dataAtual);
        await carregarAgendamentos(dataStr);

    } catch (erro) {
        fecharModalConfirmacao();
        mostrarToast("error", "Erro ao excluir", erro || "Não foi possível excluir o agendamento.");
    } finally {
        btn.disabled = false;
        btn.textContent = "Sim, excluir";
    }
}