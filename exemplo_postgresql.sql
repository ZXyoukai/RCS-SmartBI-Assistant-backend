-- Exemplo PostgreSQL
CREATE TABLE produtos (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    categoria_id INTEGER,
    preco DECIMAL(10,2),
    estoque INTEGER DEFAULT 0,
    descricao TEXT,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    disponivel BOOLEAN DEFAULT TRUE,
    tags TEXT[]
);

INSERT INTO produtos (nome, categoria_id, preco, estoque, disponivel) VALUES
('Notebook Gamer', 1, 2500.99, 15, TRUE),
('Mouse Wireless', 2, 89.90, 50, TRUE),
('Teclado Mecânico', 2, 299.99, 25, TRUE),
('Monitor 4K', 1, 1200.00, 8, TRUE),
('Headset Gaming', 3, 450.50, 20, TRUE),
('Webcam HD', 1, 180.75, 12, FALSE),
('Smartphone Pro', 4, 1800.00, 30, TRUE),
('Tablet 10pol', 4, 650.25, 18, TRUE),
('SSD 1TB', 5, 320.80, 40, TRUE),
('Placa de Vídeo', 1, 3200.99, 5, TRUE);