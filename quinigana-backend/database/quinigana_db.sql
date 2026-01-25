-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 26-01-2026 a las 00:26:57
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `quinigana_db`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `badge_definitions`
--

CREATE TABLE `badge_definitions` (
  `id` int(11) NOT NULL,
  `code` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` varchar(255) NOT NULL,
  `icon` varchar(50) NOT NULL,
  `category` enum('prediction','streak','volume','social','ranking') NOT NULL,
  `tier` enum('bronze','silver','gold','platinum') NOT NULL DEFAULT 'bronze',
  `xp_reward` int(11) NOT NULL DEFAULT 0,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `badge_definitions`
--

INSERT INTO `badge_definitions` (`id`, `code`, `name`, `description`, `icon`, `category`, `tier`, `xp_reward`, `sort_order`, `created_at`) VALUES
(1, 'first_pleno', 'Primer Pleno', 'Acertar tu primer resultado exacto', 'auto_awesome', 'prediction', 'gold', 50, 1, '2026-01-24 23:32:13'),
(2, 'pleno_x5', '5 Plenos', 'Acertar 5 resultados exactos', 'auto_awesome', 'prediction', 'platinum', 100, 2, '2026-01-24 23:32:13'),
(3, 'streak_3', 'Racha de 3', '3 jornadas consecutivas con 50%+ acierto', 'local_fire_department', 'streak', 'bronze', 20, 10, '2026-01-24 23:32:13'),
(4, 'streak_5', 'Racha de 5', '5 jornadas consecutivas con 50%+ acierto', 'local_fire_department', 'streak', 'silver', 50, 11, '2026-01-24 23:32:13'),
(5, 'streak_10', 'Racha de 10', '10 jornadas consecutivas con 50%+ acierto', 'local_fire_department', 'streak', 'gold', 100, 12, '2026-01-24 23:32:13'),
(6, 'predictions_10', 'Novato', 'Completar 10 predicciones', 'sports_soccer', 'volume', 'bronze', 10, 20, '2026-01-24 23:32:13'),
(7, 'predictions_50', 'Experimentado', 'Completar 50 predicciones', 'sports_soccer', 'volume', 'silver', 30, 21, '2026-01-24 23:32:13'),
(8, 'predictions_100', 'Veterano', 'Completar 100 predicciones', 'sports_soccer', 'volume', 'gold', 60, 22, '2026-01-24 23:32:13'),
(9, 'points_50', '50 Puntos', 'Alcanzar 50 puntos totales', 'emoji_events', 'prediction', 'bronze', 15, 30, '2026-01-24 23:32:13'),
(10, 'points_100', '100 Puntos', 'Alcanzar 100 puntos totales', 'emoji_events', 'prediction', 'silver', 30, 31, '2026-01-24 23:32:13'),
(11, 'points_500', '500 Puntos', 'Alcanzar 500 puntos totales', 'emoji_events', 'prediction', 'gold', 75, 32, '2026-01-24 23:32:13'),
(12, 'points_1000', 'Leyenda', 'Alcanzar 1000 puntos totales', 'emoji_events', 'prediction', 'platinum', 150, 33, '2026-01-24 23:32:13'),
(13, 'group_champion', 'Campeon', 'Terminar #1 en el ranking de un grupo', 'military_tech', 'ranking', 'gold', 80, 40, '2026-01-24 23:32:13'),
(14, 'first_proposal', 'Creador', 'Crear tu primera propuesta', 'edit_note', 'social', 'bronze', 10, 50, '2026-01-24 23:32:13'),
(15, 'first_vote', 'Democrata', 'Emitir tu primer voto', 'how_to_vote', 'social', 'bronze', 10, 51, '2026-01-24 23:32:13'),
(16, 'proposals_10', 'Proponedor', 'Crear 10 propuestas', 'edit_note', 'social', 'silver', 30, 52, '2026-01-24 23:32:13'),
(17, 'first_challenge', 'Retador', 'Completar tu primer reto 1vs1', 'sports_kabaddi', 'social', 'bronze', 15, 60, '2026-01-25 12:01:43'),
(18, 'challenge_wins_5', 'Gladiador', 'Ganar 5 retos 1vs1', 'sports_kabaddi', 'social', 'silver', 40, 61, '2026-01-25 12:01:43'),
(19, 'challenge_wins_20', 'Campeon de Retos', 'Ganar 20 retos 1vs1', 'sports_kabaddi', 'social', 'gold', 80, 62, '2026-01-25 12:01:43'),
(20, 'undefeated_5', 'Invicto', 'Ganar 5 retos consecutivos', 'shield', 'streak', 'gold', 60, 63, '2026-01-25 12:01:43'),
(21, 'division_promoted', 'Ascendido', 'Ascender de division', 'trending_up', 'ranking', 'silver', 50, 70, '2026-01-25 12:01:43'),
(22, 'division_oro', 'Elite Dorada', 'Alcanzar Division Oro', 'emoji_events', 'ranking', 'gold', 75, 71, '2026-01-25 12:01:43'),
(23, 'division_leyenda', 'Leyenda', 'Alcanzar Division Leyenda', 'diamond', 'ranking', 'platinum', 150, 72, '2026-01-25 12:01:43');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `challenges`
--

CREATE TABLE `challenges` (
  `id` int(10) UNSIGNED NOT NULL,
  `challenger_id` int(10) UNSIGNED NOT NULL,
  `challenged_id` int(10) UNSIGNED NOT NULL,
  `jornada_id` int(10) UNSIGNED NOT NULL,
  `status` enum('pending','accepted','rejected','completed','cancelled') NOT NULL DEFAULT 'pending',
  `wager_points` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `winner_id` int(10) UNSIGNED DEFAULT NULL,
  `challenger_score` int(11) DEFAULT NULL,
  `challenged_score` int(11) DEFAULT NULL,
  `message` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `responded_at` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `challenges`
--

INSERT INTO `challenges` (`id`, `challenger_id`, `challenged_id`, `jornada_id`, `status`, `wager_points`, `winner_id`, `challenger_score`, `challenged_score`, `message`, `created_at`, `responded_at`, `completed_at`) VALUES
(1, 2, 1, 2, 'pending', 5, NULL, NULL, NULL, 'A ver si te atreves', '2026-01-25 21:53:40', NULL, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `challenge_stats`
--

CREATE TABLE `challenge_stats` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `opponent_id` int(10) UNSIGNED NOT NULL,
  `total_challenges` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `wins` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `losses` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `draws` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `points_won` int(11) NOT NULL DEFAULT 0,
  `points_lost` int(11) NOT NULL DEFAULT 0,
  `last_challenge_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `groups`
--

CREATE TABLE `groups` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `avatar_url` varchar(500) DEFAULT NULL,
  `created_by` int(10) UNSIGNED NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `groups`
--

INSERT INTO `groups` (`id`, `name`, `description`, `avatar_url`, `created_by`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'MILLONETIS', 'SOLO VALE GANAR MUCHO DINERO', NULL, 1, 1, '2026-01-24 01:30:49', '2026-01-24 01:30:49'),
(2, 'DE POBRES A RICOS', 'TODO EL PROPOSITO LLEGARÁ', NULL, 1, 1, '2026-01-25 12:39:33', '2026-01-25 12:39:33');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `group_invitations`
--

CREATE TABLE `group_invitations` (
  `id` int(10) UNSIGNED NOT NULL,
  `group_id` int(10) UNSIGNED NOT NULL,
  `invited_by` int(10) UNSIGNED NOT NULL,
  `invited_user_id` int(10) UNSIGNED NOT NULL,
  `status` enum('pending','accepted','rejected') NOT NULL DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `responded_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `group_invitations`
--

INSERT INTO `group_invitations` (`id`, `group_id`, `invited_by`, `invited_user_id`, `status`, `created_at`, `responded_at`) VALUES
(1, 1, 1, 2, 'accepted', '2026-01-25 21:21:07', '2026-01-25 21:21:31');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `group_invite_links`
--

CREATE TABLE `group_invite_links` (
  `id` int(10) UNSIGNED NOT NULL,
  `group_id` int(10) UNSIGNED NOT NULL,
  `created_by` int(10) UNSIGNED NOT NULL,
  `token` varchar(64) NOT NULL,
  `expires_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `max_uses` int(10) UNSIGNED DEFAULT 0,
  `use_count` int(10) UNSIGNED DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `group_invite_links`
--

INSERT INTO `group_invite_links` (`id`, `group_id`, `created_by`, `token`, `expires_at`, `max_uses`, `use_count`, `is_active`, `created_at`) VALUES
(1, 1, 1, '925a9f721d834b292160febb6d24bd0da22c58b7d497714bc71e750168077626', '2026-01-26 20:38:25', 0, 0, 1, '2026-01-24 20:38:25');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `group_members`
--

CREATE TABLE `group_members` (
  `id` int(10) UNSIGNED NOT NULL,
  `group_id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `role` enum('admin','member') NOT NULL DEFAULT 'member',
  `joined_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `group_members`
--

INSERT INTO `group_members` (`id`, `group_id`, `user_id`, `role`, `joined_at`) VALUES
(3, 1, 1, 'admin', '2026-01-25 21:13:16'),
(4, 2, 1, 'admin', '2026-01-25 21:13:16'),
(5, 1, 2, 'member', '2026-01-25 21:21:31');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `group_quinielas`
--

CREATE TABLE `group_quinielas` (
  `id` int(10) UNSIGNED NOT NULL,
  `group_id` int(10) UNSIGNED NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `deadline` datetime NOT NULL,
  `status` enum('open','closed','finished') NOT NULL DEFAULT 'open',
  `created_by` int(10) UNSIGNED NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `group_quiniela_matches`
--

CREATE TABLE `group_quiniela_matches` (
  `id` int(10) UNSIGNED NOT NULL,
  `quiniela_id` int(10) UNSIGNED NOT NULL,
  `match_number` tinyint(3) UNSIGNED NOT NULL,
  `home_team` varchar(100) NOT NULL,
  `away_team` varchar(100) NOT NULL,
  `match_date` datetime DEFAULT NULL,
  `home_score` tinyint(3) UNSIGNED DEFAULT NULL,
  `away_score` tinyint(3) UNSIGNED DEFAULT NULL,
  `result_1x2` char(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `group_quiniela_predictions`
--

CREATE TABLE `group_quiniela_predictions` (
  `id` int(10) UNSIGNED NOT NULL,
  `quiniela_id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `match_id` int(10) UNSIGNED NOT NULL,
  `prediction_1x2` char(1) NOT NULL,
  `home_score_prediction` tinyint(3) UNSIGNED DEFAULT NULL,
  `away_score_prediction` tinyint(3) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `group_quiniela_scores`
--

CREATE TABLE `group_quiniela_scores` (
  `id` int(10) UNSIGNED NOT NULL,
  `quiniela_id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `correct_1x2` tinyint(3) UNSIGNED NOT NULL DEFAULT 0,
  `correct_pleno` tinyint(3) UNSIGNED NOT NULL DEFAULT 0,
  `total_points` decimal(5,1) NOT NULL DEFAULT 0.0,
  `calculated_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `group_scores`
--

CREATE TABLE `group_scores` (
  `id` int(10) UNSIGNED NOT NULL,
  `group_id` int(10) UNSIGNED NOT NULL,
  `jornada_id` int(10) UNSIGNED NOT NULL,
  `proposal_id` int(10) UNSIGNED DEFAULT NULL,
  `total_points` decimal(7,1) NOT NULL DEFAULT 0.0,
  `correct_1x2` int(11) NOT NULL DEFAULT 0,
  `correct_pleno` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `jornadas`
--

CREATE TABLE `jornadas` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(100) NOT NULL,
  `season` varchar(20) NOT NULL,
  `season_id` int(10) UNSIGNED DEFAULT NULL,
  `jornada_number` int(11) NOT NULL,
  `status` enum('open','closed','finished') NOT NULL DEFAULT 'open',
  `deadline` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `jornadas`
--

INSERT INTO `jornadas` (`id`, `name`, `season`, `season_id`, `jornada_number`, `status`, `deadline`, `created_at`, `updated_at`) VALUES
(2, 'Millonetis', '2025 - 2026', 1, 1, 'closed', '2026-01-25 22:10:55', '2026-01-24 20:28:19', '2026-01-25 22:10:55'),
(3, 'DE POBRES A RICOS', '2025 -2026', NULL, 1, 'closed', '2026-01-25 22:10:55', '2026-01-25 12:38:44', '2026-01-25 22:10:55');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `league_divisions`
--

CREATE TABLE `league_divisions` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(50) NOT NULL,
  `tier` int(10) UNSIGNED NOT NULL,
  `icon` varchar(50) NOT NULL,
  `color` varchar(20) NOT NULL,
  `min_players` int(10) UNSIGNED NOT NULL DEFAULT 1,
  `max_players` int(10) UNSIGNED DEFAULT NULL,
  `promotion_slots` int(10) UNSIGNED NOT NULL DEFAULT 3,
  `relegation_slots` int(10) UNSIGNED NOT NULL DEFAULT 3,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `league_divisions`
--

INSERT INTO `league_divisions` (`id`, `name`, `tier`, `icon`, `color`, `min_players`, `max_players`, `promotion_slots`, `relegation_slots`, `created_at`) VALUES
(1, 'Division Leyenda', 1, 'diamond', '#9333ea', 1, NULL, 0, 3, '2026-01-25 12:01:43'),
(2, 'Division Oro', 2, 'emoji_events', '#eab308', 1, NULL, 3, 3, '2026-01-25 12:01:43'),
(3, 'Division Plata', 3, 'workspace_premium', '#94a3b8', 1, NULL, 3, 3, '2026-01-25 12:01:43'),
(4, 'Division Bronce', 4, 'military_tech', '#b45309', 1, NULL, 3, 0, '2026-01-25 12:01:43');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `league_history`
--

CREATE TABLE `league_history` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `league_season_id` int(10) UNSIGNED NOT NULL,
  `from_division_id` int(10) UNSIGNED DEFAULT NULL,
  `to_division_id` int(10) UNSIGNED NOT NULL,
  `final_position` int(10) UNSIGNED DEFAULT NULL,
  `final_points` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `movement_type` enum('initial','promoted','relegated','maintained') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `league_seasons`
--

CREATE TABLE `league_seasons` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(100) NOT NULL,
  `season_id` int(10) UNSIGNED DEFAULT NULL,
  `start_jornada_id` int(10) UNSIGNED DEFAULT NULL,
  `end_jornada_id` int(10) UNSIGNED DEFAULT NULL,
  `status` enum('upcoming','active','completed') NOT NULL DEFAULT 'upcoming',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `league_seasons`
--

INSERT INTO `league_seasons` (`id`, `name`, `season_id`, `start_jornada_id`, `end_jornada_id`, `status`, `created_at`) VALUES
(1, 'Liga 2025-2026', 1, NULL, NULL, 'active', '2026-01-25 12:10:57');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `league_standings`
--

CREATE TABLE `league_standings` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `league_season_id` int(10) UNSIGNED NOT NULL,
  `division_id` int(10) UNSIGNED NOT NULL,
  `points` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `jornadas_played` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `correct_1x2` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `correct_pleno` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `position` int(10) UNSIGNED DEFAULT NULL,
  `previous_position` int(10) UNSIGNED DEFAULT NULL,
  `promotion_status` enum('none','promoted','relegated') NOT NULL DEFAULT 'none',
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `league_standings`
--

INSERT INTO `league_standings` (`id`, `user_id`, `league_season_id`, `division_id`, `points`, `jornadas_played`, `correct_1x2`, `correct_pleno`, `position`, `previous_position`, `promotion_status`, `updated_at`) VALUES
(1, 1, 1, 4, 0, 0, 0, 0, NULL, NULL, 'none', '2026-01-25 12:11:48'),
(2, 2, 1, 4, 0, 0, 0, 0, NULL, NULL, 'none', '2026-01-25 21:55:01');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `matches`
--

CREATE TABLE `matches` (
  `id` int(10) UNSIGNED NOT NULL,
  `jornada_id` int(10) UNSIGNED NOT NULL,
  `match_number` int(11) NOT NULL,
  `home_team` varchar(100) NOT NULL,
  `away_team` varchar(100) NOT NULL,
  `match_date` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `matches`
--

INSERT INTO `matches` (`id`, `jornada_id`, `match_number`, `home_team`, `away_team`, `match_date`, `created_at`) VALUES
(16, 2, 1, 'Rayo Vallecano', 'Osasuna', NULL, '2026-01-24 20:28:19'),
(17, 2, 2, 'Valencia', 'Espanyol', NULL, '2026-01-24 20:28:19'),
(18, 2, 3, 'Sevilla', 'Athletic', NULL, '2026-01-24 20:28:19'),
(19, 2, 4, 'Villarreal', 'Real Madrid', NULL, '2026-01-24 20:28:19'),
(20, 2, 5, 'Atlético de Ma.', 'Mallorca', NULL, '2026-01-24 20:28:19'),
(21, 2, 6, 'FC Barcelona', 'Real Oviedo', NULL, '2026-01-24 20:28:19'),
(22, 2, 7, 'Real Sociedad', 'Celta', NULL, '2026-01-24 20:28:19'),
(23, 2, 8, 'Deportivo Alav.', 'Real Betis', NULL, '2026-01-24 20:28:19'),
(24, 2, 9, 'Real Valladolid', 'Albacete', NULL, '2026-01-24 20:28:19'),
(25, 2, 10, 'UD Las Palmas', 'Córdoba CF', NULL, '2026-01-24 20:28:19'),
(26, 2, 11, 'FC Andorra', 'Huesca', NULL, '2026-01-24 20:28:19'),
(27, 2, 12, 'Eibar', 'Almería', NULL, '2026-01-24 20:28:19'),
(28, 2, 13, 'Real Zaragoza', 'CD Castellón', NULL, '2026-01-24 20:28:19'),
(29, 2, 14, 'RC Deportivo', 'Racing', NULL, '2026-01-24 20:28:19'),
(30, 2, 15, 'Girona FC', 'Getafe', NULL, '2026-01-24 20:28:19'),
(31, 3, 1, 'Rayo Vallecano', 'Osasuna', NULL, '2026-01-25 12:38:44'),
(32, 3, 2, 'Valencia', 'Espanyol', NULL, '2026-01-25 12:38:44'),
(33, 3, 3, 'Sevilla', 'Athletic', NULL, '2026-01-25 12:38:44'),
(34, 3, 4, 'Villarreal', 'Real Madrid', NULL, '2026-01-25 12:38:44'),
(35, 3, 5, 'Atlético de Ma.', 'Mallorca', NULL, '2026-01-25 12:38:44'),
(36, 3, 6, 'FC Barcelona', 'Real Oviedo', NULL, '2026-01-25 12:38:44'),
(37, 3, 7, 'Real Sociedad', 'Celta', NULL, '2026-01-25 12:38:44'),
(38, 3, 8, 'Deportivo Alav.', 'Real Betis', NULL, '2026-01-25 12:38:44'),
(39, 3, 9, 'Real Valladolid', 'Albacete', NULL, '2026-01-25 12:38:44'),
(40, 3, 10, 'UD Las Palmas', 'Córdoba CF', NULL, '2026-01-25 12:38:44'),
(41, 3, 11, 'FC Andorra', 'Huesca', NULL, '2026-01-25 12:38:44'),
(42, 3, 12, 'Eibar', 'Almería', NULL, '2026-01-25 12:38:44'),
(43, 3, 13, 'Real Zaragoza', 'CD Castellón', NULL, '2026-01-25 12:38:44'),
(44, 3, 14, 'RC Deportivo', 'Racing', NULL, '2026-01-25 12:38:44'),
(45, 3, 15, 'Girona FC', 'Getafe', NULL, '2026-01-25 12:38:44');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `match_results`
--

CREATE TABLE `match_results` (
  `id` int(10) UNSIGNED NOT NULL,
  `match_id` int(10) UNSIGNED NOT NULL,
  `home_score` int(11) NOT NULL,
  `away_score` int(11) NOT NULL,
  `result_1x2` enum('1','X','2') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `notifications`
--

CREATE TABLE `notifications` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `type` enum('new_jornada','proposal_submitted','vote_needed','results_published','invitation_received') NOT NULL,
  `title` varchar(200) NOT NULL,
  `message` text NOT NULL,
  `link` varchar(500) DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `notifications`
--

INSERT INTO `notifications` (`id`, `user_id`, `type`, `title`, `message`, `link`, `is_read`, `created_at`) VALUES
(1, 1, 'new_jornada', 'Nueva jornada disponible', 'La jornada \"Millonetis\" ya esta abierta. Crea una propuesta con tu grupo!', '/quiniela/jornadas', 0, '2026-01-24 20:28:19'),
(2, 1, '', 'Logro desbloqueado!', 'Has obtenido: Creador', '/stats', 1, '2026-01-25 09:43:56'),
(3, 1, 'new_jornada', 'Nueva jornada disponible', 'La jornada \"DE POBRES A RICOS\" ya esta abierta. Crea una propuesta con tu grupo!', '/quiniela/jornadas', 0, '2026-01-25 12:38:44'),
(4, 2, 'invitation_received', 'Invitacion a grupo', 'jose peiro te ha invitado a unirte a \"MILLONETIS\".', '/groups/invitations', 1, '2026-01-25 21:21:07'),
(5, 2, '', 'Logro desbloqueado!', 'Has obtenido: Creador', '/stats', 1, '2026-01-25 21:24:19'),
(6, 1, '', 'Nuevo reto 1vs1', 'Fran te ha retado en la Millonetis!', '/challenges', 1, '2026-01-25 21:53:40');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `token_hash` varchar(255) NOT NULL,
  `expires_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `used_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `proposal_comments`
--

CREATE TABLE `proposal_comments` (
  `id` int(10) UNSIGNED NOT NULL,
  `proposal_id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `message` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `proposal_predictions`
--

CREATE TABLE `proposal_predictions` (
  `id` int(10) UNSIGNED NOT NULL,
  `proposal_id` int(10) UNSIGNED NOT NULL,
  `match_id` int(10) UNSIGNED NOT NULL,
  `prediction_1x2` varchar(3) NOT NULL,
  `home_score_prediction` int(11) DEFAULT NULL,
  `away_score_prediction` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `proposal_predictions`
--

INSERT INTO `proposal_predictions` (`id`, `proposal_id`, `match_id`, `prediction_1x2`, `home_score_prediction`, `away_score_prediction`) VALUES
(1, 1, 16, '1', 3, 1),
(2, 1, 17, '1', 3, 2),
(3, 1, 18, 'X', NULL, NULL),
(4, 1, 19, '1', NULL, NULL),
(5, 1, 20, '1', NULL, NULL),
(6, 1, 21, '1', NULL, NULL),
(7, 1, 22, 'X', NULL, NULL),
(8, 1, 23, 'X', NULL, NULL),
(9, 1, 24, '1', NULL, NULL),
(10, 1, 25, '1', NULL, NULL),
(11, 1, 26, '1', NULL, NULL),
(12, 1, 27, '2', NULL, NULL),
(13, 1, 28, '2', NULL, NULL),
(14, 1, 29, '2', NULL, NULL),
(15, 1, 30, '1', NULL, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `proposal_votes`
--

CREATE TABLE `proposal_votes` (
  `id` int(10) UNSIGNED NOT NULL,
  `proposal_id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `vote` enum('approve','reject') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `push_subscriptions`
--

CREATE TABLE `push_subscriptions` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `endpoint` varchar(500) NOT NULL,
  `p256dh` varchar(200) NOT NULL,
  `auth` varchar(100) NOT NULL,
  `user_agent` varchar(300) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `quiniela_proposals`
--

CREATE TABLE `quiniela_proposals` (
  `id` int(10) UNSIGNED NOT NULL,
  `group_id` int(10) UNSIGNED NOT NULL,
  `jornada_id` int(10) UNSIGNED NOT NULL,
  `proposed_by` int(10) UNSIGNED NOT NULL,
  `status` enum('draft','pending','approved','rejected') NOT NULL DEFAULT 'draft',
  `title` varchar(200) DEFAULT NULL,
  `votes_for` int(11) NOT NULL DEFAULT 0,
  `votes_against` int(11) NOT NULL DEFAULT 0,
  `total_members_at_creation` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `quiniela_proposals`
--

INSERT INTO `quiniela_proposals` (`id`, `group_id`, `jornada_id`, `proposed_by`, `status`, `title`, `votes_for`, `votes_against`, `total_members_at_creation`, `created_at`, `updated_at`) VALUES
(1, 1, 2, 1, 'approved', NULL, 0, 0, 1, '2026-01-25 09:43:56', '2026-01-25 09:44:08');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `quiniela_results`
--

CREATE TABLE `quiniela_results` (
  `id` int(10) UNSIGNED NOT NULL,
  `proposal_id` int(10) UNSIGNED NOT NULL,
  `match_id` int(10) UNSIGNED NOT NULL,
  `points_1x2` decimal(5,1) NOT NULL DEFAULT 0.0,
  `points_pleno` int(11) NOT NULL DEFAULT 0,
  `is_correct_1x2` tinyint(1) NOT NULL DEFAULT 0,
  `is_correct_pleno` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `refresh_tokens`
--

CREATE TABLE `refresh_tokens` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `token_hash` varchar(255) NOT NULL,
  `device_info` varchar(255) DEFAULT NULL,
  `expires_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `revoked_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `refresh_tokens`
--

INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `device_info`, `expires_at`, `created_at`, `revoked_at`) VALUES
(1, 1, '2132bfc9749ce567eccdeee9d2ff467a730bad58d78ad258dc1238b471296486', NULL, '2026-01-31 00:12:23', '2026-01-24 00:12:23', NULL),
(2, 1, 'ec4b3d61b8f8689bf0be25c0661598e92e94db37570191d0322b3bf5b70fc71c', NULL, '2026-01-24 00:27:00', '2026-01-24 00:13:00', '2026-01-24 00:27:00'),
(3, 1, '13cc4d96b2f882cc4838a0bc4ada11bd93af7a48ffb63dac60521f681cf54b55', NULL, '2026-01-24 00:41:00', '2026-01-24 00:27:00', '2026-01-24 00:41:00'),
(4, 1, 'a3659eb554361e1190899d53e9d65720511560b23dd70dd1ad2e7112d7686c6b', NULL, '2026-01-24 00:55:00', '2026-01-24 00:41:00', '2026-01-24 00:55:00'),
(5, 1, '8b3bfc3bfa822ba6eb3b25f1efe1524ca0d24ce51cd22a3cb6cb9240785e3171', NULL, '2026-01-24 01:09:00', '2026-01-24 00:55:00', '2026-01-24 01:09:00'),
(6, 1, '62c3158f0fa0724a41d0ff5e324ee86336bcc568016d5aefaf917b0e824080fc', NULL, '2026-01-24 01:23:00', '2026-01-24 01:09:00', '2026-01-24 01:23:00'),
(7, 1, 'a4bf64a2c41d5989a4aa3e9392396dfaddbbfc5aa04d29e61989fad1b0b9379f', NULL, '2026-01-31 01:23:00', '2026-01-24 01:23:00', NULL),
(8, 1, 'de34961bbecdfb6517aabc2d7c832aaba96ccf7077166b3ccc960146df45e7b2', NULL, '2026-01-31 01:28:23', '2026-01-24 01:28:23', NULL),
(9, 1, 'd5bf8feecdc95ccf64c59164d0b49e474adf5bf6bac6be02adcf84576f139409', NULL, '2026-01-31 01:28:51', '2026-01-24 01:28:51', NULL),
(10, 1, '8f08f8c2d501a19c5ef11df9e25672c9ccfb96f60aa1a48b680775338af0f32a', NULL, '2026-01-31 01:30:23', '2026-01-24 01:30:23', NULL),
(11, 1, '931a62513e2a8f700994e67033891b5f4731bac4ec68fda7977ffe5b2e7054d0', NULL, '2026-01-24 01:45:21', '2026-01-24 01:31:20', '2026-01-24 01:45:21'),
(12, 1, '658204892fdd02c096bd40bd449bca4918cf0cdd44c8921027b9bf6fea760fbf', NULL, '2026-01-24 01:59:21', '2026-01-24 01:45:21', '2026-01-24 01:59:21'),
(13, 1, '1e10120184c2398f1533062e39700536b01156caf4b70c95931b99c5c2bb4370', NULL, '2026-01-24 02:13:21', '2026-01-24 01:59:21', '2026-01-24 02:13:21'),
(14, 1, 'f2dd8e3b21d05b8a72497a24ceb7128a40756b9b9e68ac1e445b98f94716c6aa', NULL, '2026-01-24 02:27:21', '2026-01-24 02:13:21', '2026-01-24 02:27:21'),
(15, 1, 'dbb49cf5714805d14f5bc915b5c3ba140bd8b5c27250c08646c8f41876c2373a', NULL, '2026-01-24 02:41:21', '2026-01-24 02:27:21', '2026-01-24 02:41:21'),
(16, 1, '964ef3daf1731ab32e19532eaee63e44555a91be28d4ad8890d4a5733b19e1c8', NULL, '2026-01-24 02:55:21', '2026-01-24 02:41:21', '2026-01-24 02:55:21'),
(17, 1, '06516be3fa265cf978a00a6d8ae92d0a4de0ff4f9f5b08149b6c73053e7173b8', NULL, '2026-01-24 03:09:21', '2026-01-24 02:55:21', '2026-01-24 03:09:21'),
(18, 1, '242deac00b1fbf187f19c0158d13460a32b2e38c6c6977483a395768f8609d53', NULL, '2026-01-24 03:23:21', '2026-01-24 03:09:21', '2026-01-24 03:23:21'),
(19, 1, 'a36686477a5da407ebb96f50c20bbc5742bbb07a788d828782be0d8f65234d08', NULL, '2026-01-24 03:37:21', '2026-01-24 03:23:21', '2026-01-24 03:37:21'),
(20, 1, 'deb8aa6291cfa049347b57daf25fe0ab9905329e96d6a38bcf49bf49472a46ed', NULL, '2026-01-24 03:51:21', '2026-01-24 03:37:21', '2026-01-24 03:51:21'),
(21, 1, '74be438231d9c72149847bbf2480c3faf6cbb9c7dd269eaea6e28dc0483c5b36', NULL, '2026-01-24 04:05:21', '2026-01-24 03:51:21', '2026-01-24 04:05:21'),
(22, 1, '4a043c513eac68481aa3d69987cf44de400151e53c821ec4acf2ec19ce7cbf66', NULL, '2026-01-24 04:19:21', '2026-01-24 04:05:21', '2026-01-24 04:19:21'),
(23, 1, '404570525d72cc90f6210d68212bbc16664bc9962c7579028b21f9360e21ec7e', NULL, '2026-01-24 04:33:21', '2026-01-24 04:19:21', '2026-01-24 04:33:21'),
(24, 1, 'df7e9e1492d5e72ad65d449b0bf930eb9c4ec612630a8846fab55189b6101213', NULL, '2026-01-24 04:47:21', '2026-01-24 04:33:21', '2026-01-24 04:47:21'),
(25, 1, 'e947e935a1745c1eea9b2ec2eea090d0dec06040114cbf27f1df33cf061fbc82', NULL, '2026-01-24 05:01:21', '2026-01-24 04:47:21', '2026-01-24 05:01:21'),
(26, 1, '1593e97edc836abe424c10b70e9952fabfbd9dbdeafea0d3349132323cb567e8', NULL, '2026-01-24 05:15:21', '2026-01-24 05:01:21', '2026-01-24 05:15:21'),
(27, 1, '2e0429331cce4a832057c9ef6f006c70e99cac10083155f805dd1f25454ab13f', NULL, '2026-01-24 05:29:21', '2026-01-24 05:15:21', '2026-01-24 05:29:21'),
(28, 1, '2f66ff5918b1315d4b4411289b1881020cc5a109bfaf77d2612e35f06b4c0a0b', NULL, '2026-01-24 05:43:21', '2026-01-24 05:29:21', '2026-01-24 05:43:21'),
(29, 1, 'd69be8f8f77bc7cf3494985ee7b5f04afcf113116e1267732dc5f978951842c9', NULL, '2026-01-24 05:57:21', '2026-01-24 05:43:21', '2026-01-24 05:57:21'),
(30, 1, '6179a119dd7ee58cf228e8582db688db6f158c786c40fa0b051697a24ea3a5c0', NULL, '2026-01-24 06:11:16', '2026-01-24 05:57:21', '2026-01-24 06:11:16'),
(31, 1, '56f755f9af7d0db2720432dd93d12adc9551dd7779bfa568a83e4a4c1eee879c', NULL, '2026-01-24 06:25:16', '2026-01-24 06:11:16', '2026-01-24 06:25:16'),
(32, 1, '78d77624594ebb4190933a118e8d50ff3e9a41a8f215316173c0fe8ee01d227b', NULL, '2026-01-24 09:58:04', '2026-01-24 06:25:16', '2026-01-24 09:58:04'),
(33, 1, '8e1f4edf76eb1cc29de3cd9b7eb99c1b19fd9e7b2c19060ee5e25cde988461ae', NULL, '2026-01-31 09:58:04', '2026-01-24 09:58:04', NULL),
(34, 1, 'f8f7447215ccf05cbf886d25246af94d8823bdb4671d85dcaf0b8bf75ec5e358', NULL, '2026-01-31 09:59:32', '2026-01-24 09:59:32', NULL),
(35, 1, '5f98e3e7f3d187dcd9f9b2961d60281d0c85e7e29653df2fc3bf6cfcddbe80f3', NULL, '2026-01-24 10:27:04', '2026-01-24 10:13:04', '2026-01-24 10:27:04'),
(36, 1, '452c73ec05c473a1fc77fc3da08c9e55b57903c20440597a5815cbc713bb2a92', NULL, '2026-01-31 10:27:04', '2026-01-24 10:27:04', NULL),
(37, 1, 'a46473bbfc8f8e32307535ea43d3ea6ed919c9c893987ea6213c9d3e37894732', NULL, '2026-01-31 10:53:56', '2026-01-24 10:53:56', NULL),
(38, 1, '53befe2bb0a4809faba397140568c6d3717d4aec7b9d187ea17ed4f8fb042a53', NULL, '2026-01-31 10:54:04', '2026-01-24 10:54:04', NULL),
(39, 1, '2922f9a19aed79bd5a35ae7fe21bafa2662d89e67168ddc10c3d3e0ecae66f21', NULL, '2026-01-31 10:56:10', '2026-01-24 10:56:10', NULL),
(40, 1, '6cb23699b50e92f37af5db7ab0a9bcca72bae8cb0bbf6eebb0fed6779f859837', NULL, '2026-01-24 14:34:09', '2026-01-24 14:26:24', '2026-01-24 14:34:09'),
(41, 1, '91cbd84a2af2c7599b51e686f419b96816ac42d81d00f64a019ed60663335b27', NULL, '2026-01-24 14:48:09', '2026-01-24 14:34:09', '2026-01-24 14:48:09'),
(42, 1, 'ba1339824e88f84e4b66fdba6856fb6cb6caf6f832ac454963ba91a62f7e731c', NULL, '2026-01-24 15:02:09', '2026-01-24 14:48:09', '2026-01-24 15:02:09'),
(43, 1, 'cd346de43a1ffcf721ac3e9f5a9e2cbc5a96668581261946c0887b77e24affe1', NULL, '2026-01-24 15:16:09', '2026-01-24 15:02:09', '2026-01-24 15:16:09'),
(44, 1, '9930038b8b88ddfaf5801e359dd0eb82571d6fff84a629bea46082439b89fdd1', NULL, '2026-01-24 15:21:18', '2026-01-24 15:16:09', '2026-01-24 15:21:18'),
(45, 1, '6f12f3b84263f35a2a00e807c4d8ef0c15123880530c0ef594a7773e30e21f38', NULL, '2026-01-24 15:21:23', '2026-01-24 15:21:18', '2026-01-24 15:21:23'),
(46, 1, '52c4732683d3be029d3580ccc7cc878547d352423003e9059875cd1f0971a895', NULL, '2026-01-24 15:25:01', '2026-01-24 15:21:23', '2026-01-24 15:25:01'),
(47, 1, '9c6a2cacd9ba92d15c3f2cfa0e003abd76e7f3f8f02f0aec36877eb0cd2626e8', NULL, '2026-01-24 15:25:05', '2026-01-24 15:25:01', '2026-01-24 15:25:05'),
(48, 1, '6ce35b2e4bc06eea98509856d097ffb910e4e3b0a092b7bc716826e633b7a2a1', NULL, '2026-01-24 15:33:28', '2026-01-24 15:25:05', '2026-01-24 15:33:28'),
(49, 1, '4327b5ab03ed572fd67d7e00eeaad9601871518c768012f0fd94bb069660db97', NULL, '2026-01-24 15:33:35', '2026-01-24 15:33:28', '2026-01-24 15:33:35'),
(50, 1, 'c3cc3ce69d088e4fe36f62e54a16c1afe72628b737ce91a9316e880c09569ac0', NULL, '2026-01-24 15:35:12', '2026-01-24 15:33:36', '2026-01-24 15:35:12'),
(51, 1, '05c7910a98e0564428ef41f7136f7cb09b7f81687c8ec7b98760d98a5dc5f26c', NULL, '2026-01-24 15:35:20', '2026-01-24 15:35:12', '2026-01-24 15:35:20'),
(52, 1, '2d73f0549f90ea00b7b9092de32f209835241180f84608cf4240ff65fabb783c', NULL, '2026-01-24 15:35:27', '2026-01-24 15:35:20', '2026-01-24 15:35:27'),
(53, 1, 'f38863cd0e03ec845854b8e6e783c87af4ebd917fcee13479b2c8c9d04d1069b', NULL, '2026-01-24 15:35:34', '2026-01-24 15:35:27', '2026-01-24 15:35:34'),
(54, 1, 'b05868d6deee4577aad0d885f22c575b72319d1aa5e642bfcbb869a9710ff4ab', NULL, '2026-01-24 15:36:12', '2026-01-24 15:35:34', '2026-01-24 15:36:12'),
(55, 1, '601584de03b48df7161ffe6e4daf17a26fe5d1363d59b6b56cf5f45535dffdd4', NULL, '2026-01-24 15:36:13', '2026-01-24 15:36:12', '2026-01-24 15:36:13'),
(56, 1, '467434de7b8a8e1d0c707ea521ad5ed70ce1b9671ebf03d2e960d32facad5533', NULL, '2026-01-24 15:36:16', '2026-01-24 15:36:13', '2026-01-24 15:36:16'),
(57, 1, '3c4f3a3e01ff42a0aa5ccb484b03de68ea2002f7041adfbedb9417c2911ae3ba', NULL, '2026-01-24 15:36:18', '2026-01-24 15:36:16', '2026-01-24 15:36:18'),
(58, 1, '9d6c8c05adf6a93bb8699f53e883a0ecf6e42bac54808d627f3ba6fa8149ee40', NULL, '2026-01-31 15:36:18', '2026-01-24 15:36:18', NULL),
(59, 1, 'c74781c9494e46684cba676e5a99a7fc7ea58fbb2bfa81658b83a4f6bbd671f3', NULL, '2026-01-24 15:47:47', '2026-01-24 15:44:38', '2026-01-24 15:47:47'),
(60, 1, '7f0c161d23cde37bd14e37adae0d4e11f5f4069fecec033eb563702d3160352f', NULL, '2026-01-24 15:52:43', '2026-01-24 15:47:47', '2026-01-24 15:52:43'),
(61, 1, '4e0ecedbf760209e2740da66f7e0677c2d9cf01f12ec536b8d09ac22bbf30e59', NULL, '2026-01-24 15:55:39', '2026-01-24 15:52:43', '2026-01-24 15:55:39'),
(62, 1, '05c3e54660c4f5d4fad4f9bf87f6a7ac05439b26c6c6d05b3218b4d87826bba0', NULL, '2026-01-31 15:55:39', '2026-01-24 15:55:39', NULL),
(63, 1, '52fbdb7db19eb353590502a48c6f9fd3615de163caed92c6ade26b7e1a5994be', NULL, '2026-01-24 16:22:46', '2026-01-24 16:08:46', '2026-01-24 16:22:46'),
(64, 1, 'aa85674fdc14ba61c312a8ef84737c010ead826365d5f015b6a673e0c982b965', NULL, '2026-01-24 16:24:27', '2026-01-24 16:22:46', '2026-01-24 16:24:27'),
(65, 1, '5cf8392bd241e1566c7b8cdd39dbe5e4a200e89a23df56d7f0bd2d4f1b9b8372', NULL, '2026-01-24 16:24:38', '2026-01-24 16:24:27', '2026-01-24 16:24:38'),
(66, 1, '973e624a4af2aaccbf92210c1797bed22ab7e1c66546c8df63809c86da813a0f', NULL, '2026-01-24 16:28:11', '2026-01-24 16:24:38', '2026-01-24 16:28:11'),
(67, 1, '9c8d716bed3f0e79211e0922cb25a5d0d693f159c01fdbdddb96f102434d89a4', NULL, '2026-01-24 16:28:20', '2026-01-24 16:28:11', '2026-01-24 16:28:20'),
(68, 1, 'e96635c555de98ad43315488f4c093c1c12dd699344a977e81a8d525b8134944', NULL, '2026-01-24 16:28:52', '2026-01-24 16:28:20', '2026-01-24 16:28:52'),
(69, 1, '6aabdfdb6ea60253b9c930e475106ad64a41dd069166b86ff4d5d3ed399a0cd3', NULL, '2026-01-24 16:29:08', '2026-01-24 16:28:52', '2026-01-24 16:29:08'),
(70, 1, '3c85b9d1d91ab518a2c5c6b2e8ac2c719c863647c8e2836644a07a0d4470d928', NULL, '2026-01-24 16:32:11', '2026-01-24 16:29:08', '2026-01-24 16:32:11'),
(71, 1, '9cbc08c33f691f71da0cf15ac093b1f3ae06246bff1cb9ffcf01130ab0003686', NULL, '2026-01-24 16:33:37', '2026-01-24 16:32:11', '2026-01-24 16:33:37'),
(72, 1, '2f851d018eeb099527e33d9aa2948ebb382dd666517cf686bc711a956f4bee37', NULL, '2026-01-31 16:33:37', '2026-01-24 16:33:37', NULL),
(73, 1, '7c6695cc7a82b8c3fdca4fe65a02a21f83ec696f45108decab23fecb90b86e29', NULL, '2026-01-24 16:36:51', '2026-01-24 16:33:53', '2026-01-24 16:36:51'),
(74, 1, '5f7131130e3ae79c8727189329f8c54efde292d707723e062dbc552e91564b10', NULL, '2026-01-24 16:55:46', '2026-01-24 16:36:51', '2026-01-24 16:55:46'),
(75, 1, '61e728909b4dadc41ef105c57d7320a4de96a5a1d129bb7580890e1108904ed2', NULL, '2026-01-24 16:56:15', '2026-01-24 16:55:46', '2026-01-24 16:56:15'),
(76, 1, 'a69a6308690c85f6bdee1fac1ea54d902f816ceea18f674a430c7c7718a85a43', NULL, '2026-01-24 17:10:15', '2026-01-24 16:56:15', '2026-01-24 17:10:15'),
(77, 1, '7db12ac6eb50be0b95d51211b32993b9437b42c8894f3806c704b380658492f9', NULL, '2026-01-24 17:20:08', '2026-01-24 17:10:15', '2026-01-24 17:20:08'),
(78, 1, '5ac9fd6223feb8603c0abd4647a6039c7c5d05fa2c66a569ee461954f972652d', NULL, '2026-01-24 17:20:18', '2026-01-24 17:20:08', '2026-01-24 17:20:18'),
(79, 1, '44418dc9a0cfe1ce78afc4b49af2eb2421e00dd4adc3b89cf61e6db86a150f90', NULL, '2026-01-24 17:23:54', '2026-01-24 17:20:18', '2026-01-24 17:23:54'),
(80, 1, '1b463cf15959bcf5b8e4e9b965935fe5d6a87b9aaf571c12f87541897f441b47', NULL, '2026-01-24 17:24:34', '2026-01-24 17:23:54', '2026-01-24 17:24:34'),
(81, 1, '5735a8f0596d46e1684a208642e920c9c3eae92e411eb71be134690fdf0be5d4', NULL, '2026-01-24 17:24:54', '2026-01-24 17:24:34', '2026-01-24 17:24:54'),
(82, 1, 'bbb3bdc70a3988b06f5e765ba96ac1d0123d96b6a255e7a2d3ae31da0940a32c', NULL, '2026-01-24 17:36:45', '2026-01-24 17:24:54', '2026-01-24 17:36:45'),
(83, 1, 'dbbf65e264e7bddd106c28091597405dd7edd4cdc8886e40cab10c5c92673fdd', NULL, '2026-01-24 17:36:51', '2026-01-24 17:36:45', '2026-01-24 17:36:51'),
(84, 1, '1f8f3fdd71d3bc7476facb1aaf7ffe3fd71a798723233900fd17f7f5b9a62383', NULL, '2026-01-24 17:37:04', '2026-01-24 17:36:51', '2026-01-24 17:37:04'),
(85, 1, '30aeea3929b37b22395fced5574e62682fd78a7900d1c9350658bdc4e094a92f', NULL, '2026-01-24 17:37:23', '2026-01-24 17:37:04', '2026-01-24 17:37:23'),
(86, 1, 'a230ad5fb8f5381e69f5bb282df0a4e1fd5bcace7d669526c59d237a6bd2e3d1', NULL, '2026-01-24 17:37:30', '2026-01-24 17:37:23', '2026-01-24 17:37:30'),
(87, 1, 'cfe1c561040e224a071a67e694c5899e80a2a7c56cdd785af5c8e72dc717c820', NULL, '2026-01-24 17:37:48', '2026-01-24 17:37:30', '2026-01-24 17:37:48'),
(88, 1, 'a97f74814df13d7f5cd6e2e67f6180e2dba5b979195d7752602ff772bc289bf5', NULL, '2026-01-24 17:51:48', '2026-01-24 17:37:48', '2026-01-24 17:51:48'),
(89, 1, '66c824b1ea6ab0628f459d17d13113c474c1d2250cc8fb4395f98b737b463bb1', NULL, '2026-01-24 18:05:48', '2026-01-24 17:51:48', '2026-01-24 18:05:48'),
(90, 1, 'e110afd05495da95eea47eda57a48891e60f9ecd83075180a720ed99c18b341b', NULL, '2026-01-24 18:14:35', '2026-01-24 18:05:48', '2026-01-24 18:14:35'),
(91, 1, '4d0de2515411b5f039fa2fb6da80f2be05a8200513a6db8218fb12d19644cbb2', NULL, '2026-01-24 18:14:46', '2026-01-24 18:14:35', '2026-01-24 18:14:46'),
(92, 1, '069c50bb0cdb58d9989bc4e239ebf53eb99ea57ff1274b944e2c73e53dbca99a', NULL, '2026-01-24 18:15:13', '2026-01-24 18:14:46', '2026-01-24 18:15:13'),
(93, 1, '50a5df17f7cd8192833de476b6a049744c8a6610ad0af4d11620d9495f074d90', NULL, '2026-01-24 18:15:22', '2026-01-24 18:15:13', '2026-01-24 18:15:22'),
(94, 1, '9cb9fcaa21f30f10b14c72d2d226677557cd6e46175aadd76f9c8785e388a95d', NULL, '2026-01-24 18:15:48', '2026-01-24 18:15:22', '2026-01-24 18:15:48'),
(95, 1, 'eb040ca02ce8c6ea3f4ba70ebbf8908a825ed8479eae44b77c82ef9ed61fb918', NULL, '2026-01-24 18:15:56', '2026-01-24 18:15:48', '2026-01-24 18:15:56'),
(96, 1, '50c4daf177c155637054710f2fc902c4bb4f1e5727a396e7d4f39106a417140a', NULL, '2026-01-24 18:29:56', '2026-01-24 18:15:56', '2026-01-24 18:29:56'),
(97, 1, '47758c8fc9c6737593e1eea6bb2d213adc18c2159b7a7d8715c449f34898d9f8', NULL, '2026-01-24 18:38:18', '2026-01-24 18:29:56', '2026-01-24 18:38:18'),
(98, 1, 'c006866238b46ca0cbc18c9771cf010e01bc6d2b7dd4b6f005a35d778c7a088c', NULL, '2026-01-24 19:53:20', '2026-01-24 18:38:18', '2026-01-24 19:53:20'),
(99, 1, 'cef83119d743019173804803fcd22a5454d16aa3b6820a8724ed84ab40e417ec', NULL, '2026-01-24 19:53:21', '2026-01-24 19:53:20', '2026-01-24 19:53:21'),
(100, 1, '23479fa292677ffa82d73aa36ecf96ea47c6f6670eca4d0c84790fc59c35fd6b', NULL, '2026-01-24 20:00:26', '2026-01-24 19:53:21', '2026-01-24 20:00:26'),
(101, 1, '529eae1c096d69a4050008e295520b950447cfddf1f8fee7fb41c690757f5306', NULL, '2026-01-31 20:00:26', '2026-01-24 20:00:26', NULL),
(102, 1, '7447833c5bc2beac7d05a00dce7319e215980bd119ff9329ce814ac4599223f1', NULL, '2026-01-24 20:11:37', '2026-01-24 20:02:23', '2026-01-24 20:11:37'),
(103, 1, '2fc04fbda726ed56471938935899e8e665e0ba5e383bfc086b70276ce976ae4e', NULL, '2026-01-24 20:11:51', '2026-01-24 20:11:37', '2026-01-24 20:11:51'),
(104, 1, '9696cc235cb790f89d2c7caefc42ae9235e2803324eb8382db0620415015b360', NULL, '2026-01-24 20:16:14', '2026-01-24 20:11:51', '2026-01-24 20:16:14'),
(105, 1, '6493fff91471b68742204e969c1fd5c26720f0aac24a6ffc11480fc0710b7597', NULL, '2026-01-24 20:17:08', '2026-01-24 20:16:14', '2026-01-24 20:17:08'),
(106, 1, '96deb89ac00f21a73744f6535bafaa71bad0efe4bcff4186c40675c848fba140', NULL, '2026-01-24 20:22:43', '2026-01-24 20:17:08', '2026-01-24 20:22:43'),
(107, 1, '3227aed134dafd2c7ec1d24d80c5a53442859804ff58a9e47324b8152e276642', NULL, '2026-01-24 20:36:43', '2026-01-24 20:22:43', '2026-01-24 20:36:43'),
(108, 1, '984228494ad4c164ed4eef1cc9df3900e58e088283ec6a75ad53ef9df0aeca3d', NULL, '2026-01-24 20:38:21', '2026-01-24 20:36:43', '2026-01-24 20:38:21'),
(109, 1, 'f3eee8250bc8ff77f6a769126756ddb9dc3dbb9294e2cacf8812a282ad531d00', NULL, '2026-01-24 20:38:31', '2026-01-24 20:38:21', '2026-01-24 20:38:31'),
(110, 1, 'f2166d4011da444fd605ee12ae65274b206560fd9bdd5a7b3826c330ca5dda46', NULL, '2026-01-24 20:52:21', '2026-01-24 20:38:31', '2026-01-24 20:52:21'),
(111, 1, '60713607344ce2b2fdd7073f84cf63327787a6426d5a5826f5de7e011fce9cd1', NULL, '2026-01-24 20:59:08', '2026-01-24 20:52:21', '2026-01-24 20:59:08'),
(112, 1, '4ea48bcf5a3db5899838191ee19f02946c03c64510af7c9ed61c27b73b139e94', NULL, '2026-01-24 21:09:54', '2026-01-24 20:59:08', '2026-01-24 21:09:54'),
(113, 1, '994b4d71d99182fbeb8763a513ee7e1944d6098841efd45c1df1f31773c9782f', NULL, '2026-01-24 21:23:54', '2026-01-24 21:09:54', '2026-01-24 21:23:54'),
(114, 1, 'b141be1aeaa8f843862813804076155a50e62abc09abde2dd81bb0f73575f8fe', NULL, '2026-01-24 21:37:54', '2026-01-24 21:23:54', '2026-01-24 21:37:54'),
(115, 1, 'bb112bb33f74e44a0167d03f5b63358896ccdbcd555bb06b42fec60a72960c32', NULL, '2026-01-24 21:45:16', '2026-01-24 21:37:54', '2026-01-24 21:45:16'),
(116, 1, 'daca7649ef75be2df23d54d601ef27caf108285afdcc93408e5d211effcc6ec8', NULL, '2026-01-24 21:45:20', '2026-01-24 21:45:16', '2026-01-24 21:45:20'),
(117, 1, 'f83ce34db70bd2e0f89c8b6690ec1668a3c431b806596980751831bcdb2234ab', NULL, '2026-01-24 21:45:26', '2026-01-24 21:45:20', '2026-01-24 21:45:26'),
(118, 1, 'daf6dbfd03f1308bd2ba1f13ccc7bf744d0e31ff257eabc756b0a74712f55e16', NULL, '2026-01-24 21:45:35', '2026-01-24 21:45:26', '2026-01-24 21:45:35'),
(119, 1, '78b134c1c2e22b2dbbed98f8b570af0fe4cb784d674f1af693ba74ddd45ec021', NULL, '2026-01-24 21:47:12', '2026-01-24 21:45:35', '2026-01-24 21:47:12'),
(120, 1, '9c2f324727f10aea084b2d23a982cc64efa120b7fd3ea549b0babe024613ad7e', NULL, '2026-01-24 21:47:20', '2026-01-24 21:47:12', '2026-01-24 21:47:20'),
(121, 1, '692944173709c3c34aa63e52c644c3ce3087afb133b5a97b51cacb90c7482130', NULL, '2026-01-24 21:47:26', '2026-01-24 21:47:20', '2026-01-24 21:47:26'),
(122, 1, '5527ba5d3fce4d8dcde80081dae348ab8ddbc06528637720e7c7eb6ebe570ac0', NULL, '2026-01-24 22:01:26', '2026-01-24 21:47:26', '2026-01-24 22:01:26'),
(123, 1, 'fb33b68e1bc9e88a672d30aee149285753c960d51a3242abc9a5f38ad4738fa5', NULL, '2026-01-24 22:15:26', '2026-01-24 22:01:26', '2026-01-24 22:15:26'),
(124, 1, '5ec54d0a08dd0b6814772da7394c7b63b5ecf58ded6f0bf4cc905dfa3f5513ff', NULL, '2026-01-24 22:23:41', '2026-01-24 22:15:26', '2026-01-24 22:23:41'),
(125, 1, 'cf975e51dfc07a2bca93a02e2400ccff720ebeea22670ab588c202e5016cb2fd', NULL, '2026-01-24 22:23:43', '2026-01-24 22:23:41', '2026-01-24 22:23:43'),
(126, 1, 'ddd8928e3f49bdfe698c34309e20cda69d86cb617772b79a73ee9c9e93dce57e', NULL, '2026-01-24 22:25:28', '2026-01-24 22:23:43', '2026-01-24 22:25:28'),
(127, 1, '83c106214e4d0470058adf4697b2ec42ef4be36431b776352283329445356d51', NULL, '2026-01-24 22:25:33', '2026-01-24 22:25:28', '2026-01-24 22:25:33'),
(128, 1, '9a8aa4b393a201742e83a87d7a485bf41f2bdb0ffc85c45c64ecca3ea1633f4f', NULL, '2026-01-24 22:25:41', '2026-01-24 22:25:33', '2026-01-24 22:25:41'),
(129, 1, 'cb4308a0f6c9642a8a211dedde8741f202e4bc983397d2fc1c9173be57992c85', NULL, '2026-01-24 22:25:47', '2026-01-24 22:25:41', '2026-01-24 22:25:47'),
(130, 1, '1fd985feb138e50a83d31b50415b6180a47239c22212190e6cda5320f87b7a62', NULL, '2026-01-24 22:25:58', '2026-01-24 22:25:47', '2026-01-24 22:25:58'),
(131, 1, '7f5a85892c4aefc32feb7a78696d2d6c75a52abfbfab7c0877de82e1f5144027', NULL, '2026-01-24 22:27:53', '2026-01-24 22:25:58', '2026-01-24 22:27:53'),
(132, 1, 'e717f229883c66df47b2b9ed340519632eb566a311e1bda3ed01351e9c5aee16', NULL, '2026-01-24 22:35:06', '2026-01-24 22:27:53', '2026-01-24 22:35:06'),
(133, 1, '4392f79eb1fa580804c1a7b345488bd553a4a870aa677f0e6ea67b12ea8d9517', NULL, '2026-01-24 22:36:28', '2026-01-24 22:35:06', '2026-01-24 22:36:28'),
(134, 1, '14a4572562dbfe7d9b576c998a7e9e38818fa979add0fd41593bfb486c928ee3', NULL, '2026-01-24 22:36:35', '2026-01-24 22:36:28', '2026-01-24 22:36:35'),
(135, 1, 'c526b1bc9e8f3583dd534c66bf1418eb36f64443d780b31b79af5755f1846206', NULL, '2026-01-24 22:37:41', '2026-01-24 22:36:35', '2026-01-24 22:37:41'),
(136, 1, '99d88d245ef3643431eb48f568705ab88257e9d0074cc59575400f81600a3e22', NULL, '2026-01-24 22:37:47', '2026-01-24 22:37:41', '2026-01-24 22:37:47'),
(137, 1, 'db2c0d49ec3018c96627eae27d7b2fe60c56aa19a378a4fbacbaf457e345a268', NULL, '2026-01-24 22:38:09', '2026-01-24 22:37:47', '2026-01-24 22:38:09'),
(138, 1, '3ea32ada23a4dff3e95e6beb494b759f09ccfbe594d7992045e073936ace4c94', NULL, '2026-01-24 22:46:04', '2026-01-24 22:38:10', '2026-01-24 22:46:04'),
(139, 1, '8766cf243ebb8a74cd1dd766db166cb1cd74bc54786271e974b5dd531348b838', NULL, '2026-01-24 22:46:14', '2026-01-24 22:46:04', '2026-01-24 22:46:14'),
(140, 1, '7740991c992ee9c16cd43986d0add9c3b604db72bd3388d66d447f0a01c295aa', NULL, '2026-01-24 22:46:22', '2026-01-24 22:46:14', '2026-01-24 22:46:22'),
(141, 1, 'c1f10f0ae97bbb5e61e34f9c1aac28b276ab47f379bb0d193e5a8afb65a34699', NULL, '2026-01-24 22:46:42', '2026-01-24 22:46:22', '2026-01-24 22:46:42'),
(142, 1, '37813023c83d0060043aa9c7b979c3fca30c24f9f39519a5d1a9c6edceda1de0', NULL, '2026-01-24 22:47:45', '2026-01-24 22:46:42', '2026-01-24 22:47:45'),
(143, 1, 'e5f018ed6077134f15f660e9a87107f03920adaf74fc8c907918c1016e6ef669', NULL, '2026-01-24 22:58:42', '2026-01-24 22:47:45', '2026-01-24 22:58:42'),
(144, 1, 'f62d0716c51c53382dec334a19efa21dfa69ba44476d6f757710bec38d02c527', NULL, '2026-01-24 22:58:49', '2026-01-24 22:58:42', '2026-01-24 22:58:49'),
(145, 1, '2f1ddbd4c246663ea199a68be1cbd0985ea06c77008359ae56829c65a8cc133f', NULL, '2026-01-24 22:59:53', '2026-01-24 22:58:49', '2026-01-24 22:59:53'),
(146, 1, '610bd05be6d1e40642e82c7e7254e076abcec4a121c3f48c7fe19d4655027516', NULL, '2026-01-24 22:59:59', '2026-01-24 22:59:53', '2026-01-24 22:59:59'),
(147, 1, '94ed121c09b45f2231bef71af2501f8c22188c136567dc16ac0ca45192c104ed', NULL, '2026-01-24 23:02:43', '2026-01-24 22:59:59', '2026-01-24 23:02:43'),
(148, 1, 'cb7a9f5c28c65ad04afd09fae77fd0ed60e75548438a2134ad6211dbd40faae4', NULL, '2026-01-24 23:12:00', '2026-01-24 23:02:43', '2026-01-24 23:12:00'),
(149, 1, '84b4b4e1f02c803bef274d9f5d4bc862b634e4434eb2e5abd7202c1b95716824', NULL, '2026-01-24 23:12:01', '2026-01-24 23:12:00', '2026-01-24 23:12:01'),
(150, 1, '25dcc3736e7bec97245f74ba6b5ef08fc85232884221cb46b87e9a97d332ed2e', NULL, '2026-01-24 23:12:08', '2026-01-24 23:12:01', '2026-01-24 23:12:08'),
(151, 1, '41f00a1e6e7bea785abdf2bcbbf243aeba000407b730a67b7a9481f86d52c796', NULL, '2026-01-24 23:12:52', '2026-01-24 23:12:08', '2026-01-24 23:12:52'),
(152, 1, '27481115a31e675314380e410d243fd64e18d6633b5da66f222e0e9d0b4fedaf', NULL, '2026-01-24 23:12:59', '2026-01-24 23:12:52', '2026-01-24 23:12:59'),
(153, 1, 'c248da93c89e2b1e8e14e22bab028d3baca836683edc1efca96ca1bdd8a27340', NULL, '2026-01-24 23:26:59', '2026-01-24 23:12:59', '2026-01-24 23:26:59'),
(154, 1, '867a2157340813d57aacd4a2b02c12912c4246dcee261eafa83a12585dac7f05', NULL, '2026-01-24 23:27:29', '2026-01-24 23:26:59', '2026-01-24 23:27:29'),
(155, 1, '3a1f36dd83169725bb07c21f837214ede7d18dd9cec7724d17927b5817f716d1', NULL, '2026-01-24 23:27:35', '2026-01-24 23:27:29', '2026-01-24 23:27:35'),
(156, 1, '6c65d0a50eaf40811729ab0661f01c0c87f390d5acfa4b833b997d06ba71580c', NULL, '2026-01-24 23:27:41', '2026-01-24 23:27:35', '2026-01-24 23:27:41'),
(157, 1, '6a5fa0768cc36d312fd31427d0d54cc2ad4a46ee0b09d7c14d61038d522c914a', NULL, '2026-01-24 23:27:55', '2026-01-24 23:27:41', '2026-01-24 23:27:55'),
(158, 1, 'd11223f60a98d42611866b881fba3435f45b493d8d94c98f4018cbc9979a5bbb', NULL, '2026-01-24 23:28:08', '2026-01-24 23:27:55', '2026-01-24 23:28:08'),
(159, 1, '2edb22157c11c8f8ea4acb92b2cf40e5068977c69191708a6916ae6f026c5e96', NULL, '2026-01-24 23:28:18', '2026-01-24 23:28:08', '2026-01-24 23:28:18'),
(160, 1, '7cda66a6a84e2fad067a04852b50f21bc391121ab3eb253ffee69a9aac3c77e9', NULL, '2026-01-24 23:28:30', '2026-01-24 23:28:18', '2026-01-24 23:28:30'),
(161, 1, '631eb7798c90657953c9fd3b23bd69bec87c33f22832f0dda35993f9b2c37d05', NULL, '2026-01-24 23:28:36', '2026-01-24 23:28:30', '2026-01-24 23:28:36'),
(162, 1, 'c3be56bee0a3c3adea2308b6dfc8161cd7ab6a0180081489bfe81f0fe43c8162', NULL, '2026-01-24 23:29:13', '2026-01-24 23:28:36', '2026-01-24 23:29:13'),
(163, 1, 'c330dfce99c94e93c6ca54079eea23bc398b35df50c2cbd94793a0a411a3df7b', NULL, '2026-01-24 23:41:29', '2026-01-24 23:29:13', '2026-01-24 23:41:29'),
(164, 1, '788fedd60ec27435ad4bd0d8d801a93fab73f0f1f254ae7ea79d5107d842e557', NULL, '2026-01-24 23:41:36', '2026-01-24 23:41:29', '2026-01-24 23:41:36'),
(165, 1, 'ea7b69fa7c510d1d7686da10eff7fdc64f52761ab76405756a454ef8fa330f4b', NULL, '2026-01-24 23:42:16', '2026-01-24 23:41:36', '2026-01-24 23:42:16'),
(166, 1, 'b4fb86be1423005872f278c611fae8165b1de0aaf5e41dad8898fb66eebea916', NULL, '2026-01-24 23:42:27', '2026-01-24 23:42:16', '2026-01-24 23:42:27'),
(167, 1, 'e6e4d6955497f516e6a0afb6b5b0cdf7ce3e85bd2d0fefdb8955d629d9d9c5c5', NULL, '2026-01-24 23:42:38', '2026-01-24 23:42:27', '2026-01-24 23:42:38'),
(168, 1, '9832482d8ea44fc9448c419be47f20e55b7da4099743a767c5a6f90f45382655', NULL, '2026-01-24 23:43:03', '2026-01-24 23:42:38', '2026-01-24 23:43:03'),
(169, 1, '84ed5e764d4cca61c90ea1ec0abd1a1e978892585fea10b1917e9defc2e124cc', NULL, '2026-01-24 23:47:34', '2026-01-24 23:43:03', '2026-01-24 23:47:34'),
(170, 1, 'db9127147ccffa3f75249379e15bcec8aa5ef492fed2752b72588aa4336594bd', NULL, '2026-01-25 00:49:03', '2026-01-24 23:47:34', '2026-01-25 00:49:03'),
(171, 1, '8e10c92940fb2022b3bc906559f568faba0e1da042d4e0731402c6a56eae0004', NULL, '2026-01-25 00:49:03', '2026-01-25 00:49:03', '2026-01-25 00:49:03'),
(172, 1, 'ddbe825a80ae265d0a284430a84b5052e76514be932ef08b6856c59e5f15d55d', NULL, '2026-01-25 00:49:06', '2026-01-25 00:49:03', '2026-01-25 00:49:06'),
(173, 1, '0c5976582e119a00e84939858a7876be5e209ffcaeeff038bb1bca80eeef09d9', NULL, '2026-01-25 00:49:28', '2026-01-25 00:49:06', '2026-01-25 00:49:28'),
(174, 1, 'c33465735d7b91df7035c8aaaa87433a25f6033712cfcd6f2b3868ff76129d17', NULL, '2026-01-25 09:23:18', '2026-01-25 00:49:28', '2026-01-25 09:23:18'),
(175, 1, '0f706ea6d9872c29dac0e9c75baec458b025025438a3d3b454e0f4d64d9b6b90', NULL, '2026-01-25 09:23:27', '2026-01-25 09:23:18', '2026-01-25 09:23:27'),
(176, 1, '0375a331b01f94cc2b2d8a3a66d19dcde5c7d75c8c7cd70d8f6fece8b034e034', NULL, '2026-01-25 09:23:33', '2026-01-25 09:23:27', '2026-01-25 09:23:33'),
(177, 1, 'd0e95eb15cf66a6e9d35872b6f7e5802543510636806d93a760d120231c7dc1c', NULL, '2026-01-25 09:25:00', '2026-01-25 09:23:33', '2026-01-25 09:25:00'),
(178, 1, '0f5cad85c2b966f2174a6b1eab0660ed179a11b60b8df782c54a97ab534f3573', NULL, '2026-01-25 09:39:00', '2026-01-25 09:25:00', '2026-01-25 09:39:00'),
(179, 1, '096a8e7074f2b4685f6efb60da12b5ca318e91d2bea79f19506429294666d51f', NULL, '2026-01-25 09:48:16', '2026-01-25 09:39:00', '2026-01-25 09:48:16'),
(180, 1, '860fddbe32620d3d9fb72e13ad5f58ef063055aeeb0bb846455a17c37cf9a9e8', NULL, '2026-01-25 09:48:31', '2026-01-25 09:48:16', '2026-01-25 09:48:31'),
(181, 1, 'ac9fc3f7964cdfec374986d535a62e4305054dd1af800f541116088a156c16e1', NULL, '2026-01-25 09:48:37', '2026-01-25 09:48:31', '2026-01-25 09:48:37'),
(182, 1, 'a58ce70713c3be3402bbc7cd62a9da3c28efd0f3a8216b8157520094721821df', NULL, '2026-01-25 09:50:46', '2026-01-25 09:48:37', '2026-01-25 09:50:46'),
(183, 1, 'e8212a0c87510f144ba20fa49bcc38839e8383e2f18b9d0ede8f2035a41b4cce', NULL, '2026-01-25 10:02:20', '2026-01-25 09:50:46', '2026-01-25 10:02:20'),
(184, 1, '6fe6521eec622b16f1f3b2e06646e8464f3496fe4ccf1a7ed8ece746088a4805', NULL, '2026-01-25 10:04:30', '2026-01-25 10:02:20', '2026-01-25 10:04:30'),
(185, 1, '70c171cfa2e3bfb2a049ea6854cfa3e03da313a671117cb4a3eb5fe6af117e00', NULL, '2026-01-25 10:39:26', '2026-01-25 10:04:30', '2026-01-25 10:39:26'),
(186, 1, '71632e6b0f2349976451e1c6f8f00a2c6072c409ae8f79c207e527cc12235112', NULL, '2026-01-25 10:39:44', '2026-01-25 10:39:26', '2026-01-25 10:39:44'),
(187, 1, '940e2e663aac85cdc61bad510831ee1479794610d675470cf46b92a27f0ddf78', NULL, '2026-01-25 10:39:50', '2026-01-25 10:39:44', '2026-01-25 10:39:50'),
(188, 1, 'cd9a5abcbb7d02a54a970b9addb62d2ecdfa57a77d22b77e61ae3d67d3225120', NULL, '2026-02-01 10:39:50', '2026-01-25 10:39:50', NULL),
(189, 1, '31158a9dd9126048b95d72eed97a5d5ae075c1dd937638ceb710aaecb2e6562a', NULL, '2026-01-25 10:58:42', '2026-01-25 10:49:37', '2026-01-25 10:58:42'),
(190, 1, '45f1a90ea21fc5250ea7fe147731654ba66bf9c878d09adcb91737fc80758319', NULL, '2026-01-25 10:59:00', '2026-01-25 10:58:42', '2026-01-25 10:59:00'),
(191, 1, 'b47296f12900776aa2288eb71a2ad008b3ce70a36c8cee34195054afda46a277', NULL, '2026-01-25 10:59:07', '2026-01-25 10:59:00', '2026-01-25 10:59:07'),
(192, 1, 'e5b046641da021a265d2289edeed221099b2f45335f5e969ac32d8be0d189b20', NULL, '2026-01-25 11:07:43', '2026-01-25 10:59:07', '2026-01-25 11:07:43'),
(193, 1, '8d19c0c31244543ddac46390d9422f0886c90294bbd7367b4ce0aefba57d6edb', NULL, '2026-01-25 11:07:48', '2026-01-25 11:07:43', '2026-01-25 11:07:48'),
(194, 1, '27f70a543cff44b80e1a365f387823117416fc158080df13039942703c7ec62a', NULL, '2026-01-25 11:08:06', '2026-01-25 11:07:48', '2026-01-25 11:08:06'),
(195, 1, 'b41d0883cb74b15fc7187aec70e5f0f8f07b6e6511c54f4a0270a4bf3c2f7b1e', NULL, '2026-01-25 11:22:06', '2026-01-25 11:08:06', '2026-01-25 11:22:06'),
(196, 1, '0c0570d0709ca47696cc4c2b5cfe26e368c30fb3f17311b0ddc443784a7dc145', NULL, '2026-01-25 11:32:47', '2026-01-25 11:22:06', '2026-01-25 11:32:47'),
(197, 1, '4d6e335d456c863d26575aef763bc4f486dc4cde1eb7cf665333525424667491', NULL, '2026-01-25 11:46:47', '2026-01-25 11:32:47', '2026-01-25 11:46:47'),
(198, 1, 'e7e78f00bded257d59cfcd214679dac247b6b579c3c938aea46a427d191b0a39', NULL, '2026-01-25 11:57:21', '2026-01-25 11:46:47', '2026-01-25 11:57:21'),
(199, 1, 'da7a079aee63a89fc2239b4f368af3fa9e2b5f57c7deae2868162e8f857927a1', NULL, '2026-01-25 12:11:21', '2026-01-25 11:57:21', '2026-01-25 12:11:21'),
(200, 1, '5650d3cb0aa8cbe07f1154bf6b9c60205498350064ca29c52e3a14032c61a81f', NULL, '2026-01-25 12:11:48', '2026-01-25 12:11:21', '2026-01-25 12:11:48'),
(201, 1, '3ca68bc0e8f836216e83b858b26d2b86d254587f3d330f694ea944160c1e43b8', NULL, '2026-01-25 12:14:51', '2026-01-25 12:11:48', '2026-01-25 12:14:51'),
(202, 1, '5e0d1b7003193ab6a1b0a2984d2572a34a9548822505066c35d0fa48b06c9064', NULL, '2026-01-25 12:15:27', '2026-01-25 12:14:51', '2026-01-25 12:15:27'),
(203, 1, '47f5690a50faaabb3b2e2c52a88c14fbfae42a05a7d62f854ff8b6ca130ae199', NULL, '2026-01-25 12:17:22', '2026-01-25 12:15:27', '2026-01-25 12:17:22'),
(204, 1, '22d855af8d148a4a7e21c4a1fe1febc2bed833ae883061e46f321637f20b38c0', NULL, '2026-01-25 12:19:48', '2026-01-25 12:17:22', '2026-01-25 12:19:48'),
(205, 1, '865d04f22aad99558deca9a5ca334a92cfbbbc4e99c6869ae3e730a4e29f1bfa', NULL, '2026-01-25 12:33:47', '2026-01-25 12:19:48', '2026-01-25 12:33:47'),
(206, 1, '87589d581a458b9660c51eff11801859e02112cd038f416ff8f1637edda236f0', NULL, '2026-01-25 12:34:08', '2026-01-25 12:33:47', '2026-01-25 12:34:08'),
(207, 1, '2d5112f00d3eaaa52f2ef250e9cd1a7c161b7f90967bcc9397ad5140e015d9d5', NULL, '2026-01-25 12:34:14', '2026-01-25 12:34:08', '2026-01-25 12:34:14'),
(208, 1, 'bbcbe325c7c9320ba95803aed6d1d1db4e24611fe00d5559239043cc44518956', NULL, '2026-01-25 12:34:51', '2026-01-25 12:34:14', '2026-01-25 12:34:51'),
(209, 1, 'ae3853a3a0b2324dd1cb34549c8918e5386dba622ed47e9aa9d7bde7495ee069', NULL, '2026-01-25 12:35:01', '2026-01-25 12:34:51', '2026-01-25 12:35:01'),
(210, 1, 'b3ba0eaee9fcf89a90d376771a0cbc46d18b9b3f025c83c996541970fa44ed1f', NULL, '2026-01-25 12:35:22', '2026-01-25 12:35:01', '2026-01-25 12:35:22'),
(211, 1, '7a48b3f5bd45dedeed989f83c216c44e2aef27f239e61069e52109a88b2ca724', NULL, '2026-01-25 12:36:50', '2026-01-25 12:35:22', '2026-01-25 12:36:50'),
(212, 1, '04e1fc21618fd190fd646d21ea3e489ed3e4985b53bc1a7e544504fb39d02eae', NULL, '2026-01-25 12:46:11', '2026-01-25 12:36:50', '2026-01-25 12:46:11'),
(213, 1, '32b4a8838c34c024cb74ea8540c3d3cfcb69303917316fca74e90c7bc0ddde18', NULL, '2026-01-25 12:47:39', '2026-01-25 12:46:11', '2026-01-25 12:47:39'),
(214, 1, '1954f6a24090d234ff98c75781c1db8602ec503baa7306dc9086e2c2b91a5fc4', NULL, '2026-01-25 12:49:22', '2026-01-25 12:47:39', '2026-01-25 12:49:22'),
(215, 1, '50a7920c5d4f9f91d7c92d52b2108407121adeba9e46561c37ae3c6c66e94841', NULL, '2026-01-25 12:49:47', '2026-01-25 12:49:22', '2026-01-25 12:49:47'),
(216, 1, 'ba5fd3cbe5ee27d8501eac48c022ee06ec4260e795e47e0f0e1cde154b414932', NULL, '2026-01-25 12:51:35', '2026-01-25 12:49:47', '2026-01-25 12:51:35'),
(217, 1, '264ec7198fd832a145bd85f70201400c44393967725eb20277fde5352dfbbb60', NULL, '2026-02-01 12:51:35', '2026-01-25 12:51:35', NULL),
(218, 2, 'e6a78cc223646f2ca46715880e8892eacfae502458790eb6a4543e86dca583a4', NULL, '2026-01-25 14:37:29', '2026-01-25 14:34:03', '2026-01-25 14:37:29'),
(219, 2, '10f971d6c486ff37016914e88c764749ee9e1d23fc1d457e1624536969e87894', NULL, '2026-01-25 14:37:41', '2026-01-25 14:37:29', '2026-01-25 14:37:41'),
(220, 2, '4838fdc386f083e84ebea71bd37d355408004af3a5ee794b398de0462ee06812', NULL, '2026-01-25 14:37:46', '2026-01-25 14:37:41', '2026-01-25 14:37:46'),
(221, 2, 'be802a66f56b26b240927c392475660c0e7741e17fc898070b79d3fcce8be545', NULL, '2026-01-25 14:47:33', '2026-01-25 14:37:46', '2026-01-25 14:47:33'),
(222, 2, '9e228ff9e751b8428d1fb82b5d827af0ad78668d529c9b92d6057dfd2f282a6f', NULL, '2026-01-25 14:51:15', '2026-01-25 14:47:33', '2026-01-25 14:51:15'),
(223, 2, '5392c9fc7282601ff846a4d972d39a1ce4a9e7ba6bda7e697920025445df8436', NULL, '2026-01-25 14:57:33', '2026-01-25 14:51:15', '2026-01-25 14:57:33'),
(224, 1, '099caae1c819015b06dc7a024148f1b5c5dcc0d3cee218b4a3ee91e6d64b332b', NULL, '2026-01-25 14:57:50', '2026-01-25 14:53:47', '2026-01-25 14:57:50'),
(225, 2, 'e48131e09bccb916bb71b589a13adb59f40db187eea80b6977644ebdc68381d9', NULL, '2026-01-25 15:39:28', '2026-01-25 14:57:33', '2026-01-25 15:39:28'),
(226, 1, 'c49b938a897cf03b0ca51a6b53fa9f759707506caa81098b4fb99219dac0e182', NULL, '2026-01-25 14:57:57', '2026-01-25 14:57:50', '2026-01-25 14:57:57'),
(227, 1, '9ec07f5ed315e5e2ae29f73fa513e979d565224cab62e5ae7151d96386aab592', NULL, '2026-01-25 21:10:37', '2026-01-25 14:57:57', '2026-01-25 21:10:37'),
(228, 2, '05ca96aea98a0e2b0264851b9fd65bd25f1c52dbb3940df4c0c21e6ad3c4820c', NULL, '2026-01-25 15:39:28', '2026-01-25 15:39:28', '2026-01-25 15:39:28'),
(229, 2, '778f134d37aa95217a28b347141d33c460a8d4147647ef604732cbfb170ff924', NULL, '2026-01-25 20:50:23', '2026-01-25 15:39:28', '2026-01-25 20:50:23'),
(230, 2, '1556f854d34594260da46a36a282b066f770525a4a379570d4e24837012018b7', NULL, '2026-01-25 20:50:30', '2026-01-25 20:50:23', '2026-01-25 20:50:30'),
(231, 2, '9a156cf42c2edebff368226be7a68081803e005ea6773fbbd632963acd049348', NULL, '2026-01-25 21:04:30', '2026-01-25 20:50:30', '2026-01-25 21:04:30'),
(232, 2, 'ec6791aa053759e36c191edcfb6026f88ebf87e98dfc707c7febe84acfc6beda', NULL, '2026-01-25 21:04:41', '2026-01-25 21:04:30', '2026-01-25 21:04:41'),
(233, 2, '06bc6632067f93b7e218bc2fd7e7ac04d96fb6c2b7fbfe7d7a0fca4446233cd2', NULL, '2026-01-25 21:05:23', '2026-01-25 21:04:41', '2026-01-25 21:05:23'),
(234, 2, 'e0641c2de77b14d6c725f6951820f764e97f96ab0d63f56ec053fe7aaae3f92d', NULL, '2026-01-25 21:15:22', '2026-01-25 21:05:23', '2026-01-25 21:15:22'),
(235, 1, '3bf26a8c81f4e89a5dc590ac44efd6effed0fadb88860585cf3e320bd3862be4', NULL, '2026-02-01 21:10:37', '2026-01-25 21:10:37', NULL),
(236, 1, 'e375d4db7b41c21c1a86d34161b4313d6aa7baab08887a75265edce4e5dd3a22', NULL, '2026-01-25 21:10:37', '2026-01-25 21:10:37', '2026-01-25 21:10:37'),
(237, 1, '2c58980446e3ce7e06812db1fb88b3177b300c9bcf6197d12ea94183b6172d57', NULL, '2026-01-25 21:24:37', '2026-01-25 21:10:37', '2026-01-25 21:24:37'),
(238, 2, '3cea4932926b60db729e770fbe7735b49e4c34da4440a77bf80a3f0d00cbfdff', NULL, '2026-02-01 21:15:22', '2026-01-25 21:15:22', NULL),
(239, 1, '00b43df946f5b5d601e1bc7a31f88496ff357b7ed21323f7f0f256cdd8f7fef6', NULL, '2026-01-25 21:38:37', '2026-01-25 21:24:37', '2026-01-25 21:38:37'),
(240, 2, 'f0c342db93b121f7743b3132cde6ab1e8f003f222d62b5ba3c22d6b3a923a98a', NULL, '2026-01-25 21:32:51', '2026-01-25 21:29:26', '2026-01-25 21:32:51'),
(241, 2, 'f1fe1e041371f51d07664bbf6830fe8a500acaff2a822a602960f3573bbf8bb5', NULL, '2026-01-25 21:39:41', '2026-01-25 21:32:51', '2026-01-25 21:39:41'),
(242, 1, '0963649de2365ced53d0a6ca6d7add41d9c3a4157e80384e5bbd35d44f62aa15', NULL, '2026-01-25 21:39:26', '2026-01-25 21:38:37', '2026-01-25 21:39:26'),
(243, 1, '6c9382d4f9a6ba67819adc55eae26b08304391a4be60f10d39aca49cda9d0eaa', NULL, '2026-01-25 21:42:41', '2026-01-25 21:39:26', '2026-01-25 21:42:41'),
(244, 2, 'bacb46029cad8e58d7ba7107fcaa7b7a94ee768ef2e7ddabfb04c7bddbe61ce8', NULL, '2026-01-25 21:43:13', '2026-01-25 21:39:41', '2026-01-25 21:43:13'),
(245, 1, '007c3372e55d5df8c644532390f818aeb22112fec0e3375387101c5a2dc39b5b', NULL, '2026-01-25 21:42:50', '2026-01-25 21:42:41', '2026-01-25 21:42:50'),
(246, 1, '01696c8ae1c63c1afdb3fbffe4fb27210bbbca3d9544aab54e9c09f82ac159aa', NULL, '2026-01-25 21:45:59', '2026-01-25 21:42:50', '2026-01-25 21:45:59'),
(247, 2, '292d4272e5fea8f565d4c1d9ce604a6b4026445f5298488fbb202444b6dfc7ad', NULL, '2026-01-25 21:46:50', '2026-01-25 21:43:13', '2026-01-25 21:46:50'),
(248, 1, '46b1201f56e260adb2660237a08f06adb65f980374e75e67e171d6815e891e56', NULL, '2026-01-25 22:12:45', '2026-01-25 21:45:59', '2026-01-25 22:12:45'),
(249, 2, '43e66c4dcf9d72b30b0a87c1bdd75182f62139259be93b9746cc4e87761b8a7a', NULL, '2026-01-25 22:00:47', '2026-01-25 21:46:50', '2026-01-25 22:00:47'),
(250, 2, 'bb65d4a5f79f7a32ee9965ee5c000bdef6fc91f95fb801cfdb58cbf87bef0fa9', NULL, '2026-01-25 22:01:26', '2026-01-25 22:00:47', '2026-01-25 22:01:26'),
(251, 2, 'b0b342c0031006924e57fce7b524203bb0660444ebcddff62e2dc9d9c2cff1f2', NULL, '2026-01-25 22:03:27', '2026-01-25 22:01:26', '2026-01-25 22:03:27'),
(252, 2, 'c16112146f2ed6a5e6050f5523de22dc79241ae279d833a60e4fac5535eb9608', NULL, '2026-01-25 22:04:18', '2026-01-25 22:03:27', '2026-01-25 22:04:18'),
(253, 2, '19726f9d39ce6f5527dc06b835e72a232fd0cd7b35ed862a3882c454efbd4792', NULL, '2026-02-01 22:04:18', '2026-01-25 22:04:18', NULL),
(254, 1, '0001be7d85e28791bc8de2d6d2ba3604ceb27441ba4085798af9579efca69d5b', NULL, '2026-02-01 22:12:45', '2026-01-25 22:12:45', NULL),
(255, 1, '3bb6586cf48587eea7ab78c0d2d06c766ec55bbfc5181cca256cd70beebb0413', NULL, '2026-01-25 22:12:45', '2026-01-25 22:12:45', '2026-01-25 22:12:45'),
(256, 1, '3d57186905cb95e9f758d5c8c3d44e669d6fce3d9f6d24bfcbc036ffa5c7d8df', NULL, '2026-02-01 22:12:45', '2026-01-25 22:12:45', NULL),
(257, 1, '3e8e4f5c5bf3223632ece1b57d6973aef53e052eb5ee8e74b580fb69714db169', NULL, '2026-01-25 22:13:16', '2026-01-25 22:12:45', '2026-01-25 22:13:16'),
(258, 1, 'a96aa590715a9823eb3c0e351691844ce6f4e342934e63da5922958529b411c2', NULL, '2026-01-25 22:26:47', '2026-01-25 22:13:16', '2026-01-25 22:26:47'),
(259, 2, 'bb8dd8dcc31a9e97d989126eec1bf9c80956ae646987d94897bab0d360d9bd29', NULL, '2026-01-25 22:26:47', '2026-01-25 22:17:27', '2026-01-25 22:26:47'),
(260, 1, '27e36bf924a797272cae77effc3e4cde506dd4a6c7af2df463bed47c50a51067', NULL, '2026-01-25 22:28:15', '2026-01-25 22:26:47', '2026-01-25 22:28:15'),
(261, 2, 'd94eeb0540ee4df6a498e60449dd3afcc117bf964b57b932df0abe5434c45cb7', NULL, '2026-01-25 22:28:15', '2026-01-25 22:26:47', '2026-01-25 22:28:15'),
(262, 1, 'b3e910d294147dbc1da79974bbec7b276bd96b0c762d8ec931d2f193708ad269', NULL, '2026-01-25 22:39:33', '2026-01-25 22:28:15', '2026-01-25 22:39:33'),
(263, 2, '515f131b7df479ad8cc44ca67a02f60129a8ac34e3f29324a40d9862a9ef9902', NULL, '2026-01-25 22:37:28', '2026-01-25 22:28:15', '2026-01-25 22:37:28'),
(264, 2, 'f0eedcf7b6f8d4d2200afffa1ebc34ff11afa2eceb582cd2d7abe28564f86ef2', NULL, '2026-01-25 22:49:35', '2026-01-25 22:37:28', '2026-01-25 22:49:35'),
(265, 1, '8de47946c0730af1bbebd8a27309fdb2a538afa32bded035a509e1944dd27e7d', NULL, '2026-01-25 22:49:35', '2026-01-25 22:39:33', '2026-01-25 22:49:35'),
(266, 1, 'be561d9e0dceff4b6d2c0f3f4bf53e0a46824d03915081641a8bc87ba1fc1dff', NULL, '2026-01-25 22:49:49', '2026-01-25 22:49:35', '2026-01-25 22:49:49'),
(267, 2, '0cff95c8a82a131995f4e4820dc614ea6fb58f129b85a263e06a6d34b5758c90', NULL, '2026-01-25 22:49:49', '2026-01-25 22:49:35', '2026-01-25 22:49:49'),
(268, 1, '3551d60f4af8fb522a5b0f53eee1f56b636a40893c96522571abd45a7e099b4d', NULL, '2026-01-25 22:49:58', '2026-01-25 22:49:49', '2026-01-25 22:49:58'),
(269, 2, '1d28796cb9dc487ba431569538ce2341fdf9308161fe88de4d532462b906ef5a', NULL, '2026-01-25 22:49:58', '2026-01-25 22:49:49', '2026-01-25 22:49:58'),
(270, 1, 'baa047f262dcce752beed29aa130c0b15e8122450860c5e3c0090325f3e4d0ba', NULL, '2026-01-25 22:51:34', '2026-01-25 22:49:58', '2026-01-25 22:51:34'),
(271, 2, '36ad2b6f8c447a1e9d1fbbc00b2c02083ac25f7164250a273d9bf47ffec555ca', NULL, '2026-01-25 22:51:34', '2026-01-25 22:49:58', '2026-01-25 22:51:34'),
(272, 2, '4e8984356499141e7d62bb14f5abf4e3b352f15eb251aa66d6d643439dc2ab0b', NULL, '2026-01-25 22:51:47', '2026-01-25 22:51:34', '2026-01-25 22:51:47'),
(273, 1, '007ee3e8a066f8dec00292eeddc26585952b727fa919aebd625853dbde8597bc', NULL, '2026-01-25 22:51:47', '2026-01-25 22:51:34', '2026-01-25 22:51:47'),
(274, 1, 'd35c720745f20dfefd527707e7133ab2547f48542ab5b211a6f282435586055f', NULL, '2026-01-25 22:52:03', '2026-01-25 22:51:47', '2026-01-25 22:52:03'),
(275, 2, '642051e7906afa95880d6a90e60ff7ef75ac621e07229da04fd345f08f9378bc', NULL, '2026-01-25 22:52:03', '2026-01-25 22:51:47', '2026-01-25 22:52:03'),
(276, 2, 'cf0db0ac5a157e58f93b2903c7920a1e7cce3cad6660fb7e75de44bbb5cf2bea', NULL, '2026-01-25 22:52:15', '2026-01-25 22:52:03', '2026-01-25 22:52:15'),
(277, 1, 'b125ba7ab0c502d6da282fdeef67d6ee5a76b14844c78ccb8ff3fb162afa0c3b', NULL, '2026-01-25 22:52:15', '2026-01-25 22:52:03', '2026-01-25 22:52:15'),
(278, 2, '2a16ca018e341743d53f66ed191bcb8889bde1de1b104241f7c09dcb9b7c8497', NULL, '2026-01-25 22:52:26', '2026-01-25 22:52:15', '2026-01-25 22:52:26'),
(279, 1, 'fe552dd5c90624bf08039183c53566af188dffd5f435f089f0ff5ac64961c974', NULL, '2026-01-25 22:52:26', '2026-01-25 22:52:15', '2026-01-25 22:52:26'),
(280, 2, '517765f97823a47fff3b801ec43548e3d43eb2a72261a293583ad94b8b8ddfef', NULL, '2026-01-25 22:52:39', '2026-01-25 22:52:26', '2026-01-25 22:52:39'),
(281, 1, '91469399f017cc64f91b3c64bcdfeb3931d726497e539f844e7a835934ca88fd', NULL, '2026-01-25 22:52:39', '2026-01-25 22:52:26', '2026-01-25 22:52:39'),
(282, 2, '93d8ea4c76093ea4481a72c501115a0dccb883eb9bb96b09610ba9fde5c92d35', NULL, '2026-01-25 22:57:19', '2026-01-25 22:52:39', '2026-01-25 22:57:19'),
(283, 1, '6e5166053beab873c70b6a64bc0f10aa94ac8a9a74138b0ee5e2376ebb5fc140', NULL, '2026-02-01 22:52:39', '2026-01-25 22:52:39', NULL),
(284, 2, 'd577911589045b8c28f35b6ba20522730f8655873e406c08846bb230ac738f0f', NULL, '2026-02-01 22:57:19', '2026-01-25 22:57:19', NULL),
(285, 2, 'ce08acfe19dcd96dd022c630b03d4a344bce5c1e66f3fc16cbd2aca9574c08f9', NULL, '2026-02-01 23:03:50', '2026-01-25 23:03:50', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `seasons`
--

CREATE TABLE `seasons` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(50) NOT NULL,
  `display_name` varchar(100) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `is_current` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `seasons`
--

INSERT INTO `seasons` (`id`, `name`, `display_name`, `start_date`, `end_date`, `is_current`, `created_at`, `updated_at`) VALUES
(1, '2025 - 2026', 'Temporada 2025 - 2026', '2026-01-23', '2026-01-23', 0, '2026-01-25 12:04:56', '2026-01-25 12:17:54'),
(2, '2025-2026', 'Temporada 2025-2026', '2026-01-24', '2026-01-24', 1, '2026-01-25 12:04:56', '2026-01-25 12:17:54');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `users`
--

CREATE TABLE `users` (
  `id` int(10) UNSIGNED NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) DEFAULT NULL,
  `avatar_url` varchar(500) DEFAULT NULL,
  `google_id` varchar(255) DEFAULT NULL,
  `auth_provider` enum('local','google','both') DEFAULT 'local',
  `email_verified` tinyint(1) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `is_admin` tinyint(1) NOT NULL DEFAULT 0,
  `reputation_points` int(10) UNSIGNED NOT NULL DEFAULT 100,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `users`
--

INSERT INTO `users` (`id`, `email`, `password_hash`, `first_name`, `last_name`, `avatar_url`, `google_id`, `auth_provider`, `email_verified`, `is_active`, `is_admin`, `reputation_points`, `created_at`, `updated_at`) VALUES
(1, 'jmpeiro@hotmail.com', '$2a$12$lOFo3W2fZc92l/VnHhafZ.9A1lHaZZcHlDzc7MW0RjiN1NRL0KJ0S', 'jose', 'peiro', '/uploads/avatars/b772181caac90770e40d51b0f5b2530b.png', NULL, 'local', 0, 1, 1, 100, '2026-01-24 00:12:23', '2026-01-24 16:36:26'),
(2, 'fescriba@hotmail.com', '$2a$12$Bzbvf7BxXYrzJdLHiRnejednvdXPFiS3SmoqggrXGWUrmx6klBAcm', 'Fran', 'Escribá', NULL, NULL, 'local', 0, 1, 1, 100, '2026-01-25 14:34:03', '2026-01-25 21:05:15');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `user_badges`
--

CREATE TABLE `user_badges` (
  `id` int(11) NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `badge_id` int(11) NOT NULL,
  `earned_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `seen` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `user_badges`
--

INSERT INTO `user_badges` (`id`, `user_id`, `badge_id`, `earned_at`, `seen`) VALUES
(1, 1, 14, '2026-01-25 09:43:56', 0),
(2, 2, 14, '2026-01-25 21:24:19', 0);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `user_xp`
--

CREATE TABLE `user_xp` (
  `user_id` int(10) UNSIGNED NOT NULL,
  `total_xp` int(11) NOT NULL DEFAULT 0,
  `level` int(11) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `user_xp`
--

INSERT INTO `user_xp` (`user_id`, `total_xp`, `level`) VALUES
(1, 15, 1),
(2, 15, 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `xp_log`
--

CREATE TABLE `xp_log` (
  `id` int(11) NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `xp_amount` int(11) NOT NULL,
  `source` varchar(50) NOT NULL,
  `reference_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `xp_log`
--

INSERT INTO `xp_log` (`id`, `user_id`, `xp_amount`, `source`, `reference_id`, `created_at`) VALUES
(1, 1, 5, 'proposal', NULL, '2026-01-25 09:43:56'),
(2, 1, 10, 'badge_reward', 14, '2026-01-25 09:43:56'),
(3, 2, 5, 'proposal', NULL, '2026-01-25 21:24:19'),
(4, 2, 10, 'badge_reward', 14, '2026-01-25 21:24:19');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `badge_definitions`
--
ALTER TABLE `badge_definitions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`);

--
-- Indices de la tabla `challenges`
--
ALTER TABLE `challenges`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_challenge` (`challenger_id`,`challenged_id`,`jornada_id`),
  ADD KEY `challenged_id` (`challenged_id`),
  ADD KEY `winner_id` (`winner_id`),
  ADD KEY `idx_challenges_status` (`status`),
  ADD KEY `idx_challenges_jornada` (`jornada_id`);

--
-- Indices de la tabla `challenge_stats`
--
ALTER TABLE `challenge_stats`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_rivalry` (`user_id`,`opponent_id`),
  ADD KEY `opponent_id` (`opponent_id`);

--
-- Indices de la tabla `groups`
--
ALTER TABLE `groups`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_by` (`created_by`);

--
-- Indices de la tabla `group_invitations`
--
ALTER TABLE `group_invitations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `invited_by` (`invited_by`),
  ADD KEY `idx_invitations_user_status` (`invited_user_id`,`status`),
  ADD KEY `idx_invitations_group` (`group_id`,`status`);

--
-- Indices de la tabla `group_invite_links`
--
ALTER TABLE `group_invite_links`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `token` (`token`),
  ADD KEY `group_id` (`group_id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `idx_invite_token` (`token`);

--
-- Indices de la tabla `group_members`
--
ALTER TABLE `group_members`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_group_member` (`group_id`,`user_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indices de la tabla `group_quinielas`
--
ALTER TABLE `group_quinielas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `idx_group_quinielas_group` (`group_id`),
  ADD KEY `idx_group_quinielas_status` (`status`),
  ADD KEY `idx_group_quinielas_deadline` (`deadline`);

--
-- Indices de la tabla `group_quiniela_matches`
--
ALTER TABLE `group_quiniela_matches`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_quiniela_match` (`quiniela_id`,`match_number`),
  ADD KEY `idx_quiniela_matches_quiniela` (`quiniela_id`);

--
-- Indices de la tabla `group_quiniela_predictions`
--
ALTER TABLE `group_quiniela_predictions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_match_prediction` (`user_id`,`match_id`),
  ADD KEY `match_id` (`match_id`),
  ADD KEY `idx_predictions_quiniela` (`quiniela_id`),
  ADD KEY `idx_predictions_user` (`user_id`);

--
-- Indices de la tabla `group_quiniela_scores`
--
ALTER TABLE `group_quiniela_scores`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_quiniela_user_score` (`quiniela_id`,`user_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `idx_scores_points` (`total_points`);

--
-- Indices de la tabla `group_scores`
--
ALTER TABLE `group_scores`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_group_jornada_score` (`group_id`,`jornada_id`),
  ADD KEY `jornada_id` (`jornada_id`),
  ADD KEY `proposal_id` (`proposal_id`),
  ADD KEY `idx_group_scores_group` (`group_id`,`total_points`);

--
-- Indices de la tabla `jornadas`
--
ALTER TABLE `jornadas`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_season_jornada` (`season`,`jornada_number`),
  ADD KEY `idx_jornadas_status` (`status`),
  ADD KEY `idx_jornadas_season_id` (`season_id`);

--
-- Indices de la tabla `league_divisions`
--
ALTER TABLE `league_divisions`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `league_history`
--
ALTER TABLE `league_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `league_season_id` (`league_season_id`),
  ADD KEY `from_division_id` (`from_division_id`),
  ADD KEY `to_division_id` (`to_division_id`);

--
-- Indices de la tabla `league_seasons`
--
ALTER TABLE `league_seasons`
  ADD PRIMARY KEY (`id`),
  ADD KEY `start_jornada_id` (`start_jornada_id`),
  ADD KEY `end_jornada_id` (`end_jornada_id`);

--
-- Indices de la tabla `league_standings`
--
ALTER TABLE `league_standings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_league_season` (`user_id`,`league_season_id`),
  ADD KEY `idx_standings_division` (`division_id`,`points`),
  ADD KEY `idx_standings_season` (`league_season_id`);

--
-- Indices de la tabla `matches`
--
ALTER TABLE `matches`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_jornada_match` (`jornada_id`,`match_number`);

--
-- Indices de la tabla `match_results`
--
ALTER TABLE `match_results`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `match_id` (`match_id`);

--
-- Indices de la tabla `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_notifications_user_read` (`user_id`,`is_read`,`created_at`);

--
-- Indices de la tabla `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_token_hash` (`token_hash`);

--
-- Indices de la tabla `proposal_comments`
--
ALTER TABLE `proposal_comments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `idx_comments_proposal` (`proposal_id`,`created_at`);

--
-- Indices de la tabla `proposal_predictions`
--
ALTER TABLE `proposal_predictions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_proposal_match` (`proposal_id`,`match_id`),
  ADD KEY `match_id` (`match_id`);

--
-- Indices de la tabla `proposal_votes`
--
ALTER TABLE `proposal_votes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_proposal_vote` (`proposal_id`,`user_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indices de la tabla `push_subscriptions`
--
ALTER TABLE `push_subscriptions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_endpoint` (`endpoint`),
  ADD KEY `idx_push_sub_user` (`user_id`);

--
-- Indices de la tabla `quiniela_proposals`
--
ALTER TABLE `quiniela_proposals`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_group_jornada_user` (`group_id`,`jornada_id`,`proposed_by`),
  ADD KEY `jornada_id` (`jornada_id`),
  ADD KEY `proposed_by` (`proposed_by`),
  ADD KEY `idx_proposals_group_jornada` (`group_id`,`jornada_id`,`status`),
  ADD KEY `idx_proposals_status` (`status`);

--
-- Indices de la tabla `quiniela_results`
--
ALTER TABLE `quiniela_results`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_result_proposal_match` (`proposal_id`,`match_id`),
  ADD KEY `match_id` (`match_id`);

--
-- Indices de la tabla `refresh_tokens`
--
ALTER TABLE `refresh_tokens`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_token_hash` (`token_hash`);

--
-- Indices de la tabla `seasons`
--
ALTER TABLE `seasons`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`),
  ADD KEY `idx_seasons_current` (`is_current`),
  ADD KEY `idx_seasons_dates` (`start_date`,`end_date`);

--
-- Indices de la tabla `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `google_id` (`google_id`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_google_id` (`google_id`);

--
-- Indices de la tabla `user_badges`
--
ALTER TABLE `user_badges`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_badge` (`user_id`,`badge_id`),
  ADD KEY `badge_id` (`badge_id`);

--
-- Indices de la tabla `user_xp`
--
ALTER TABLE `user_xp`
  ADD PRIMARY KEY (`user_id`);

--
-- Indices de la tabla `xp_log`
--
ALTER TABLE `xp_log`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_xp_log` (`user_id`,`created_at`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `badge_definitions`
--
ALTER TABLE `badge_definitions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=40;

--
-- AUTO_INCREMENT de la tabla `challenges`
--
ALTER TABLE `challenges`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `challenge_stats`
--
ALTER TABLE `challenge_stats`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `groups`
--
ALTER TABLE `groups`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `group_invitations`
--
ALTER TABLE `group_invitations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `group_invite_links`
--
ALTER TABLE `group_invite_links`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `group_members`
--
ALTER TABLE `group_members`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT de la tabla `group_quinielas`
--
ALTER TABLE `group_quinielas`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `group_quiniela_matches`
--
ALTER TABLE `group_quiniela_matches`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `group_quiniela_predictions`
--
ALTER TABLE `group_quiniela_predictions`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `group_quiniela_scores`
--
ALTER TABLE `group_quiniela_scores`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `group_scores`
--
ALTER TABLE `group_scores`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `jornadas`
--
ALTER TABLE `jornadas`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `league_divisions`
--
ALTER TABLE `league_divisions`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `league_history`
--
ALTER TABLE `league_history`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `league_seasons`
--
ALTER TABLE `league_seasons`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `league_standings`
--
ALTER TABLE `league_standings`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `matches`
--
ALTER TABLE `matches`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=46;

--
-- AUTO_INCREMENT de la tabla `match_results`
--
ALTER TABLE `match_results`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT de la tabla `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `proposal_comments`
--
ALTER TABLE `proposal_comments`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `proposal_predictions`
--
ALTER TABLE `proposal_predictions`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT de la tabla `proposal_votes`
--
ALTER TABLE `proposal_votes`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `push_subscriptions`
--
ALTER TABLE `push_subscriptions`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `quiniela_proposals`
--
ALTER TABLE `quiniela_proposals`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `quiniela_results`
--
ALTER TABLE `quiniela_results`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `refresh_tokens`
--
ALTER TABLE `refresh_tokens`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=286;

--
-- AUTO_INCREMENT de la tabla `seasons`
--
ALTER TABLE `seasons`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `users`
--
ALTER TABLE `users`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `user_badges`
--
ALTER TABLE `user_badges`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `xp_log`
--
ALTER TABLE `xp_log`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `challenges`
--
ALTER TABLE `challenges`
  ADD CONSTRAINT `challenges_ibfk_1` FOREIGN KEY (`challenger_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `challenges_ibfk_2` FOREIGN KEY (`challenged_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `challenges_ibfk_3` FOREIGN KEY (`jornada_id`) REFERENCES `jornadas` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `challenges_ibfk_4` FOREIGN KEY (`winner_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `challenge_stats`
--
ALTER TABLE `challenge_stats`
  ADD CONSTRAINT `challenge_stats_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `challenge_stats_ibfk_2` FOREIGN KEY (`opponent_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `groups`
--
ALTER TABLE `groups`
  ADD CONSTRAINT `groups_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `group_invitations`
--
ALTER TABLE `group_invitations`
  ADD CONSTRAINT `group_invitations_ibfk_1` FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `group_invitations_ibfk_2` FOREIGN KEY (`invited_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `group_invitations_ibfk_3` FOREIGN KEY (`invited_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `group_invite_links`
--
ALTER TABLE `group_invite_links`
  ADD CONSTRAINT `group_invite_links_ibfk_1` FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `group_invite_links_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `group_members`
--
ALTER TABLE `group_members`
  ADD CONSTRAINT `group_members_ibfk_1` FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `group_members_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `group_quinielas`
--
ALTER TABLE `group_quinielas`
  ADD CONSTRAINT `group_quinielas_ibfk_1` FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `group_quinielas_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `group_quiniela_matches`
--
ALTER TABLE `group_quiniela_matches`
  ADD CONSTRAINT `group_quiniela_matches_ibfk_1` FOREIGN KEY (`quiniela_id`) REFERENCES `group_quinielas` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `group_quiniela_predictions`
--
ALTER TABLE `group_quiniela_predictions`
  ADD CONSTRAINT `group_quiniela_predictions_ibfk_1` FOREIGN KEY (`quiniela_id`) REFERENCES `group_quinielas` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `group_quiniela_predictions_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `group_quiniela_predictions_ibfk_3` FOREIGN KEY (`match_id`) REFERENCES `group_quiniela_matches` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `group_quiniela_scores`
--
ALTER TABLE `group_quiniela_scores`
  ADD CONSTRAINT `group_quiniela_scores_ibfk_1` FOREIGN KEY (`quiniela_id`) REFERENCES `group_quinielas` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `group_quiniela_scores_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `group_scores`
--
ALTER TABLE `group_scores`
  ADD CONSTRAINT `group_scores_ibfk_1` FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `group_scores_ibfk_2` FOREIGN KEY (`jornada_id`) REFERENCES `jornadas` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `group_scores_ibfk_3` FOREIGN KEY (`proposal_id`) REFERENCES `quiniela_proposals` (`id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `jornadas`
--
ALTER TABLE `jornadas`
  ADD CONSTRAINT `fk_jornadas_season` FOREIGN KEY (`season_id`) REFERENCES `seasons` (`id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `league_history`
--
ALTER TABLE `league_history`
  ADD CONSTRAINT `league_history_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `league_history_ibfk_2` FOREIGN KEY (`league_season_id`) REFERENCES `league_seasons` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `league_history_ibfk_3` FOREIGN KEY (`from_division_id`) REFERENCES `league_divisions` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `league_history_ibfk_4` FOREIGN KEY (`to_division_id`) REFERENCES `league_divisions` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `league_seasons`
--
ALTER TABLE `league_seasons`
  ADD CONSTRAINT `league_seasons_ibfk_1` FOREIGN KEY (`start_jornada_id`) REFERENCES `jornadas` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `league_seasons_ibfk_2` FOREIGN KEY (`end_jornada_id`) REFERENCES `jornadas` (`id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `league_standings`
--
ALTER TABLE `league_standings`
  ADD CONSTRAINT `league_standings_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `league_standings_ibfk_2` FOREIGN KEY (`league_season_id`) REFERENCES `league_seasons` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `league_standings_ibfk_3` FOREIGN KEY (`division_id`) REFERENCES `league_divisions` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `matches`
--
ALTER TABLE `matches`
  ADD CONSTRAINT `matches_ibfk_1` FOREIGN KEY (`jornada_id`) REFERENCES `jornadas` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `match_results`
--
ALTER TABLE `match_results`
  ADD CONSTRAINT `match_results_ibfk_1` FOREIGN KEY (`match_id`) REFERENCES `matches` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD CONSTRAINT `fk_reset_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `proposal_comments`
--
ALTER TABLE `proposal_comments`
  ADD CONSTRAINT `proposal_comments_ibfk_1` FOREIGN KEY (`proposal_id`) REFERENCES `quiniela_proposals` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `proposal_comments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `proposal_predictions`
--
ALTER TABLE `proposal_predictions`
  ADD CONSTRAINT `proposal_predictions_ibfk_1` FOREIGN KEY (`proposal_id`) REFERENCES `quiniela_proposals` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `proposal_predictions_ibfk_2` FOREIGN KEY (`match_id`) REFERENCES `matches` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `proposal_votes`
--
ALTER TABLE `proposal_votes`
  ADD CONSTRAINT `proposal_votes_ibfk_1` FOREIGN KEY (`proposal_id`) REFERENCES `quiniela_proposals` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `proposal_votes_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `push_subscriptions`
--
ALTER TABLE `push_subscriptions`
  ADD CONSTRAINT `push_subscriptions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `quiniela_proposals`
--
ALTER TABLE `quiniela_proposals`
  ADD CONSTRAINT `quiniela_proposals_ibfk_1` FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `quiniela_proposals_ibfk_2` FOREIGN KEY (`jornada_id`) REFERENCES `jornadas` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `quiniela_proposals_ibfk_3` FOREIGN KEY (`proposed_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `quiniela_results`
--
ALTER TABLE `quiniela_results`
  ADD CONSTRAINT `quiniela_results_ibfk_1` FOREIGN KEY (`proposal_id`) REFERENCES `quiniela_proposals` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `quiniela_results_ibfk_2` FOREIGN KEY (`match_id`) REFERENCES `matches` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `refresh_tokens`
--
ALTER TABLE `refresh_tokens`
  ADD CONSTRAINT `fk_refresh_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `user_badges`
--
ALTER TABLE `user_badges`
  ADD CONSTRAINT `user_badges_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_badges_ibfk_2` FOREIGN KEY (`badge_id`) REFERENCES `badge_definitions` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `user_xp`
--
ALTER TABLE `user_xp`
  ADD CONSTRAINT `user_xp_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `xp_log`
--
ALTER TABLE `xp_log`
  ADD CONSTRAINT `xp_log_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
