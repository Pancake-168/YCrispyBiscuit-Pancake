/*
 Navicat Premium Dump SQL

 Source Server         : YCrispBiscuit
 Source Server Type    : MySQL
 Source Server Version : 80042 (8.0.42)
 Source Host           : localhost:3306
 Source Schema         : ycrispbiscuit-bestfriend

 Target Server Type    : MySQL
 Target Server Version : 80042 (8.0.42)
 File Encoding         : 65001

 Date: 24/11/2025 18:21:06
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for calendar_event_extended_props
-- ----------------------------
DROP TABLE IF EXISTS `calendar_event_extended_props`;
CREATE TABLE `calendar_event_extended_props`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `event_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `description` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `priority` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `category` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `location` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `attendees` json NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `event_id`(`event_id` ASC) USING BTREE,
  CONSTRAINT `calendar_event_extended_props_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `calendar_events` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of calendar_event_extended_props
-- ----------------------------

-- ----------------------------
-- Table structure for calendar_events
-- ----------------------------
DROP TABLE IF EXISTS `calendar_events`;
CREATE TABLE `calendar_events`  (
  `id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `title` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `content` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '事件类型：default, meeting, birthday, holiday, deadline',
  `importance` varchar(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '重要性：R, SR, SSR, SP',
  `repeat` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '重复类型：none, daily, weekly, monthly, yearly',
  `weekdays` json NULL COMMENT '可选，repeat为weekly时使用，0表示星期天，1表示星期一，依此类推',
  `range` tinyint(1) NULL DEFAULT NULL COMMENT '可选，是否为跨天事件',
  `startDay` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '事件开始日期，格式为 YYYY-MM-DD',
  `endDay` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '事件结束日期，格式为 YYYY-MM-DD',
  `startTime` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '可选，事件开始时间，格式为 HH:MM',
  `endTime` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '可选，事件结束时间，格式为 HH:MM',
  `status` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '可选，事件状态：normal, completed, canceled',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `ix_calendar_events_id`(`id` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of calendar_events
-- ----------------------------

SET FOREIGN_KEY_CHECKS = 1;
