-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 08, 2025 at 02:30 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

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
-- Table structure for table `assets`
--

CREATE TABLE `assets` (
  `id` int(11) NOT NULL COMMENT 'asset_id',
  `name` varchar(100) NOT NULL,
  `status` enum('Available','Borrowed','Disable') NOT NULL,
  `image` varchar(255) DEFAULT NULL,
  `quantity` tinyint(4) DEFAULT 0,
  `description` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `assets`
--

INSERT INTO `assets` (`id`, `name`, `status`, `image`, `quantity`, `description`) VALUES
(1, 'Ping Pong', 'Available', 'pingpong.png', 1, ''),
(2, 'Racket', 'Disable', '1743515177821_tennisracket.png', 5, ''),
(3, 'Shuttlecock', 'Available', 'shuttlecock.png', 19, ''),
(4, 'Tennis Ball', 'Available', '1743518529305_tennisball.png', 5, ''),
(5, 'Basketball', 'Available', '1743515302514_volleyball.png', 3, 'Basketball'),
(6, 'Boxing Glove', 'Available', '1743518306838_boxing_gloves.png', 1, 'For Boxing sport'),
(7, 'Badminton racket', 'Disable', '1743518566245_badmintonracket.png', 2, 'For badminton sport');

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
  `handover_by_id` smallint(5) UNSIGNED DEFAULT 0,
  `receiver_id` smallint(5) UNSIGNED DEFAULT 0,
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
(13, 3, '2025-04-02', '2025-04-03', 'rejected', '2025-04-02', NULL, 8, 0, 0, 10, 'test10');

-- --------------------------------------------------------

--
-- Table structure for table `news`
--

CREATE TABLE `news` (
  `id` smallint(5) UNSIGNED NOT NULL,
  `image` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `news`
--

INSERT INTO `news` (`id`, `image`) VALUES
(5, '1744099521384_new1.png'),
(6, '1744099529312_new2.png'),
(7, '1744099537592_new3.png');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` smallint(5) UNSIGNED NOT NULL COMMENT 'user_id',
  `username` varchar(50) NOT NULL,
  `password` varchar(60) NOT NULL,
  `role` tinyint(1) UNSIGNED NOT NULL,
  `email` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `role`, `email`) VALUES
(7, 'staff', '$2b$10$DcLQvqRFSs.rRBJFwCkCX.jG2pdXpIzKs2SJNt17oIcZdj5i5dHrC', 1, 'staff@staff'),
(8, 'lecturer', '$2b$10$T0xM4KhFXFNQfucy5fhE6uj1yA2oDWhxrcxT0cljlil.nDH7y.qqe', 2, 'lecturer@lecturer'),
(9, 'student', '$2b$10$qs.LZBTbOwowqYR1cuR3eOv9vWidTZPLC7GijI7uxQ4GpQ5tMXd3.', 3, 'student@student'),
(10, 'student2', '$2b$10$iKI9fmERvnfpT2eSOJRPSex5Y0J5PCqh56Uh4lN2lFZ3emVnjpBTC', 3, 'student2@student'),
(11, 'student3', '$2b$10$VBVawiqUwVJQeil17/yCtO1ll8lBayQq.8IeIvNtNXIubXHOTMi9u', 3, 'student3@student');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `assets`
--
ALTER TABLE `assets`
  ADD PRIMARY KEY (`id`);

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
-- Indexes for table `news`
--
ALTER TABLE `news`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `assets`
--
ALTER TABLE `assets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'asset_id', AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `borrow_requests`
--
ALTER TABLE `borrow_requests`
  MODIFY `id` smallint(5) UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'request_id', AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `news`
--
ALTER TABLE `news`
  MODIFY `id` smallint(5) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` smallint(5) UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'user_id', AUTO_INCREMENT=12;

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
