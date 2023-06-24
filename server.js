const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { body, validationResult } = require('express-validator');

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

// Configuração e conexão com o banco de dados SQLite
const dbPath = path.join(__dirname, 'arquivo.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run('CREATE TABLE IF NOT EXISTS cartoes (cartao_id TEXT, data_entrada TEXT, hora_entrada TEXT, data_saida TEXT, hora_saida TEXT, tipo TEXT)');
});

// Array para armazenar os registros
let registros = [];

// Rota para obter os registros
app.get('/dados', (req, res) => {
  db.all('SELECT * FROM cartoes', (error, results) => {
    if (error) {
      console.error('Erro ao executar a consulta:', error);
      res.status(500).json({ error: 'Erro ao obter os registros' });
      return;
    }

    registros = results;
    res.json({ registros });
  });
});

// Rota para receber os dados do cartão RFID
app.post('/dados', [
  body('conteudo').notEmpty().withMessage('O campo conteúdo é obrigatório.')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { conteudo } = req.body;

  const data = new Date().toLocaleDateString();
  const hora = new Date().toLocaleTimeString();

  db.serialize(() => {
    db.get('SELECT tipo, data_entrada, hora_entrada FROM cartoes WHERE cartao_id = ? ORDER BY ROWID DESC LIMIT 1', [conteudo], (error, row) => {
      if (error) {
        console.error('Erro ao verificar a última interação:', error);
        res.status(500).json({ error: 'Erro ao verificar a última interação' });
        return;
      }

      let tipo = 'Entrada';
      if (row && row.tipo === 'Entrada') {
        tipo = 'Saída';
      }

      const novoRegistro = {
        cartao_id: conteudo,
        tipo: tipo
      };

      if (tipo === 'Entrada') {
        novoRegistro.data_entrada = data;
        novoRegistro.hora_entrada = hora;
      } else {
        novoRegistro.data_entrada = row ? row.data_entrada : null;
        novoRegistro.hora_entrada = row ? row.hora_entrada : null;
        novoRegistro.data_saida = data;
        novoRegistro.hora_saida = hora;
      }

      db.run('INSERT INTO cartoes (cartao_id, data_entrada, hora_entrada, data_saida, hora_saida, tipo) VALUES (?, ?, ?, ?, ?, ?)', [novoRegistro.cartao_id, novoRegistro.data_entrada, novoRegistro.hora_entrada, novoRegistro.data_saida, novoRegistro.hora_saida, novoRegistro.tipo], (error) => {
        if (error) {
          console.error('Erro ao cadastrar o cartão:', error);
          res.status(500).json({ error: 'Erro ao cadastrar o cartão' });
          return;
        }

        // Atualizar a lista de registros
        db.all('SELECT * FROM cartoes', (error, results) => {
          if (error) {
            console.error('Erro ao executar a consulta:', error);
            res.status(500).json({ error: 'Erro ao obter os registros' });
            return;
          }

          registros = results;

          // Enviar registros atualizados para o cliente
          io.emit('registrosAtualizados', registros);

          res.json({ success: true });
        });
      });
    });
  });
});

// Rota para registrar a saída do cartão RFID
app.put('/dados/:id', [
  body('tipo').notEmpty().withMessage('O campo tipo é obrigatório.')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { tipo } = req.body;

  const data = new Date().toLocaleDateString();
  const hora = new Date().toLocaleTimeString();

  db.serialize(() => {
    db.get('SELECT tipo FROM cartoes WHERE cartao_id = ? ORDER BY ROWID DESC LIMIT 1', [id], (error, row) => {
      if (error) {
        console.error('Erro ao verificar a última interação:', error);
        res.status(500).json({ error: 'Erro ao verificar a última interação' });
        return;
      }

      let proximaInteracao;
      if (row && row.tipo === 'Entrada') {
        proximaInteracao = 'Saída';
      } else {
        proximaInteracao = 'Entrada';
      }

      const atualizarRegistro = {
        data_saida: data,
        hora_saida: hora,
        tipo: tipo,
        ultima_interacao: proximaInteracao
      };

      db.run('UPDATE cartoes SET data_saida = ?, hora_saida = ?, tipo = ?, ultima_interacao = ? WHERE cartao_id = ?', [atualizarRegistro.data_saida, atualizarRegistro.hora_saida, atualizarRegistro.tipo, atualizarRegistro.ultima_interacao, id], function (error) {
        if (error) {
          console.error('Erro ao atualizar o registro:', error);
          res.status(500).json({ error: 'Erro ao atualizar o registro' });
          return;
        }

        // Atualizar a lista de registros
        db.all('SELECT * FROM cartoes', (error, results) => {
          if (error) {
            console.error('Erro ao executar a consulta:', error);
            res.status(500).json({ error: 'Erro ao obter os registros' });
            return;
          }

          registros = results;

          // Enviar registros atualizados para o cliente
          io.emit('registrosAtualizados', registros);

          res.json({ success: true });
        });
      });
    });
  });
});

// Configuração do servidor HTTP e Socket.IO
const server = http.createServer(app);
const io = socketIO(server);

// Evento de conexão do cliente Socket.IO
io.on('connection', (socket) => {
  console.log('Novo cliente conectado');

  // Enviar registros para o cliente assim que conectar
  socket.emit('registrosAtualizados', registros);

  // Evento de desconexão do cliente Socket.IO
  socket.on('disconnect', () => {
    console.log('Cliente desconectado');
  });
});

// Iniciar o servidor
server.listen(port, () => {
  console.log(`Servidor iniciado na porta ${port}`);
});
