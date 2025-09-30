-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Tempo de geração: 29/09/2025 às 21:10
-- Versão do servidor: 10.4.32-MariaDB
-- Versão do PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `angokima`
--

-- --------------------------------------------------------

--
-- Estrutura para tabela `affiliates`
--

CREATE TABLE `affiliates` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `status` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `affiliates`
--

INSERT INTO `affiliates` (`id`, `user_id`, `status`, `created_at`, `updated_at`, `deleted_at`) VALUES
('a3e41329-3d89-4cbe-96eb-9d63846a76a9', '6cc9f6ba-b5f1-4107-9b22-253b948d859b', 0, '2025-05-02 11:08:52', '2025-05-02 11:08:52', NULL);

-- --------------------------------------------------------

--
-- Estrutura para tabela `affiliate_orders`
--

CREATE TABLE `affiliate_orders` (
  `id` char(36) NOT NULL,
  `affiliate_id` char(36) NOT NULL,
  `order_id` char(36) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `affiliate_products`
--

CREATE TABLE `affiliate_products` (
  `id` char(36) NOT NULL,
  `affiliate_id` char(36) NOT NULL,
  `product_id` char(36) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `affiliate_products`
--

INSERT INTO `affiliate_products` (`id`, `affiliate_id`, `product_id`, `created_at`, `updated_at`, `deleted_at`) VALUES
('ef4713d2-d3fa-4145-8bbb-3a14baec86ab', 'a3e41329-3d89-4cbe-96eb-9d63846a76a9', '8c78c12f-c5fe-4730-a90c-6f6c0dcce87c', '2025-05-02 11:09:47', '2025-05-02 11:09:47', NULL);

-- --------------------------------------------------------

--
-- Estrutura para tabela `banners`
--

CREATE TABLE `banners` (
  `id` char(36) NOT NULL,
  `image_path` varchar(255) NOT NULL,
  `title` longtext NOT NULL,
  `description` longtext NOT NULL,
  `status` enum('0','1') NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `carts`
--

CREATE TABLE `carts` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `status` enum('0','1') NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `cart_products`
--

CREATE TABLE `cart_products` (
  `id` char(36) NOT NULL,
  `quantity` int(11) NOT NULL,
  `product_id` char(36) NOT NULL,
  `cart_id` char(36) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `color_id` char(36) NOT NULL,
  `size_id` char(36) NOT NULL,
  `discount` double NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `categories`
--

CREATE TABLE `categories` (
  `id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `image_path` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `categories`
--

INSERT INTO `categories` (`id`, `name`, `created_at`, `updated_at`, `deleted_at`, `image_path`) VALUES
('4f8cf9a3-d7d4-4f69-9ded-4e9c079dee19', 'Roupas e Acessórios', '2025-05-02 11:02:11', '2025-05-02 11:02:11', NULL, '/storage/categories/173c6e832b2d78751f37b773d92adc55.jpg');

-- --------------------------------------------------------

--
-- Estrutura para tabela `comissions`
--

CREATE TABLE `comissions` (
  `id` char(36) NOT NULL,
  `affiliate_id` char(36) NOT NULL,
  `comission` double NOT NULL,
  `final_comission` double NOT NULL,
  `platform_comission` double NOT NULL,
  `status` enum('0','1') NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `debits`
--

CREATE TABLE `debits` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `value` double NOT NULL,
  `status` enum('0','1','2') NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `debits`
--

INSERT INTO `debits` (`id`, `user_id`, `value`, `status`, `created_at`, `updated_at`, `deleted_at`) VALUES
('d4045308-cdb3-4acd-8d2f-d1667fb579fb', 'dcca6521-150f-48fc-8129-0be890e41fdc', 1000, '0', '2025-05-02 11:14:11', '2025-05-02 11:14:11', NULL);

-- --------------------------------------------------------

--
-- Estrutura para tabela `failed_jobs`
--

CREATE TABLE `failed_jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `uuid` varchar(255) NOT NULL,
  `connection` text NOT NULL,
  `queue` text NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `financials`
--

CREATE TABLE `financials` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `IBAN` varchar(255) NOT NULL,
  `bank` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `image_products`
--

CREATE TABLE `image_products` (
  `id` char(36) NOT NULL,
  `path` longtext NOT NULL,
  `product_id` char(36) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `image_products`
--

INSERT INTO `image_products` (`id`, `path`, `product_id`, `created_at`, `updated_at`, `deleted_at`) VALUES
('323de308-69af-4276-bd45-5f459761908f', '/storage/products/2fe6b5cfcaf94a0d71c4f99c7b107832.jpg', '8c78c12f-c5fe-4730-a90c-6f6c0dcce87c', '2025-05-02 11:04:13', '2025-05-02 11:04:13', NULL),
('51810d39-3398-4f78-a38f-38586541a4fa', '/storage/products/44ae3afc208edac9939a88c0f2b80943.jpg', '8c78c12f-c5fe-4730-a90c-6f6c0dcce87c', '2025-05-02 11:04:13', '2025-05-02 11:04:13', NULL);

-- --------------------------------------------------------

--
-- Estrutura para tabela `kimador_comissions`
--

CREATE TABLE `kimador_comissions` (
  `id` char(36) NOT NULL,
  `seller_id` char(36) NOT NULL,
  `comission` double(8,2) NOT NULL,
  `status` enum('unpaid','paid') NOT NULL DEFAULT 'unpaid',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `migrations`
--

CREATE TABLE `migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '2014_10_12_000000_create_users_table', 1),
(2, '2014_10_12_100000_create_password_reset_tokens_table', 1),
(3, '2014_10_12_100000_create_password_resets_table', 1),
(4, '2019_08_19_000000_create_failed_jobs_table', 1),
(5, '2019_12_14_000001_create_personal_access_tokens_table', 1),
(6, '2024_10_27_181129_create_sellers_table', 1),
(7, '2024_10_28_180750_create_affiliates_table', 1),
(8, '2024_10_29_180729_create_categories_table', 1),
(9, '2024_10_29_180738_create_products_table', 1),
(10, '2024_10_29_180810_create_affiliate_products_table', 1),
(11, '2024_10_29_180858_create_financials_table', 1),
(12, '2024_10_29_181649_create_image_products_table', 1),
(13, '2024_10_29_182253_create_orders_table', 1),
(14, '2024_10_29_182521_create_comissions_table', 1),
(15, '2024_10_29_182539_create_debits_table', 1),
(16, '2024_10_29_183028_create_payment_requests_table', 1),
(17, '2024_10_29_183029_create_payments_table', 1),
(18, '2024_11_09_072732_create_affiliate_orders_table', 1),
(19, '2024_11_09_145801_create_platform_payments_table', 1),
(20, '2024_11_09_184533_create_payment_data_table', 1),
(21, '2024_11_09_184546_create_platform_payment_data_table', 1),
(22, '2024_11_12_052743_alter_table_order', 1),
(23, '2024_11_15_125315_alter_table_user', 1),
(24, '2025_01_05_083142_create_carts_table', 1),
(25, '2025_01_05_110718_alter_table_orders', 1),
(26, '2025_01_05_111416_create_cart_products_table', 1),
(27, '2025_01_05_113157_create_banners_table', 1),
(28, '2025_01_05_113221_create_promotions_table', 1),
(29, '2025_01_05_115418_create_product_colors_table', 1),
(30, '2025_01_08_092636_alter_table_product', 1),
(31, '2025_01_08_094839_alter_table_category', 1),
(32, '2025_01_08_194508_create_product_sizes_table', 1),
(33, '2025_01_09_044013_alter_table_product', 1),
(34, '2025_01_09_081855_alter_table_promotion', 1),
(35, '2025_01_09_082417_alter_table_cart_product', 1),
(36, '2025_01_09_092038_alter_table_order', 1),
(37, '2025_01_09_104413_alter_table_order', 1),
(38, '2025_01_09_221929_alter_table_cart_product', 1),
(39, '2025_03_16_183840_alter_table_orders', 1),
(40, '2025_03_21_144357_add_order_number_to_orders_table', 1),
(41, '2025_04_16_144926_create_seller_types_table', 1),
(42, '2025_04_16_145143_add_seller_type_id_to_sellers_table', 1),
(43, '2025_05_02_114259_create_kimador_comissions_table', 1);

-- --------------------------------------------------------

--
-- Estrutura para tabela `orders`
--

CREATE TABLE `orders` (
  `id` char(36) NOT NULL,
  `number` int(11) NOT NULL,
  `client_name` varchar(255) NOT NULL,
  `delivery_date` date NOT NULL,
  `delivery_adress` varchar(255) NOT NULL,
  `delivery_hour` time NOT NULL,
  `telefone` int(11) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 0,
  `total_price` double NOT NULL,
  `status` varchar(255) NOT NULL DEFAULT '0',
  `payment_method` varchar(255) NOT NULL,
  `affiliate_products_id` char(36) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `real_total_price` double NOT NULL,
  `cart_id` char(36) DEFAULT NULL,
  `order_type` varchar(255) DEFAULT NULL,
  `delivery_type` varchar(255) DEFAULT NULL,
  `discount` double DEFAULT NULL,
  `order_number` bigint(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `orders`
--

INSERT INTO `orders` (`id`, `number`, `client_name`, `delivery_date`, `delivery_adress`, `delivery_hour`, `telefone`, `quantity`, `total_price`, `status`, `payment_method`, `affiliate_products_id`, `created_at`, `updated_at`, `deleted_at`, `real_total_price`, `cart_id`, `order_type`, `delivery_type`, `discount`, `order_number`) VALUES
('3756dffd-18cf-4357-af91-65753c985da3', 629832, 'Cristina Mateus', '2025-05-03', 'Angola, Luanda, Bairro Palanca, Rua 0 0', '12:00:00', 922773978, 3, 46500, '3', 'CASH', 'ef4713d2-d3fa-4145-8bbb-3a14baec86ab', '2025-05-02 11:10:45', '2025-05-02 11:14:11', NULL, 30000, NULL, NULL, NULL, NULL, 1);

-- --------------------------------------------------------

--
-- Estrutura para tabela `password_resets`
--

CREATE TABLE `password_resets` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `payments`
--

CREATE TABLE `payments` (
  `id` char(36) NOT NULL,
  `affiliate_id` char(36) NOT NULL,
  `payment_request_id` char(36) NOT NULL,
  `number` int(11) NOT NULL,
  `value` int(11) NOT NULL,
  `path` longtext NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `payment_data`
--

CREATE TABLE `payment_data` (
  `id` char(36) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `entity` varchar(255) NOT NULL,
  `iban` varchar(255) NOT NULL,
  `express_number` varchar(255) DEFAULT NULL,
  `user_id` char(36) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `payment_requests`
--

CREATE TABLE `payment_requests` (
  `id` char(36) NOT NULL,
  `comission_id` char(36) NOT NULL,
  `status` enum('0','1') NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `personal_access_tokens`
--

CREATE TABLE `personal_access_tokens` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `tokenable_type` varchar(255) NOT NULL,
  `tokenable_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `token` varchar(64) NOT NULL,
  `abilities` text DEFAULT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `platform_payments`
--

CREATE TABLE `platform_payments` (
  `id` char(36) NOT NULL,
  `number` int(11) NOT NULL,
  `path` varchar(255) NOT NULL,
  `value` varchar(255) NOT NULL,
  `status` enum('0','1','2') NOT NULL DEFAULT '0',
  `debit_id` char(36) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `platform_payment_data`
--

CREATE TABLE `platform_payment_data` (
  `id` char(36) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `entity` varchar(255) NOT NULL,
  `iban` varchar(255) NOT NULL,
  `express_number` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `products`
--

CREATE TABLE `products` (
  `id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` longtext NOT NULL,
  `price` double NOT NULL,
  `price_platform` double NOT NULL,
  `comission` double NOT NULL,
  `quantity` int(11) NOT NULL,
  `seller_id` char(36) NOT NULL,
  `category_id` char(36) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `status` enum('0','1','2') NOT NULL DEFAULT '0',
  `condition` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `products`
--

INSERT INTO `products` (`id`, `name`, `description`, `price`, `price_platform`, `comission`, `quantity`, `seller_id`, `category_id`, `created_at`, `updated_at`, `deleted_at`, `status`, `condition`) VALUES
('8c78c12f-c5fe-4730-a90c-6f6c0dcce87c', 'Blusa Femenina', 'Blusa Femenina', 10000, 15500, 4000, 9, 'd7254373-027c-490e-9485-246a0868bb9d', '4f8cf9a3-d7d4-4f69-9ded-4e9c079dee19', '2025-05-02 11:04:13', '2025-05-02 11:14:11', NULL, '1', 'Novo');

-- --------------------------------------------------------

--
-- Estrutura para tabela `product_colors`
--

CREATE TABLE `product_colors` (
  `id` char(36) NOT NULL,
  `color` longtext NOT NULL,
  `product_id` char(36) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `product_colors`
--

INSERT INTO `product_colors` (`id`, `color`, `product_id`, `created_at`, `updated_at`) VALUES
('413acd09-f5b9-423e-8b49-740eea4904fb', '#9e9e9e', '8c78c12f-c5fe-4730-a90c-6f6c0dcce87c', '2025-05-02 11:04:13', '2025-05-02 11:04:13');

-- --------------------------------------------------------

--
-- Estrutura para tabela `product_sizes`
--

CREATE TABLE `product_sizes` (
  `id` char(36) NOT NULL,
  `size` varchar(255) NOT NULL,
  `price` double DEFAULT NULL,
  `product_id` char(36) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `product_sizes`
--

INSERT INTO `product_sizes` (`id`, `size`, `price`, `product_id`, `created_at`, `updated_at`) VALUES
('25b248aa-e0f2-4752-9cb7-36560de233cd', 'XXXL', NULL, '8c78c12f-c5fe-4730-a90c-6f6c0dcce87c', '2025-05-02 11:04:13', '2025-05-02 11:04:13'),
('33f65ebe-61f8-4ae5-b20c-e5b56b8ebae1', 'M', NULL, '8c78c12f-c5fe-4730-a90c-6f6c0dcce87c', '2025-05-02 11:04:13', '2025-05-02 11:04:13'),
('3f6fbda4-8534-4168-a04d-2e0128479eb6', 'XL', NULL, '8c78c12f-c5fe-4730-a90c-6f6c0dcce87c', '2025-05-02 11:04:13', '2025-05-02 11:04:13'),
('79b6263a-de50-44b1-9a61-829045401814', 'L', NULL, '8c78c12f-c5fe-4730-a90c-6f6c0dcce87c', '2025-05-02 11:04:13', '2025-05-02 11:04:13'),
('bc28c380-9c23-4701-9bd2-4766dfa6dd15', 'XXL', NULL, '8c78c12f-c5fe-4730-a90c-6f6c0dcce87c', '2025-05-02 11:04:13', '2025-05-02 11:04:13');

-- --------------------------------------------------------

--
-- Estrutura para tabela `promotions`
--

CREATE TABLE `promotions` (
  `id` char(36) NOT NULL,
  `title` longtext NOT NULL,
  `description` longtext NOT NULL,
  `discount` double NOT NULL,
  `status` enum('0','1') NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `product_id` char(36) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `sellers`
--

CREATE TABLE `sellers` (
  `id` char(36) NOT NULL,
  `seller_type_id` char(36) NOT NULL,
  `status` int(11) NOT NULL DEFAULT 0,
  `user_id` char(36) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `sellers`
--

INSERT INTO `sellers` (`id`, `seller_type_id`, `status`, `user_id`, `created_at`, `updated_at`, `deleted_at`) VALUES
('d7254373-027c-490e-9485-246a0868bb9d', 'f0d8d3bb-fa29-4d84-bafd-85d8017311a4', 0, 'dcca6521-150f-48fc-8129-0be890e41fdc', '2025-05-02 10:54:38', '2025-05-02 10:54:38', NULL);

-- --------------------------------------------------------

--
-- Estrutura para tabela `seller_types`
--

CREATE TABLE `seller_types` (
  `id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `seller_types`
--

INSERT INTO `seller_types` (`id`, `name`, `description`, `deleted_at`, `created_at`, `updated_at`) VALUES
('9043be07-493a-44ac-ba22-618e94a3637b', 'Kimasta', 'O dono da loja, que gerencia e controla os produtos na AngoKima.', NULL, '2025-05-02 10:53:59', '2025-05-02 10:53:59'),
('f0d8d3bb-fa29-4d84-bafd-85d8017311a4', 'Kimador', 'O intermediador da AngoKima, responsável por cadastrar produtos.', NULL, '2025-05-02 10:53:59', '2025-05-02 10:53:59');

-- --------------------------------------------------------

--
-- Estrutura para tabela `users`
--

CREATE TABLE `users` (
  `id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `image_path` varchar(255) DEFAULT NULL,
  `status` varchar(255) NOT NULL DEFAULT '1',
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(255) NOT NULL,
  `bi` varchar(255) NOT NULL,
  `bi_path` longtext DEFAULT NULL,
  `user_type` enum('admin','affiliate','seller') NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `code` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `users`
--

INSERT INTO `users` (`id`, `name`, `image_path`, `status`, `email`, `phone`, `bi`, `bi_path`, `user_type`, `email_verified_at`, `password`, `remember_token`, `created_at`, `updated_at`, `deleted_at`, `code`) VALUES
('5d3f4972-f2ec-45c5-a233-10e19112df0f', 'Administrador', NULL, '1', 'admin@gmail.com', '945006657', 'bi', NULL, 'admin', '2025-05-02 10:53:59', '$2y$12$uo3B.VAFcJ0aidjMUh5BLOEYuKgwXNfi40zeFTvEIH.xXcSLKNkkG', 'rzlRlSSUN0', '2025-05-02 10:53:59', '2025-05-02 10:53:59', NULL, NULL),
('6cc9f6ba-b5f1-4107-9b22-253b948d859b', 'GOMES MATEUS', NULL, '1', 'gomesfranciscomateus18@gmail.com', '957572348', '0004019LA040', '/storage/users/bi/4b7c1d76f4063fe8d97630d395321885.png', 'affiliate', NULL, '$2y$12$cqAaf74OXc3yiCvLzhDmjOgGhUUHCMAxFG2oAmKygNY4889VVohKO', NULL, '2025-05-02 11:08:52', '2025-05-02 11:08:52', NULL, NULL),
('dcca6521-150f-48fc-8129-0be890e41fdc', 'Gomes Francisco Mateus', NULL, '1', 'gomesfranciscomateus20@gmail.com', '941135188', '003296573LA034', '/storage/users/bi/d16db3e2040366f73c89a4c90a111ada.png', 'seller', NULL, '$2y$12$sGlJCn24tY7yyaufRuhRDu7LhMKZhuI9qLN.D28L8MtP7PbbfvdaK', NULL, '2025-05-02 10:54:38', '2025-05-02 10:54:38', NULL, NULL);

--
-- Índices para tabelas despejadas
--

--
-- Índices de tabela `affiliates`
--
ALTER TABLE `affiliates`
  ADD PRIMARY KEY (`id`),
  ADD KEY `affiliates_user_id_foreign` (`user_id`);

--
-- Índices de tabela `affiliate_orders`
--
ALTER TABLE `affiliate_orders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `affiliate_orders_affiliate_id_foreign` (`affiliate_id`),
  ADD KEY `affiliate_orders_order_id_foreign` (`order_id`);

--
-- Índices de tabela `affiliate_products`
--
ALTER TABLE `affiliate_products`
  ADD PRIMARY KEY (`id`),
  ADD KEY `affiliate_products_affiliate_id_foreign` (`affiliate_id`),
  ADD KEY `affiliate_products_product_id_foreign` (`product_id`);

--
-- Índices de tabela `banners`
--
ALTER TABLE `banners`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `carts`
--
ALTER TABLE `carts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `carts_user_id_foreign` (`user_id`);

--
-- Índices de tabela `cart_products`
--
ALTER TABLE `cart_products`
  ADD PRIMARY KEY (`id`),
  ADD KEY `cart_products_product_id_foreign` (`product_id`),
  ADD KEY `cart_products_cart_id_foreign` (`cart_id`),
  ADD KEY `cart_products_color_id_foreign` (`color_id`),
  ADD KEY `cart_products_size_id_foreign` (`size_id`);

--
-- Índices de tabela `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `categories_name_unique` (`name`);

--
-- Índices de tabela `comissions`
--
ALTER TABLE `comissions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `comissions_affiliate_id_foreign` (`affiliate_id`);

--
-- Índices de tabela `debits`
--
ALTER TABLE `debits`
  ADD PRIMARY KEY (`id`),
  ADD KEY `debits_user_id_foreign` (`user_id`);

--
-- Índices de tabela `failed_jobs`
--
ALTER TABLE `failed_jobs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`);

--
-- Índices de tabela `financials`
--
ALTER TABLE `financials`
  ADD PRIMARY KEY (`id`),
  ADD KEY `financials_user_id_foreign` (`user_id`);

--
-- Índices de tabela `image_products`
--
ALTER TABLE `image_products`
  ADD PRIMARY KEY (`id`),
  ADD KEY `image_products_product_id_foreign` (`product_id`);

--
-- Índices de tabela `kimador_comissions`
--
ALTER TABLE `kimador_comissions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `kimador_comissions_seller_id_foreign` (`seller_id`);

--
-- Índices de tabela `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `orders_order_number_unique` (`order_number`),
  ADD KEY `orders_affiliate_products_id_foreign` (`affiliate_products_id`),
  ADD KEY `orders_cart_id_foreign` (`cart_id`);

--
-- Índices de tabela `password_resets`
--
ALTER TABLE `password_resets`
  ADD KEY `password_resets_email_index` (`email`);

--
-- Índices de tabela `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`email`);

--
-- Índices de tabela `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `payments_affiliate_id_foreign` (`affiliate_id`),
  ADD KEY `payments_payment_request_id_foreign` (`payment_request_id`);

--
-- Índices de tabela `payment_data`
--
ALTER TABLE `payment_data`
  ADD PRIMARY KEY (`id`),
  ADD KEY `payment_data_user_id_foreign` (`user_id`);

--
-- Índices de tabela `payment_requests`
--
ALTER TABLE `payment_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `payment_requests_comission_id_foreign` (`comission_id`);

--
-- Índices de tabela `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  ADD KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`);

--
-- Índices de tabela `platform_payments`
--
ALTER TABLE `platform_payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `platform_payments_debit_id_foreign` (`debit_id`);

--
-- Índices de tabela `platform_payment_data`
--
ALTER TABLE `platform_payment_data`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD KEY `products_seller_id_foreign` (`seller_id`),
  ADD KEY `products_category_id_foreign` (`category_id`);

--
-- Índices de tabela `product_colors`
--
ALTER TABLE `product_colors`
  ADD PRIMARY KEY (`id`),
  ADD KEY `product_colors_product_id_foreign` (`product_id`);

--
-- Índices de tabela `product_sizes`
--
ALTER TABLE `product_sizes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `product_sizes_product_id_foreign` (`product_id`);

--
-- Índices de tabela `promotions`
--
ALTER TABLE `promotions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `promotions_product_id_foreign` (`product_id`);

--
-- Índices de tabela `sellers`
--
ALTER TABLE `sellers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sellers_user_id_foreign` (`user_id`),
  ADD KEY `sellers_seller_type_id_foreign` (`seller_type_id`);

--
-- Índices de tabela `seller_types`
--
ALTER TABLE `seller_types`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `seller_types_name_unique` (`name`);

--
-- Índices de tabela `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_phone_unique` (`phone`),
  ADD UNIQUE KEY `users_bi_unique` (`bi`),
  ADD UNIQUE KEY `users_email_unique` (`email`);

--
-- AUTO_INCREMENT para tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `failed_jobs`
--
ALTER TABLE `failed_jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=44;

--
-- AUTO_INCREMENT de tabela `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- Restrições para tabelas despejadas
--

--
-- Restrições para tabelas `affiliates`
--
ALTER TABLE `affiliates`
  ADD CONSTRAINT `affiliates_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Restrições para tabelas `affiliate_orders`
--
ALTER TABLE `affiliate_orders`
  ADD CONSTRAINT `affiliate_orders_affiliate_id_foreign` FOREIGN KEY (`affiliate_id`) REFERENCES `affiliates` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `affiliate_orders_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Restrições para tabelas `affiliate_products`
--
ALTER TABLE `affiliate_products`
  ADD CONSTRAINT `affiliate_products_affiliate_id_foreign` FOREIGN KEY (`affiliate_id`) REFERENCES `affiliates` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `affiliate_products_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Restrições para tabelas `carts`
--
ALTER TABLE `carts`
  ADD CONSTRAINT `carts_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Restrições para tabelas `cart_products`
--
ALTER TABLE `cart_products`
  ADD CONSTRAINT `cart_products_cart_id_foreign` FOREIGN KEY (`cart_id`) REFERENCES `carts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `cart_products_color_id_foreign` FOREIGN KEY (`color_id`) REFERENCES `product_colors` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `cart_products_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `cart_products_size_id_foreign` FOREIGN KEY (`size_id`) REFERENCES `product_sizes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Restrições para tabelas `comissions`
--
ALTER TABLE `comissions`
  ADD CONSTRAINT `comissions_affiliate_id_foreign` FOREIGN KEY (`affiliate_id`) REFERENCES `affiliates` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Restrições para tabelas `debits`
--
ALTER TABLE `debits`
  ADD CONSTRAINT `debits_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Restrições para tabelas `financials`
--
ALTER TABLE `financials`
  ADD CONSTRAINT `financials_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Restrições para tabelas `image_products`
--
ALTER TABLE `image_products`
  ADD CONSTRAINT `image_products_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Restrições para tabelas `kimador_comissions`
--
ALTER TABLE `kimador_comissions`
  ADD CONSTRAINT `kimador_comissions_seller_id_foreign` FOREIGN KEY (`seller_id`) REFERENCES `sellers` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_affiliate_products_id_foreign` FOREIGN KEY (`affiliate_products_id`) REFERENCES `affiliate_products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `orders_cart_id_foreign` FOREIGN KEY (`cart_id`) REFERENCES `carts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Restrições para tabelas `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_affiliate_id_foreign` FOREIGN KEY (`affiliate_id`) REFERENCES `affiliates` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `payments_payment_request_id_foreign` FOREIGN KEY (`payment_request_id`) REFERENCES `payment_requests` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Restrições para tabelas `payment_data`
--
ALTER TABLE `payment_data`
  ADD CONSTRAINT `payment_data_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Restrições para tabelas `payment_requests`
--
ALTER TABLE `payment_requests`
  ADD CONSTRAINT `payment_requests_comission_id_foreign` FOREIGN KEY (`comission_id`) REFERENCES `comissions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Restrições para tabelas `platform_payments`
--
ALTER TABLE `platform_payments`
  ADD CONSTRAINT `platform_payments_debit_id_foreign` FOREIGN KEY (`debit_id`) REFERENCES `debits` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Restrições para tabelas `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `products_category_id_foreign` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `products_seller_id_foreign` FOREIGN KEY (`seller_id`) REFERENCES `sellers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Restrições para tabelas `product_colors`
--
ALTER TABLE `product_colors`
  ADD CONSTRAINT `product_colors_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Restrições para tabelas `product_sizes`
--
ALTER TABLE `product_sizes`
  ADD CONSTRAINT `product_sizes_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Restrições para tabelas `promotions`
--
ALTER TABLE `promotions`
  ADD CONSTRAINT `promotions_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Restrições para tabelas `sellers`
--
ALTER TABLE `sellers`
  ADD CONSTRAINT `sellers_seller_type_id_foreign` FOREIGN KEY (`seller_type_id`) REFERENCES `seller_types` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `sellers_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
