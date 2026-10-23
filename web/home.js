const API_URL = "http://localhost:3000";
const usuario = JSON.parse(sessionStorage.getItem("usuario") || "null");

if (!usuario) {
    window.location.replace("login.html");
}

const nomeUsuario = document.getElementById("nomeUsuario");
const listaEventos = document.getElementById("listaEventos");
const mensagem = document.getElementById("mensagem");
const modal = document.getElementById("modalEvento");
const eventoForm = document.getElementById("eventoForm");
const erroForm = document.getElementById("erroForm");

let eventos = [];

nomeUsuario.textContent = usuario?.nome || usuario?.email || "Usuário";

document.getElementById("sair").addEventListener("click", () => {
    sessionStorage.removeItem("usuario");
    window.location.replace("login.html");
});

document.getElementById("novoEvento").addEventListener("click", abrirNovo);
document.getElementById("fecharModal").addEventListener("click", fecharModal);
document.getElementById("cancelar").addEventListener("click", fecharModal);
document.getElementById("busca").addEventListener("input", renderizar);

function mostrarMensagem(texto, sucesso = false) {
    mensagem.textContent = texto;
    mensagem.classList.toggle("success", sucesso);
}

function fecharModal() {
    modal.close();
    erroForm.textContent = "";
}

function abrirNovo() {
    eventoForm.reset();
    document.getElementById("eventoId").value = "";
    document.getElementById("tituloModal").textContent = "Novo evento";
    modal.showModal();
}

function formatarData(data) {
    if (!data) return "—";
    const dataLocal = new Date(data);
    return Number.isNaN(dataLocal.getTime())
        ? "—"
        : dataLocal.toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

function normalizarLista(dados) {
    // O controller GET /evento/listar devolve diretamente um array.
    if (Array.isArray(dados)) return dados;
    return [];
}

async function requisicao(caminho, opcoes = {}) {
    const resposta = await fetch(`${API_URL}${caminho}`, {
        ...opcoes,
        headers: {
            "Content-Type": "application/json",
            ...(opcoes.headers || {})
        }
    });

    const texto = await resposta.text();
    let dados = {};
    try {
        dados = texto ? JSON.parse(texto) : {};
    } catch {
        dados = {};
    }

    if (!resposta.ok) {
        throw new Error(
            dados.erro ||
            dados.msg ||
            `A API retornou o erro ${resposta.status}.`
        );
    }

    return dados;
}

async function carregarEventos() {
    try {
        // Rota definida em src/routes/evento.routes.js
        const dados = await requisicao("/evento/listar");
        eventos = normalizarLista(dados);
        renderizar();
        mostrarMensagem("");
    } catch (erro) {
        mostrarMensagem(
            `${erro.message} Confira se a API está rodando em ${API_URL}.`
        );
    }
}

function renderizar() {
    const termo = document.getElementById("busca").value.toLocaleLowerCase("pt-BR");

    const filtrados = eventos.filter((evento) =>
        `${evento.cidade || ""} ${evento.tipoEvento || ""}`
            .toLocaleLowerCase("pt-BR")
            .includes(termo)
    );

    listaEventos.innerHTML = filtrados.map((evento) => `
        <tr>
            <td><strong>${escapar(evento.cidade)}</strong></td>
            <td>${escapar(evento.tipoEvento)}</td>
            <td>${evento.temperaturaMaxima == null
                ? "—"
                : `${Number(evento.temperaturaMaxima).toLocaleString("pt-BR")} °C`}</td>
            <td>${formatarData(evento.data)}</td>
            <td>${escapar(evento.nivelImpacto || "—")}</td>
            <td>
                <div class="actions">
                    <button class="action-button" data-editar="${evento.id}">Editar</button>
                    <button class="action-button delete" data-excluir="${evento.id}">Excluir</button>
                </div>
            </td>
        </tr>
    `).join("");

    document.getElementById("vazio").style.display = filtrados.length ? "none" : "block";
    document.getElementById("totalEventos").textContent = eventos.length;
    document.getElementById("totalCidades").textContent =
        new Set(eventos.map((evento) => evento.cidade).filter(Boolean)).size;
    document.getElementById("totalTipos").textContent =
        new Set(eventos.map((evento) => evento.tipoEvento).filter(Boolean)).size;
}

function escapar(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, (caractere) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[caractere]);
}

listaEventos.addEventListener("click", async (event) => {
    const editarId = event.target.dataset.editar;
    const excluirId = event.target.dataset.excluir;

    if (editarId) {
        const evento = eventos.find((item) => String(item.id) === editarId);
        if (!evento) return;

        document.getElementById("eventoId").value = evento.id;
        document.getElementById("tituloModal").textContent = "Editar evento";
        document.getElementById("cidade").value = evento.cidade || "";
        document.getElementById("tipoEvento").value = evento.tipoEvento || "";
        document.getElementById("temperaturaMaxima").value = evento.temperaturaMaxima ?? "";
        document.getElementById("data").value = evento.data
            ? new Date(evento.data).toISOString().slice(0, 10)
            : "";
        document.getElementById("nivelImpacto").value = evento.nivelImpacto || "";

        modal.showModal();
        return;
    }

    if (excluirId) {
        const evento = eventos.find((item) => String(item.id) === excluirId);
        if (!confirm(`Deseja excluir o evento de ${evento?.cidade || "esta cidade"}?`)) {
            return;
        }

        try {
            // DELETE /evento/excluir/:id
            await requisicao(`/evento/excluir/${excluirId}`, { method: "DELETE" });
            mostrarMensagem("Evento excluído com sucesso.", true);
            await carregarEventos();
        } catch (erro) {
            mostrarMensagem(erro.message);
        }
    }
});

eventoForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    erroForm.textContent = "";

    const id = document.getElementById("eventoId").value;
    const temperatura = document.getElementById("temperaturaMaxima").value;
    const dataInput = document.getElementById("data").value;

    const corpo = {
        usuarioId: Number(usuario?.id),
        cidade: document.getElementById("cidade").value.trim(),
        tipoEvento: document.getElementById("tipoEvento").value.trim(),
        temperaturaMaxima: temperatura === "" ? null : Number(temperatura),
        nivelImpacto: document.getElementById("nivelImpacto").value.trim()
    };

    if (!Number.isInteger(corpo.usuarioId) || corpo.usuarioId <= 0) {
        erroForm.textContent = "Não foi possível identificar o usuário conectado. Faça login novamente.";
        return;
    }

    if (dataInput) {
        corpo.data = new Date(`${dataInput}T12:00:00`).toISOString();
    }

    try {
        if (id) {
            // PUT /evento/atualizar/:id
            await requisicao(`/evento/atualizar/${id}`, {
                method: "PUT",
                body: JSON.stringify(corpo)
            });
        } else {
            // POST /evento/cadastrar
            await requisicao("/evento/cadastrar", {
                method: "POST",
                body: JSON.stringify(corpo)
            });
        }

        fecharModal();
        mostrarMensagem(
            id ? "Evento atualizado com sucesso." : "Evento cadastrado com sucesso.",
            true
        );
        await carregarEventos();
    } catch (erro) {
        erroForm.textContent = erro.message;
    }
});

carregarEventos();
