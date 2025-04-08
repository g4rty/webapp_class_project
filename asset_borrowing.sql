-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Apr 08, 2025 at 02:54 PM
-- Server version: 10.4.28-MariaDB
-- PHP Version: 8.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `asset_borrowing`
--

-- --------------------------------------------------------

--
-- Table structure for table `borrow_requests`
--

CREATE TABLE `borrow_requests` (
  `id` smallint(5) UNSIGNED NOT NULL COMMENT 'request_id',
  `asset_id` int(11) NOT NULL,
  `borrow_date` date NOT NULL COMMENT 'date that received actual item == handover_by_id',
  `return_date` date NOT NULL COMMENT 'expected to return date',
  `status` enum('pending','approved','rejected','cancelled','timeout') NOT NULL DEFAULT 'pending',
  `request_date` date NOT NULL COMMENT 'date that req to borrowing',
  `returned_date` date DEFAULT NULL,
  `approve_by_id` smallint(5) UNSIGNED DEFAULT NULL,
  `handover_by_id` int(11) UNSIGNED DEFAULT NULL,
  `receiver_id` int(11) UNSIGNED DEFAULT NULL,
  `borrower_id` smallint(5) UNSIGNED NOT NULL,
  `reason` text NOT NULL COMMENT 'reason for borrowing'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `borrow_requests`
--

INSERT INTO `borrow_requests` (`id`, `asset_id`, `borrow_date`, `return_date`, `status`, `request_date`, `returned_date`, `approve_by_id`, `handover_by_id`, `receiver_id`, `borrower_id`, `reason`) VALUES
(10, 1, '2025-04-02', '2025-04-03', 'approved', '2025-04-02', '2025-04-02', 8, 7, 7, 10, 'testing'),
(11, 1, '2025-04-02', '2025-04-03', 'cancelled', '2025-04-02', NULL, NULL, 7, 0, 9, 'today test'),
(12, 6, '2025-04-02', '2025-04-03', 'rejected', '2025-04-02', NULL, 8, 0, 0, 10, 'test'),
(13, 3, '2025-04-02', '2025-04-03', 'rejected', '2025-04-02', NULL, 8, 0, 0, 10, 'test10'),
(14, 1, '2025-04-08', '2025-04-09', 'cancelled', '2025-04-08', NULL, NULL, 0, 0, 9, 'test for 09/04'),
(15, 3, '2025-04-08', '2025-04-09', 'approved', '2025-04-08', NULL, 8, NULL, NULL, 9, 'testset');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `borrow_requests`
--
ALTER TABLE `borrow_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_approved_by_id` (`approve_by_id`),
  ADD KEY `asset_id` (`asset_id`),
  ADD KEY `borrower_id` (`borrower_id`) USING BTREE,
  ADD KEY `fk_handover_by_id` (`handover_by_id`),
  ADD KEY `fk_receiver_id` (`receiver_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `borrow_requests`
--
ALTER TABLE `borrow_requests`
  MODIFY `id` smallint(5) UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'request_id', AUTO_INCREMENT=16;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `borrow_requests`
--
ALTER TABLE `borrow_requests`
  ADD CONSTRAINT `asset_id` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_approved_by_id` FOREIGN KEY (`approve_by_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_borrower_id` FOREIGN KEY (`borrower_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
