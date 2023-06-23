CREATE TABLE clientes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cartaoId VARCHAR(255) NOT NULL,
  dataEntrada DATE NOT NULL,
  horaEntrada TIME NOT NULL,
  dataSaida DATE,
  horaSaida TIME,
  tipo VARCHAR(20)
);
