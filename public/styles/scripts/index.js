document.addEventListener('DOMContentLoaded', () => {
  const registrosBody = document.getElementById('registros-body');
  let registros = [];

  function criarLinhaTabela(idCartao, dataEntrada, horaEntrada, dataSaida, horaSaida, tipo) {
    const novaLinha = document.createElement('tr');
    novaLinha.classList.add(tipo.toLowerCase());

    novaLinha.innerHTML = `
      <td>${idCartao}</td>
      <td>${dataEntrada}</td>
      <td>${horaEntrada}</td>
      <td>${dataSaida}</td>
      <td>${horaSaida}</td>
      <td>${tipo}</td>
    `;

    return novaLinha;
  }

  function atualizarTabelaRegistros() {
    registrosBody.innerHTML = '';

    registros.forEach(registro => {
      const novaLinha = criarLinhaTabela(
        registro.cartaoId,
        registro.dataEntrada,
        registro.horaEntrada,
        registro.dataSaida,
        registro.horaSaida,
        registro.tipo
      );
      registrosBody.appendChild(novaLinha);
    });
  }

  function registrarEntradaSaida(idCartao, tipo) {
    const dataAtual = new Date();
    const data = dataAtual.toLocaleDateString();
    const hora = dataAtual.toLocaleTimeString();

    const registroExistente = registros.find(r => r.cartaoId === idCartao && !r.dataSaida);
    if (registroExistente) {
      registroExistente.dataSaida = data;
      registroExistente.horaSaida = hora;
      registroExistente.tipo = tipo;
    } else {
      const novoRegistro = {
        cartaoId: idCartao,
        dataEntrada: data,
        horaEntrada: hora,
        dataSaida: '',
        horaSaida: '',
        tipo: tipo
      };
      registros.push(novoRegistro);
    }

    atualizarTabelaRegistros();
  }

  function enviarDados(e) {
    e.preventDefault();

    const idCartaoInput = document.getElementById('idCartao');
    const idCartao = idCartaoInput.value.trim();

    if (idCartao) {
      registrarEntradaSaida(idCartao, 'Entrada');

      fetch('/dados', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ conteudo: idCartao })
      })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            idCartaoInput.value = '';
            idCartaoInput.focus();
          }
        })
        .catch(error => console.log(error));
    }
  }

  function limparHistorico() {
    if (confirm('Tem certeza de que deseja limpar o histórico?')) {
      fetch('/limpar', {
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

  fetch('/dados')
    .then(response => response.json())
    .then(data => {
      registros = data.registros || [];
      atualizarTabelaRegistros();
    })
    .catch(error => console.log(error));

  const formulario = document.getElementById('formulario');
  formulario.addEventListener('submit', enviarDados);

  const limparHistoricoBtn = document.getElementById('limparHistoricoBtn');
  limparHistoricoBtn.addEventListener('click', limparHistorico);
});
