-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Sep 24, 2025 at 03:10 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `breakwaters_website`
--

-- --------------------------------------------------------

--
-- Table structure for table `activity_logs`
--

CREATE TABLE `activity_logs` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED DEFAULT NULL,
  `action` varchar(255) NOT NULL,
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `assignments`
--

CREATE TABLE `assignments` (
  `id` int(10) UNSIGNED NOT NULL,
  `client_id` int(10) UNSIGNED NOT NULL,
  `company_id` int(10) UNSIGNED NOT NULL,
  `assigned_by` int(10) UNSIGNED DEFAULT NULL,
  `status` enum('assigned','interview','declined','hired') NOT NULL DEFAULT 'assigned',
  `assigned_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `assignments`
--

INSERT INTO `assignments` (`id`, `client_id`, `company_id`, `assigned_by`, `status`, `assigned_at`) VALUES
(1, 1, 1, 4, 'assigned', '2025-09-24 13:07:33'),
(2, 2, 2, 4, 'interview', '2025-09-24 13:07:33'),
(3, 3, 1, 4, 'hired', '2025-09-24 13:07:33');

-- --------------------------------------------------------

--
-- Table structure for table `clients`
--

CREATE TABLE `clients` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone_number` varchar(20) DEFAULT NULL,
  `location` varchar(100) DEFAULT NULL,
  `skills` text DEFAULT NULL,
  `preferred_role` varchar(100) DEFAULT NULL,
  `education` text DEFAULT NULL,
  `linkedin_url` varchar(255) DEFAULT NULL,
  `experience` text DEFAULT NULL,
  `status` enum('pending','assigned','rejected') NOT NULL DEFAULT 'pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `clients`
--

INSERT INTO `clients` (`id`, `user_id`, `full_name`, `email`, `phone_number`, `location`, `skills`, `preferred_role`, `education`, `linkedin_url`, `experience`, `status`) VALUES
(1, 1, 'Alice Johnson', 'alice@example.com', '+27 82 123 4567', 'Cape Town', 'HTML, CSS, JavaScript', 'Frontend Developer', 'BSc Computer Science', 'https://linkedin.com/in/alicejohnson', '2 years web development', 'pending'),
(2, 2, 'Bob Smith', 'bob@example.com', '+27 83 234 5678', 'Johannesburg', 'Python, SQL, Data Analysis', 'Data Analyst', 'BCom Information Systems', 'https://linkedin.com/in/bobsmith', '1 year data analytics internship', 'pending'),
(3, 3, 'Carol Adams', 'carol@example.com', '+27 84 345 6789', 'Durban', 'Java, Spring Boot, MySQL', 'Backend Developer', 'BSc Software Engineering', 'https://linkedin.com/in/caroladams', '3 years backend development', 'assigned');

-- --------------------------------------------------------

--
-- Table structure for table `companies`
--

CREATE TABLE `companies` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `company_name` varchar(255) NOT NULL,
  `industry` varchar(100) DEFAULT NULL,
  `phone_number` varchar(20) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `workforce_size` int(11) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `available_roles` text DEFAULT NULL,
  `specifications` text DEFAULT NULL,
  `linkedin_url` varchar(255) DEFAULT NULL,
  `status` enum('unverified','verified') NOT NULL DEFAULT 'unverified'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `companies`
--

INSERT INTO `companies` (`id`, `user_id`, `company_name`, `industry`, `phone_number`, `email`, `workforce_size`, `location`, `available_roles`, `specifications`, `linkedin_url`, `status`) VALUES
(1, 5, 'Acme Corp', 'Technology', '+27 21 987 6543', 'hr@acme.com', 250, 'Cape Town', 'Frontend Developer, UI Designer', 'Focuses on innovative web platforms', 'https://linkedin.com/company/acmecorp', 'verified'),
(2, 6, 'Globex Industries', 'Finance', '+27 11 654 3210', 'careers@globex.com', 500, 'Johannesburg', 'Data Analyst, Backend Developer', 'Provides financial software solutions', 'https://linkedin.com/company/globex', 'unverified');

-- --------------------------------------------------------

--
-- Table structure for table `cvs`
--

CREATE TABLE `cvs` (
  `id` int(10) UNSIGNED NOT NULL,
  `client_id` int(10) UNSIGNED NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `file_type` varchar(50) DEFAULT NULL,
  `file_size` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `cvs`
--

INSERT INTO `cvs` (`id`, `client_id`, `file_path`, `uploaded_at`, `file_type`, `file_size`) VALUES
(1, 1, '/uploads/cvs/alice_johnson_cv.pdf', '2025-09-24 13:07:13', 'application/pdf', 450000),
(2, 2, '/uploads/cvs/bob_smith_cv.pdf', '2025-09-24 13:07:13', 'application/pdf', 320000),
(3, 3, '/uploads/cvs/carol_adams_cv.pdf', '2025-09-24 13:07:13', 'application/pdf', 500000);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(10) UNSIGNED NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('client','company_rep','recruitment_officer') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `password_hash`, `role`, `created_at`) VALUES
(1, 'alice@example.com', 'password123', 'client', '2025-09-24 13:05:52'),
(2, 'bob@example.com', 'password123', 'client', '2025-09-24 13:05:52'),
(3, 'carol@example.com', 'password123', 'client', '2025-09-24 13:05:52'),
(4, 'recruiter@bw.com', 'password123', 'recruitment_officer', '2025-09-24 13:05:52'),
(5, 'companyrep@acme.com', 'password123', 'company_rep', '2025-09-24 13:05:52'),
(6, 'companyrep@globex.com', 'password123', 'company_rep', '2025-09-24 13:05:52');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_logs_user_id` (`user_id`);

--
-- Indexes for table `assignments`
--
ALTER TABLE `assignments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_assign_client_id` (`client_id`),
  ADD KEY `idx_assign_company_id` (`company_id`),
  ADD KEY `idx_assign_assigned_by` (`assigned_by`);

--
-- Indexes for table `clients`
--
ALTER TABLE `clients`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_clients_user_id` (`user_id`),
  ADD UNIQUE KEY `uq_clients_email` (`email`);

--
-- Indexes for table `companies`
--
ALTER TABLE `companies`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_companies_user_id` (`user_id`),
  ADD KEY `idx_companies_email` (`email`);

--
-- Indexes for table `cvs`
--
ALTER TABLE `cvs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_cvs_client_id` (`client_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_users_email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `activity_logs`
--
ALTER TABLE `activity_logs`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `assignments`
--
ALTER TABLE `assignments`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `clients`
--
ALTER TABLE `clients`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `companies`
--
ALTER TABLE `companies`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `cvs`
--
ALTER TABLE `cvs`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD CONSTRAINT `fk_logs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `assignments`
--
ALTER TABLE `assignments`
  ADD CONSTRAINT `fk_assign_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_assign_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_assign_officer` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `clients`
--
ALTER TABLE `clients`
  ADD CONSTRAINT `fk_clients_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `companies`
--
ALTER TABLE `companies`
  ADD CONSTRAINT `fk_companies_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `cvs`
--
ALTER TABLE `cvs`
  ADD CONSTRAINT `fk_cvs_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
