document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("formCadastroServico");

    form.addEventListener("submit", function (event) {
        
        event.preventDefault();

        
        const nome = document.getElementById("nome").value;
        const tempo = document.getElementById("tempo").value;
        const preco = document.getElementById("preco").value;

       
        const novoServico = {
            nome: nome,
            tempo: tempo,
            preco: preco
        };

       
        console.log("Dados do serviço capturados:", novoServico);

        
        alert("Serviço '" + nome + "' cadastrado com sucesso!");

       
        form.reset();
    });
});