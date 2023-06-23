const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const app = express();
const port = 3000;

app.use(express.static('public'));
app.use(express.json());

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/public/views/index.html'));
});

app.get('/cadastro', (req, res) => {
  res.sendFile(path.join(__dirname, '/public/views/clienteForms.html'));
});

const server = http.createServer(app);
const io = socketIO(server);

// Array para armazenar os registros
let registros = [];

// Rota para obter os registros
app.get('/dados', (req, res) => {
  res.json({ registros });
});

// Rota para receber os dados do cartão RFID
app.post('/dados', (req, res) => {
  const { conteudo } = req.body;

  if (!conteudo) {
    return res.status(400).json({ error: 'Conteúdo não fornecido.' });
  }

  // Verificar se o registro já existe
  const registroExistente = registros.find(registro => registro.cartaoId === conteudo);

  if (registroExistente) {
    if (!registroExistente.dataSaida) {
      // Atualizar registro de saída
      registroExistente.dataSaida = new Date().toLocaleDateString();
      registroExistente.horaSaida = new Date().toLocaleTimeString();
      registroExistente.tipo = 'Saída';
    } else {
      // Adicionar novo registro de entrada
      const novoRegistro = {
        cartaoId: conteudo,
        dataEntrada: new Date().toLocaleDateString(),
        horaEntrada: new Date().toLocaleTimeString(),
        dataSaida: '',
        horaSaida: '',
        tipo: 'Entrada'
      };
      registros.push(novoRegistro);
    }
  } else {
    // Adicionar novo registro de entrada
    const novoRegistro = {
      cartaoId: conteudo,
      dataEntrada: new Date().toLocaleDateString(),
      horaEntrada: new Date().toLocaleTimeString(),
      dataSaida: '',
      horaSaida: '',
      tipo: 'Entrada'
    };
    registros.push(novoRegistro);
  }

  // Enviar registros atualizados para o cliente
  io.emit('registrosAtualizados', registros);

  res.json({ success: true });
});

// Configurar comunicação em tempo real com o cliente
io.on('connection', socket => {
  console.log('Novo cliente conectado.');

  // Enviar registros atualizados para o cliente quando houver uma nova conexão
  socket.emit('registrosAtualizados', registros);

  socket.on('disconnect', () => {
    console.log('Cliente desconectado.');
  });
});

// Iniciar o servidor
server.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
