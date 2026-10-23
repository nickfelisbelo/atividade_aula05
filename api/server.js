
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

app.use(express.json());
app.use(cors());

const eventoRoutes = require('./src/routes/evento.routes');
app.use('/evento', eventoRoutes);

const usuarioRoutes = require('./src/routes/usuario.routes');
app.use('/usuario', usuarioRoutes);

// Rota de login
const loginRoutes = require('./src/routes/login.routes');
app.use('/usuario/login', loginRoutes);

// Rota inicial da API
app.use('/', (req, res) => {
    res.json({
        msg: 'API eventos respondendo:',
        rotas: [
            { usuario: '/usuario' },
            { login: '/usuario/login' },
            { eventos: '/evento' }
        ]
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor http://localhost:${PORT}`);
});
