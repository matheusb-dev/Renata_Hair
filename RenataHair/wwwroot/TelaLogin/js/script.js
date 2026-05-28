function tremerTela() {
    const box = document.querySelector(".login-box");
    box.classList.remove("erro-animacao");
    void box.offsetWidth;
    box.classList.add("erro-animacao");
}

function mostrarErro(mensagem) {
    const erro = document.getElementById("erro-login");
    erro.innerText = mensagem;
    erro.style.display = "block";
    erro.style.animation = "none";
    erro.offsetHeight;
    erro.style.animation = "shake 0.3s";
    tremerTela();
}

function fazerLogin() {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    const btn = document.getElementById("btnLogin");
    const erro = document.getElementById("erro-login");

    if (!username || !password) {
        mostrarErro("Preencha todos os campos");
        return;
    }

    erro.style.display = "none";
    btn.innerText = "Entrando...";
    btn.disabled = true;

    fetch("/api/Auth/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            usuario: username,
            senha: password
        })
    })
        .then(response => {
            if (response.ok) return response.json();
            throw new Error();
        })
        .then(data => {
            localStorage.setItem("token", data.token);
            localStorage.setItem("usuario", JSON.stringify(data.usuario));

            btn.innerText = "Entrar";
            btn.disabled = false;

            window.location.href = "/TelaAgenda/agenda.html";
        })
        .catch(() => {
            mostrarErro("Usuário ou senha inválidos");
            btn.innerText = "Entrar";
            btn.disabled = false;
        });
}

document.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
        fazerLogin();
    }
});