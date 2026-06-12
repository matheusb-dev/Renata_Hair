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

document.addEventListener("click", function (e) {
    document.querySelectorAll(".dropdown-custom").forEach(dropdown => {
        if (!dropdown.contains(e.target)) dropdown.classList.remove("active");
    });
});

function selecionarPlano(plano) {
    document.getElementById("plano").value = plano;
    document.getElementById("selected-plano-label").innerText = plano;

    const mensalidade = document.getElementById("dropdown-mensalidade");
    if (plano === "Premium") {
        mensalidade.style.display = "flex";
    } else {
        mensalidade.style.display = "none";
        document.getElementById("tipoMensalidade").value = "";
        document.getElementById("selected-mensalidade-label").innerText = "Tipo de Mensalidade";
    }
    toggleDropdown("dropdown-plano");
}

function selecionarMensalidade(tipo) {
    document.getElementById("tipoMensalidade").value = tipo;
    document.getElementById("selected-mensalidade-label").innerText = tipo;
    toggleDropdown("dropdown-mensalidade");
}

// ─── MÁSCARAS ─────────────────────────────────────────────────────────────────

function configurarMascaras() {
    const cpfInput = document.getElementById("cpf");
    const telefoneInput = document.getElementById("telefone");

    if (cpfInput) {
        cpfInput.addEventListener("input", (e) => {
            let v = e.target.value.replace(/\D/g, "");
            if (v.length > 11) v = v.slice(0, 11);
            v = v.replace(/(\d{3})(\d)/, "$1.$2")
                .replace(/(\d{3})(\d)/, "$1.$2")
                .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
            e.target.value = v;
        });
    }

    if (telefoneInput) {
        telefoneInput.addEventListener("input", (e) => {
            let v = e.target.value.replace(/\D/g, "");
            if (v.length > 11) v = v.slice(0, 11);
            if (v.length > 10) {
                v = v.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
            } else {
                v = v.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3");
            }
            e.target.value = v;
        });
    }
}

// ─── CADASTRAR ───────────────────────────────────────────────────────────────

function salvarCliente() {
    const erroDiv = document.getElementById("erro-cadastro");
    if (erroDiv) erroDiv.style.display = "none";

    const nome = document.getElementById("nome").value.trim();
    const cpf = document.getElementById("cpf").value;
    const telefone = document.getElementById("telefone").value;
    const plano = document.getElementById("plano").value;
    const tipoMensalidade = document.getElementById("tipoMensalidade").value;

    if (!nome || !cpf || !telefone) {
        mostrarErro("Por favor, preencha Nome, CPF e Telefone.");
        return;
    }
    if (plano === "Premium" && !tipoMensalidade) {
        mostrarErro("Selecione o tipo de mensalidade do plano Premium.");
        return;
    }

    const btn = document.getElementById("btnCadastrarForm");
    if (btn) { btn.innerText = "Salvando..."; btn.disabled = true; }

    const payload = {
        Nome: nome,
        Cpf: cpf,
        Telefone: telefone,
        Email: document.getElementById("email").value.trim() || null,
        Endereco: document.getElementById("endereco").value.trim() || null,
        Plano: plano,
        TipoMensalidade: plano === "Premium" ? tipoMensalidade : null
    };

    fetchAutenticado("/api/Clientes", { method: "POST", body: JSON.stringify(payload) })
        .then(() => {
            mostrarToast("success", "Cliente cadastrado!", "Os dados foram salvos com sucesso.");
            limparFormulario();
        })
        .catch(error => mostrarErro(error || "Erro ao cadastrar cliente."))
        .finally(() => {
            if (btn) { btn.innerText = "Cadastrar"; btn.disabled = false; }
        });
}

function limparFormulario() {
    document.querySelectorAll('input[type="text"], input[type="email"]').forEach(i => i.value = "");
    document.getElementById("plano").value = "Nenhum";
    document.getElementById("selected-plano-label").innerText = "Plano";
    document.getElementById("tipoMensalidade").value = "";
    document.getElementById("selected-mensalidade-label").innerText = "Tipo de Mensalidade";
    document.getElementById("dropdown-mensalidade").style.display = "none";
}

// ─── MODAL DE EDIÇÃO ─────────────────────────────────────────────────────────

let clienteEditandoId = null;

async function abrirModalEdicaoCliente() {
    clienteEditandoId = null;
    document.getElementById("modalEditarOverlay").classList.add("aberto");
    document.getElementById("modal-editar-erro").style.display = "none";
    document.getElementById("formEdicaoCliente").style.display = "none";
    document.getElementById("listaSelecionarCliente").style.display = "block"; // garante lista visível
    document.getElementById("listaSelecionarCliente").innerHTML = "<p style='color:#888;text-align:center;padding:20px;'>Carregando...</p>";

    try {
        const response = await fetchAutenticado("/api/Clientes");
        const clientes = await response.json();
        renderizarListaClientes(clientes);
    } catch (e) {
        document.getElementById("listaSelecionarCliente").innerHTML = "<p style='color:red;text-align:center;padding:20px;'>Erro ao carregar clientes.</p>";
    }
}

function renderizarListaClientes(clientes) {
    const lista = document.getElementById("listaSelecionarCliente");

    if (!clientes || clientes.length === 0) {
        lista.innerHTML = "<p style='color:#888;text-align:center;padding:20px;'>Nenhum cliente cadastrado.</p>";
        return;
    }

    lista.innerHTML = clientes.map(c => `
        <div class="item-selecionar" onclick="selecionarClienteParaEditar(${c.id})">
            <span class="item-nome">${c.nome}</span>
            <span class="item-detalhe">${c.cpf} — ${c.plano}</span>
        </div>
    `).join("");
}

async function selecionarClienteParaEditar(id) {
    clienteEditandoId = id;

    try {
        const response = await fetchAutenticado(`/api/Clientes/${id}`);
        const c = await response.json();

        document.getElementById("editNome").value = c.nome || "";
        document.getElementById("editCpf").value = c.cpf || "";
        document.getElementById("editTelefone").value = c.telefone || "";
        document.getElementById("editEmail").value = c.email || "";
        document.getElementById("editEndereco").value = c.endereco || "";

        document.getElementById("editPlano").value = c.plano || "Nenhum";
        document.getElementById("selected-edit-plano-label").innerText = c.plano || "Nenhum";

        const mensalidadeRow = document.getElementById("editMensalidadeRow");
        if (c.plano === "Premium") {
            mensalidadeRow.style.display = "block";
            document.getElementById("editTipoMensalidade").value = c.tipoMensalidade || "";
            document.getElementById("selected-edit-mensalidade-label").innerText = c.tipoMensalidade || "Tipo de Mensalidade";
        } else {
            mensalidadeRow.style.display = "none";
        }

        document.getElementById("listaSelecionarCliente").style.display = "none"; // esconde a lista
        document.getElementById("formEdicaoCliente").style.display = "block";
        document.getElementById("modal-editar-erro").style.display = "none";
    } catch (e) {
        mostrarErroModal("Erro ao carregar dados do cliente.");
    }
}

function selecionarPlanoEdicao(plano) {
    document.getElementById("editPlano").value = plano;
    document.getElementById("selected-edit-plano-label").innerText = plano;
    const mensalidadeRow = document.getElementById("editMensalidadeRow");
    if (plano === "Premium") {
        mensalidadeRow.style.display = "block";
    } else {
        mensalidadeRow.style.display = "none";
        document.getElementById("editTipoMensalidade").value = "";
        document.getElementById("selected-edit-mensalidade-label").innerText = "Tipo de Mensalidade";
    }
    toggleDropdownModal("editDropdownPlano");
}

function selecionarMensalidadeEdicao(tipo) {
    document.getElementById("editTipoMensalidade").value = tipo;
    document.getElementById("selected-edit-mensalidade-label").innerText = tipo;
    toggleDropdownModal("editDropdownMensalidade");
}

function toggleDropdownModal(id) {
    document.getElementById(id).classList.toggle("active");
}

async function salvarEdicaoCliente() {
    if (!clienteEditandoId) return;

    const nome = document.getElementById("editNome").value.trim();
    const cpf = document.getElementById("editCpf").value.trim();
    const telefone = document.getElementById("editTelefone").value.trim();
    const email = document.getElementById("editEmail").value.trim();
    const endereco = document.getElementById("editEndereco").value.trim();
    const plano = document.getElementById("editPlano").value;
    const tipoMensalidade = document.getElementById("editTipoMensalidade").value;

    if (!nome || !cpf || !telefone) {
        mostrarErroModal("Preencha Nome, CPF e Telefone.");
        return;
    }
    if (plano === "Premium" && !tipoMensalidade) {
        mostrarErroModal("Selecione o tipo de mensalidade do plano Premium.");
        return;
    }

    const btn = document.getElementById("btnSalvarEdicao");
    btn.innerText = "Salvando...";
    btn.disabled = true;

    try {
        await fetchAutenticado(`/api/Clientes/${clienteEditandoId}`, {
            method: "PUT",
            body: JSON.stringify({
                Nome: nome,
                Cpf: cpf,
                Telefone: telefone,
                Email: email || null,
                Endereco: endereco || null,
                Plano: plano,
                TipoMensalidade: plano === "Premium" ? tipoMensalidade : null
            })
        });

        mostrarToast("success", "Cliente atualizado!", "As alterações foram salvas com sucesso.");
        fecharModalEdicao();
    } catch (e) {
        mostrarErroModal(e || "Erro ao atualizar cliente.");
    } finally {
        btn.innerText = "Salvar Alterações";
        btn.disabled = false;
    }
}

// ─── MODAL HELPERS ───────────────────────────────────────────────────────────

function fecharModalEdicao() {
    document.getElementById("modalEditarOverlay").classList.remove("aberto");
    document.getElementById("listaSelecionarCliente").style.display = "block"; // mostra lista novamente
    document.getElementById("formEdicaoCliente").style.display = "none";       // esconde formulário
    document.getElementById("modal-editar-erro").style.display = "none";       // limpa erros
    clienteEditandoId = null;
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

// ─── UTILITÁRIOS ─────────────────────────────────────────────────────────────

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
            const erroJson = await response.json().catch(() => ({ message: "Erro interno do servidor" }));
            return Promise.reject(erroJson.message);
        }
        return response;
    });
}

function logout() {
    localStorage.clear();
    window.location.href = "/TelaLogin/login.html";
}

function mostrarErro(mensagem) {
    const erroDiv = document.getElementById("erro-cadastro");
    if (!erroDiv) return;
    erroDiv.innerText = mensagem;
    erroDiv.style.display = "block";
}