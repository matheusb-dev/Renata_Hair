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

    console.log("Página carregada");

    verificarAutenticacao();
    configurarMascaras();
    configurarListenersTurno();
    carregarServicos();
});

function toggleDropdown(id) {

    console.log("Abrindo dropdown:", id);

    const dropdown = document.getElementById(id);

    if (dropdown) {
        dropdown.classList.toggle("active");
    }
}

function selecionarOpcao(dropdownId, labelId, texto, valor) {

    document.getElementById(labelId).innerText = texto;

    const hidden =
        document.querySelector(`#${dropdownId} input[type='hidden']`);

    if (hidden) {
        hidden.value = valor;
    }

    document.getElementById(dropdownId)
        .classList.remove("active");
}

document.addEventListener("click", function (e) {

    document.querySelectorAll(".dropdown-custom")
        .forEach(dropdown => {

            if (!dropdown.contains(e.target)) {
                dropdown.classList.remove("active");
            }
        });
});

function configurarDropdownServicos() {

    const dropdown =
        document.querySelector("#dropdown-servicos");

    if (!dropdown) return;

    const checkboxes =
        dropdown.querySelectorAll(
            '.dropdown-content input[type="checkbox"]'
        );

    const label =
        document.getElementById(
            "selected-services-label"
        );

    checkboxes.forEach(checkbox => {

        checkbox.addEventListener("change", () => {

            const selecionados = Array.from(checkboxes)
                .filter(i => i.checked)
                .map(i =>
                    i.getAttribute("data-name") || i.value
                );

            if (selecionados.length === 0) {

                label.innerText = "Serviços";
            }
            else if (selecionados.length <= 2) {

                label.innerText =
                    selecionados.join(", ");
            }
            else {

                label.innerText =
                    `${selecionados.length} Selecionados`;
            }
        });
    });
}

async function carregarServicos() {

    console.log("Entrou em carregarServicos");

    try {

        const response =
            await fetchAutenticado("/api/Servicos");

        console.log("Response:", response);

        const servicos =
            await response.json();

        console.log("Serviços recebidos:", servicos);

        const container =
            document.getElementById(
                "servicos-container"
            );

        console.log("Container:", container);

        if (!container) {
            console.error(
                "servicos-container não encontrado"
            );
            return;
        }

        container.innerHTML = "";

        if (!servicos || servicos.length === 0) {

            container.innerHTML =
                "<label>Nenhum serviço cadastrado</label>";

            return;
        }

        servicos.forEach(servico => {

            const label =
                document.createElement("label");

            label.innerHTML = `
                <input
                    type="checkbox"
                    value="${servico.id}"
                    data-name="${servico.nome}">
                ${servico.nome}
            `;

            container.appendChild(label);
        });

        configurarDropdownServicos();

        console.log(
            "Serviços carregados com sucesso"
        );
    }
    catch (erro) {

        console.error(
            "Erro ao carregar serviços:",
            erro
        );

        mostrarErro(
            "Não foi possível carregar os serviços."
        );
    }
}

function configurarListenersTurno() {

    const checkboxes =
        document.querySelectorAll(".turno-check");

    const label =
        document.getElementById(
            "selected-turno-label"
        );

    checkboxes.forEach(cb => {

        cb.addEventListener("change", () => {

            const selecionados =
                Array.from(checkboxes)
                    .filter(i => i.checked)
                    .map(i => i.value);

            // Limita a no máximo 2 turnos
            if (selecionados.length > 2) {
                cb.checked = false;
                return;
            }

            label.innerText =
                selecionados.length > 0
                    ? selecionados.join(", ")
                    : "Turno";
        });
    });
}

function configurarMascaras() {

    const cpfInput =
        document.getElementById("cpf");

    const telefoneInput =
        document.getElementById("telefone");

    if (cpfInput) {

        cpfInput.addEventListener("input", e => {

            let v =
                e.target.value.replace(/\D/g, "");

            if (v.length > 11)
                v = v.slice(0, 11);

            v = v
                .replace(/(\d{3})(\d)/, "$1.$2")
                .replace(/(\d{3})(\d)/, "$1.$2")
                .replace(/(\d{3})(\d{1,2})$/, "$1-$2");

            e.target.value = v;
        });
    }

    if (telefoneInput) {

        telefoneInput.addEventListener("input", e => {

            let v =
                e.target.value.replace(/\D/g, "");

            if (v.length > 11)
                v = v.slice(0, 11);

            if (v.length > 10) {

                v = v.replace(
                    /^(\d{2})(\d{5})(\d{4})$/,
                    "($1) $2-$3"
                );
            }
            else {

                v = v.replace(
                    /^(\d{2})(\d{4})(\d{4})$/,
                    "($1) $2-$3"
                );
            }

            e.target.value = v;
        });
    }
}

function obterServicosIdsSelecionados() {

    return Array.from(
        document.querySelectorAll(
            '#dropdown-servicos input[type="checkbox"]:checked'
        )
    )
        .map(i => parseInt(i.value))
        .filter(i => !isNaN(i));
}

function obterTurnosSelecionados() {

    return Array.from(
        document.querySelectorAll(
            ".turno-check:checked"
        )
    )
        .map(i => i.value)
        .join(", ");
}

function mostrarErro(mensagem) {

    const erroDiv =
        document.getElementById(
            "erro-cadastro"
        );

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

        if (response.status === 401) {

            window.location.href =
                "/TelaLogin/login.html";
        }

        if (!response.ok) {

            const erro =
                await response.json();

            throw erro.message;
        }

        return response;
    });
}

function logout() {

    localStorage.clear();

    window.location.href =
        "/TelaLogin/login.html";
}

// ─── NOVA FUNÇÃO ────────────────────────────────────────────────────────────

async function salvarFuncionario() {

    const nome =
        document.getElementById("nome").value.trim();

    const endereco =
        document.getElementById("endereco").value.trim();

    const email =
        document.getElementById("email").value.trim();

    const cpf =
        document.getElementById("cpf").value.trim();

    const telefone =
        document.getElementById("telefone").value.trim();

    const horas =
        document.getElementById("horas").value;

    const pj =
        document.getElementById("pj").value === "true";

    const cadastrarComoCliente =
        document.getElementById("cliente-checkbox").checked;

    const servicosIds = obterServicosIdsSelecionados();
    const turno = obterTurnosSelecionados();

    // Validações básicas no front
    if (!nome || !cpf || !telefone || !horas || !turno || servicosIds.length === 0) {

        mostrarErro(
            "Preencha todos os campos obrigatórios e selecione ao menos um serviço e um turno."
        );

        return;
    }

    const body = {
        nome,
        endereco,
        email,
        cpf,
        telefone,
        turno,
        horasMensais: parseInt(horas),
        pj,
        servicosIds,
        cadastrarComoCliente
    };

    try {

        await fetchAutenticado("/api/Funcionarios", {
            method: "POST",
            body: JSON.stringify(body)
        });

        alert("Funcionário cadastrado com sucesso!");

        // Limpa o formulário
        ["nome", "endereco", "email", "cpf", "telefone", "horas"]
            .forEach(id => {
                document.getElementById(id).value = "";
            });

        document.getElementById(
            "selected-services-label"
        ).innerText = "Serviços";

        document.getElementById(
            "selected-turno-label"
        ).innerText = "Turno";

        document.getElementById(
            "selected-pj-label"
        ).innerText = "Pessoa Física";

        document.getElementById("pj").value = "false";

        document.getElementById(
            "cliente-checkbox"
        ).checked = false;

        document.querySelectorAll(".turno-check")
            .forEach(cb => cb.checked = false);

        document.querySelectorAll(
            '#dropdown-servicos input[type="checkbox"]'
        ).forEach(cb => cb.checked = false);

        document.getElementById(
            "erro-cadastro"
        ).style.display = "none";
    }
    catch (erro) {

        mostrarErro(
            typeof erro === "string"
                ? erro
                : "Erro ao cadastrar funcionário."
        );
    }
}