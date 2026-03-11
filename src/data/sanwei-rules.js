/**
 * 浙江三位一体招生资格匹配规则
 * 31所学校，每校独立方法
 *
 * student = {
 *   grades: { 语文:'A', 数学:'B', 外语:'A', 物理:'C', 化学:'B', 生物:'A', 政治:'A', 历史:'A', 地理:'A', 技术:'B' },
 *   selectedSubjects: ['物理','化学','生物'],  // 3门选考
 *   qualityGrade: 'B',                         // 综合素质评价
 * }
 * 返回：{ school, majors: [{name, plan, note}] }
 */

// ---------- 工具函数 ----------

var GV = { A: 4, B: 3, C: 2, D: 1 }

function gv(g) { return GV[g] || 0 }
function gte(g, min) { return gv(g) >= gv(min) }

// 学考各科目列表
var SUBJECTS = ['语文', '数学', '外语', '物理', '化学', '生物', '政治', '历史', '地理', '技术']

// 统计 >= 某等级的门数
function countGte(grades, minGrade) {
  return SUBJECTS.filter(function(s) { return gte(grades[s], minGrade) }).length
}

// 统计A等门数
function cntA(grades) { return countGte(grades, 'A') }

// 统计A或B门数
function cntAB(grades) { return countGte(grades, 'B') }

// 综合素质评价是否满足B及以上
function qualityOk(quality) { return gte(quality, 'B') }

// 所有科目是否D及以上
function allD(grades) {
  return SUBJECTS.every(function(s) { return gte(grades[s], 'D') })
}

// 所有科目是否C及以上（宁波大学特殊要求）
function allC(grades) {
  return SUBJECTS.every(function(s) { return gte(grades[s], 'C') })
}

// 选考科目检查
// reqText: "物理，化学（2门...）" / "物理(1门...)" / "不提科目要求" / ""
function checkSel(selected, reqText) {
  if (!reqText || reqText.indexOf('不提') !== -1 || reqText.trim() === '') return true

  var norm = function(s) {
    if (s === '思想政治') return '政治'
    if (s === '生物学') return '生物'
    return s
  }
  var normSel = selected.map(norm)
  var allSubj = ['物理', '化学', '生物学', '生物', '政治', '思想政治', '历史', '地理', '技术']

  if (reqText.indexOf('2门') !== -1 || reqText.indexOf('2 门') !== -1) {
    var found = []
    for (var i = 0; i < allSubj.length; i++) {
      if (reqText.indexOf(allSubj[i]) !== -1) {
        var m = norm(allSubj[i])
        if (found.indexOf(m) === -1) found.push(m)
      }
    }
    return found.every(function(s) { return normSel.indexOf(s) !== -1 })
  }

  if (reqText.indexOf('1门') !== -1 || reqText.indexOf('1 门') !== -1 || reqText.indexOf('必须选考') !== -1) {
    for (var j = 0; j < allSubj.length; j++) {
      if (reqText.indexOf(allSubj[j]) !== -1) {
        return normSel.indexOf(norm(allSubj[j])) !== -1
      }
    }
  }
  return true
}

// 按选考要求过滤专业列表
function filterBySelReq(specialties, selected) {
  return specialties.filter(function(sp) { return checkSel(selected, sp.selReq) })
}

// 通用折算分计算
// config: { weights: {A:n,B:n,C:n,D:n}, special: {科目:{A:n,...}}, cap: n }
function calcScore(grades, config) {
  var total = 0
  for (var i = 0; i < SUBJECTS.length; i++) {
    var subj = SUBJECTS[i]
    var grade = grades[subj] || 'D'
    var w = (config.special && config.special[subj] && config.special[subj][grade] !== undefined)
      ? config.special[subj][grade]
      : (config.weights[grade] !== undefined ? config.weights[grade] : 0)
    total += w
  }
  if (config.cap) total = Math.min(total, config.cap)
  return total
}

// ---------- 31所学校规则 ----------

// 1. 浙江工业大学
function check浙江工业大学(g, sel, q) {
  if (!qualityOk(q) || !allD(g)) return []
  var nA = cntA(g)
  var others_ok = function(minA, minOther) {
    return nA >= minA && SUBJECTS.every(function(s) { return g[s] === 'A' || gte(g[s], minOther) })
  }
  var res = []
  // A组：7A+，其余C以上，不提选考
  if (others_ok(7, 'C') && checkSel(sel, '不提科目要求')) {
    res.push({ name: '健行学院实验班（人文社科）', plan: 10, note: '全校专业任选（艺术类等专业除外）' })
  }
  // B组：7A+，其余C以上，物理+化学
  if (others_ok(7, 'C') && checkSel(sel, '物理，化学（2门）')) {
    res.push({ name: '健行学院实验班（理工）', plan: 30, note: '全校专业任选（艺术类等专业除外）' })
  }
  // C/D/E/F组：6A+，其余C以上
  var c6ok = others_ok(6, 'C')
  if (c6ok) {
    var cGroup = [
      { name: '化工与制药类', plan: 40, selReq: '物化' },
      { name: '安全工程', plan: 5, selReq: '物化' },
      { name: '生物工程类', plan: 35, selReq: '物化' },
      { name: '药学类（“2011计划”创新实验区）', plan: 30, selReq: '物化' },
      { name: '环境科学与工程类', plan: 35, selReq: '物化' },
      { name: '材料类', plan: 25, selReq: '物化' },
      { name: '食品科学与工程类', plan: 35, selReq: '物化' },
      { name: '工商管理类', plan: 5, selReq: '不提' },
      { name: '金融学', plan: 5, selReq: '不提' },
      { name: '国际经济与贸易', plan: 5, selReq: '不提' },
      { name: '应用心理学', plan: 5, selReq: '不提' },
      { name: '英语', plan: 5, selReq: '不提' },
      { name: '新闻传播学类', plan: 5, selReq: '不提' },
      { name: '汉语言文学', plan: 5, selReq: '不提' },
      { name: '城乡规划', plan: 5, selReq: '不提' },
      { name: '法学', plan: 10, selReq: '不提' },
      { name: '公共管理类', plan: 10, selReq: '不提' },
      { name: '计算机类', plan: 20, selReq: '物化' },
      { name: '数据科学与大数据技术', plan: 10, selReq: '物化' },
      { name: '土木类', plan: 20, selReq: '物化' },
      { name: '物理学类', plan: 15, selReq: '物化' },
      { name: '数学类', plan: 15, selReq: '物化' },
      { name: '管理科学与工程类', plan: 10, selReq: '物理' },
      { name: '机械类', plan: 35, selReq: '物化' },
      { name: '能源与环境系统工程', plan: 10, selReq: '物化' },
      { name: '机器人工程', plan: 10, selReq: '物化' },
      { name: '电气类', plan: 10, selReq: '物化' },
      { name: '电子信息类', plan: 15, selReq: '物化' },
      { name: '工业设计', plan: 5, selReq: '物化' },
    ]
    cGroup.forEach(function(sp) {
      var selMap = { '物化': '物理，化学（2门）', '物理': '物理(1门)', '不提': '' }
      if (checkSel(sel, selMap[sp.selReq])) res.push({ name: sp.name, plan: sp.plan })
    })
  }
  // G组：5A+，其余C以上，物化
  if (others_ok(5, 'C') && checkSel(sel, '物理，化学（2门）')) {
    res.push({ name: '软件工程（中外合作办学）', plan: 20 })
  }
  return res
}

// 2. 浙江师范大学 (折算 A=10,B=8,C=6,D=2)
// ≥86：思想政治、小学教育、汉语言文学、英语、数学、物理、化学师范
// ≥76：生物科学、学前教育、特殊教育师范
function check浙江师范大学(g, sel, q) {
  if (!qualityOk(q) || !allD(g)) return []
  var score = calcScore(g, { weights: { A: 10, B: 8, C: 6, D: 2 } })
  var res = []
  if (score >= 86) {
    var specs86 = [
      { name: '思想政治（师范）', plan: 30, selReq: '思想政治(1门)', extraOk: g['政治'] === 'A' && g['地理'] === 'A' },
      { name: '小学教育（师范）', plan: 40, selReq: '', extraOk: g['语文'] === 'A' || g['数学'] === 'A' },
      { name: '汉语言文学（师范）', plan: 40, selReq: '', extraOk: g['语文'] === 'A' },
      { name: '英语（师范）', plan: 26, selReq: '', extraOk: g['外语'] === 'A' && g['语文'] === 'A' },
      { name: '数学与应用数学（师范）', plan: 25, selReq: '物理，化学（2门）', extraOk: g['数学'] === 'A' || g['物理'] === 'A' },
      { name: '物理学（师范）', plan: 20, selReq: '物理，化学（2门）', extraOk: g['数学'] === 'A' || g['物理'] === 'A' },
      { name: '化学（师范）', plan: 35, selReq: '物理，化学（2门）', extraOk: g['物理'] === 'A' || g['化学'] === 'A' },
    ]
    specs86.forEach(function(sp) {
      if (sp.extraOk && checkSel(sel, sp.selReq)) res.push({ name: sp.name, plan: sp.plan })
    })
  }
  if (score >= 76) {
    if (checkSel(sel, '物理，化学（2门）') && (g['生物'] === 'A' || g['物理'] === 'A' || g['化学'] === 'A')) {
      res.push({ name: '生物科学（师范）', plan: 35 })
    }
    res.push({ name: '学前教育（师范）', plan: 30 })
    res.push({ name: '特殊教育（师范）', plan: 30 })
  }
  return res
}

// 3. 宁波大学 (折算 A=10,B=8,C=4,D=0, ≥80; 所有科目C以上)
function check宁波大学(g, sel, q) {
  if (!qualityOk(q) || !allC(g)) return []
  var score = calcScore(g, { weights: { A: 10, B: 8, C: 4, D: 0 }, cap: 100 })
  if (score < 80) return []
  var specs = [
    { name: '水产养殖学（拔尖人才创新班）', plan: 15, selReq: '物理、化学（2门）' },
    { name: '物理学（拔尖人才创新班）', plan: 5, selReq: '物理、化学（2门）' },
    { name: '生物技术（拔尖人才创新班）', plan: 15, selReq: '物理、化学（2门）' },
    { name: '机械设计制造及其自动化', plan: 10, selReq: '物理、化学（2门）' },
    { name: '金融工程', plan: 10, selReq: '物理(1门)' },
    { name: '历史学', plan: 10, selReq: '' },
    { name: '汉语言文学', plan: 10, selReq: '' },
    { name: '经济学', plan: 15, selReq: '' },
    { name: '日语', plan: 10, selReq: '' },
    { name: '物流管理', plan: 10, selReq: '' },
    { name: '小学教育（师范）', plan: 70, selReq: '' },
    { name: '学前教育（师范）', plan: 15, selReq: '' },
    { name: '思想政治教育（师范）', plan: 20, selReq: '思想政治(1门)' },
    { name: '汉语言文学（师范）', plan: 15, selReq: '' },
    { name: '英语（师范）', plan: 20, selReq: '' },
    { name: '数学与应用数学（师范）', plan: 15, selReq: '物理、化学（2门）' },
    { name: '物理学（师范）', plan: 15, selReq: '物理、化学（2门）' },
    { name: '地理科学（师范）', plan: 40, selReq: '地理（1门）' },
    { name: '人文地理与城乡规划（中外合作）', plan: 25, selReq: '地理（1门）' },
    { name: '旅游管理（中外合作）', plan: 25, selReq: '' },
  ]
  return filterBySelReq(specs, sel)
}

// 4. 杭州电子科技大学 (≥7A + 折算A=15,B=10,C=5,D=0 ≥110)
function check杭州电子科技大学(g, sel, q) {
  if (!qualityOk(q) || !allD(g)) return []
  if (cntA(g) < 7) return []
  var score = calcScore(g, { weights: { A: 15, B: 10, C: 5, D: 0 } })
  if (score < 110) return []
  var specs = [
    { name: '计算机科学与技术', plan: 20, selReq: '物理，化学（2门）' },
    { name: '软件工程', plan: 10, selReq: '物理，化学（2门）' },
    { name: '电子信息类（电子信息学院）', plan: 20, selReq: '物理，化学（2门）' },
    { name: '集成电路设计与集成系统', plan: 5, selReq: '物理，化学（2门）' },
    { name: '数字媒体技术', plan: 15, selReq: '物理，化学（2门）' },
    { name: '信息安全', plan: 5, selReq: '物理，化学（2门）' },
    { name: '网络工程', plan: 5, selReq: '物理，化学（2门）' },
    { name: '电子信息类（通信学院）', plan: 25, selReq: '物理，化学（2门）' },
    { name: '智能科学与技术', plan: 5, selReq: '物理，化学（2门）' },
    { name: '电气工程及其自动化', plan: 15, selReq: '物理，化学（2门）' },
    { name: '自动化', plan: 20, selReq: '物理，化学（2门）' },
    { name: '机械设计制造及其自动化', plan: 25, selReq: '物理，化学（2门）' },
    { name: '智能制造工程', plan: 5, selReq: '物理，化学（2门）' },
    { name: '材料科学与工程', plan: 20, selReq: '物理，化学（2门）' },
    { name: '管理科学与工程类', plan: 30, selReq: '物理(1门)' },
    { name: '数学类', plan: 30, selReq: '物理，化学（2门）' },
    { name: '光电信息科学与工程', plan: 15, selReq: '物理，化学（2门）' },
    { name: '应用物理学', plan: 10, selReq: '物理，化学（2门）' },
    { name: '工业工程', plan: 10, selReq: '物理(1门)' },
    { name: '统计学', plan: 15, selReq: '物理，化学（2门）' },
    { name: '环境工程', plan: 20, selReq: '物理，化学（2门）' },
    { name: '会计学', plan: 10, selReq: '' },
    { name: '审计学', plan: 5, selReq: '' },
    { name: '财务管理', plan: 5, selReq: '' },
    { name: '工商管理', plan: 20, selReq: '' },
    { name: '金融学', plan: 20, selReq: '' },
    { name: '法学', plan: 5, selReq: '' },
    { name: '英语', plan: 10, selReq: '' },
    { name: '传播学', plan: 10, selReq: '' },
  ]
  return filterBySelReq(specs, sel)
}

// 5. 浙江工商大学 (折算 A=10,B=8,C=4,D=0, ≥60)
function check浙江工商大学(g, sel, q) {
  if (!qualityOk(q) || !allD(g)) return []
  var score = calcScore(g, { weights: { A: 10, B: 8, C: 4, D: 0 }, cap: 100 })
  if (score < 60) return []
  var specs = [
    { name: '工商管理类', plan: 10, selReq: '' },
    { name: '会计学', plan: 5, selReq: '' },
    { name: '金融学', plan: 15, selReq: '' },
    { name: '保险学', plan: 5, selReq: '' },
    { name: '公共管理类', plan: 20, selReq: '' },
    { name: '旅游管理类', plan: 25, selReq: '' },
    { name: '外国语言文学类', plan: 25, selReq: '' },
    { name: '新闻传播学类', plan: 20, selReq: '' },
    { name: '城乡规划', plan: 4, selReq: '' },
    { name: '社会工作', plan: 4, selReq: '' },
    { name: '哲学', plan: 4, selReq: '' },
    { name: '汉语言文学', plan: 4, selReq: '' },
    { name: '法语', plan: 10, selReq: '' },
    { name: '阿拉伯语', plan: 10, selReq: '' },
    { name: '日语', plan: 25, selReq: '' },
    { name: '历史学', plan: 4, selReq: '' },
    { name: '数字经济', plan: 20, selReq: '物理(1门)' },
    { name: '金融工程', plan: 10, selReq: '物理(1门)' },
    { name: '信息管理与信息系统', plan: 15, selReq: '物理(1门)' },
    { name: '电子信息类', plan: 15, selReq: '物理，化学（2门）' },
    { name: '计算机类', plan: 15, selReq: '物理，化学（2门）' },
    { name: '环境科学与工程类', plan: 30, selReq: '物理，化学（2门）' },
    { name: '食品科学与工程类', plan: 30, selReq: '物理，化学（2门）' },
    { name: '数学与应用数学', plan: 10, selReq: '物理，化学（2门）' },
    { name: '给排水科学与工程', plan: 5, selReq: '物理，化学（2门）' },
    { name: '电子信息工程（中外合作）', plan: 10, selReq: '物理，化学（2门）' },
    { name: '通信工程（中外合作）', plan: 10, selReq: '物理，化学（2门）' },
  ]
  return filterBySelReq(specs, sel)
}

// 6. 浙江理工大学 (各科合格即可，综合素质评价B及以上)
function check浙江理工大学(g, sel, q) {
  if (!qualityOk(q) || !allD(g)) return []
  var specs = [
    // 理工类一
    { name: '纺织类（纺织工程、非织造材料与工程）', plan: 30, selReq: '物理,化学（2门）' },
    { name: '轻化工程', plan: 20, selReq: '物理,化学（2门）' },
    { name: '丝绸设计与工程', plan: 20, selReq: '' },
    { name: '材料类（材料科学与工程、高分子材料与工程）', plan: 30, selReq: '物理,化学（2门）' },
    { name: '服装设计与工程', plan: 25, selReq: '物理(1门)' },
    { name: '应用化学', plan: 20, selReq: '物理,化学（2门）' },
    { name: '生物科学类（生物技术、生物制药）', plan: 30, selReq: '物理,化学（2门）' },
    // 理工类二
    { name: '机械设计制造及其自动化', plan: 20, selReq: '物理,化学（2门）' },
    { name: '数学类（数学与应用数学、信息与计算科学）', plan: 30, selReq: '物理,化学（2门）' },
    { name: '应用物理学', plan: 20, selReq: '物理,化学（2门）' },
    { name: '土木类（土木工程、建筑环境与能源应用工程、工程管理）', plan: 30, selReq: '物理,化学（2门）' },
    { name: '建筑学', plan: 30, selReq: '' },
    { name: '工业设计', plan: 25, selReq: '物理,化学（2门）' },
    // 经管人文类
    { name: '经济与贸易类（经济学、国际经济与贸易）', plan: 25, selReq: '' },
    { name: '工商管理类（会计学、人力资源管理）', plan: 15, selReq: '' },
    { name: '英语', plan: 20, selReq: '' },
    { name: '新闻传播学类（传播学、汉语言文学）', plan: 10, selReq: '' },
  ]
  return filterBySelReq(specs, sel)
}

// 7. 温州医科大学 (折算 A*10+B*9+C*7+D*4, 临床≥95, 医学相关≥90)
function check温州医科大学(g, sel, q) {
  if (!qualityOk(q) || !allD(g)) return []
  var score = 0
  SUBJECTS.forEach(function(s) {
    var vals = { A: 10, B: 9, C: 7, D: 4 }
    score += vals[g[s]] || 4
  })
  if (!checkSel(sel, '物理，化学（2门）')) return []
  var res = []
  if (score >= 95) {
    var clinicalSpecs = [
      { name: '眼视光医学（5+3一体化）', plan: 10 },
      { name: '临床医学（5+3一体化）', plan: 15 },
      { name: '临床医学（5+3一体化，儿科学方向）', plan: 5 },
      { name: '眼视光医学（新医科班）', plan: 5 },
      { name: '临床医学', plan: 60 },
      { name: '眼视光医学', plan: 10 },
      { name: '口腔医学', plan: 5 },
      { name: '麻醉学', plan: 5 },
      { name: '医学影像学', plan: 5 },
      { name: '临床医学（中外合作）', plan: 20, note: '外语单科≥120分' },
      { name: '放射医学', plan: 5 },
      { name: '精神医学', plan: 5 },
    ]
    res = res.concat(clinicalSpecs)
  }
  if (score >= 90) {
    res = res.concat([
      { name: '药学', plan: 15 },
      { name: '生物制药', plan: 10 },
      { name: '临床药学', plan: 10 },
      { name: '医学检验技术', plan: 15 },
    ])
  }
  return res
}

// 8. 浙江海洋大学 (折算 A=15,B=10,C=6,D=1; 理工≥80, 文师≥90)
function check浙江海洋大学(g, sel, q) {
  if (!qualityOk(q) || !allD(g)) return []
  var score = calcScore(g, { weights: { A: 15, B: 10, C: 6, D: 1 } })
  var res = []
  var grp80 = [
    { name: '海洋科学', plan: 10, selReq: '物理，化学（2门）' },
    { name: '水产养殖学', plan: 10, selReq: '物理，化学（2门）' },
    { name: '船舶与海洋工程', plan: 15, selReq: '物理，化学（2门）' },
    { name: '数学与应用数学（师范）', plan: 15, selReq: '物理，化学（2门）' },
    { name: '物理学（师范）', plan: 10, selReq: '物理，化学（2门）' },
  ]
  var grp90 = [
    { name: '历史学（师范）', plan: 10, selReq: '历史（1门）' },
    { name: '小学教育（师范）', plan: 30, selReq: '' },
    { name: '英语（师范）', plan: 10, selReq: '' },
  ]
  if (score >= 80) res = res.concat(filterBySelReq(grp80, sel))
  if (score >= 90) res = res.concat(filterBySelReq(grp90, sel))
  return res
}

// 9. 浙江农林大学 (折算 A=15,B=10,C=5,D=0, ≥90)
function check浙江农林大学(g, sel, q) {
  if (!qualityOk(q) || !allD(g)) return []
  var score = calcScore(g, { weights: { A: 15, B: 10, C: 5, D: 0 } })
  if (score < 90) return []
  var specs = [
    { name: '农学', plan: 5, selReq: '物理，化学（2门）' },
    { name: '植物保护', plan: 5, selReq: '物理，化学（2门）' },
    { name: '林学', plan: 10, selReq: '物理，化学（2门）' },
    { name: '生物技术', plan: 10, selReq: '物理，化学（2门）' },
    { name: '生态学', plan: 5, selReq: '物理，化学（2门）' },
    { name: '农业资源与环境', plan: 5, selReq: '物理，化学（2门）' },
    { name: '环境科学与工程', plan: 5, selReq: '物理，化学（2门）' },
    { name: '测绘工程', plan: 10, selReq: '物理，化学（2门）' },
    { name: '木材科学与工程', plan: 10, selReq: '物理，化学（2门）' },
    { name: '家具设计与工程', plan: 10, selReq: '物理，化学（2门）' },
    { name: '应用化学', plan: 10, selReq: '物理，化学（2门）' },
    { name: '高分子材料与工程', plan: 10, selReq: '物理，化学（2门）' },
    { name: '土木工程', plan: 15, selReq: '物理，化学（2门）' },
    { name: '动物科学', plan: 15, selReq: '物理，化学（2门）' },
    { name: '工业设计', plan: 15, selReq: '物理，化学（2门）' },
    { name: '应用统计学', plan: 10, selReq: '物理，化学（2门）' },
    { name: '数据科学与大数据技术', plan: 10, selReq: '物理，化学（2门）' },
    { name: '智能科学与技术', plan: 5, selReq: '物理，化学（2门）' },
    { name: '物联网工程', plan: 5, selReq: '物理，化学（2门）' },
    { name: '电子信息工程', plan: 5, selReq: '物理，化学（2门）' },
    { name: '食品科学与工程', plan: 5, selReq: '物理，化学（2门）' },
    { name: '食品质量与安全', plan: 10, selReq: '物理，化学（2门）' },
    { name: '中药学', plan: 5, selReq: '物理，化学（2门）' },
    { name: '生物制药', plan: 5, selReq: '物理，化学（2门）' },
    { name: '园艺', plan: 25, selReq: '物理，化学（2门）' },
    { name: '茶学', plan: 15, selReq: '物理，化学（2门）' },
    { name: '金融工程', plan: 10, selReq: '物理（1门）' },
    { name: '地理信息科学', plan: 15, selReq: '地理（1门）' },
    { name: '园林', plan: 10, selReq: '生物学（1门）' },
    { name: '风景园林', plan: 5, selReq: '' },
    { name: '城乡规划', plan: 10, selReq: '' },
    { name: '建筑学', plan: 10, selReq: '' },
    { name: '农林经济管理', plan: 5, selReq: '' },
    { name: '国际经济与贸易', plan: 5, selReq: '' },
    { name: '工商管理', plan: 5, selReq: '' },
    { name: '英语', plan: 10, selReq: '' },
    { name: '文化产业管理（茶文化）', plan: 5, selReq: '' },
    { name: '机械设计制造及其自动化（中澳联合培养）', plan: 30, selReq: '物理，化学（2门）' },
  ]
  return filterBySelReq(specs, sel)
}

// 10. 浙江中医药大学 (折算 A=10,B=7,C=4,D=0; 不同类别不同阈值)
function check浙江中医药大学(g, sel, q) {
  if (!qualityOk(q) || !allD(g)) return []
  var score = calcScore(g, { weights: { A: 10, B: 7, C: 4, D: 0 }, cap: 100 })
  var res = []
  // 中医学类 ≥82
  if (score >= 82) {
    if (checkSel(sel, '化学（1门）')) res.push({ name: '中医学（5+3一体化）', plan: 10 })
    res.push({ name: '中医学', plan: 30 })
  }
  // 临床医学类 ≥79
  if (score >= 79 && checkSel(sel, '物理,化学（2门）')) {
    res.push({ name: '临床医学', plan: 40 })
    res.push({ name: '中西医临床医学', plan: 10 })
  }
  // 中药学类 ≥70
  if (score >= 70 && checkSel(sel, '物理,化学（2门）')) {
    res.push({ name: '中药学', plan: 35 })
  }
  // 护理学类 ≥61
  if (score >= 61) {
    if (checkSel(sel, '化学（1门）')) res.push({ name: '护理学（卓越班）', plan: 10 })
    res.push({ name: '护理学', plan: 25 })
  }
  // 管理学类 ≥67
  if (score >= 67) {
    res.push({ name: '公共事业管理', plan: 10 })
    res.push({ name: '健康服务与管理', plan: 10 })
  }
  return res
}

// 11. 中国计量大学 (折算 A=20,B=10,C=0,D=0, ≥100)
function check中国计量大学(g, sel, q) {
  if (!qualityOk(q) || !allD(g)) return []
  var score = calcScore(g, { weights: { A: 20, B: 10, C: 0, D: 0 } })
  if (score < 100) return []
  var specs = [
    { name: '自动化', plan: 5, selReq: '物理,化学（2门）' },
    { name: '电气工程及其自动化', plan: 10, selReq: '物理,化学（2门）' },
    { name: '机械设计制造及其自动化', plan: 10, selReq: '物理,化学（2门）' },
    { name: '测控技术与仪器', plan: 20, selReq: '物理,化学（2门）' },
    { name: '智能感知工程', plan: 10, selReq: '物理,化学（2门）' },
    { name: '电子信息工程', plan: 5, selReq: '物理,化学（2门）' },
    { name: '通信工程', plan: 5, selReq: '物理,化学（2门）' },
    { name: '计算机科学与技术', plan: 5, selReq: '物理,化学（2门）' },
    { name: '人工智能', plan: 5, selReq: '物理,化学（2门）' },
    { name: '光电信息科学与工程', plan: 25, selReq: '物理,化学（2门）' },
    { name: '电子科学与技术', plan: 15, selReq: '物理,化学（2门）' },
    { name: '微电子科学与工程', plan: 5, selReq: '物理,化学（2门）' },
    { name: '材料科学与工程', plan: 10, selReq: '物理,化学（2门）' },
    { name: '应用化学', plan: 5, selReq: '物理,化学（2门）' },
    { name: '能源与动力工程', plan: 10, selReq: '物理,化学（2门）' },
    { name: '安全工程', plan: 10, selReq: '物理,化学（2门）' },
    { name: '环境工程', plan: 5, selReq: '物理,化学（2门）' },
    { name: '数学与应用数学', plan: 10, selReq: '物理,化学（2门）' },
    { name: '应用物理学', plan: 10, selReq: '物理,化学（2门）' },
    { name: '数据科学与大数据技术', plan: 5, selReq: '物理,化学（2门）' },
    { name: '食品质量与安全', plan: 10, selReq: '物理,化学（2门）' },
    { name: '生物工程', plan: 15, selReq: '物理,化学（2门）' },
    { name: '药学', plan: 5, selReq: '物理,化学（2门）' },
    { name: '工业设计', plan: 10, selReq: '物理,化学（2门）' },
    { name: '信息管理与信息系统', plan: 15, selReq: '物理(1门)' },
    { name: '标准化工程', plan: 15, selReq: '物理(1门)' },
    { name: '质量管理工程', plan: 20, selReq: '物理(1门)' },
    { name: '工业工程', plan: 5, selReq: '物理(1门)' },
  ]
  return filterBySelReq(specs, sel)
}

// 12. 浙江万里学院 (折算 A=12,B=9,C=6,D=4; B组若外语为英语则A=15,B=12; 分档阈值)
function check浙江万里学院(g, sel, q, lang) {
  if (!qualityOk(q) || !allD(g)) return []
  // A组计算（不区分外语语种）
  var scoreA = calcScore(g, { weights: { A: 12, B: 9, C: 6, D: 4 } })
  // B组计算（英语科目有额外加分，其他外语语种不享受）
  var scoreBConfig = lang === '英语'
    ? { weights: { A: 12, B: 9, C: 6, D: 4 }, special: { 外语: { A: 15, B: 12, C: 6, D: 4 } } }
    : { weights: { A: 12, B: 9, C: 6, D: 4 } }
  var scoreB = calcScore(g, scoreBConfig)
  var res = []
  if (scoreA >= 70) {
    if (checkSel(sel, '')) res.push({ name: '日语', plan: 15 })
    if (checkSel(sel, '')) res.push({ name: '电子商务', plan: 10 })
  }
  if (scoreA >= 65) {
    var grp65 = [
      { name: '金融工程', plan: 10, selReq: '物理(1门)' },
      { name: '电气工程及其自动化', plan: 15, selReq: '物理，化学（2门）' },
      { name: '电子信息工程', plan: 10, selReq: '物理，化学（2门）' },
      { name: '生物技术', plan: 15, selReq: '物理，化学（2门）' },
      { name: '生物工程类', plan: 25, selReq: '物理，化学（2门）' },
      { name: '环境科学与工程类', plan: 25, selReq: '物理，化学（2门）' },
      { name: '食品质量与安全', plan: 10, selReq: '物理，化学（2门）' },
      { name: '食品营养与健康', plan: 10, selReq: '物理，化学（2门）' },
      { name: '网络空间安全', plan: 10, selReq: '物理，化学（2门）' },
      { name: '智能影像工程', plan: 10, selReq: '物理，化学（2门）' },
      { name: '机械电子工程', plan: 15, selReq: '物理，化学（2门）' },
    ]
    res = res.concat(filterBySelReq(grp65, sel))
  }
  if (scoreB >= 60) {
    res.push({ name: '物流管理', plan: 40 })
    res.push({ name: '艺术与科技（中外合作）', plan: 40 })
    res.push({ name: '广告学（中外合作）', plan: 45 })
    res.push({ name: '视觉传达设计（中外合作）', plan: 45 })
  }
  return res
}

// 13. 浙江科技大学 (A+B ≥ 6, 各科D以上)
function check浙江科技大学(g, sel, q) {
  if (!qualityOk(q) || !allD(g)) return []
  if (cntAB(g) < 6) return []
  var specs = [
    // A组（物化2门）
    { name: '车辆工程（实验班）', plan: 30, selReq: '物理，化学（2门）' },
    { name: '环境工程', plan: 10, selReq: '物理，化学（2门）' },
    { name: '工业设计', plan: 20, selReq: '物理，化学（2门）' },
    { name: '机械类（中德联合培养）', plan: 30, selReq: '物理，化学（2门）' },
    { name: '电气类（中德联合培养）', plan: 20, selReq: '物理，化学（2门）' },
    { name: '土木类（中德联合培养）', plan: 10, selReq: '物理，化学（2门）' },
    { name: '机器人工程（中澳联合培养）', plan: 30, selReq: '物理，化学（2门）' },
    // B组（不提科目要求）
    { name: '国际商务（中澳联合培养）', plan: 30, selReq: '' },
    { name: '经济学（中美合作办学）', plan: 40, selReq: '' },
    { name: '德语', plan: 20, selReq: '' },
  ]
  return filterBySelReq(specs, sel)
}

// 14. 浙江财经大学 (折算 A=15,B=9,C=3,D=0, A/B组≥95, C组≥80)
function check浙江财经大学(g, sel, q) {
  if (!qualityOk(q) || !allD(g)) return []
  var score = calcScore(g, { weights: { A: 15, B: 9, C: 3, D: 0 } })
  var res = []
  if (score >= 95) {
    var ab = [
      { name: '财政学', plan: 10, selReq: '' },
      { name: '税收学', plan: 5, selReq: '' },
      { name: '公共管理类', plan: 15, selReq: '' },
      { name: '城乡规划', plan: 10, selReq: '' },
      { name: '会计学', plan: 5, selReq: '' },
      { name: '财务管理', plan: 5, selReq: '' },
      { name: '审计学', plan: 5, selReq: '' },
      { name: '金融学', plan: 5, selReq: '' },
      { name: '投资学', plan: 10, selReq: '' },
      { name: '工商管理类', plan: 10, selReq: '' },
      { name: '经济学', plan: 10, selReq: '' },
      { name: '国际经济与贸易', plan: 15, selReq: '' },
      { name: '法学', plan: 5, selReq: '' },
      { name: '社会工作', plan: 15, selReq: '' },
      { name: '外国语言文学类', plan: 10, selReq: '' },
      { name: '汉语言文学', plan: 5, selReq: '' },
      { name: '新闻传播学类', plan: 10, selReq: '' },
      { name: '金融工程', plan: 20, selReq: '物理(1门)' },
      { name: '数字经济', plan: 20, selReq: '物理(1门)' },
      { name: '人工智能', plan: 15, selReq: '物理,化学（2门）' },
      { name: '软件工程', plan: 15, selReq: '物理,化学（2门）' },
      { name: '应用统计学', plan: 20, selReq: '物理,化学（2门）' },
      { name: '数据科学与大数据技术', plan: 20, selReq: '物理,化学（2门）' },
      { name: '经济统计学', plan: 20, selReq: '物理(1门)' },
      { name: '金融数学', plan: 20, selReq: '物理(1门)' },
      { name: '金融科技', plan: 20, selReq: '物理(1门)' },
      { name: '金融工程（金融科创）', plan: 20, selReq: '物理(1门)' },
    ]
    res = res.concat(filterBySelReq(ab, sel))
  }
  if (score >= 80) {
    res.push({ name: '金融学（中外合作）', plan: 30 })
    res.push({ name: '市场营销（中外合作）', plan: 30 })
  }
  return res
}

// 15. 嘉兴大学 (A≥3 或 A+B≥5，各科D以上)
function check嘉兴大学(g, sel, q) {
  if (!qualityOk(q) || !allD(g)) return []
  if (cntA(g) < 3 && cntAB(g) < 5) return []
  var specs = [
    // A组（不提科目要求）
    { name: '人力资源管理', plan: 10, selReq: '' },
    { name: '跨境电子商务', plan: 10, selReq: '' },
    { name: '英语', plan: 10, selReq: '' },
    { name: '服装设计与工程', plan: 10, selReq: '' },
    // B组（物理1门）
    { name: '金融数学', plan: 10, selReq: '物理(1门)' },
    { name: '工程管理', plan: 10, selReq: '物理(1门)' },
    // B组（物化2门）
    { name: '数学与应用数学', plan: 10, selReq: '物理，化学（2门）' },
    { name: '应用统计学', plan: 10, selReq: '物理，化学（2门）' },
    { name: '临床医学', plan: 10, selReq: '物理，化学（2门）' },
    { name: '麻醉学', plan: 10, selReq: '物理，化学（2门）' },
    { name: '药学', plan: 10, selReq: '物理，化学（2门）' },
    { name: '化学工程与工艺', plan: 10, selReq: '物理，化学（2门）' },
    { name: '应用化学', plan: 10, selReq: '物理，化学（2门）' },
    { name: '环境工程', plan: 10, selReq: '物理，化学（2门）' },
    { name: '生物工程', plan: 10, selReq: '物理，化学（2门）' },
    { name: '纺织工程', plan: 10, selReq: '物理，化学（2门）' },
    { name: '高分子材料与工程', plan: 10, selReq: '物理，化学（2门）' },
  ]
  return filterBySelReq(specs, sel)
}

// 16. 浙大城市学院 (语数外A=15,其他A=10,B=8,C=6,D=0, cap100, ≥60)
function check浙大城市学院(g, sel, q) {
  if (!qualityOk(q) || !allD(g)) return []
  var score = calcScore(g, {
    weights: { A: 10, B: 8, C: 6, D: 0 },
    special: { 语文: { A: 15, B: 8, C: 6, D: 0 }, 数学: { A: 15, B: 8, C: 6, D: 0 }, 外语: { A: 15, B: 8, C: 6, D: 0 } },
    cap: 100
  })
  if (score < 60) return []
  var specs = [
    { name: '护理学', plan: 70, selReq: '化学(1门)' },
    { name: '药学', plan: 40, selReq: '物理,化学（2门）' },
    { name: '土木工程', plan: 40, selReq: '物理,化学（2门）' },
    { name: '工业设计(中外合作)', plan: 50, selReq: '物理,化学（2门）' },

  ]
  return filterBySelReq(specs, sel)
}

// 17. 浙大宁波理工学院 (两种折算方式, ≥60)
function check浙大宁波理工学院(g, sel, q) {
  if (!qualityOk(q) || !allD(g)) return []
  var hasPhy = sel.indexOf('物理') !== -1
  var haChem = sel.indexOf('化学') !== -1
  var res = []
  // 物化组（需物理+化学）
  if (hasPhy && haChem) {
    var scoreWH = calcScore(g, {
      weights: { A: 10, B: 8, C: 5, D: 0 },
      special: { 语文: { A: 15, B: 8, C: 5, D: 0 }, 数学: { A: 15, B: 8, C: 5, D: 0 }, 外语: { A: 15, B: 8, C: 5, D: 0 } },
      cap: 100
    })
    if (scoreWH >= 60) {
      res = res.concat([
        { name: '高分子材料与工程', plan: 10 },
        { name: '材料科学与工程', plan: 10 },
        { name: '化学工程与工艺', plan: 10 },
        { name: '机械设计制造及其自动化', plan: 8 },
        { name: '土木工程', plan: 8 },
        { name: '工业设计', plan: 8 },
      ])
    }
  }
  // 不限科目组
  var scoreNL = calcScore(g, {
    weights: { A: 10, B: 8, C: 5, D: 0 },
    special: { 语文: { A: 15, B: 8, C: 5, D: 0 }, 数学: { A: 15, B: 8, C: 5, D: 0 }, 外语: { A: 20, B: 8, C: 5, D: 0 } },
    cap: 100
  })
  if (scoreNL >= 60) {
    res.push({ name: '国际经济与贸易（中外合作）', plan: 8 })
    res.push({ name: '金融学（中外合作）', plan: 8 })
  }
  return res
}

// 18. 杭州师范大学 (折算 A=10,B=7,C=4,D=1; 各专业门槛不同)
function check杭州师范大学(g, sel, q) {
  if (!qualityOk(q)) return []
  var score = calcScore(g, { weights: { A: 10, B: 7, C: 4, D: 1 } })
  var res = []
  if (score >= 75) res.push({ name: '小学教育（师范）', plan: 70 })
  if (score >= 65) {
    res.push({ name: '学前教育（师范）', plan: 30 })
    res.push({ name: '特殊教育（师范）', plan: 30 })
  }
  if (score >= 45 && checkSel(sel, '化学（1门）')) {
    res.push({ name: '护理学', plan: 160 })
  }
  return res
}

// 19. 湖州师范大学 (A+B ≥ 5, 其余D以上)
function check湖州师范大学(g, sel, q) {
  if (!qualityOk(q) || !allD(g)) return []
  if (cntAB(g) < 5) return []
  var specs = [
    { name: '小学教育（师范）', plan: 15, selReq: '' },
    { name: '英语（师范）', plan: 15, selReq: '' },
    { name: '知识产权', plan: 15, selReq: '' },
    { name: '新闻学', plan: 15, selReq: '' },
    { name: '电子商务', plan: 15, selReq: '' },
    { name: '数学与应用数学（师范）', plan: 20, selReq: '物理，化学（2门）' },
    { name: '物理学（师范）', plan: 20, selReq: '物理，化学（2门）' },
    { name: '化学（师范）', plan: 20, selReq: '物理，化学（2门）' },
    { name: '新能源材料与器件', plan: 20, selReq: '物理，化学（2门）' },
    { name: '制药工程', plan: 20, selReq: '物理，化学（2门）' },
    { name: '生物工程', plan: 20, selReq: '物理，化学（2门）' },
    { name: '水产养殖学（卓越班）', plan: 20, selReq: '物理，化学（2门）' },
    { name: '护理学', plan: 20, selReq: '化学（1门）' },
  ]
  return filterBySelReq(specs, sel)
}

// 20. 绍兴大学 (折算 A=10,B=8,C=6,D=4, ≥60)
function check绍兴大学(g, sel, q) {
  if (!qualityOk(q) || !allD(g)) return []
  var score = calcScore(g, { weights: { A: 10, B: 8, C: 6, D: 4 } })
  if (score < 60) return []
  var specs = [
    { name: '学前教育（中外合作办学）（师范）', plan: 40, selReq: '' },
    { name: '土木工程', plan: 20, selReq: '物理，化学（2门）' },
    { name: '地质工程', plan: 10, selReq: '物理，化学（2门）' },
    { name: '纺织工程', plan: 20, selReq: '物理，化学（2门）' },
    { name: '轻化工程', plan: 20, selReq: '物理，化学（2门）' },
    { name: '药学', plan: 25, selReq: '物理，化学（2门）' },
  ]
  return filterBySelReq(specs, sel)
}

// 21. 温州大学 (折算 A=15,B=10,C=5,D=0, ≥100)
function check温州大学(g, sel, q) {
  if (!qualityOk(q) || !allD(g)) return []
  var score = calcScore(g, { weights: { A: 15, B: 10, C: 5, D: 0 } })
  if (score < 100) return []
  var specs = [
    { name: '汉语言文学（师范）', plan: 7, selReq: '' },
    { name: '思想政治教育（师范）', plan: 7, selReq: '思想政治(1门)' },
    { name: '小学教育（师范）', plan: 15, selReq: '' },
    { name: '学前教育（师范）', plan: 12, selReq: '' },
    { name: '应用心理学（师范）', plan: 10, selReq: '' },
    { name: '英语（师范）', plan: 7, selReq: '' },
    { name: '历史学（师范）', plan: 7, selReq: '' },
    { name: '教育技术学（师范）', plan: 10, selReq: '物理(1门)' },
    { name: '数学与应用数学（师范）', plan: 10, selReq: '物理，化学（2门）' },
    { name: '物理学（师范）', plan: 10, selReq: '物理，化学（2门）' },
    { name: '化学（师范）', plan: 10, selReq: '物理，化学（2门）' },
    { name: '生物科学（师范）', plan: 10, selReq: '物理，化学（2门）' },
    { name: '法学', plan: 10, selReq: '' },
    { name: '行政管理', plan: 6, selReq: '' },
    { name: '国际经贸规则', plan: 6, selReq: '' },
    { name: '建筑学', plan: 15, selReq: '' },
    { name: '电气工程及其自动化（卓工示范班）', plan: 10, selReq: '物理，化学（2门）' },
    { name: '电子信息科学与技术', plan: 10, selReq: '物理，化学（2门）' },
    { name: '集成电路设计与集成系统', plan: 10, selReq: '物理，化学（2门）' },
    { name: '材料科学与工程', plan: 10, selReq: '物理，化学（2门）' },
    { name: '应用化学', plan: 10, selReq: '物理，化学（2门）' },
    { name: '能源化学', plan: 10, selReq: '物理，化学（2门）' },
    { name: '工业工程', plan: 10, selReq: '物理(1门)' },
    { name: '车辆工程', plan: 10, selReq: '物理，化学（2门）' },
    { name: '机械工程（卓工示范班）', plan: 10, selReq: '物理，化学（2门）' },
    { name: '智能制造工程', plan: 10, selReq: '物理，化学（2门）' },
    { name: '土木工程', plan: 15, selReq: '物理，化学（2门）' },
    { name: '城市地下空间工程', plan: 9, selReq: '物理，化学（2门）' },
    { name: '计算机科学与技术', plan: 8, selReq: '物理，化学（2门）' },
    { name: '数据科学与大数据技术', plan: 8, selReq: '物理，化学（2门）' },
    { name: '人工智能', plan: 10, selReq: '物理，化学（2门）' },
    { name: '网络工程（卓工示范班）', plan: 8, selReq: '物理，化学（2门）' },
    { name: '应用统计学', plan: 10, selReq: '物理，化学（2门）' },
    { name: '信息与计算科学', plan: 10, selReq: '物理，化学（2门）' },
    { name: '生态学', plan: 10, selReq: '物理，化学（2门）' },
    { name: '环境工程', plan: 10, selReq: '物理，化学（2门）' },
    { name: '生物技术', plan: 10, selReq: '物理，化学（2门）' },
  ]
  return filterBySelReq(specs, sel)
}

// 22. 浙江外国语学院 (A≥1 或 B以上≥6)
function check浙江外国语学院(g, sel, q) {
  if (!qualityOk(q)) return []
  if (cntA(g) < 1 && cntAB(g) < 6) return []
  var specs = [
    { name: '汉语言文学（师范）', plan: 15, selReq: '历史（1门）' },
    { name: '小学教育（师范）', plan: 20, selReq: '' },
    { name: '西班牙语（中外合作办学）（旅游方向）', plan: 25, selReq: '' },
    { name: '葡萄牙语', plan: 10, selReq: '' },
    { name: '俄语', plan: 10, selReq: '' },
    { name: '阿拉伯语', plan: 10, selReq: '' },
    { name: '日语', plan: 15, selReq: '' },
    { name: '朝鲜语', plan: 5, selReq: '' },
    { name: '意大利语', plan: 5, selReq: '' },
  ]
  return filterBySelReq(specs, sel)
}

// 23. 浙江水利水电学院 (各科合格)
function check浙江水利水电学院(g, sel, q) {
  if (!qualityOk(q) || !allD(g)) return []
  var specs = [
    { name: '水利水电工程', plan: 10, selReq: '物理，化学（2门）' },
    { name: '港口航道与海岸工程', plan: 10, selReq: '物理，化学（2门）' },
    { name: '给排水科学与工程', plan: 10, selReq: '物理，化学（2门）' },
    { name: '环境生态工程', plan: 10, selReq: '物理，化学（2门）' },
    { name: '土木工程', plan: 10, selReq: '物理，化学（2门）' },
    { name: '道路桥梁与渡河工程', plan: 10, selReq: '物理，化学（2门）' },
    { name: '测绘工程', plan: 10, selReq: '物理，化学（2门）' },
    { name: '遥感科学与技术', plan: 10, selReq: '物理，化学（2门）' },
    { name: '材料成型及控制工程', plan: 10, selReq: '物理，化学（2门）' },
    { name: '新能源科学与工程', plan: 10, selReq: '物理，化学（2门）' },
  ]
  return filterBySelReq(specs, sel)
}

// 24. 杭州医学院 (折算 A*10+B*9+C*7+D*4; 临床≥90, 智能医学≥85)
function check杭州医学院(g, sel, q) {
  if (!qualityOk(q) || !allD(g)) return []
  if (!checkSel(sel, '物理,化学（2门）')) return []
  var score = 0
  SUBJECTS.forEach(function(s) {
    var vals = { A: 10, B: 9, C: 7, D: 4 }
    score += vals[g[s]] || 4
  })
  var res = []
  if (score >= 90) res.push({ name: '临床医学', plan: 15 })
  if (score >= 85) res.push({ name: '智能医学工程', plan: 15 })
  return res
}

// 25. 丽水学院 (A+B ≥ 5)
function check丽水学院(g, sel, q) {
  if (!qualityOk(q) || !allD(g)) return []
  if (cntAB(g) < 5) return []
  var specs = [
    { name: '小学教育（师范）', plan: 40, selReq: '' },
    { name: '学前教育（师范）', plan: 40, selReq: '' },
    { name: '民族学', plan: 20, selReq: '历史（1门）' },
  ]
  return filterBySelReq(specs, sel)
}

// 26. 嘉兴南湖学院 (A≥2 或 A+B≥4, 其余D以上)
function check嘉兴南湖学院(g, sel, q) {
  if (!qualityOk(q) || !allD(g)) return []
  if (cntA(g) < 2 && cntAB(g) < 4) return []
  var specs = [
    { name: '机械设计制造及其自动化', plan: 15, selReq: '物理、化学（2门）' },
    { name: '工业设计', plan: 15, selReq: '物理、化学（2门）' },
    { name: '化学工程与工艺', plan: 15, selReq: '物理、化学（2门）' },
    { name: '土木工程', plan: 15, selReq: '物理、化学（2门）' },
  ]
  return filterBySelReq(specs, sel)
}

// 27. 温州肯恩大学 (折算 A=15,B=10,C=5,D=0, ≥85)
function check温州肯恩大学(g, sel, q) {
  if (!qualityOk(q) || !allD(g)) return []
  var score = calcScore(g, { weights: { A: 15, B: 10, C: 5, D: 0 } })
  if (score < 85) return []
  var specs = [
    { name: '经济学（中外合作）', plan: 11, selReq: '' },
    { name: '金融学（中外合作）', plan: 11, selReq: '' },
    { name: '国际商务（中外合作）', plan: 8, selReq: '' },
    { name: '会计学（中外合作）', plan: 13, selReq: '' },
    { name: '市场营销（中外合作）', plan: 8, selReq: '' },
    { name: '英语（中外合作）', plan: 8, selReq: '' },
    { name: '心理学（中外合作）', plan: 8, selReq: '' },
    { name: '传播学（中外合作）', plan: 14, selReq: '' },
    { name: '建筑学（中外合作）', plan: 12, selReq: '' },
    { name: '管理科学（中外合作）', plan: 7, selReq: '物理(1门)' },
    { name: '生物科学（中外合作）', plan: 11, selReq: '物理，化学（2门）' },
    { name: '数学与应用数学（中外合作）', plan: 9, selReq: '物理，化学（2门）' },
    { name: '计算机科学与技术（中外合作）', plan: 18, selReq: '物理，化学（2门）' },
    { name: '化学（中外合作）', plan: 6, selReq: '物理，化学（2门）' },
    { name: '环境科学（中外合作）', plan: 6, selReq: '物理，化学（2门）' },
  ]
  return filterBySelReq(specs, sel)
}

// 28. 宁波诺丁汉大学 (各科合格)
function check宁波诺丁汉大学(g, sel, q) {
  if (!qualityOk(q) || !allD(g)) return []
  var specs = [
    { name: '国际商务（中外合作）', plan: 25, selReq: '' },
    { name: '财务管理（中外合作）', plan: 10, selReq: '' },
    { name: '经济学（中外合作）', plan: 2, selReq: '' },
    { name: '国际事务与国际关系（中外合作）', plan: 14, selReq: '思想政治(1门)' },
    { name: '传播学（中外合作）', plan: 25, selReq: '' },
    { name: '英语（中外合作）', plan: 20, selReq: '' },
    { name: '建筑学（中外合作）', plan: 13, selReq: '' },
    { name: '化学（中外合作）', plan: 9, selReq: '物理, 化学（2门）' },
    { name: '数学与应用数学（中外合作）', plan: 10, selReq: '物理, 化学（2门）' },
    { name: '统计学（中外合作）', plan: 2, selReq: '物理, 化学（2门）' },
    { name: '电气类（中外合作）', plan: 70, selReq: '物理, 化学（2门）' },
  ]
  return filterBySelReq(specs, sel)
}

// 29. 浙江越秀外国语学院 (外语B以上, 其他D以上)
function check浙江越秀外国语学院(g, sel, q) {
  if (!qualityOk(q)) return []
  if (!gte(g['外语'], 'B')) return []
  if (!allD(g)) return []
  var specs = [
    { name: '日语', plan: 8, selReq: '' },
    { name: '朝鲜语', plan: 6, selReq: '' },
    { name: '泰语', plan: 6, selReq: '' },
    { name: '大数据管理与应用（中外合作）', plan: 40, selReq: '物理(1门)' },
    { name: '网络与新媒体（中外合作办学）', plan: 60, selReq: '' },
  ]
  return filterBySelReq(specs, sel)
}

// 30. 宁波财经大学 (折算 A=15,B=9,C=6,D=4, cap100, ≥60)
function check宁波财经大学(g, sel, q) {
  if (!qualityOk(q) || !allD(g)) return []
  var score = calcScore(g, { weights: { A: 15, B: 9, C: 6, D: 4 }, cap: 100 })
  if (score < 60) return []
  var specs = [
    { name: '财务管理（家族财富管理）', plan: 30, selReq: '' },
    { name: '创业管理', plan: 35, selReq: '' },
    { name: '文化产业管理', plan: 25, selReq: '' },
    { name: '国际经济与贸易（大宗商品交易）', plan: 30, selReq: '' },
    { name: '戏剧影视文学', plan: 30, selReq: '' },
    { name: '广播电视编导（中韩2+2）', plan: 30, selReq: '' },
    { name: '工业设计', plan: 25, selReq: '物理、化学（2门）' },
  ]
  return filterBySelReq(specs, sel)
}

// 31. 温州商学院 (各科合格)
function check温州商学院(g, sel, q) {
  if (!qualityOk(q) || !allD(g)) return []
  var specs = [
    { name: '金融学', plan: 40, selReq: '' },
    { name: '会计学', plan: 40, selReq: '' },
    { name: '市场营销', plan: 25, selReq: '' },
    { name: '英语', plan: 45, selReq: '' },
    { name: '商务英语', plan: 40, selReq: '' },
    { name: '计算机类（含计算机科学与技术、数据科学与大数据技术专业）', plan: 55, selReq: '物理，化学（2门）' },
    { name: '新闻传播学类（含广告学、传播学、网络与新媒体专业）', plan: 55, selReq: '' },
  ]
  return filterBySelReq(specs, sel)
}

// ---------- 主入口 ----------

var SCHOOL_RULES = [
  { name: '浙江工业大学', check: check浙江工业大学 },
  { name: '浙江师范大学', check: check浙江师范大学 },
  { name: '宁波大学', check: check宁波大学 },
  { name: '杭州电子科技大学', check: check杭州电子科技大学 },
  { name: '浙江工商大学', check: check浙江工商大学 },
  { name: '浙江理工大学', check: check浙江理工大学 },
  { name: '温州医科大学', check: check温州医科大学 },
  { name: '浙江海洋大学', check: check浙江海洋大学 },
  { name: '浙江农林大学', check: check浙江农林大学 },
  { name: '浙江中医药大学', check: check浙江中医药大学 },
  { name: '中国计量大学', check: check中国计量大学 },
  { name: '浙江万里学院', check: check浙江万里学院 },
  { name: '浙江科技大学', check: check浙江科技大学 },
  { name: '浙江财经大学', check: check浙江财经大学 },
  { name: '嘉兴大学', check: check嘉兴大学 },
  { name: '浙大城市学院', check: check浙大城市学院 },
  { name: '浙大宁波理工学院', check: check浙大宁波理工学院 },
  { name: '杭州师范大学', check: check杭州师范大学 },
  { name: '湖州师范大学', check: check湖州师范大学 },
  { name: '绍兴大学', check: check绍兴大学 },
  { name: '温州大学', check: check温州大学 },
  { name: '浙江外国语学院', check: check浙江外国语学院 },
  { name: '浙江水利水电学院', check: check浙江水利水电学院 },
  { name: '杭州医学院', check: check杭州医学院 },
  { name: '丽水学院', check: check丽水学院 },
  { name: '嘉兴南湖学院', check: check嘉兴南湖学院 },
  { name: '温州肯恩大学', check: check温州肯恩大学 },
  { name: '宁波诺丁汉大学', check: check宁波诺丁汉大学 },
  { name: '浙江越秀外国语学院', check: check浙江越秀外国语学院 },
  { name: '宁波财经大学', check: check宁波财经大学 },
  { name: '温州商学院', check: check温州商学院 },
]

/**
 * 匹配所有学校
 * @param {object} student - { grades, selectedSubjects, qualityGrade }
 * @returns {Array} - [{ school, majors: [{name, plan, note}] }]
 */
export function matchAllSchools(student) {
  var g = student.grades
  var sel = student.selectedSubjects || []
  var q = student.qualityGrade || 'D'
  var lang = student.foreignLang || '英语'
  var results = []
  SCHOOL_RULES.forEach(function(rule) {
    var majors = rule.check(g, sel, q, lang)
    if (majors && majors.length > 0) {
      results.push({ school: rule.name, majors: majors })
    }
  })
  return results
}
