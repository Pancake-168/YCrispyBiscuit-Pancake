/*
 Navicat Premium Dump SQL

 Source Server         : YCrispBiscuit
 Source Server Type    : MySQL
 Source Server Version : 80042 (8.0.42)
 Source Host           : localhost:3306
 Source Schema         : ycrispbiscuittools

 Target Server Type    : MySQL
 Target Server Version : 80042 (8.0.42)
 File Encoding         : 65001

 Date: 11/09/2025 18:14:32
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for acgn_personal_preference_table_generator
-- ----------------------------
DROP TABLE IF EXISTS `acgn_personal_preference_table_generator`;
CREATE TABLE `acgn_personal_preference_table_generator`  (
  `ACGN_Personal_Preference_Table_Generator_ID` int NOT NULL COMMENT '喜好表ID',
  `ACGN_Personal_Preference_Table_Generator_Name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '喜好表名称',
  `ACGN_Personal_Preference_Table_Generator_Main_Content` json NULL COMMENT '主要内容，记录表格每个格子的类型',
  `Data_Source_Number` int NULL DEFAULT NULL COMMENT '对应的资源库内Item的数量，通过查询Item_ID的数量来确定',
  PRIMARY KEY (`ACGN_Personal_Preference_Table_Generator_ID`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of acgn_personal_preference_table_generator
-- ----------------------------
INSERT INTO `acgn_personal_preference_table_generator` VALUES (1, 'Genshin Impact', '[\"最喜欢的\", \"最讨厌的\", \"最常用的\", \"最想抽到的\", \"最冷门的\", \"最强的\", \"最弱的\", \"最可爱的\", \"最帅的\", \"最治愈的\", \"最高冷的\", \"最热情的\", \"最风雅的\", \"想看ta性转\", \"想变成ta的\"]', 116);
INSERT INTO `acgn_personal_preference_table_generator` VALUES (2, 'Honkai: Star Rail', '[\"最喜欢的\", \"最讨厌的\", \"最常用的\", \"最想抽到的\", \"最冷门的\", \"最强的\", \"最弱的\", \"最可爱的\", \"最帅的\", \"最治愈的\", \"最高冷的\", \"最热情的\", \"最风雅的\", \"想看ta性转\", \"想变成ta的\"]', 83);
INSERT INTO `acgn_personal_preference_table_generator` VALUES (3, 'ZenlessZoneZero', '[\"最喜欢的\", \"最讨厌的\", \"最常用的\", \"最想抽到的\", \"最冷门的\", \"最强的\", \"最弱的\", \"最可爱的\", \"最帅的\", \"最治愈的\", \"最高冷的\", \"最热情的\", \"最风雅的\", \"想看ta性转\", \"想变成ta的\"]', 43);
INSERT INTO `acgn_personal_preference_table_generator` VALUES (4, 'Wuthering Waves', '[\"最喜欢的\", \"最讨厌的\", \"最常用的\", \"最想抽到的\", \"最冷门的\", \"最强的\", \"最弱的\", \"最可爱的\", \"最帅的\", \"最治愈的\", \"最高冷的\", \"最热情的\", \"最风雅的\", \"想看ta性转\", \"想变成ta的\"]', 44);

-- ----------------------------
-- Table structure for data_source_acgn_personal_preference_table_generator
-- ----------------------------
DROP TABLE IF EXISTS `data_source_acgn_personal_preference_table_generator`;
CREATE TABLE `data_source_acgn_personal_preference_table_generator`  (
  `Data_Source_ACGN_Personal_Preference_Table_Generator_ID` int NOT NULL AUTO_INCREMENT COMMENT '自增主键',
  `ACGN_Personal_Preference_Table_Generator_ID` int NULL DEFAULT NULL COMMENT '外键，属于哪个喜好表，关联ACGN_Personal_Preference_Table_Generator',
  `Item_Picture` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '图片',
  `Item_Name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '名称',
  `Item_ID` int NULL DEFAULT NULL COMMENT '喜好表内ID，表内ID按理来说不重复，但此处不知道该怎么设置了',
  PRIMARY KEY (`Data_Source_ACGN_Personal_Preference_Table_Generator_ID`) USING BTREE,
  INDEX `key1`(`ACGN_Personal_Preference_Table_Generator_ID` ASC) USING BTREE,
  CONSTRAINT `key1` FOREIGN KEY (`ACGN_Personal_Preference_Table_Generator_ID`) REFERENCES `acgn_personal_preference_table_generator` (`ACGN_Personal_Preference_Table_Generator_ID`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 863 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of data_source_acgn_personal_preference_table_generator
-- ----------------------------
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (577, 4, 'resources/ACGN_Personal_Preference_Table_Generator/WutheringWaves/16789.png', '露帕', 16789);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (578, 4, 'resources/ACGN_Personal_Preference_Table_Generator/WutheringWaves/17113.png', '弗洛洛', 17113);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (579, 4, 'resources/ACGN_Personal_Preference_Table_Generator/WutheringWaves/16790.png', '卡提希娅', 16790);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (580, 4, 'resources/ACGN_Personal_Preference_Table_Generator/WutheringWaves/16433.png', '夏空', 16433);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (581, 4, 'resources/ACGN_Personal_Preference_Table_Generator/WutheringWaves/16744.png', '赞妮', 16744);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (582, 4, 'resources/ACGN_Personal_Preference_Table_Generator/WutheringWaves/16175.png', '坎特蕾拉', 16175);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (583, 4, 'resources/ACGN_Personal_Preference_Table_Generator/WutheringWaves/15514.png', '布兰特', 15514);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (584, 4, 'resources/ACGN_Personal_Preference_Table_Generator/WutheringWaves/15515.png', '菲比', 15515);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (585, 4, 'resources/ACGN_Personal_Preference_Table_Generator/WutheringWaves/15513.png', '洛可可', 15513);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (586, 4, 'resources/ACGN_Personal_Preference_Table_Generator/WutheringWaves/15511.png', '珂莱塔', 15511);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (587, 4, 'resources/ACGN_Personal_Preference_Table_Generator/WutheringWaves/15093.png', '椿', 15093);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (588, 4, 'resources/ACGN_Personal_Preference_Table_Generator/WutheringWaves/14942.png', '守岸人', 14942);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (589, 4, 'resources/ACGN_Personal_Preference_Table_Generator/WutheringWaves/14944.png', '折枝', 14944);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (590, 4, 'resources/ACGN_Personal_Preference_Table_Generator/WutheringWaves/14943.png', '相里要', 14943);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (591, 4, 'resources/ACGN_Personal_Preference_Table_Generator/WutheringWaves/14734.png', '长离', 14734);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (592, 4, 'resources/ACGN_Personal_Preference_Table_Generator/WutheringWaves/14234.png', '今汐', 14234);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (593, 4, 'resources/ACGN_Personal_Preference_Table_Generator/WutheringWaves/13715.png', '吟霖', 13715);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (594, 4, 'resources/ACGN_Personal_Preference_Table_Generator/WutheringWaves/11718.png', '忌炎', 11718);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (595, 4, 'resources/ACGN_Personal_Preference_Table_Generator/WutheringWaves/16405.png', '漂泊者-女-气动', 16405);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (596, 4, 'resources/ACGN_Personal_Preference_Table_Generator/WutheringWaves/16404.png', '漂泊者-男-气动', 16404);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (597, 4, 'resources/ACGN_Personal_Preference_Table_Generator/WutheringWaves/11301.png', '鉴心', 11301);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (598, 4, 'resources/ACGN_Personal_Preference_Table_Generator/WutheringWaves/11730.png', '卡卡罗', 11730);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (599, 4, 'resources/ACGN_Personal_Preference_Table_Generator/WutheringWaves/11885.png', '安可', 11885);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (600, 4, 'resources/ACGN_Personal_Preference_Table_Generator/WutheringWaves/11639.png', '维里奈', 11639);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (601, 4, 'resources/ACGN_Personal_Preference_Table_Generator/WutheringWaves/11299.png', '凌阳', 11299);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (602, 4, 'resources/ACGN_Personal_Preference_Table_Generator/WutheringWaves/11641.png', '漂泊者-男-衍射', 11641);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (603, 4, 'resources/ACGN_Personal_Preference_Table_Generator/WutheringWaves/12790.png', '漂泊者-女-衍射', 12790);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (604, 4, 'resources/ACGN_Personal_Preference_Table_Generator/WutheringWaves/13197.png', '漂泊者-男-湮灭', 13197);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (605, 4, 'resources/ACGN_Personal_Preference_Table_Generator/WutheringWaves/13198.png', '漂泊者-女-湮灭', 13198);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (606, 4, 'resources/ACGN_Personal_Preference_Table_Generator/WutheringWaves/15097.png', '灯灯', 15097);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (607, 4, 'resources/ACGN_Personal_Preference_Table_Generator/WutheringWaves/11302.png', '秧秧', 11302);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (608, 4, 'resources/ACGN_Personal_Preference_Table_Generator/WutheringWaves/14941.png', '釉瑚', 14941);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (609, 4, 'resources/ACGN_Personal_Preference_Table_Generator/WutheringWaves/11227.png', '白芷', 11227);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (610, 4, 'resources/ACGN_Personal_Preference_Table_Generator/WutheringWaves/11719.png', '炽霞', 11719);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (611, 4, 'resources/ACGN_Personal_Preference_Table_Generator/WutheringWaves/11300.png', '散华', 11300);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (612, 4, 'resources/ACGN_Personal_Preference_Table_Generator/WutheringWaves/11651.png', '秋水', 11651);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (613, 4, 'resources/ACGN_Personal_Preference_Table_Generator/WutheringWaves/11303.png', '丹瑾', 11303);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (614, 4, 'resources/ACGN_Personal_Preference_Table_Generator/WutheringWaves/11816.png', '莫特斐', 11816);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (615, 4, 'resources/ACGN_Personal_Preference_Table_Generator/WutheringWaves/11656.png', '渊武', 11656);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (616, 4, 'resources/ACGN_Personal_Preference_Table_Generator/WutheringWaves/11710.png', '桃祈', 11710);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (617, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/505631.png', '伊涅芙', 505631);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (618, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/503613.png', '玛薇卡', 503613);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (619, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/501441.png', '艾梅莉埃', 501441);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (620, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/504621.png', '伊安珊', 504621);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (621, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/5866.png', '瑶瑶', 5866);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (622, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/112.png', '香菱', 112);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (623, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/505417.png', '丝柯克', 505417);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (624, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/3386.png', '申鹤', 3386);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (625, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/505418.png', '塔利雅', 505418);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (626, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/4781.png', '坎蒂丝', 4781);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (627, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/1221.png', '迪奥娜', 1221);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (628, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/501624.png', '基尼奇', 501624);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (629, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/2404.png', '雷电将军', 2404);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (630, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/2123.png', '神里绫华', 2123);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (631, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/3875.png', '神里绫人', 3875);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (632, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/5493.png', '珐露珊', 5493);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (633, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/500987.png', '千织', 500987);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (634, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/3564.png', '八重神子', 3564);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (635, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/3276.png', '荒泷一斗', 3276);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (636, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/2124.png', '宵宫', 2124);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (637, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/6938.png', '琳妮特', 6938);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (638, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/2402.png', '九条裟罗', 2402);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (639, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/504976.png', '爱可菲', 504976);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (640, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/2606.png', '托马', 2606);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (641, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/500419.png', '娜维娅', 500419);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (642, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/504977.png', '伊法', 504977);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (643, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/502927.png', '欧洛伦', 502927);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (644, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/5297.png', '莱依拉', 5297);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (645, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/502306.png', '希诺宁', 502306);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (646, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/57.png', '温迪', 57);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (647, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/1795.png', '烟绯', 1795);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (648, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/4073.png', '旅行者·火 ', 4073);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (649, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/4074.png', '旅行者·火', 4074);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (650, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/505505.png', '旅行者·水', 505505);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (651, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/505500.png', '旅行者·水', 505500);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (652, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/505498.png', '旅行者·草', 505498);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (653, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/505502.png', '旅行者·草', 505502);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (654, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/505496.png', '旅行者·雷', 505496);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (655, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/505503.png', '旅行者·雷', 505503);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (656, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/505497.png', '旅行者·岩', 505497);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (657, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/505501.png', '旅行者·岩', 505501);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (658, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/505504.png', '旅行者·风', 505504);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (659, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/505499.png', '旅行者·风', 505499);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (660, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/500673.png', '闲云', 500673);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (661, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/79.png', '北斗', 79);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (662, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/504570.png', '瓦雷莎', 504570);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (663, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/500672.png', '嘉明', 500672);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (664, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/500605.png', '夏沃蕾', 500605);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (665, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/500291.png', '芙宁娜', 500291);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (666, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/500286.png', '莱欧斯利', 500286);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (667, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/504440.png', '梦见月瑞希', 504440);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (668, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/501214.png', '希格雯', 501214);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (669, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/503614.png', '蓝砚', 503614);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (670, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/501157.png', '阿蕾奇诺', 501157);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (671, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/501213.png', '克洛琳德', 501213);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (672, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/6489.png', '白术', 6489);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (673, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/1058.png', '刻晴', 1058);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (674, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/1433.png', '甘雨', 1433);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (675, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/1056.png', '七七', 1056);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (676, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/1220.png', '达达利亚', 1220);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (677, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/1498.png', '魈', 1498);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (678, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/503612.png', '茜特菈莉', 503612);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (679, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/500207.png', '那维莱特', 500207);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (680, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/1290.png', '钟离', 1290);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (681, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/502928.png', '恰斯卡', 502928);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (682, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/5111.png', '纳西妲', 5111);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (683, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/1627.png', '胡桃', 1627);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (684, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/501625.png', '玛拉妮', 501625);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (685, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/501626.png', '卡齐娜', 501626);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (686, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/2142.png', '枫原万叶', 2142);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (687, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/4334.png', '提纳里', 4334);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (688, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/6180.png', '迪希雅', 6180);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (689, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/59.png', '琴', 59);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (690, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/75.png', '迪卢克', 75);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (691, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/1057.png', '莫娜', 1057);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (692, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/4081.png', '夜兰', 4081);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (693, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/5020.png', '妮露', 5020);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (694, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/5865.png', '艾尔海森', 5865);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (695, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/6937.png', '林尼', 6937);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (696, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/4780.png', '赛诺', 4780);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (697, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/5494.png', '流浪者', 5494);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (698, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/1360.png', '阿贝多', 1360);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (699, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/2040.png', '优菈', 2040);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (700, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/2403.png', '珊瑚宫心海', 2403);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (701, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/55.png', '可莉', 55);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (702, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/111.png', '诺艾尔', 111);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (703, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/1744.png', '罗莎莉亚', 1744);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (704, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/501212.png', '赛索斯', 501212);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (705, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/500292.png', '夏洛蒂', 500292);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (706, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/7257.png', '菲米尼', 7257);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (707, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/6594.png', '绮良良', 6594);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (708, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/6490.png', '卡维', 6490);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (709, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/6285.png', '米卡', 6285);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (710, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/4736.png', '多莉', 4736);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (711, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/4333.png', '柯莱', 4333);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (712, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/4197.png', '鹿野院平藏', 4197);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (713, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/4148.png', '久岐忍', 4148);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (714, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/3387.png', '云堇', 3387);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (715, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/3275.png', '五郎', 3275);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (716, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/2125.png', '早柚', 2125);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (717, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/78.png', '凝光', 78);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (718, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/382.png', '菲谢尔', 382);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (719, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/105.png', '班尼特', 105);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (720, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/92.png', '丽莎', 92);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (721, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/241.png', '行秋', 241);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (722, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/54.png', '安柏', 54);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (723, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/644.png', '重云', 644);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (724, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/56.png', '雷泽', 56);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (725, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/61.png', '芭芭拉', 61);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (726, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/76.png', '凯亚', 76);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (727, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/1055.png', '砂糖', 1055);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (728, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/1291.png', '辛焱', 1291);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (729, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/2415.png', '埃洛伊', 2415);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (730, 2, 'resources/ACGN_Personal_Preference_Table_Generator/HonkaiStarRail/5339.png', 'Saber', 5339);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (731, 2, 'resources/ACGN_Personal_Preference_Table_Generator/HonkaiStarRail/5338.png', 'Archer', 5338);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (732, 2, 'resources/ACGN_Personal_Preference_Table_Generator/HonkaiStarRail/5107.png', '白厄', 5107);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (733, 2, 'resources/ACGN_Personal_Preference_Table_Generator/HonkaiStarRail/4608.png', '缇宝', 4608);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (734, 2, 'resources/ACGN_Personal_Preference_Table_Generator/HonkaiStarRail/4174.png', '星期日', 4174);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (735, 2, 'resources/ACGN_Personal_Preference_Table_Generator/HonkaiStarRail/2087.png', '花火', 2087);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (736, 2, 'resources/ACGN_Personal_Preference_Table_Generator/HonkaiStarRail/1085.png', '银狼', 1085);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (737, 2, 'resources/ACGN_Personal_Preference_Table_Generator/HonkaiStarRail/1214.png', '刃', 1214);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (738, 2, 'resources/ACGN_Personal_Preference_Table_Generator/HonkaiStarRail/1298.png', '卡芙卡', 1298);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (739, 2, 'resources/ACGN_Personal_Preference_Table_Generator/HonkaiStarRail/1708.png', '镜流', 1708);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (740, 2, 'resources/ACGN_Personal_Preference_Table_Generator/HonkaiStarRail/5583.png', '刻律德菈', 5583);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (741, 2, 'resources/ACGN_Personal_Preference_Table_Generator/HonkaiStarRail/5582.png', '海瑟音', 5582);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (742, 2, 'resources/ACGN_Personal_Preference_Table_Generator/HonkaiStarRail/5109.png', '赛飞儿', 5109);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (743, 2, 'resources/ACGN_Personal_Preference_Table_Generator/HonkaiStarRail/4440.png', '阿格莱雅', 4440);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (744, 2, 'resources/ACGN_Personal_Preference_Table_Generator/HonkaiStarRail/5108.png', '风堇', 5108);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (745, 2, 'resources/ACGN_Personal_Preference_Table_Generator/HonkaiStarRail/4439.png', '大黑塔', 4439);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (746, 2, 'resources/ACGN_Personal_Preference_Table_Generator/HonkaiStarRail/4917.png', '那刻夏', 4917);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (747, 2, 'resources/ACGN_Personal_Preference_Table_Generator/HonkaiStarRail/1873.png', '真理医生', 1873);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (748, 2, 'resources/ACGN_Personal_Preference_Table_Generator/HonkaiStarRail/4916.png', '遐蝶', 4916);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (749, 2, 'resources/ACGN_Personal_Preference_Table_Generator/HonkaiStarRail/4175.png', '忘归人', 4175);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (750, 2, 'resources/ACGN_Personal_Preference_Table_Generator/HonkaiStarRail/3058.png', '椒丘', 3058);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (751, 2, 'resources/ACGN_Personal_Preference_Table_Generator/HonkaiStarRail/2300.png', '黄泉', 2300);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (752, 2, 'resources/ACGN_Personal_Preference_Table_Generator/HonkaiStarRail/4609.png', '万敌', 4609);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (753, 2, 'resources/ACGN_Personal_Preference_Table_Generator/HonkaiStarRail/1712.png', '藿藿', 1712);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (754, 2, 'resources/ACGN_Personal_Preference_Table_Generator/HonkaiStarRail/3056.png', '云璃', 3056);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (755, 2, 'resources/ACGN_Personal_Preference_Table_Generator/HonkaiStarRail/2526.png', '波提欧', 2526);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (756, 2, 'resources/ACGN_Personal_Preference_Table_Generator/HonkaiStarRail/2524.png', '知更鸟', 2524);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (757, 2, 'resources/ACGN_Personal_Preference_Table_Generator/HonkaiStarRail/4442.png', '开拓者•记忆', 4442);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (758, 2, 'resources/ACGN_Personal_Preference_Table_Generator/HonkaiStarRail/4441.png', '开拓者•记忆', 4441);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (759, 2, 'resources/ACGN_Personal_Preference_Table_Generator/HonkaiStarRail/3502.png', '灵砂', 3502);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (760, 2, 'resources/ACGN_Personal_Preference_Table_Generator/HonkaiStarRail/3501.png', '飞霄', 3501);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (761, 2, 'resources/ACGN_Personal_Preference_Table_Generator/HonkaiStarRail/2675.png', '翡翠', 2675);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (762, 2, 'resources/ACGN_Personal_Preference_Table_Generator/HonkaiStarRail/2674.png', '流萤', 2674);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (763, 2, 'resources/ACGN_Personal_Preference_Table_Generator/HonkaiStarRail/389.png', '景元', 389);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (764, 2, 'resources/ACGN_Personal_Preference_Table_Generator/HonkaiStarRail/2302.png', '砂金', 2302);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (765, 2, 'resources/ACGN_Personal_Preference_Table_Generator/HonkaiStarRail/3732.png', '乱破', 3732);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (766, 2, 'resources/ACGN_Personal_Preference_Table_Generator/HonkaiStarRail/2082.png', '黑天鹅', 2082);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (767, 2, 'resources/ACGN_Personal_Preference_Table_Generator/HonkaiStarRail/1472.png', '丹恒•饮月', 1472);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (768, 2, 'resources/ACGN_Personal_Preference_Table_Generator/HonkaiStarRail/1874.png', '阮•梅', 1874);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (769, 2, 'resources/ACGN_Personal_Preference_Table_Generator/HonkaiStarRail/1714.png', '银枝', 1714);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (770, 2, 'resources/ACGN_Personal_Preference_Table_Generator/HonkaiStarRail/564.png', '白露', 564);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (771, 2, 'resources/ACGN_Personal_Preference_Table_Generator/HonkaiStarRail/565.png', '彦卿', 565);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (772, 2, 'resources/ACGN_Personal_Preference_Table_Generator/HonkaiStarRail/1646.png', '符玄', 1646);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (773, 2, 'resources/ACGN_Personal_Preference_Table_Generator/HonkaiStarRail/1188.png', '罗刹', 1188);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (774, 2, 'resources/ACGN_Personal_Preference_Table_Generator/HonkaiStarRail/1709.png', '托帕&账账', 1709);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (775, 2, 'resources/ACGN_Personal_Preference_Table_Generator/HonkaiStarRail/414.png', '克拉拉', 414);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (776, 2, 'resources/ACGN_Personal_Preference_Table_Generator/HonkaiStarRail/424.png', '杰帕德', 424);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (777, 2, 'resources/ACGN_Personal_Preference_Table_Generator/HonkaiStarRail/317.png', '希儿', 317);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (778, 2, 'resources/ACGN_Personal_Preference_Table_Generator/HonkaiStarRail/453.png', '布洛妮娅', 453);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (779, 2, 'resources/ACGN_Personal_Preference_Table_Generator/HonkaiStarRail/560.png', '瓦尔特', 560);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (780, 2, 'resources/ACGN_Personal_Preference_Table_Generator/HonkaiStarRail/407.png', '姬子', 407);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (781, 2, 'resources/ACGN_Personal_Preference_Table_Generator/HonkaiStarRail/411.png', '开拓者•同谐', 411);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (782, 2, 'resources/ACGN_Personal_Preference_Table_Generator/HonkaiStarRail/872.png', '开拓者•同谐', 872);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (783, 2, 'resources/ACGN_Personal_Preference_Table_Generator/HonkaiStarRail/3127.png', '开拓者•存护', 3127);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (784, 2, 'resources/ACGN_Personal_Preference_Table_Generator/HonkaiStarRail/3123.png', '开拓者•存护', 3123);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (785, 2, 'resources/ACGN_Personal_Preference_Table_Generator/HonkaiStarRail/3128.png', '开拓者•毁灭', 3128);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (786, 2, 'resources/ACGN_Personal_Preference_Table_Generator/HonkaiStarRail/3124.png', '开拓者•毁灭', 3124);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (787, 2, 'resources/ACGN_Personal_Preference_Table_Generator/HonkaiStarRail/2086.png', '米沙', 2086);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (788, 2, 'resources/ACGN_Personal_Preference_Table_Generator/HonkaiStarRail/2304.png', '加拉赫', 2304);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (789, 2, 'resources/ACGN_Personal_Preference_Table_Generator/HonkaiStarRail/3121.png', '仙舟三月七', 3121);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (790, 2, 'resources/ACGN_Personal_Preference_Table_Generator/HonkaiStarRail/3505.png', '貊泽', 3505);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (791, 2, 'resources/ACGN_Personal_Preference_Table_Generator/HonkaiStarRail/1717.png', '寒鸦', 1717);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (792, 2, 'resources/ACGN_Personal_Preference_Table_Generator/HonkaiStarRail/1872.png', '雪衣', 1872);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (793, 2, 'resources/ACGN_Personal_Preference_Table_Generator/HonkaiStarRail/1710.png', '桂乃芬', 1710);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (794, 2, 'resources/ACGN_Personal_Preference_Table_Generator/HonkaiStarRail/1187.png', '驭空', 1187);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (795, 2, 'resources/ACGN_Personal_Preference_Table_Generator/HonkaiStarRail/412.png', '素裳', 412);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (796, 2, 'resources/ACGN_Personal_Preference_Table_Generator/HonkaiStarRail/561.png', '停云', 561);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (797, 2, 'resources/ACGN_Personal_Preference_Table_Generator/HonkaiStarRail/497.png', '青雀', 497);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (798, 2, 'resources/ACGN_Personal_Preference_Table_Generator/HonkaiStarRail/1325.png', '卢卡', 1325);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (799, 2, 'resources/ACGN_Personal_Preference_Table_Generator/HonkaiStarRail/1543.png', '玲可', 1543);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (800, 2, 'resources/ACGN_Personal_Preference_Table_Generator/HonkaiStarRail/76.png', '虎克', 76);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (801, 2, 'resources/ACGN_Personal_Preference_Table_Generator/HonkaiStarRail/386.png', '桑博', 386);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (802, 2, 'resources/ACGN_Personal_Preference_Table_Generator/HonkaiStarRail/422.png', '佩拉', 422);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (803, 2, 'resources/ACGN_Personal_Preference_Table_Generator/HonkaiStarRail/46.png', '娜塔莎', 46);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (804, 2, 'resources/ACGN_Personal_Preference_Table_Generator/HonkaiStarRail/423.png', '希露瓦', 423);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (805, 2, 'resources/ACGN_Personal_Preference_Table_Generator/HonkaiStarRail/49.png', '黑塔', 49);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (806, 2, 'resources/ACGN_Personal_Preference_Table_Generator/HonkaiStarRail/52.png', '艾丝妲', 52);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (807, 2, 'resources/ACGN_Personal_Preference_Table_Generator/HonkaiStarRail/380.png', '阿兰', 380);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (808, 2, 'resources/ACGN_Personal_Preference_Table_Generator/HonkaiStarRail/406.png', '丹恒', 406);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (809, 2, 'resources/ACGN_Personal_Preference_Table_Generator/HonkaiStarRail/48.png', '三月七', 48);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (810, 3, 'resources/ACGN_Personal_Preference_Table_Generator/ZenlessZoneZero/1386.png', '浮波 柚叶', 1386);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (811, 3, 'resources/ACGN_Personal_Preference_Table_Generator/ZenlessZoneZero/1301.png', '橘福福', 1301);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (812, 3, 'resources/ACGN_Personal_Preference_Table_Generator/ZenlessZoneZero/1299.png', '仪玄', 1299);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (813, 3, 'resources/ACGN_Personal_Preference_Table_Generator/ZenlessZoneZero/1300.png', '潘引壶', 1300);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (814, 3, 'resources/ACGN_Personal_Preference_Table_Generator/ZenlessZoneZero/801.png', '凯撒·金', 801);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (815, 3, 'resources/ACGN_Personal_Preference_Table_Generator/ZenlessZoneZero/1385.png', '爱丽丝·泰姆菲尔德', 1385);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (816, 3, 'resources/ACGN_Personal_Preference_Table_Generator/ZenlessZoneZero/1290.png', '雨果·维拉德', 1290);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (817, 3, 'resources/ACGN_Personal_Preference_Table_Generator/ZenlessZoneZero/1276.png', '薇薇安·班希', 1276);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (818, 3, 'resources/ACGN_Personal_Preference_Table_Generator/ZenlessZoneZero/1230.png', '「扳机」', 1230);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (819, 3, 'resources/ACGN_Personal_Preference_Table_Generator/ZenlessZoneZero/1190.png', '零号·安比', 1190);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (820, 3, 'resources/ACGN_Personal_Preference_Table_Generator/ZenlessZoneZero/1158.png', '伊芙琳·舒瓦利耶', 1158);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (821, 3, 'resources/ACGN_Personal_Preference_Table_Generator/ZenlessZoneZero/1109.png', '耀嘉音', 1109);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (822, 3, 'resources/ACGN_Personal_Preference_Table_Generator/ZenlessZoneZero/996.png', '星见 雅', 996);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (823, 3, 'resources/ACGN_Personal_Preference_Table_Generator/ZenlessZoneZero/997.png', '浅羽 悠真', 997);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (824, 3, 'resources/ACGN_Personal_Preference_Table_Generator/ZenlessZoneZero/950.png', '莱特', 950);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (825, 3, 'resources/ACGN_Personal_Preference_Table_Generator/ZenlessZoneZero/916.png', '月城 柳', 916);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (826, 3, 'resources/ACGN_Personal_Preference_Table_Generator/ZenlessZoneZero/840.png', '柏妮思·怀特', 840);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (827, 3, 'resources/ACGN_Personal_Preference_Table_Generator/ZenlessZoneZero/759.png', '简·杜', 759);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (828, 3, 'resources/ACGN_Personal_Preference_Table_Generator/ZenlessZoneZero/680.png', '青衣', 680);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (829, 3, 'resources/ACGN_Personal_Preference_Table_Generator/ZenlessZoneZero/634.png', '朱鸢', 634);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (830, 3, 'resources/ACGN_Personal_Preference_Table_Generator/ZenlessZoneZero/317.png', '艾莲·乔', 317);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (831, 3, 'resources/ACGN_Personal_Preference_Table_Generator/ZenlessZoneZero/65.png', '冯·莱卡恩', 65);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (832, 3, 'resources/ACGN_Personal_Preference_Table_Generator/ZenlessZoneZero/378.png', '猫宫 又奈', 378);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (833, 3, 'resources/ACGN_Personal_Preference_Table_Generator/ZenlessZoneZero/73.png', '「11号」', 73);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (834, 3, 'resources/ACGN_Personal_Preference_Table_Generator/ZenlessZoneZero/316.png', '亚历山德丽娜·莎芭丝缇安', 316);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (835, 3, 'resources/ACGN_Personal_Preference_Table_Generator/ZenlessZoneZero/318.png', '珂蕾妲·贝洛伯格', 318);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (836, 3, 'resources/ACGN_Personal_Preference_Table_Generator/ZenlessZoneZero/150.png', '格莉丝·霍华德', 150);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (837, 3, 'resources/ACGN_Personal_Preference_Table_Generator/ZenlessZoneZero/1191.png', '波可娜·费雷尼', 1191);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (838, 3, 'resources/ACGN_Personal_Preference_Table_Generator/ZenlessZoneZero/758.png', '赛斯·洛威尔', 758);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (839, 3, 'resources/ACGN_Personal_Preference_Table_Generator/ZenlessZoneZero/493.png', '露西亚娜·德·蒙特夫', 493);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (840, 3, 'resources/ACGN_Personal_Preference_Table_Generator/ZenlessZoneZero/485.png', '派派·韦尔', 485);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (841, 3, 'resources/ACGN_Personal_Preference_Table_Generator/ZenlessZoneZero/80.png', '妮可·德玛拉', 80);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (842, 3, 'resources/ACGN_Personal_Preference_Table_Generator/ZenlessZoneZero/371.png', '比利·奇德', 371);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (843, 3, 'resources/ACGN_Personal_Preference_Table_Generator/ZenlessZoneZero/158.png', '本·比格', 158);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (844, 3, 'resources/ACGN_Personal_Preference_Table_Generator/ZenlessZoneZero/227.png', '苍角', 227);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (845, 3, 'resources/ACGN_Personal_Preference_Table_Generator/ZenlessZoneZero/379.png', '安比·德玛拉', 379);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (846, 3, 'resources/ACGN_Personal_Preference_Table_Generator/ZenlessZoneZero/179.png', '可琳·威克斯', 179);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (847, 3, 'resources/ACGN_Personal_Preference_Table_Generator/ZenlessZoneZero/147.png', '安东·伊万诺夫', 147);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (848, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/505971.png', '菲林斯【预告】', 505971);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (849, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/505973.png', '菈乌玛', 505973);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (850, 1, 'resources/ACGN_Personal_Preference_Table_Generator/GenshinImpact/505972.png', '爱诺', 505972);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (851, 2, 'resources/ACGN_Personal_Preference_Table_Generator/HonkaiStarRail/5851.png', '昔涟', 5851);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (852, 2, 'resources/ACGN_Personal_Preference_Table_Generator/HonkaiStarRail/5737.png', '丹恒•腾荒', 5737);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (853, 2, 'resources/ACGN_Personal_Preference_Table_Generator/HonkaiStarRail/5736.png', '长夜月', 5736);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (854, 3, 'resources/ACGN_Personal_Preference_Table_Generator/ZenlessZoneZero/1499.png', '「席德」', 1499);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (855, 3, 'resources/ACGN_Personal_Preference_Table_Generator/ZenlessZoneZero/1501.png', '奥菲丝·马格努森&「鬼火」', 1501);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (856, 3, 'resources/ACGN_Personal_Preference_Table_Generator/ZenlessZoneZero/1538.png', '伊德海莉', 1538);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (857, 3, 'resources/ACGN_Personal_Preference_Table_Generator/ZenlessZoneZero/1536.png', '狛野真斗', 1536);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (858, 3, 'resources/ACGN_Personal_Preference_Table_Generator/ZenlessZoneZero/1533.png', '卢西娅', 1533);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (859, 4, 'resources/ACGN_Personal_Preference_Table_Generator/WutheringWaves/17536.png', '奥古斯塔', 17536);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (860, 4, 'resources/ACGN_Personal_Preference_Table_Generator/WutheringWaves/17823.png', '嘉贝莉娜', 17823);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (861, 4, 'resources/ACGN_Personal_Preference_Table_Generator/WutheringWaves/17824.png', '仇远', 17824);
INSERT INTO `data_source_acgn_personal_preference_table_generator` VALUES (862, 4, 'resources/ACGN_Personal_Preference_Table_Generator/WutheringWaves/17535.png', '尤诺', 17535);

-- ----------------------------
-- Table structure for user
-- ----------------------------
DROP TABLE IF EXISTS `user`;
CREATE TABLE `user`  (
  `UserID` int NOT NULL AUTO_INCREMENT COMMENT '用户唯一标识ID，自增主键',
  `UserName` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '用户昵称',
  `UserLoginPhoneNumber` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '登录手机号',
  `UserLoginPassword` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '登录密码',
  `Avatar` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '用户头像',
  `CreateTime` datetime NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `LastUpDateTime` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后更新时间',
  PRIMARY KEY (`UserID`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of user
-- ----------------------------

-- ----------------------------
-- Triggers structure for table data_source_acgn_personal_preference_table_generator
-- ----------------------------
DROP TRIGGER IF EXISTS `Update_Number_After_Insert`;
delimiter ;;
CREATE TRIGGER `Update_Number_After_Insert` AFTER INSERT ON `data_source_acgn_personal_preference_table_generator` FOR EACH ROW BEGIN
  UPDATE acgn_personal_preference_table_generator
  SET Data_Source_Number = (
    SELECT COUNT(*)
    FROM data_source_acgn_personal_preference_table_generator
    WHERE ACGN_Personal_Preference_Table_Generator_ID = NEW.ACGN_Personal_Preference_Table_Generator_ID
  )
  WHERE ACGN_Personal_Preference_Table_Generator_ID = NEW.ACGN_Personal_Preference_Table_Generator_ID;
END
;;
delimiter ;

-- ----------------------------
-- Triggers structure for table data_source_acgn_personal_preference_table_generator
-- ----------------------------
DROP TRIGGER IF EXISTS `Update_Number_After_Delete`;
delimiter ;;
CREATE TRIGGER `Update_Number_After_Delete` AFTER DELETE ON `data_source_acgn_personal_preference_table_generator` FOR EACH ROW BEGIN
  UPDATE acgn_personal_preference_table_generator
  SET Data_Source_Number = (
    SELECT COUNT(*)
    FROM data_source_acgn_personal_preference_table_generator
    WHERE ACGN_Personal_Preference_Table_Generator_ID = OLD.ACGN_Personal_Preference_Table_Generator_ID
  )
  WHERE ACGN_Personal_Preference_Table_Generator_ID = OLD.ACGN_Personal_Preference_Table_Generator_ID;
END
;;
delimiter ;

SET FOREIGN_KEY_CHECKS = 1;
