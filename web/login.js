const API_URL = "http://localhost:3000";

const loginForm = document.getElementById("loginForm");
const mensagem = document.getElementById("mensagem");

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    mensagem.textContent = "";
    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value;

    try {
        const resposta = await fetch(`${API_URL}/usuario/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, senha })
        });
        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(dados.erro || dados.msg || "E-mail ou senha inválidos.");
        }

        // Guarda apenas os dados públicos do usuário para a sessão da interface.
        sessionStorage.setItem("usuario", JSON.stringify(dados.usuario || dados));
        window.location.href = "home.html";
    } catch (erro) {
        mensagem.textContent = erro.message || "Não foi possível conectar à API.";
    }
});
