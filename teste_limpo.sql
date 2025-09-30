CREATE TABLE vendas_teste (
    id INTEGER PRIMARY KEY,
    vendedor TEXT NOT NULL,
    valor_venda REAL,
    regiao TEXT,
    meta_atingida INTEGER
);

INSERT INTO vendas_teste VALUES (1, 'Ana Silva', 2500.00, 'Sudeste', 1);
INSERT INTO vendas_teste VALUES (2, 'Carlos Santos', 1500.50, 'Sul', 0);
INSERT INTO vendas_teste VALUES (3, 'Maria Costa', 2999.99, 'Norte', 1);
INSERT INTO vendas_teste VALUES (4, 'João Oliveira', 1200.00, 'Nordeste', 0);
INSERT INTO vendas_teste VALUES (5, 'Ana Silva', 2807.75, 'Sudeste', 1);
INSERT INTO vendas_teste VALUES (6, 'Pedro Lima', 1800.00, 'Centro-Oeste', 1);
INSERT INTO vendas_teste VALUES (7, 'Carlos Santos', 4502.25, 'Sul', 1);
INSERT INTO vendas_teste VALUES (8, 'Lucia Ferreira', 3200.00, 'Sudeste', 1);
INSERT INTO vendas_teste VALUES (9, 'Maria Costa', 1500.00, 'Norte', 1);
INSERT INTO vendas_teste VALUES (10, 'Roberto Alves', 6509.99, 'Nordeste', 1);
INSERT INTO vendas_teste VALUES (11, 'Ana Silva', 8905.50, 'Sudeste', 1);
INSERT INTO vendas_teste VALUES (12, 'João Oliveira', 4207.75, 'Nordeste', 0);
INSERT INTO vendas_teste VALUES (13, 'Pedro Lima', 5800.00, 'Centro-Oeste', 1);
INSERT INTO vendas_teste VALUES (14, 'Lucia Ferreira', 1802.25, 'Sudeste', 1);
INSERT INTO vendas_teste VALUES (15, 'Carlos Santos', 3509.99, 'Sul', 1);
INSERT INTO vendas_teste VALUES (16, 'Maria Costa', 4599.90, 'Norte', 1);
INSERT INTO vendas_teste VALUES (17, 'Roberto Alves', 3555.50, 'Nordeste', 0);
INSERT INTO vendas_teste VALUES (18, 'Ana Silva', 2900.00, 'Sudeste', 1);
INSERT INTO vendas_teste VALUES (19, 'Pedro Lima', 1207.75, 'Centro-Oeste', 1);
INSERT INTO vendas_teste VALUES (20, 'João Oliveira', 4805.50, 'Nordeste', 1);