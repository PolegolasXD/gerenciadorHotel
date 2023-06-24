document.addEventListener('DOMContentLoaded', () => {
  const cadastroForm = document.getElementById('formulario');
  const cadastroBtn = document.getElementById('cadastroBtn');
  const sucessoMsg = document.getElementById('sucessoMsg');

  function exibirMensagemSucesso() {
    sucessoMsg.style.display = 'block';
    cadastroForm.reset();
    setTimeout(() => {
      sucessoMsg.style.display = 'none';
    }, 3000);
  }

  function cadastrarCliente(e) {
    e.preventDefault();

    const nomeInput = document.getElementById('nome');
    const emailInput = document.getElementById('email');
    const telefoneInput = document.getElementById('telefone');

    const novoCliente = {
      nome: nomeInput.value.trim(),
      email: emailInput.value.trim(),
      telefone: telefoneInput.value.trim()
    };

    fetch('/clientes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(novoCliente)
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          exibirMensagemSucesso();
        }
      })
      .catch(error => console.log(error));
  }

  cadastroForm.addEventListener('submit', cadastrarCliente);
});
