const prisma = require("../data/prisma");

async function login(req, res) {
    try {
        const { email, senha } = req.body;

        if (!email || !senha) {
            return res.status(400).json({ erro: "Informe e-mail e senha." });
        }

        const usuario = await prisma.usuario.findUnique({
            where: { email }
        });

        if (!usuario || usuario.senha !== senha) {
            return res.status(401).json({ erro: "E-mail ou senha inválidos." });
        }

        // Nunca devolva a senha para o navegador.
        const { senha: senhaPrivada, ...usuarioPublico } = usuario;
        return res.status(200).json({ usuario: usuarioPublico });
    } catch (erro) {
        console.error("Erro no login:", erro);
        return res.status(500).json({ erro: "Erro interno ao realizar login." });
    }
}

module.exports = { login };
