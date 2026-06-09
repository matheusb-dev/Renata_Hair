// =============================================
//  agendaGrid.js — monta a grade da agenda
// =============================================

const GRID_CONFIG = {
    horaInicio: 7,
    horaFim: 21,
    intervaloMin: 30,
    alturaSlot: 60
};

function montarGrid(funcionarios) {
    const grid = document.getElementById("agendaGrid");
    if (!grid) return;

    grid.innerHTML = "";

    grid.style.gridTemplateColumns = `70px repeat(${funcionarios.length}, minmax(130px, 1fr))`;

    // ---- CABEÇALHO ----
    const headerVazio = document.createElement("div");
    headerVazio.className = "grid-header-vazio";
    grid.appendChild(headerVazio);

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

        const celulaHora = document.createElement("div");
        celulaHora.className = "grid-hora" + (ehHoraCheia ? " hora-cheia" : "");
        celulaHora.textContent = ehHoraCheia ? horaLabel : "";
        grid.appendChild(celulaHora);

        funcionarios.forEach(func => {
            const celula = document.createElement("div");
            const foraDeTurno = !slotDentroDoTurno(horas, func);

            celula.className = "grid-cell"
                + (ehHoraCheia ? " hora-cheia" : " meia-hora")
                + (foraDeTurno ? " fora-turno" : "");

            celula.dataset.funcionarioId = func.id;
            celula.dataset.hora = horaLabel;

            if (!foraDeTurno) {
                celula.addEventListener("click", () => {
                    abrirModalNovo(func.id, horaLabel);
                });
            }

            celula.id = `cell-${func.id}-${horaLabel.replace(":", "")}`;
            grid.appendChild(celula);
        });
    }
}

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

function getCelula(funcionarioId, horaStr) {
    return document.getElementById(`cell-${funcionarioId}-${horaStr.replace(":", "")}`);
}

function horaParaMinutos(horaStr) {
    const [h, m] = horaStr.split(":").map(Number);
    return h * 60 + m;
}

function calcularPosicaoCard(horaInicio, horaFim) {
    const minInicio = horaParaMinutos(horaInicio);
    const minFim = horaParaMinutos(horaFim);
    const minBase = GRID_CONFIG.horaInicio * 60;
    const pxPorMinuto = GRID_CONFIG.alturaSlot / GRID_CONFIG.intervaloMin;

    const top = (minInicio - minBase) * pxPorMinuto;
    const height = (minFim - minInicio) * pxPorMinuto - 4;

    return { top, height };
}