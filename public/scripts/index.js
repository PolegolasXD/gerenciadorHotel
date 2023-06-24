document.addEventListener('DOMContentLoaded', () => {
  const registrosBody = document.getElementById('registrosTable').getElementsByTagName('tbody')[0];
  let registros = [];

  function criarLinhaTabela(idCartao, dataEntrada, horaEntrada, dataSaida, horaSaida, tipo) {
    const novaLinha = document.createElement('tr');
    novaLinha.classList.add(tipo.toLowerCase());

    novaLinha.innerHTML = `
      <td>${idCartao}</td>
      <td class="data-entrada">${dataEntrada}</td>
      <td class="hora-entrada">${horaEntrada}</td>
      <td class="data-saida">${dataSaida}</td>
      <td class="hora-saida">${horaSaida}</td>
      <td>${tipo}</td>
    `;

    return novaLinha;
  }

  function atualizarTabelaRegistros() {
    registrosBody.innerHTML = '';

    registros.forEach(registro => {
      const novaLinha = criarLinhaTabela(
        registro.cartao_id,
        registro.data_entrada,
        registro.hora_entrada,
        registro.data_saida,
        registro.hora_saida,
        registro.tipo
      );
      registrosBody.appendChild(novaLinha);
    });
  }

  function registrarEntradaSaida(idCartao, tipo) {
    const dataAtual = new Date();
    const data = dataAtual.toLocaleDateString();
    const hora = dataAtual.toLocaleTimeString();

    const registroExistente = registros.find(r => r.cartao_id === idCartao && !r.data_saida);
    if (registroExistente) {
      if (tipo === 'Entrada') {
        registroExistente.data_saida = '';
        registroExistente.hora_saida = '';
      } else {
        registroExistente.data_saida = data;
        registroExistente.hora_saida = hora;
      }
      registroExistente.tipo = tipo;
    } else {
      const novoRegistro = {
        cartao_id: idCartao,
        data_entrada: data,
        hora_entrada: hora,
        data_saida: tipo === 'Entrada' ? '' : data,
        hora_saida: tipo === 'Entrada' ? '' : hora,
        tipo: tipo
      };
      registros.push(novoRegistro);
    }

    atualizarTabelaRegistros();
  }

  function adicionarDadosEntrada(idCartao, dataEntrada, horaEntrada) {
    const registroEntrada = registros.find(r => r.cartao_id === idCartao && r.tipo === 'Entrada');

    if (registroEntrada) {
      registroEntrada.data_entrada = dataEntrada;
      registroEntrada.hora_entrada = horaEntrada;
    } else {
      registrarEntradaSaida(idCartao, 'Entrada');
    }

    atualizarTabelaRegistros();
  }

  function enviarDados(e) {
    e.preventDefault();

    const idCartaoInput = document.getElementById('idCartao');
    const idCartao = idCartaoInput.value.trim();

    if (idCartao) {
      fetch('/dados', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: idCartao, tipo: 'Entrada' })
      })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            const dataAtual = new Date();
            const dataEntrada = dataAtual.toLocaleDateString();
            const horaEntrada = dataAtual.toLocaleTimeString();
            adicionarDadosEntrada(idCartao, dataEntrada, horaEntrada);

            idCartaoInput.value = '';
            idCartaoInput.focus();
          }
        })
        .catch(error => console.log(error));
    }
  }

  function limparHistorico() {
    if (confirm('Tem certeza de que deseja limpar o histórico?')) {
      fetch('/dados/limpar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            registros = [];
            atualizarTabelaRegistros();
          }
        })
        .catch(error => console.log(error));
    }
  }

  const socket = io();

  socket.on('registrosAtualizados', novosRegistros => {
    registros = novosRegistros;
    atualizarTabelaRegistros();
  });

  fetch('/dados')
    .then(response => response.json())
    .then(data => {
      registros = data.registros || [];
      atualizarTabelaRegistros();
    })
    .catch(error => console.log(error));

  const formulario = document.getElementById('formulario');
  formulario.addEventListener('submit', enviarDados);

  const limparBtn = document.getElementById('limparBtn');
  limparBtn.addEventListener('click', limparHistorico);
});
