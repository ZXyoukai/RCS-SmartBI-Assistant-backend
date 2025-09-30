-- Exemplo de arquivo SQL para teste
-- Cria uma tabela com dados similares ao Iris dataset

CREATE TABLE iris_data (
    id INTEGER PRIMARY KEY,
    sepal_length REAL,
    sepal_width REAL,
    petal_length REAL,
    petal_width REAL,
    species INTEGER
);

INSERT INTO iris_data (sepal_length, sepal_width, petal_length, petal_width, species) VALUES
(5.1, 3.5, 1.4, 0.2, 0),
(4.9, 3.0, 1.4, 0.2, 0),
(4.7, 3.2, 1.3, 0.2, 0),
(4.6, 3.1, 1.5, 0.2, 0),
(5.0, 3.6, 1.4, 0.2, 0),
(7.0, 3.2, 4.7, 1.4, 1),
(6.4, 3.2, 4.5, 1.5, 1),
(6.9, 3.1, 4.9, 1.5, 1),
(5.5, 2.3, 4.0, 1.3, 1),
(6.5, 2.8, 4.6, 1.5, 1),
(6.3, 3.3, 6.0, 2.5, 2),
(5.8, 2.7, 5.1, 1.9, 2),
(7.1, 3.0, 5.9, 2.1, 2),
(6.3, 2.9, 5.6, 1.8, 2),
(6.5, 3.0, 5.8, 2.2, 2);