-- Exemplo de SQL misto com diferentes sintaxes
-- Compatível com: MySQL, PostgreSQL, MariaDB

-- Criação da tabela principal
CREATE TABLE vendas_analise (
    id INTEGER PRIMARY KEY,
    vendedor TEXT NOT NULL,
    produto TEXT,
    categoria_id INTEGER,
    valor_venda REAL,
    quantidade INTEGER DEFAULT 1,
    comissao REAL,
    data_venda TEXT,
    regiao TEXT,
    cliente_tipo INTEGER,
    performance_score REAL,
    meta_atingida INTEGER
);

-- Inserção de dados para análise
INSERT INTO vendas_analise (id, vendedor, produto, categoria_id, valor_venda, quantidade, comissao, data_venda, regiao, cliente_tipo, performance_score, meta_atingida) VALUES
(1, 'Ana Silva', 'Notebook Dell', 1, 2500.00, 1, 250.00, '2024-01-15 10:30:00', 'Sudeste', 1, 0.85, 1),
(2, 'Carlos Santos', 'Mouse Gamer', 2, 150.50, 3, 45.15, '2024-01-16 14:20:00', 'Sul', 0, 0.72, 0),
(3, 'Maria Costa', 'Teclado RGB', 2, 299.99, 2, 60.00, '2024-01-17 09:15:00', 'Norte', 1, 0.91, 1),
(4, 'João Oliveira', 'Monitor 27pol', 1, 1200.00, 1, 180.00, '2024-01-18 16:45:00', 'Nordeste', 0, 0.68, 0),
(5, 'Ana Silva', 'SSD 500GB', 3, 280.75, 4, 112.30, '2024-01-19 11:30:00', 'Sudeste', 1, 0.88, 1),
(6, 'Pedro Lima', 'Placa Vídeo', 1, 1800.00, 1, 270.00, '2024-01-20 13:00:00', 'Centro-Oeste', 1, 0.95, 1),
(7, 'Carlos Santos', 'Headset Pro', 4, 450.25, 1, 67.54, '2024-01-21 15:30:00', 'Sul', 0, 0.75, 1),
(8, 'Lucia Ferreira', 'Webcam 4K', 4, 320.00, 2, 64.00, '2024-01-22 10:00:00', 'Sudeste', 0, 0.82, 1),
(9, 'Maria Costa', 'Smartphone', 5, 1500.00, 1, 225.00, '2024-01-23 12:15:00', 'Norte', 1, 0.93, 1),
(10, 'Roberto Alves', 'Tablet 10pol', 5, 650.99, 1, 97.65, '2024-01-24 14:45:00', 'Nordeste', 0, 0.79, 1),
(11, 'Ana Silva', 'Impressora', 6, 890.50, 1, 133.58, '2024-01-25 09:30:00', 'Sudeste', 1, 0.87, 1),
(12, 'João Oliveira', 'Scanner Pro', 6, 420.75, 1, 42.08, '2024-01-26 16:00:00', 'Nordeste', 0, 0.71, 0),
(13, 'Pedro Lima', 'Roteador Mesh', 7, 580.00, 2, 174.00, '2024-01-27 11:45:00', 'Centro-Oeste', 1, 0.89, 1),
(14, 'Lucia Ferreira', 'Switch 8P', 7, 180.25, 3, 54.08, '2024-01-28 13:20:00', 'Sudeste', 0, 0.76, 1),
(15, 'Carlos Santos', 'HD Externo', 3, 350.99, 2, 70.20, '2024-01-29 15:10:00', 'Sul', 1, 0.83, 1),
(16, 'Maria Costa', 'Pen Drive 64GB', 3, 45.90, 8, 36.72, '2024-01-30 10:25:00', 'Norte', 0, 0.94, 1),
(17, 'Roberto Alves', 'Cabo HDMI', 8, 35.50, 5, 17.75, '2024-01-31 12:30:00', 'Nordeste', 0, 0.65, 0),
(18, 'Ana Silva', 'Fonte 600W', 8, 290.00, 1, 43.50, '2024-02-01 14:15:00', 'Sudeste', 1, 0.86, 1),
(19, 'Pedro Lima', 'Cooler CPU', 8, 120.75, 2, 24.15, '2024-02-02 16:40:00', 'Centro-Oeste', 0, 0.78, 1),
(20, 'João Oliveira', 'Memoria RAM', 3, 480.50, 1, 72.08, '2024-02-03 09:50:00', 'Nordeste', 1, 0.81, 1);

-- Comentário final: Dataset pronto para análise de performance de vendas