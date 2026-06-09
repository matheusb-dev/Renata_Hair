const API_URL = "";

function getToken() {
    return localStorage.getItem("token");
}

function verificarAutenticacao() {
    if (!getToken()) window.location.href = "../TelaLogin/login.html";
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

// ─── MÁSCARAS ─────────────────────────────────────────────────────────────────

function configurarMascaras() {
    const precoInput = document.getElementById("preco");
    const tempoInput = document.getElementById("tempo");

    precoInput.addEventListener("input", (e) => {
        let v = e.target.value.replace(/\D/g, "");
        v = (v / 100).toFixed(2).replace(".", ",");
        v = v.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
        e.target.value = "R$ " + v;
    });

    tempoInput.addEventListener("input", (e) => {
        e.target.value = e.target.value.replace(/\D/g, "");
    });
}

function aplicarMascaraPreco(input, valor) {
    const cents = Math.round(valor * 100);
    let v = String(cents).padStart(3, "0");
    v = (parseInt(v) / 100).toFixed(2).replace(".", ",");
    v = v.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
    input.value = "R$ " + v;
}

// ─── CADASTRAR ───────────────────────────────────────────────────────────────

function salvarServico() {
    const erroDiv = document.getElementById("erro-cadastro");
    if (erroDiv) erroDiv.style.display = "none";

    const nome = document.getElementById("nomeServico").value.trim();
    const tempo = document.getElementById("tempo").value.trim();
    const precoRaw = document.getElementById("preco").value.replace(/\D/g, "");

    if (!nome || !tempo || !precoRaw) {
        mostrarErro("Por favor, preencha todos os campos corretamente.");
        return;
    }

    const btn = document.getElementById("btnCadastrarForm");
    btn.innerText = "Salvando...";
    btn.disabled = true;

    const payload = {
        Nome: nome,
        Tempo: parseInt(tempo),
        Preco: parseFloat(precoRaw) / 100
    };

    fetchAutenticado("/api/Servicos", {
        method: "POST",
        body: JSON.stringify(payload)
    })
        .then(() => {
            mostrarToast("success", "Serviço cadastrado!", "Os dados foram salvos com sucesso.");
            limparFormulario();
        })
        .catch((error) => {
            mostrarErro(error || "Falha ao realizar o cadastro.");
        })
        .finally(() => {
            btn.innerText = "Cadastrar";
            btn.disabled = false;
        });
}

function limparFormulario() {
    document.querySelectorAll("input").forEach(i => i.value = "");
}

// ─── MODAL DE EDIÇÃO ─────────────────────────────────────────────────────────

let servicoEditandoId = null;

async function abrirModalEdicao() {
    servicoEditandoId = null;
    document.getElementById("modalEditarOverlay").classList.add("aberto");
    document.getElementById("modal-editar-erro").style.display = "none";
    document.getElementById("formEdicao").style.display = "none";
    document.getElementById("listaSelecionarServico").innerHTML = "<p style='color:#888;text-align:center;padding:20px;'>Carregando...</p>";

    try {
        const response = await fetchAutenticado("/api/Servicos");
        const servicos = await response.json();
        renderizarListaServicos(servicos);
    } catch (e) {
        document.getElementById("listaSelecionarServico").innerHTML = "<p style='color:red;text-align:center;padding:20px;'>Erro ao carregar serviços.</p>";
    }
}

function renderizarListaServicos(servicos) {
    const lista = document.getElementById("listaSelecionarServico");

    if (!servicos || servicos.length === 0) {
        lista.innerHTML = "<p style='color:#888;text-align:center;padding:20px;'>Nenhum serviço cadastrado.</p>";
        return;
    }

    lista.innerHTML = servicos.map(s => `
        <div class="item-selecionar" onclick="selecionarServicoParaEditar(${s.id}, '${s.nome.replace(/'/g, "\\'")}', ${s.tempo}, ${s.preco})">
            <span class="item-nome">${s.nome}</span>
            <span class="item-detalhe">${s.tempo} min — R$ ${s.preco.toFixed(2).replace(".", ",")}</span>
        </div>
    `).join("");
}

function selecionarServicoParaEditar(id, nome, tempo, preco) {
    servicoEditandoId = id;

    document.querySelectorAll(".item-selecionar").forEach(el => el.classList.remove("ativo"));
    event.currentTarget.classList.add("ativo");

    document.getElementById("editNomeServico").value = nome;
    document.getElementById("editTempo").value = tempo;
    aplicarMascaraPreco(document.getElementById("editPreco"), preco);

    document.getElementById("formEdicao").style.display = "block";
    document.getElementById("modal-editar-erro").style.display = "none";
}

async function salvarEdicaoServico() {
    if (!servicoEditandoId) return;

    const nome = document.getElementById("editNomeServico").value.trim();
    const tempo = document.getElementById("editTempo").value.trim();
    const precoRaw = document.getElementById("editPreco").value.replace(/\D/g, "");

    if (!nome || !tempo || !precoRaw) {
        mostrarErroModal("Preencha todos os campos.");
        return;
    }

    const btn = document.getElementById("btnSalvarEdicao");
    btn.innerText = "Salvando...";
    btn.disabled = true;

    try {
        await fetchAutenticado(`/api/Servicos/${servicoEditandoId}`, {
            method: "PUT",
            body: JSON.stringify({
                Nome: nome,
                Tempo: parseInt(tempo),
                Preco: parseFloat(precoRaw) / 100
            })
        });

        mostrarToast("success", "Serviço atualizado!", "As alterações foram salvas com sucesso.");
        fecharModalEdicao();
    } catch (e) {
        mostrarErroModal(e || "Erro ao atualizar serviço.");
    } finally {
        btn.innerText = "Salvar Alterações";
        btn.disabled = false;
    }
}

// ─── MODAL HELPERS ───────────────────────────────────────────────────────────

function fecharModalEdicao() {
    document.getElementById("modalEditarOverlay").classList.remove("aberto");
    servicoEditandoId = null;
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
    }).then(async (response) => {
        if (response.status === 401) window.location.href = "../TelaLogin/login.html";
        if (!response.ok) {
            const erroJson = await response.json().catch(() => ({ message: "Erro interno" }));
            return Promise.reject(erroJson.message);
        }
        return response;
    });
}

function logout() {
    localStorage.clear();
    window.location.href = "../TelaLogin/login.html";
}

function mostrarErro(mensagem) {
    const erroDiv = document.getElementById("erro-cadastro");
    if (erroDiv) {
        erroDiv.innerText = mensagem;
        erroDiv.style.display = "block";
    }
}