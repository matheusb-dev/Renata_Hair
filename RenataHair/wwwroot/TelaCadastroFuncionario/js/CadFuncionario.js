/**
 * Lógica do Cadastro de Funcionário
 */
const API_URL = "";

function getToken() {
    return localStorage.getItem("token");
}

function verificarAutenticacao() {
    if (!getToken()) window.location.href = "/TelaLogin/login.html";
}

document.addEventListener("DOMContentLoaded", () => {
    verificarAutenticacao();
    configurarMascaras();
    configurarDropdownServicos();
    configurarListenersTurno();
});

/**
 * Configuração de Dropdowns e Interação
 */
function configurarDropdownServicos() {
    const dropdown = document.querySelector('#dropdown-servicos');
    if (!dropdown) return;

    const checkboxes = dropdown.querySelectorAll('.dropdown-content input[type="checkbox"]');
    const label = document.getElementById('selected-services-label');

    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            const selecionados = Array.from(checkboxes)
                .filter(i => i.checked)
                .map(i => i.getAttribute('data-name') || i.value);

            if (selecionados.length === 0) {
                label.innerText = "Serviços";
            } else if (selecionados.length <= 2) {
                label.innerText = selecionados.join(', ');
            } else {
                label.innerText = `${selecionados.length} Selecionados`;
            }
        });
    });
}

function configurarListenersTurno() {
    const checkboxes = document.querySelectorAll('.turno-check');
    const label = document.getElementById('selected-turno-label');

    checkboxes.forEach(cb => {
        cb.addEventListener('change', () => {
            const selecionados = Array.from(checkboxes)
                .filter(i => i.checked)
                .map(i => i.value);

            label.innerText = selecionados.length > 0 ? selecionados.join(', ') : "Turno";
        });
    });
}

function toggleDropdown(id) {
    const dropdown = document.getElementById(id);
    if (dropdown) dropdown.classList.toggle('active');
}

function selecionarOpcao(dropdownId, labelId, texto, valor) {
    document.getElementById(labelId).innerText = texto;
    const inputOculto = document.querySelector(`#${dropdownId} input[type="hidden"]`);
    if (inputOculto) inputOculto.value = valor;
    toggleDropdown(dropdownId);
}

document.addEventListener('click', function (e) {
    document.querySelectorAll('.dropdown-custom').forEach(d => {
        if (!d.contains(e.target)) d.classList.remove('active');
    });
});

/**
 * Máscaras e Validações
 */
function configurarMascaras() {
    const cpfInput = document.getElementById("cpf");
    const telefoneInput = document.getElementById("telefone");

    if (cpfInput) {
        cpfInput.addEventListener("input", (e) => {
            let v = e.target.value.replace(/\D/g, "");
            if (v.length > 11) v = v.slice(0, 11);
            v = v.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
            e.target.value = v;
        });
    }

    if (telefoneInput) {
        telefoneInput.addEventListener("input", (e) => {
            let v = e.target.value.replace(/\D/g, "");
            if (v.length > 11) v = v.slice(0, 11);
            v = v.length > 10 ? v.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3") : v.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3");
            e.target.value = v;
        });
    }
}

function obterServicosIdsSelecionados() {
    return Array.from(document.querySelectorAll('#dropdown-servicos .dropdown-content input[type="checkbox"]:checked'))
        .map(i => parseInt(i.value, 10))
        .filter(id => !isNaN(id));
}

function obterTurnosSelecionados() {
    return Array.from(document.querySelectorAll('.turno-check:checked'))
        .map(i => i.value)
        .join(', ');
}

/**
 * Envio do Formulário
 */
function salvarFuncionario() {
    const erroDiv = document.getElementById("erro-cadastro");
    if (erroDiv) erroDiv.style.display = "none";

    const nome = document.getElementById("nome").value.trim();
    const cpf = document.getElementById("cpf").value;
    const telefone = document.getElementById("telefone").value;
    const pj = document.getElementById("pj").value === "true";
    const turno = obterTurnosSelecionados();
    const horasInput = document.getElementById("horas").value.trim();

    if (!nome || !cpf || !telefone || !turno) {
        mostrarErro("Por favor, preencha os campos obrigatórios (Nome, CPF, Telefone e Turno).");
        return;
    }

    const servicosIds = obterServicosIdsSelecionados();
    if (servicosIds.length === 0) {
        mostrarErro("O funcionário deve ter pelo menos um serviço vinculado.");
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
        Turno: turno,
        HorasMensais: horasInput ? parseInt(horasInput, 10) : 0,
        Pj: pj,
        ServicosIds: servicosIds,
        CadastrarComoCliente: document.getElementById("cliente-checkbox").checked
    };

    fetchAutenticado("/api/Funcionarios", {
        method: "POST",
        body: JSON.stringify(payload)
    })
        .then(() => {
            alert("Funcionário cadastrado com sucesso!");
            limparFormulario();
        })
        .catch((error) => {
            console.error(error);
            mostrarErro(error || "Falha ao realizar o cadastro.");
        })
        .finally(() => {
            if (btn) { btn.innerHTML = 'Cadastrar'; btn.disabled = false; }
        });
}

function limparFormulario() {
    document.querySelectorAll('input[type="text"], input[type="email"]').forEach(i => i.value = "");
    document.getElementById("cliente-checkbox").checked = false;
    document.getElementById("pj").value = "false";
    document.getElementById("selected-pj-label").innerText = "Pessoa Física";

    document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    document.getElementById("selected-turno-label").innerText = "Turno";
    document.getElementById("selected-services-label").innerText = "Serviços";
}

function fetchAutenticado(url, options = {}) {
    const token = getToken();
    return fetch(API_URL + url, {
        ...options,
        headers: {
            "Authorization": "Bearer " + token,
            "Content-Type": "application/json"
        }
    }).then(async (response) => {
        if (response.status === 401) window.location.href = "/TelaLogin/login.html";
        if (!response.ok) {
            const erroJson = await response.json().catch(() => ({ message: "Erro interno" }));
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
    if (erroDiv) {
        erroDiv.innerText = mensagem;
        erroDiv.style.display = "block";
    }
}