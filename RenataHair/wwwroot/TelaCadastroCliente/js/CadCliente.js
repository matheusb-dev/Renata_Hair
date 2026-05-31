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
});

function toggleDropdown(id) {
    const dropdown = document.getElementById(id);

    if (dropdown) {
        dropdown.classList.toggle("active");
    }
}

document.addEventListener("click", function (e) {
    document.querySelectorAll(".dropdown-custom").forEach(dropdown => {
        if (!dropdown.contains(e.target)) {
            dropdown.classList.remove("active");
        }
    });
});

function selecionarPlano(plano) {

    document.getElementById("plano").value = plano;
    document.getElementById("selected-plano-label").innerText = plano;

    const mensalidade = document.getElementById("dropdown-mensalidade");

    if (plano === "Premium") {
        mensalidade.style.display = "flex";
    }
    else {
        mensalidade.style.display = "none";

        document.getElementById("tipoMensalidade").value = "";

        document.getElementById(
            "selected-mensalidade-label"
        ).innerText = "Tipo de Mensalidade";
    }

    toggleDropdown("dropdown-plano");
}

function selecionarMensalidade(tipo) {

    document.getElementById("tipoMensalidade").value = tipo;

    document.getElementById(
        "selected-mensalidade-label"
    ).innerText = tipo;

    toggleDropdown("dropdown-mensalidade");
}

function configurarMascaras() {

    const cpfInput = document.getElementById("cpf");
    const telefoneInput = document.getElementById("telefone");

    if (cpfInput) {

        cpfInput.addEventListener("input", (e) => {

            let v = e.target.value.replace(/\D/g, "");

            if (v.length > 11) {
                v = v.slice(0, 11);
            }

            v = v
                .replace(/(\d{3})(\d)/, "$1.$2")
                .replace(/(\d{3})(\d)/, "$1.$2")
                .replace(/(\d{3})(\d{1,2})$/, "$1-$2");

            e.target.value = v;
        });
    }

    if (telefoneInput) {

        telefoneInput.addEventListener("input", (e) => {

            let v = e.target.value.replace(/\D/g, "");

            if (v.length > 11) {
                v = v.slice(0, 11);
            }

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

function salvarCliente() {

    const erroDiv = document.getElementById("erro-cadastro");

    if (erroDiv) {
        erroDiv.style.display = "none";
    }

    const nome = document.getElementById("nome").value.trim();
    const cpf = document.getElementById("cpf").value;
    const telefone = document.getElementById("telefone").value;
    const plano = document.getElementById("plano").value;
    const tipoMensalidade =
        document.getElementById("tipoMensalidade").value;

    if (!nome || !cpf || !telefone) {
        mostrarErro(
            "Por favor, preencha Nome, CPF e Telefone."
        );
        return;
    }

    if (
        plano === "Premium" &&
        !tipoMensalidade
    ) {
        mostrarErro(
            "Selecione o tipo de mensalidade do plano Premium."
        );
        return;
    }

    const btn = document.getElementById(
        "btnCadastrarForm"
    );

    if (btn) {
        btn.innerText = "Salvando...";
        btn.disabled = true;
    }

    const payload = {
        Nome: nome,
        Cpf: cpf,
        Telefone: telefone,
        Email:
            document.getElementById("email")
                .value
                .trim() || null,

        Endereco:
            document.getElementById("endereco")
                .value
                .trim() || null,

        Plano: plano,
        TipoMensalidade:
            plano === "Premium"
                ? tipoMensalidade
                : null
    };

    console.log("Payload enviado:", payload);

    fetchAutenticado("/api/Clientes", {
        method: "POST",
        body: JSON.stringify(payload)
    })
        .then(async response => {

            if (response.ok) {

                alert(
                    "Cliente cadastrado com sucesso!"
                );

                limparFormulario();
            }
        })
        .catch(error => {

            console.error(error);

            mostrarErro(
                error || "Erro ao cadastrar cliente."
            );
        })
        .finally(() => {

            if (btn) {
                btn.innerText = "Cadastrar";
                btn.disabled = false;
            }
        });
}

function limparFormulario() {

    document
        .querySelectorAll(
            'input[type="text"], input[type="email"]'
        )
        .forEach(input => {
            input.value = "";
        });

    document.getElementById("plano").value = "Nenhum";

    document.getElementById(
        "selected-plano-label"
    ).innerText = "Plano";

    document.getElementById(
        "tipoMensalidade"
    ).value = "";

    document.getElementById(
        "selected-mensalidade-label"
    ).innerText = "Tipo de Mensalidade";

    document.getElementById(
        "dropdown-mensalidade"
    ).style.display = "none";
}

function fetchAutenticado(url, options = {}) {

    const token = getToken();

    return fetch(API_URL + url, {
        ...options,
        headers: {
            "Authorization": "Bearer " + token,
            "Content-Type": "application/json"
        }
    })
        .then(async response => {

            if (response.status === 401) {

                window.location.href =
                    "/TelaLogin/login.html";

                return;
            }

            if (!response.ok) {

                const erroJson =
                    await response
                        .json()
                        .catch(() => ({
                            message:
                                "Erro interno do servidor"
                        }));

                return Promise.reject(
                    erroJson.message
                );
            }

            return response;
        });
}

function logout() {

    localStorage.clear();

    window.location.href =
        "/TelaLogin/login.html";
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
