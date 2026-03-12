-- 三位一体招生查询记录表
-- 每次用户点击提交产生一条记录，保存输入条件和匹配结果

CREATE TABLE `swyt_record` (
  `id`                    BIGINT       UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',

  -- 学考等级（A / B / C / D）
  `grade_yuwen`           CHAR(1)      NOT NULL COMMENT '语文',
  `grade_shuxue`          CHAR(1)      NOT NULL COMMENT '数学',
  `grade_waiyu`           CHAR(1)      NOT NULL COMMENT '外语',
  `grade_sixiang_zhengzhi` CHAR(1)     NOT NULL COMMENT '思想政治',
  `grade_lishi`           CHAR(1)      NOT NULL COMMENT '历史',
  `grade_dili`            CHAR(1)      NOT NULL COMMENT '地理',
  `grade_wuli`            CHAR(1)      NOT NULL COMMENT '物理',
  `grade_huaxue`          CHAR(1)      NOT NULL COMMENT '化学',
  `grade_shengwu`         CHAR(1)      NOT NULL COMMENT '生物',
  `grade_jishu`           CHAR(1)      NOT NULL COMMENT '技术',

  -- 其他输入条件
  `selected_subjects`     VARCHAR(50)  NOT NULL COMMENT '选考科目，逗号分隔，如：物理,化学,生物',
  `foreign_lang`          VARCHAR(20)  NOT NULL COMMENT '外语语种，如：英语',
  `quality_grade`         CHAR(1)      NOT NULL COMMENT '综合素质评价（A / B / C / D）',

  -- 匹配输出
  `matched_count`         SMALLINT     UNSIGNED NOT NULL DEFAULT 0 COMMENT '匹配学校数量',
  `matched_result`        JSON         NOT NULL COMMENT '匹配结果，格式见下方说明',

  -- 元信息
  `created_at`            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '提交时间',

  PRIMARY KEY (`id`),
  INDEX `idx_created_at` (`created_at`),
  INDEX `idx_quality_grade` (`quality_grade`)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COMMENT='三位一体招生查询记录';

-- ------------------------------------------------------------
-- matched_result 字段 JSON 结构示例：
-- [
--   {
--     "school": "浙江工业大学",
--     "majors": [
--       { "name": "健行学院实验班（理工）", "plan": 30 },
--       { "name": "计算机类", "plan": 20 }
--     ]
--   },
--   {
--     "school": "宁波大学",
--     "majors": [
--       { "name": "小学教育（师范）", "plan": 70, "note": "..." }
--     ]
--   }
-- ]
-- ------------------------------------------------------------

-- 插入示例数据
INSERT INTO `swyt_record` (
  `grade_yuwen`, `grade_shuxue`, `grade_waiyu`,
  `grade_sixiang_zhengzhi`, `grade_lishi`, `grade_dili`,
  `grade_wuli`, `grade_huaxue`, `grade_shengwu`, `grade_jishu`,
  `selected_subjects`, `foreign_lang`, `quality_grade`,
  `matched_count`, `matched_result`
) VALUES (
  'A', 'A', 'A',
  'B', 'C', 'B',
  'A', 'A', 'B', 'A',
  '物理,化学,生物', '英语', 'B',
  15,
  '[{"school":"浙江工业大学","majors":[{"name":"计算机类","plan":20}]}]'
);
