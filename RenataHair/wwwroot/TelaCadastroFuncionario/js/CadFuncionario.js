console.log("CADFUNCIONARIO JS CARREGADO");

const API_URL = "";

function getToken() {
    return localStorage.getItem("token");
}

function verificarAutenticacao() {
    if (!getToken()) {
        window.location.href = "/TelaLogin/login.html";
    }
}

document.addEventListener("DOMContentLoaded", () => {
    verificarAutenticacao();
    configurarMascaras();
    configurarListenersTurno();
    carregarServicos();
    criarToastContainer();
});

// ─── TOAST ────────────────────────────────────────────────────────────────────

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

// ─── DROPDOWN ────────────────────────────────────────────────────────────────

function toggleDropdown(id) {
    const dropdown = document.getElementById(id);
    if (dropdown) dropdown.classList.toggle("active");
}

function selecionarOpcao(dropdownId, labelId, texto, valor) {
    document.getElementById(labelId).innerText = texto;
    const hidden = document.querySelector(`#${dropdownId} input[type='hidden']`);
    if (hidden) hidden.value = valor;
    document.getElementById(dropdownId).classList.remove("active");
}

document.addEventListener("click", function (e) {
    document.querySelectorAll(".dropdown-custom").forEach(dropdown => {
        if (!dropdown.contains(e.target)) dropdown.classList.remove("active");
    });
});

// ─── SERVIÇOS ─────────────────────────────────────────────────────────────────

function configurarDropdownServicos() {
    const dropdown = document.querySelector("#dropdown-servicos");
    if (!dropdown) return;

    const checkboxes = dropdown.querySelectorAll('.dropdown-content input[type="checkbox"]');
    const label = document.getElementById("selected-services-label");

    checkboxes.forEach(checkbox => {
        checkbox.addEventListener("change", () => {
            const selecionados = Array.from(checkboxes)
                .filter(i => i.checked)
                .map(i => i.getAttribute("data-name") || i.value);

            if (selecionados.length === 0) label.innerText = "Serviços";
            else if (selecionados.length <= 2) label.innerText = selecionados.join(", ");
            else label.innerText = `${selecionados.length} Selecionados`;
        });
    });
}

async function carregarServicos() {
    try {
        const response = await fetchAutenticado("/api/Servicos");
        const servicos = await response.json();
        const container = document.getElementById("servicos-container");

        if (!container) return;
        container.innerHTML = "";

        if (!servicos || servicos.length === 0) {
            container.innerHTML = "<label>Nenhum serviço cadastrado</label>";
            return;
        }

        servicos.forEach(servico => {
            const label = document.createElement("label");
            label.innerHTML = `
                <input type="checkbox" value="${servico.id}" data-name="${servico.nome}">
                ${servico.nome}
            `;
            container.appendChild(label);
        });

        configurarDropdownServicos();
    } catch (erro) {
        mostrarErro("Não foi possível carregar os serviços.");
    }
}

// ─── TURNO ────────────────────────────────────────────────────────────────────

function configurarListenersTurno() {
    const checkboxes = document.querySelectorAll(".turno-check");
    const label = document.getElementById("selected-turno-label");

    checkboxes.forEach(cb => {
        cb.addEventListener("change", () => {
            const selecionados = Array.from(checkboxes).filter(i => i.checked).map(i => i.value);
            if (selecionados.length > 2) { cb.checked = false; return; }
            label.innerText = selecionados.length > 0 ? selecionados.join(", ") : "Turno";
        });
    });
}

// ─── MÁSCARAS ─────────────────────────────────────────────────────────────────

function configurarMascaras() {
    const cpfInput = document.getElementById("cpf");
    const telefoneInput = document.getElementById("telefone");

    if (cpfInput) {
        cpfInput.addEventListener("input", e => {
            let v = e.target.value.replace(/\D/g, "");
            if (v.length > 11) v = v.slice(0, 11);
            v = v.replace(/(\d{3})(\d)/, "$1.$2")
                .replace(/(\d{3})(\d)/, "$1.$2")
                .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
            e.target.value = v;
        });
    }

    if (telefoneInput) {
        telefoneInput.addEventListener("input", e => {
            let v = e.target.value.replace(/\D/g, "");
            if (v.length > 11) v = v.slice(0, 11);
            if (v.length > 10) v = v.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
            else v = v.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3");
            e.target.value = v;
        });
    }
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function obterServicosIdsSelecionados() {
    return Array.from(document.querySelectorAll('#dropdown-servicos input[type="checkbox"]:checked'))
        .map(i => parseInt(i.value))
        .filter(i => !isNaN(i));
}

function obterTurnosSelecionados() {
    return Array.from(document.querySelectorAll(".turno-check:checked"))
        .map(i => i.value)
        .join(", ");
}

function mostrarErro(mensagem) {
    const erroDiv = document.getElementById("erro-cadastro");
    if (!erroDiv) return;
    erroDiv.innerText = mensagem;
    erroDiv.style.display = "block";
}

function fetchAutenticado(url, options = {}) {
    const token = getToken();
    return fetch(API_URL + url, {
        ...options,
        headers: {
            "Authorization": "Bearer " + token,
            "Content-Type": "application/json"
        }
    }).then(async response => {
        if (response.status === 401) window.location.href = "/TelaLogin/login.html";
        if (!response.ok) {
            const erro = await response.json();
            throw erro.message;
        }
        return response;
    });
}

function logout() {
    localStorage.clear();
    window.location.href = "/TelaLogin/login.html";
}

// ─── CADASTRAR ───────────────────────────────────────────────────────────────

async function salvarFuncionario() {
    const nome = document.getElementById("nome").value.trim();
    const endereco = document.getElementById("endereco").value.trim();
    const email = document.getElementById("email").value.trim();
    const cpf = document.getElementById("cpf").value.trim();
    const telefone = document.getElementById("telefone").value.trim();
    const horas = document.getElementById("horas").value;
    const pj = document.getElementById("pj").value === "true";
    const cadastrarComoCliente = document.getElementById("cliente-checkbox").checked;
    const servicosIds = obterServicosIdsSelecionados();
    const turno = obterTurnosSelecionados();

    if (!nome || !cpf || !telefone || !horas || !turno || servicosIds.length === 0) {
        mostrarErro("Preencha todos os campos obrigatórios e selecione ao menos um serviço e um turno.");
        return;
    }

    const body = { nome, endereco, email, cpf, telefone, turno, horasMensais: parseInt(horas), pj, servicosIds, cadastrarComoCliente };

    try {
        await fetchAutenticado("/api/Funcionarios", { method: "POST", body: JSON.stringify(body) });

        mostrarToast("success", "Funcionário cadastrado!", "Os dados foram salvos com sucesso.");

        ["nome", "endereco", "email", "cpf", "telefone", "horas"].forEach(id => document.getElementById(id).value = "");
        document.getElementById("selected-services-label").innerText = "Serviços";
        document.getElementById("selected-turno-label").innerText = "Turno";
        document.getElementById("selected-pj-label").innerText = "Pessoa Física";
        document.getElementById("pj").value = "false";
        document.getElementById("cliente-checkbox").checked = false;
        document.querySelectorAll(".turno-check").forEach(cb => cb.checked = false);
        document.querySelectorAll('#dropdown-servicos input[type="checkbox"]').forEach(cb => cb.checked = false);
        document.getElementById("erro-cadastro").style.display = "none";
    } catch (erro) {
        mostrarErro(typeof erro === "string" ? erro : "Erro ao cadastrar funcionário.");
    }
}

// ─── MODAL DE EDIÇÃO ─────────────────────────────────────────────────────────

let funcionarioEditandoId = null;
let todosServicosDisponiveis = [];

async function abrirModalEdicaoFuncionario() {
    funcionarioEditandoId = null;
    document.getElementById("modalEditarOverlay").classList.add("aberto");
    document.getElementById("modal-editar-erro").style.display = "none";
    document.getElementById("formEdicaoFuncionario").style.display = "none";
    document.getElementById("listaSelecionarFuncionario").style.display = "block"; // garante lista visível
    document.getElementById("listaSelecionarFuncionario").innerHTML = "<p style='color:#888;text-align:center;padding:20px;'>Carregando...</p>";

    try {
        const [resFuncs, resServs] = await Promise.all([
            fetchAutenticado("/api/Funcionarios/todos"),
            fetchAutenticado("/api/Servicos")
        ]);
        const funcionarios = await resFuncs.json();
        todosServicosDisponiveis = await resServs.json();
        renderizarListaFuncionarios(funcionarios);
    } catch (e) {
        document.getElementById("listaSelecionarFuncionario").innerHTML = "<p style='color:red;text-align:center;padding:20px;'>Erro ao carregar funcionários.</p>";
    }
}

function renderizarListaFuncionarios(funcionarios) {
    const lista = document.getElementById("listaSelecionarFuncionario");

    if (!funcionarios || funcionarios.length === 0) {
        lista.innerHTML = "<p style='color:#888;text-align:center;padding:20px;'>Nenhum funcionário cadastrado.</p>";
        return;
    }

    lista.innerHTML = funcionarios.map(f => `
        <div class="item-selecionar" onclick="selecionarFuncionarioParaEditar(${f.id})">
            <span class="item-nome">${f.nome}</span>
            <span class="item-detalhe">${f.turno} — ${f.pj ? "PJ" : "CLT"}</span>
        </div>
    `).join("");
}

async function selecionarFuncionarioParaEditar(id) {
    funcionarioEditandoId = id;

    try {
        const response = await fetchAutenticado(`/api/Funcionarios/${id}`);
        const f = await response.json();

        document.getElementById("editNome").value = f.nome || "";
        document.getElementById("editEndereco").value = f.endereco || "";
        document.getElementById("editEmail").value = f.email || "";
        document.getElementById("editCpf").value = f.cpf || "";
        document.getElementById("editTelefone").value = f.telefone || "";
        document.getElementById("editHoras").value = f.horasMensais || "";

        const pjVal = f.pj ? "true" : "false";
        document.getElementById("editPj").value = pjVal;
        document.getElementById("selected-edit-pj-label").innerText = f.pj ? "Pessoa Jurídica" : "Pessoa Física";

        const turnosAtivos = (f.turno || "").split(",").map(t => t.trim());
        document.querySelectorAll(".turno-check-edit").forEach(cb => {
            cb.checked = turnosAtivos.includes(cb.value);
        });
        atualizarLabelTurnoEdicao();

        renderizarServicosEdicao(f.servicos || []);

        document.getElementById("listaSelecionarFuncionario").style.display = "none"; // esconde a lista
        document.getElementById("formEdicaoFuncionario").style.display = "block";
        document.getElementById("modal-editar-erro").style.display = "none";
    } catch (e) {
        mostrarErroModal("Erro ao carregar dados do funcionário.");
    }
}

function renderizarServicosEdicao(servicosSelecionados) {
    const container = document.getElementById("editServicosContainer");
    container.innerHTML = "";

    todosServicosDisponiveis.forEach(servico => {
        const ativo = servicosSelecionados.includes(servico.nome);
        const label = document.createElement("label");
        label.innerHTML = `
            <input type="checkbox" class="servico-check-edit" value="${servico.id}" data-name="${servico.nome}" ${ativo ? "checked" : ""}>
            ${servico.nome}
        `;
        container.appendChild(label);
    });

    atualizarLabelServicosEdicao();
    container.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.addEventListener("change", atualizarLabelServicosEdicao);
    });
}

function atualizarLabelServicosEdicao() {
    const checkboxes = document.querySelectorAll(".servico-check-edit");
    const selecionados = Array.from(checkboxes).filter(i => i.checked).map(i => i.getAttribute("data-name") || i.value);
    const label = document.getElementById("selected-edit-services-label");
    if (selecionados.length === 0) label.innerText = "Serviços";
    else if (selecionados.length <= 2) label.innerText = selecionados.join(", ");
    else label.innerText = `${selecionados.length} Selecionados`;
}

function atualizarLabelTurnoEdicao() {
    const checkboxes = document.querySelectorAll(".turno-check-edit");
    const selecionados = Array.from(checkboxes).filter(i => i.checked).map(i => i.value);
    document.getElementById("selected-edit-turno-label").innerText = selecionados.length > 0 ? selecionados.join(", ") : "Turno";
}

document.addEventListener("change", function (e) {
    if (e.target.classList.contains("turno-check-edit")) {
        const checkboxes = document.querySelectorAll(".turno-check-edit");
        const selecionados = Array.from(checkboxes).filter(i => i.checked);
        if (selecionados.length > 2) { e.target.checked = false; return; }
        atualizarLabelTurnoEdicao();
    }
});

async function salvarEdicaoFuncionario() {
    if (!funcionarioEditandoId) return;

    const nome = document.getElementById("editNome").value.trim();
    const endereco = document.getElementById("editEndereco").value.trim();
    const email = document.getElementById("editEmail").value.trim();
    const cpf = document.getElementById("editCpf").value.trim();
    const telefone = document.getElementById("editTelefone").value.trim();
    const horas = document.getElementById("editHoras").value;
    const pj = document.getElementById("editPj").value === "true";

    const turnosSelecionados = Array.from(document.querySelectorAll(".turno-check-edit:checked")).map(i => i.value).join(", ");
    const servicosIds = Array.from(document.querySelectorAll(".servico-check-edit:checked")).map(i => parseInt(i.value)).filter(i => !isNaN(i));

    if (!nome || !cpf || !telefone || !horas || !turnosSelecionados || servicosIds.length === 0) {
        mostrarErroModal("Preencha todos os campos e selecione ao menos um serviço e um turno.");
        return;
    }

    const btn = document.getElementById("btnSalvarEdicao");
    btn.innerText = "Salvando...";
    btn.disabled = true;

    try {
        await fetchAutenticado(`/api/Funcionarios/${funcionarioEditandoId}`, {
            method: "PUT",
            body: JSON.stringify({
                nome, endereco, email, cpf, telefone,
                turno: turnosSelecionados,
                horasMensais: parseInt(horas),
                pj,
                servicosIds,
                cadastrarComoCliente: false
            })
        });

        mostrarToast("success", "Funcionário atualizado!", "As alterações foram salvas com sucesso.");
        fecharModalEdicao();
    } catch (e) {
        mostrarErroModal(e || "Erro ao atualizar funcionário.");
    } finally {
        btn.innerText = "Salvar Alterações";
        btn.disabled = false;
    }
}

// ─── MODAL HELPERS ───────────────────────────────────────────────────────────

function fecharModalEdicao() {
    document.getElementById("modalEditarOverlay").classList.remove("aberto");
    document.getElementById("listaSelecionarFuncionario").style.display = "block"; 
    document.getElementById("formEdicaoFuncionario").style.display = "none";       
    document.getElementById("modal-editar-erro").style.display = "none";           
    funcionarioEditandoId = null;
}

function fecharModalSeForaDoConteudo(event) {
    if (event.target === document.getElementById("modalEditarOverlay")) {
        fecharModalEdicao();
    }
}

function mostrarErroModal(mensagem) {
    const erroDiv = document.getElementById("modal-editar-erro");
    erroDiv.innerText = mensagem;
    erroDiv.style.display = "block";
}

function toggleDropdownModal(id) {
    document.getElementById(id).classList.toggle("active");
}

function selecionarOpcaoModal(dropdownId, labelId, texto, valor, hiddenId) {
    document.getElementById(labelId).innerText = texto;
    document.getElementById(hiddenId).value = valor;
    document.getElementById(dropdownId).classList.remove("active");
}