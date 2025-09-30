-- Exemplo MySQL/MariaDB
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    idade TINYINT UNSIGNED,
    salario DECIMAL(10,2),
    data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP,
    ativo BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO usuarios (nome, idade, salario, ativo) VALUES
('João Silva', 28, 5500.50, 1),
('Maria Santos', 34, 7200.00, 1),
('Pedro Costa', 25, 4800.75, 0),
('Ana Oliveira', 31, 6500.25, 1),
('Carlos Lima', 29, 5900.00, 1),
('Lucia Ferreira', 27, 5200.80, 1),
('Roberto Alves', 35, 8100.00, 1),
('Fernanda Silva', 26, 4900.50, 0),
('José Santos', 32, 6800.25, 1),
('Patricia Costa', 30, 6200.75, 1);