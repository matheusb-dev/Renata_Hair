// =============================================
//  agendaGrid.js — monta a grade da agenda
// =============================================

// Configurações da grade
const GRID_CONFIG = {
    horaInicio: 7,      // 07:00
    horaFim: 21,        // 21:00
    intervaloMin: 30,   // slots de 30 em 30 minutos
    alturaSlot: 60      // px por slot
};

/**
 * Monta toda a estrutura da grade:
 * - Coluna de horários (esquerda)
 * - Colunas de funcionários
 * - Células clicáveis
 */
function montarGrid(funcionarios) {
    const grid = document.getElementById("agendaGrid");
    if (!grid) return;

    grid.innerHTML = "";

    const totalColunas = 1 + funcionarios.length; // 1 coluna hora + N funcionários
    grid.style.gridTemplateColumns = `70px repeat(${funcionarios.length}, minmax(130px, 1fr))`;

    // ---- LINHA DO CABEÇALHO ----
    // Célula vazia no topo esquerdo
    const headerVazio = document.createElement("div");
    headerVazio.className = "grid-header-vazio";
    grid.appendChild(headerVazio);

    // Cabeçalho de cada funcionário
    funcionarios.forEach(func => {
        const header = document.createElement("div");
        header.className = "grid-header-funcionario";
        header.textContent = func.nome;
        header.title = func.nome;
        grid.appendChild(header);
    });

    // ---- LINHAS DE HORÁRIO ----
    const totalMinutos = (GRID_CONFIG.horaFim - GRID_CONFIG.horaInicio) * 60;
    const totalSlots = totalMinutos / GRID_CONFIG.intervaloMin;

    for (let i = 0; i < totalSlots; i++) {
        const minutosTotais = GRID_CONFIG.horaInicio * 60 + i * GRID_CONFIG.intervaloMin;
        const horas = Math.floor(minutosTotais / 60);
        const minutos = minutosTotais % 60;
        const horaLabel = `${String(horas).padStart(2, "0")}:${String(minutos).padStart(2, "0")}`;
        const ehHoraCheia = minutos === 0;

        // Célula da hora (coluna esquerda)
        const celulaHora = document.createElement("div");
        celulaHora.className = "grid-hora" + (ehHoraCheia ? " hora-cheia" : "");
        celulaHora.textContent = ehHoraCheia ? horaLabel : "";
        grid.appendChild(celulaHora);

        // Células de cada funcionário neste slot
        funcionarios.forEach(func => {
            const celula = document.createElement("div");
            const foraDeTurno = !slotDentroDoTurno(horas, func);

            celula.className = "grid-cell"
                + (ehHoraCheia ? " hora-cheia" : " meia-hora")
                + (foraDeTurno ? " fora-turno" : "");

            celula.dataset.funcionarioId = func.id;
            celula.dataset.hora = horaLabel;

            // Só permite clicar em slots dentro do turno do funcionário
            if (!foraDeTurno) {
                celula.addEventListener("click", () => {
                    abrirModalNovo(func.id, horaLabel);
                });
            }

            // ID único para posicionar os cards depois
            celula.id = `cell-${func.id}-${horaLabel.replace(":", "")}`;

            grid.appendChild(celula);
        });
    }
}

/**
 * Retorna true se o slot de hora está dentro do turno do funcionário.
 * Funcionários PJ não têm restrição.
 *
 * Turnos (espelhando a validação do back-end):
 *   Manhã → 06:00–11:59
 *   Tarde  → 12:00–17:59
 *   Noite  → 18:00–23:59
 */
function slotDentroDoTurno(hora, funcionario) {
    if (funcionario.pj) return true;

    const turno = (funcionario.turno || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    switch (turno) {
        case "manha": return hora >= 6 && hora < 12;
        case "tarde": return hora >= 12 && hora < 18;
        case "noite": return hora >= 18 && hora <= 23;
        default: return true;
    }
}

/**
 * Retorna o elemento de célula para um funcionário + horário específico
 */
function getCelula(funcionarioId, horaStr) {
    return document.getElementById(`cell-${funcionarioId}-${horaStr.replace(":", "")}`);
}

/**
 * Converte hora "HH:MM" em número de minutos desde meia-noite
 */
function horaParaMinutos(horaStr) {
    const [h, m] = horaStr.split(":").map(Number);
    return h * 60 + m;
}

/**
 * Calcula a posição e altura de um card dentro da grade
 * Retorna { top, height } em px
 */
function calcularPosicaoCard(horaInicio, horaFim) {
    const minInicio = horaParaMinutos(horaInicio);
    const minFim = horaParaMinutos(horaFim);
    const minBase = GRID_CONFIG.horaInicio * 60;
    const pxPorMinuto = GRID_CONFIG.alturaSlot / GRID_CONFIG.intervaloMin;

    const top = (minInicio - minBase) * pxPorMinuto;
    const height = (minFim - minInicio) * pxPorMinuto - 4; // -4px de margem

    return { top, height };
}