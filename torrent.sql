
SET NAMES utf8;
SET time_zone = '+00:00';
SET foreign_key_checks = 0;
SET sql_mode = 'NO_AUTO_VALUE_ON_ZERO';

CREATE DATABASE `torrent` /*!40100 DEFAULT CHARACTER SET latin1 */;
USE `torrent`;

DROP TABLE IF EXISTS `file`;
CREATE TABLE `file` (
  `infohash` char(40) NOT NULL,
  `json` json NOT NULL,
  `count` int(11) NOT NULL,
  `update_date` datetime NOT NULL,
  `create_date` datetime NOT NULL,
  `binary` mediumblob NOT NULL,
  PRIMARY KEY (`infohash`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;