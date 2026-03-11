import { matchAllSchools } from '../data/sanwei-rules.js'

// ---------- 测试辅助 ----------

const ALL_SUBJECTS = ['语文', '数学', '外语', '物理', '化学', '生物', '政治', '历史', '地理', '技术']

function makeGrades(overrides = {}) {
  const base = {}
  ALL_SUBJECTS.forEach(s => { base[s] = 'A' })
  return Object.assign(base, overrides)
}

function makeStudent({ grades, sel = ['物理', '化学', '生物'], quality = 'B', lang } = {}) {
  const student = { grades, selectedSubjects: sel, qualityGrade: quality }
  if (lang) student.foreignLang = lang
  return student
}

function getSchool(results, schoolName) {
  return results.find(r => r.school === schoolName)
}

function getMajors(results, schoolName) {
  const s = getSchool(results, schoolName)
  return s ? s.majors.map(m => m.name) : []
}

// ---------- 常用学生档案 ----------

const allA = makeGrades()          // 所有科目 A
const sevenA = makeGrades({ 历史: 'C', 地理: 'C', 技术: 'C' })   // 7A + 3C
const sixA = makeGrades({ 政治: 'C', 历史: 'C', 地理: 'C', 技术: 'C' })  // 6A + 4C
const fiveA = makeGrades({ 生物: 'C', 政治: 'C', 历史: 'C', 地理: 'C', 技术: 'C' }) // 5A + 5C
const fourA = makeGrades({ 化学: 'C', 生物: 'C', 政治: 'C', 历史: 'C', 地理: 'C', 技术: 'C' }) // 4A + 6C
const allB = makeGrades({ 语文: 'B', 数学: 'B', 外语: 'B', 物理: 'B', 化学: 'B', 生物: 'B', 政治: 'B', 历史: 'B', 地理: 'B', 技术: 'B' })
const allC = makeGrades({ 语文: 'C', 数学: 'C', 外语: 'C', 物理: 'C', 化学: 'C', 生物: 'C', 政治: 'C', 历史: 'C', 地理: 'C', 技术: 'C' })
const withD = makeGrades({ 技术: 'D' })  // 9A + 1D

// ---------- 通用门控测试 ----------

describe('matchAllSchools — 通用门控', () => {
  test('综合素质评价为 D 时不匹配任何学校', () => {
    const result = matchAllSchools(makeStudent({ grades: allA, quality: 'D' }))
    expect(result).toHaveLength(0)
  })

  test('综合素质评价为 C 时不匹配任何学校（需要 B+）', () => {
    const result = matchAllSchools(makeStudent({ grades: allA, quality: 'C' }))
    expect(result).toHaveLength(0)
  })

  test('综合素质评价为 B 时能匹配学校', () => {
    const result = matchAllSchools(makeStudent({ grades: allA, quality: 'B' }))
    expect(result.length).toBeGreaterThan(0)
  })

  test('综合素质评价为 A 时能匹配学校', () => {
    const result = matchAllSchools(makeStudent({ grades: allA, quality: 'A' }))
    expect(result.length).toBeGreaterThan(0)
  })

  test('有科目为 D 时，只要求 allD 的学校仍可匹配（浙江理工大学）', () => {
    // 浙江理工大学只要求 qualityOk + allD（D >= D），9A+1D 仍可通过
    const result = matchAllSchools(makeStudent({ grades: withD }))
    expect(getSchool(result, '浙江理工大学')).toBeDefined()
  })

  test('返回结果中每条记录均有 school 和 majors 字段', () => {
    const result = matchAllSchools(makeStudent({ grades: allA }))
    result.forEach(r => {
      expect(r).toHaveProperty('school')
      expect(r).toHaveProperty('majors')
      expect(Array.isArray(r.majors)).toBe(true)
      expect(r.majors.length).toBeGreaterThan(0)
    })
  })
})

// ---------- 浙江工业大学 ----------

describe('浙江工业大学', () => {
  const school = '浙江工业大学'

  test('10A + 物化选考 → 健行学院实验班（人文社科）和（理工）均匹配', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allA })), school)
    expect(majors).toContain('健行学院实验班（人文社科）')
    expect(majors).toContain('健行学院实验班（理工）')
  })

  test('7A+3C + 物化选考 → 两个健行学院实验班均匹配', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: sevenA })), school)
    expect(majors).toContain('健行学院实验班（人文社科）')
    expect(majors).toContain('健行学院实验班（理工）')
  })

  test('6A+4C + 物化选考 → 不匹配健行学院实验班', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: sixA })), school)
    expect(majors).not.toContain('健行学院实验班（人文社科）')
    expect(majors).not.toContain('健行学院实验班（理工）')
  })

  test('6A+4C + 物化选考 → C/D/E/F 组专业（物化类）匹配', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: sixA })), school)
    expect(majors).toContain('计算机类')
    expect(majors).toContain('机械类')
    expect(majors).toContain('化工与制药类')
  })

  test('6A+4C + 物化选考 → 不提科目要求的专业也匹配', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: sixA })), school)
    expect(majors).toContain('工商管理类')
    expect(majors).toContain('法学')
  })

  test('5A+5C + 物化选考 → 仅匹配软件工程（中外合作办学）（G组）', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: fiveA })), school)
    expect(majors).toContain('软件工程（中外合作办学）')
    expect(majors).not.toContain('计算机类')
    expect(majors).not.toContain('健行学院实验班（理工）')
  })

  test('4A+6C → 浙工大无匹配', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: fourA })), school)
    expect(majors).toHaveLength(0)
  })

  test('6A+4C + 无物理选考 → 物化专业不匹配，不提要求专业仍匹配', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: sixA, sel: ['历史', '地理', '政治'] })), school)
    expect(majors).not.toContain('计算机类')
    expect(majors).not.toContain('软件工程（中外合作办学）')
    expect(majors).toContain('工商管理类')
    expect(majors).toContain('法学')
  })

  test('质量评价 D 时浙工大无匹配', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allA, quality: 'D' })), school)
    expect(majors).toHaveLength(0)
  })
})

// ---------- 浙江师范大学 ----------

describe('浙江师范大学', () => {
  const school = '浙江师范大学'
  // 折算规则: A=10, B=8, C=6, D=2; ≥86 为高分组, ≥76 为低分组

  test('10A（score=100）+ 物化选考 → 高分组含小学教育/汉语言文学/英语/数学/物理/化学', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allA })), school)
    expect(majors).toContain('小学教育（师范）')
    expect(majors).toContain('汉语言文学（师范）')
    expect(majors).toContain('英语（师范）')
    expect(majors).toContain('数学与应用数学（师范）')
    expect(majors).toContain('物理学（师范）')
    expect(majors).toContain('化学（师范）')
  })

  test('10A + 物化选考 → 高分组含生物科学', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allA })), school)
    expect(majors).toContain('生物科学（师范）')
  })

  test('10A + 选考不含政治 → 思想政治（师范）不匹配', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allA, sel: ['物理', '化学', '生物'] })), school)
    expect(majors).not.toContain('思想政治（师范）')
  })

  test('10A + 选考含政治 → 思想政治（师范）匹配', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allA, sel: ['政治', '历史', '地理'] })), school)
    expect(majors).toContain('思想政治（师范）')
  })

  test('allB（score=80）+ 物化选考 → 仅低分组（学前教育/特殊教育）', () => {
    // score=80 >= 76 但 < 86
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allB })), school)
    expect(majors).toContain('学前教育（师范）')
    expect(majors).toContain('特殊教育（师范）')
    expect(majors).not.toContain('汉语言文学（师范）')
    expect(majors).not.toContain('数学与应用数学（师范）')
  })

  test('allB + 物化选考 → 生物科学不匹配（需要生物/物理/化学有一门A）', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allB })), school)
    expect(majors).not.toContain('生物科学（师范）')
  })

  test('allC（score=60）→ 师范大学无匹配（< 76）', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allC })), school)
    expect(majors).toHaveLength(0)
  })
})

// ---------- 宁波大学 ----------

describe('宁波大学', () => {
  const school = '宁波大学'
  // 条件: allC + score(A=10,B=8,C=4,D=0,cap100) >= 80

  test('10A + 物化选考 → 物化类专业匹配', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allA })), school)
    expect(majors).toContain('水产养殖学（拔尖人才创新班）')
    expect(majors).toContain('机械设计制造及其自动化')
    expect(majors).toContain('小学教育（师范）')
  })

  test('10A + 含地理选考 → 地理科学（师范）匹配', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allA, sel: ['物理', '地理', '历史'] })), school)
    expect(majors).toContain('地理科学（师范）')
    expect(majors).toContain('人文地理与城乡规划（中外合作）')
  })

  test('10A + 不含地理选考 → 地理科学（师范）不匹配', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allA, sel: ['物理', '化学', '生物'] })), school)
    expect(majors).not.toContain('地理科学（师范）')
  })

  test('有科目为 D → 不满足 allC 要求，宁波大学无匹配', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: withD })), school)
    expect(majors).toHaveLength(0)
  })

  test('allC（score=40）→ 分数不够，宁波大学无匹配', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allC })), school)
    expect(majors).toHaveLength(0)
  })

  test('allB（score=80）→ 刚好达线，宁波大学有匹配', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allB })), school)
    expect(majors.length).toBeGreaterThan(0)
  })
})

// ---------- 杭州电子科技大学 ----------

describe('杭州电子科技大学', () => {
  const school = '杭州电子科技大学'
  // 条件: ≥7A + score(A=15,B=10,C=5,D=0) >= 110

  test('10A + 物化选考 → 计算机/软件/电子信息匹配', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allA })), school)
    expect(majors).toContain('计算机科学与技术')
    expect(majors).toContain('软件工程')
    expect(majors).toContain('电气工程及其自动化')
    expect(majors).toContain('金融学')
  })

  test('7A+3C（score=7*15+3*5=120）+ 物化选考 → 匹配', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: sevenA })), school)
    expect(majors.length).toBeGreaterThan(0)
    expect(majors).toContain('计算机科学与技术')
  })

  test('6A+4C（cntA=6 < 7）→ 杭电无匹配', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: sixA })), school)
    expect(majors).toHaveLength(0)
  })

  test('7A+3D（score=7*15+3*0=105 < 110）→ 杭电无匹配', () => {
    const grades7AWith3D = makeGrades({ 历史: 'D', 地理: 'D', 技术: 'D' })
    const majors = getMajors(matchAllSchools(makeStudent({ grades: grades7AWith3D })), school)
    expect(majors).toHaveLength(0)
  })

  test('10A + 无物理选考 → 物化类专业不匹配，无科目要求专业匹配', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allA, sel: ['历史', '地理', '政治'] })), school)
    expect(majors).not.toContain('计算机科学与技术')
    expect(majors).toContain('会计学')
    expect(majors).toContain('金融学')
  })

  test('10A + 仅物理选考 → 管理科学与工程类和工业工程匹配，纯物化不匹配', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allA, sel: ['物理', '历史', '地理'] })), school)
    expect(majors).toContain('管理科学与工程类')
    expect(majors).toContain('工业工程')
    expect(majors).not.toContain('计算机科学与技术')
  })
})

// ---------- 浙江工商大学 ----------

describe('浙江工商大学', () => {
  const school = '浙江工商大学'
  // 折算: A=10, B=8, C=4, D=0, cap100; ≥60 达线

  test('10A（score=100）→ 全部专业根据选考过滤', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allA })), school)
    expect(majors).toContain('工商管理类')
    expect(majors).toContain('金融学')
    expect(majors).toContain('计算机类')
    expect(majors).toContain('电子信息类')
  })

  test('score=60（7A+3C: score=70+12=82 → 实际测allC: 10*4=40, 需要找恰好60的情况）', () => {
    // 6个B + 4个D = 6*8+4*0=48, 7个B+3个D=56+0=56, 8个B+2个D=64 → 64 >= 60
    const grades8B2D = makeGrades({
      语文: 'B', 数学: 'B', 外语: 'B', 物理: 'B', 化学: 'B', 生物: 'B', 政治: 'B', 历史: 'B',
      地理: 'D', 技术: 'D'
    })
    // score = 8*8 + 2*0 = 64 >= 60 ✓
    const majors = getMajors(matchAllSchools(makeStudent({ grades: grades8B2D })), school)
    expect(majors.length).toBeGreaterThan(0)
    expect(majors).toContain('工商管理类')
  })

  test('allC（score=40）→ 浙商大无匹配（< 60）', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allC })), school)
    expect(majors).toHaveLength(0)
  })

  test('10A + 无物理选考 → 仅不提科目要求专业匹配', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allA, sel: ['历史', '地理', '政治'] })), school)
    expect(majors).toContain('工商管理类')
    expect(majors).not.toContain('计算机类')
    expect(majors).not.toContain('数字经济')
  })

  test('10A + 仅物理选考 → 物理(1门)专业匹配', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allA, sel: ['物理', '历史', '地理'] })), school)
    expect(majors).toContain('数字经济')
    expect(majors).toContain('金融工程')
    expect(majors).toContain('信息管理与信息系统')
    expect(majors).not.toContain('计算机类')
  })
})

// ---------- 浙江理工大学 ----------

describe('浙江理工大学', () => {
  const school = '浙江理工大学'
  // 条件: 各科 D+ + quality B+（无分数线）

  test('allD（全D）+ quality B + 物化选考 → 物化专业匹配', () => {
    const gradesAllD = makeGrades({
      语文: 'D', 数学: 'D', 外语: 'D', 物理: 'D', 化学: 'D', 生物: 'D',
      政治: 'D', 历史: 'D', 地理: 'D', 技术: 'D'
    })
    const majors = getMajors(matchAllSchools(makeStudent({ grades: gradesAllD })), school)
    expect(majors).toContain('纺织类（纺织工程、非织造材料与工程）')
    expect(majors).toContain('英语')
  })

  test('10A + 物化选考 → 理工类和经管类均匹配', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allA })), school)
    expect(majors).toContain('机械设计制造及其自动化')
    expect(majors).toContain('应用化学')
    expect(majors).toContain('经济与贸易类（经济学、国际经济与贸易）')
    expect(majors).toContain('英语')
  })

  test('10A + 无物理选考 → 物化类不匹配，不提要求专业匹配', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allA, sel: ['历史', '地理', '政治'] })), school)
    expect(majors).not.toContain('纺织类（纺织工程、非织造材料与工程）')
    expect(majors).toContain('丝绸设计与工程')
    expect(majors).toContain('经济与贸易类（经济学、国际经济与贸易）')
  })

  test('10A + 仅物理 → 服装设计与工程匹配（需物理1门），物化类不匹配', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allA, sel: ['物理', '历史', '地理'] })), school)
    expect(majors).toContain('服装设计与工程')
    expect(majors).not.toContain('纺织类（纺织工程、非织造材料与工程）')
  })
})

// ---------- 温州医科大学 ----------

describe('温州医科大学', () => {
  const school = '温州医科大学'
  // 折算: A=10, B=9, C=7, D=4; ≥95 临床组, ≥90 医学相关组; 必须物化2门

  test('10A（score=100）+ 物化选考 → 临床医学全组匹配', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allA })), school)
    expect(majors).toContain('临床医学')
    expect(majors).toContain('临床医学（5+3一体化）')
    expect(majors).toContain('眼视光医学')
    expect(majors).toContain('口腔医学')
    expect(majors).toContain('药学')
    expect(majors).toContain('医学检验技术')
  })

  test('5A+5B（score=5*10+5*9=95）+ 物化选考 → 刚好达到临床组', () => {
    const grades5A5B = makeGrades({ 生物: 'B', 政治: 'B', 历史: 'B', 地理: 'B', 技术: 'B' })
    const majors = getMajors(matchAllSchools(makeStudent({ grades: grades5A5B })), school)
    expect(majors).toContain('临床医学')
    expect(majors).toContain('药学')
  })

  test('4A+6B（score=4*10+6*9=94）+ 物化选考 → 仅医学相关组（药学等），无临床医学', () => {
    const grades4A6B = makeGrades({ 化学: 'B', 生物: 'B', 政治: 'B', 历史: 'B', 地理: 'B', 技术: 'B' })
    const majors = getMajors(matchAllSchools(makeStudent({ grades: grades4A6B })), school)
    expect(majors).not.toContain('临床医学')
    expect(majors).toContain('药学')
    expect(majors).toContain('医学检验技术')
  })

  test('allB（score=90）+ 物化选考 → 仅医学相关组', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allB })), school)
    expect(majors).not.toContain('临床医学')
    expect(majors).toContain('药学')
  })

  test('10A + 无物化选考 → 温州医科大学无匹配', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allA, sel: ['历史', '地理', '政治'] })), school)
    expect(majors).toHaveLength(0)
  })

  test('10A + 仅物理选考（无化学）→ 温州医科大学无匹配', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allA, sel: ['物理', '历史', '地理'] })), school)
    expect(majors).toHaveLength(0)
  })

  test('allC（score=70）→ 温州医科大学无匹配（< 90）', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allC, sel: ['物理', '化学', '生物'] })), school)
    expect(majors).toHaveLength(0)
  })
})

// ---------- 浙江海洋大学 ----------

describe('浙江海洋大学', () => {
  const school = '浙江海洋大学'
  // 折算: A=15, B=10, C=6, D=1; 理工 >= 80, 文师 >= 90

  test('10A（score=150）+ 物化选考 → 理工组和文师组均匹配', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allA })), school)
    expect(majors).toContain('海洋科学')
    expect(majors).toContain('船舶与海洋工程')
    expect(majors).toContain('小学教育（师范）')
    expect(majors).toContain('英语（师范）')
  })

  test('10A + 含历史选考 → 历史学（师范）匹配', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allA, sel: ['历史', '地理', '政治'] })), school)
    expect(majors).toContain('历史学（师范）')
  })

  test('10A + 无历史选考 → 历史学（师范）不匹配', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allA, sel: ['物理', '化学', '生物'] })), school)
    expect(majors).not.toContain('历史学（师范）')
  })

  test('allC（score=60）→ 浙海大无匹配（< 80）', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allC })), school)
    expect(majors).toHaveLength(0)
  })

  // allB: score = 10*10 = 100 >= 90 → 两组都匹配
  test('allB（score=100）+ 物化选考 → 理工组和文师组均匹配', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allB })), school)
    expect(majors).toContain('海洋科学')
    expect(majors).toContain('小学教育（师范）')
  })

  // 6C+4B: score=6*6+4*10=36+40=76 → >= 80? NO. 8C+2B: 8*6+2*10=68 → NO
  // 6B+4C: 6*10+4*6=60+24=84 → >= 80 ✓ but < 90
  test('5B+5C（score=80）+ 物化选考 → 仅理工组，无文师组', () => {
    // score = 5*10+5*6=80 >= 80 ✓, < 90 → 仅理工组
    const grades5B5C = makeGrades({
      语文: 'B', 数学: 'B', 外语: 'B', 物理: 'B', 化学: 'B',
      生物: 'C', 政治: 'C', 历史: 'C', 地理: 'C', 技术: 'C'
    })
    // score = 5*10+5*6=80 >= 80 ✓, < 90
    const majors = getMajors(matchAllSchools(makeStudent({ grades: grades5B5C })), school)
    expect(majors).toContain('海洋科学')
    expect(majors).not.toContain('小学教育（师范）')
  })
})

// ---------- 浙江万里学院（测试外语语种加成） ----------

describe('浙江万里学院', () => {
  const school = '浙江万里学院'
  // 外语科目英语有额外加分：A=15（B组），其他语种A=12
  // scoreB: A=12, B=9, C=6, D=4; 外语若英语则A=15
  // scoreB >= 60 → 物流管理等B组专业

  test('allC（score=60）+ 英语 → scoreB=60 刚好达线，B组专业匹配', () => {
    // A: score = 10*12=120 ≥ 70 → A组 + ≥65 + ≥60
    // allC: scoreA = 10*6=60, scoreB(英语A=12→但全C，外语C): 6+6+6+6+6+6+6+6+6+6=60
    // 实际B组分: 外语是C时 scoreBConfig=英语但外语C所以special无效?
    // special: { 外语: { A: 15, B: 12, C: 6, D: 4 } } → 外语C → 6（和普通一样）
    // 所以allC时scoreB = 10*6 = 60 → >= 60 ✓
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allC, lang: '英语' })), school)
    expect(majors).toContain('物流管理')
    expect(majors).toContain('广告学（中外合作）')
  })

  test('allA + 英语 → B组外语加成（scoreB: 外语A→15 + 其他9*12=108+15=123）→ 远超60', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allA, lang: '英语' })), school)
    expect(majors).toContain('物流管理')
    expect(majors).toContain('日语')  // scoreA=10*12=120 ≥ 70
  })

  test('allA + 非英语 → scoreB=10*12=120（无外语加成），B组专业仍匹配', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allA, lang: '日语' })), school)
    // scoreB = 10*12=120 >= 60 → B组仍匹配
    expect(majors).toContain('物流管理')
  })

  test('外语A + 英语语种 vs 非英语语种 — B组scoreB差值体现外语加成', () => {
    // 英语: scoreB(外语A)=15, 其他9*12=108 → total=123
    // 日语: scoreB=10*12=120（外语A同样算12）
    // 差距3分，但两者都超60，所以B组匹配
    // 边界测试: 其他科目全D, 外语A
    const gradesOnlyLangA = makeGrades({
      语文: 'D', 数学: 'D', 外语: 'A', 物理: 'D', 化学: 'D', 生物: 'D',
      政治: 'D', 历史: 'D', 地理: 'D', 技术: 'D'
    })
    // 英语: scoreB = (外语A→15) + 9*4=36 → 51 < 60
    // 日语: scoreB = (外语A→12) + 9*4=36 → 48 < 60
    const majorsEn = getMajors(matchAllSchools(makeStudent({ grades: gradesOnlyLangA, lang: '英语' })), school)
    const majorsJa = getMajors(matchAllSchools(makeStudent({ grades: gradesOnlyLangA, lang: '日语' })), school)
    expect(majorsEn).not.toContain('物流管理')
    expect(majorsJa).not.toContain('物流管理')
  })
})

// ---------- 选考科目（checkSel）专项测试 ----------

describe('选考科目匹配（checkSel）', () => {
  // 通过宁波大学的专业来测试 checkSel 行为

  test('2门要求：物理+化学选考 → 物化类专业匹配', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allA, sel: ['物理', '化学', '历史'] })), '宁波大学')
    expect(majors).toContain('水产养殖学（拔尖人才创新班）')
    expect(majors).toContain('机械设计制造及其自动化')
  })

  test('2门要求：仅选物理（无化学）→ 物化类专业不匹配', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allA, sel: ['物理', '历史', '地理'] })), '宁波大学')
    expect(majors).not.toContain('水产养殖学（拔尖人才创新班）')
    expect(majors).not.toContain('机械设计制造及其自动化')
  })

  test('1门要求（物理）：选了物理 → 金融工程匹配', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allA, sel: ['物理', '历史', '地理'] })), '宁波大学')
    expect(majors).toContain('金融工程')
  })

  test('1门要求（物理）：未选物理 → 金融工程不匹配', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allA, sel: ['历史', '地理', '政治'] })), '宁波大学')
    expect(majors).not.toContain('金融工程')
  })

  test('1门要求（地理）：选了地理 → 地理科学（师范）匹配', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allA, sel: ['地理', '历史', '政治'] })), '宁波大学')
    expect(majors).toContain('地理科学（师范）')
  })

  test('无科目要求：任何选考 → 无要求专业均匹配', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allA, sel: ['历史', '地理', '政治'] })), '宁波大学')
    expect(majors).toContain('历史学')
    expect(majors).toContain('汉语言文学')
    expect(majors).toContain('经济学')
    expect(majors).toContain('小学教育（师范）')
  })

  test('思想政治1门要求：选了政治 → 思想政治教育（师范）匹配（宁波大学）', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allA, sel: ['政治', '历史', '地理'] })), '宁波大学')
    expect(majors).toContain('思想政治教育（师范）')
  })

  test('思想政治1门要求：未选政治 → 思想政治教育（师范）不匹配', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allA, sel: ['物理', '化学', '生物'] })), '宁波大学')
    expect(majors).not.toContain('思想政治教育（师范）')
  })
})

// ---------- 综合集成测试 ----------

describe('matchAllSchools 综合集成', () => {
  test('全A学生（物化生选考）应匹配超过 20 所学校', () => {
    const result = matchAllSchools(makeStudent({ grades: allA }))
    expect(result.length).toBeGreaterThan(20)
  })

  test('allC 学生（物化生选考）应匹配若干较低门槛学校', () => {
    const result = matchAllSchools(makeStudent({ grades: allC, sel: ['物理', '化学', '生物'] }))
    // 浙江理工大学门槛最低（allD即可），所以至少有部分匹配
    const schools = result.map(r => r.school)
    expect(schools).toContain('浙江理工大学')
  })

  test('返回结果中学校名不重复', () => {
    const result = matchAllSchools(makeStudent({ grades: allA }))
    const schools = result.map(r => r.school)
    const unique = [...new Set(schools)]
    expect(schools.length).toBe(unique.length)
  })

  test('返回结果学校名均为字符串', () => {
    const result = matchAllSchools(makeStudent({ grades: allA }))
    result.forEach(r => {
      expect(typeof r.school).toBe('string')
    })
  })

  test('每个专业记录有 name 字段（字符串）和 plan 字段（数字）', () => {
    const result = matchAllSchools(makeStudent({ grades: allA }))
    result.forEach(r => {
      r.majors.forEach(m => {
        expect(typeof m.name).toBe('string')
        expect(typeof m.plan).toBe('number')
        expect(m.plan).toBeGreaterThan(0)
      })
    })
  })

  test('选考科目为空数组时，仅无科目要求的专业被匹配', () => {
    const result = matchAllSchools(makeStudent({ grades: allA, sel: [] }))
    result.forEach(r => {
      // 不应出现需要物化2门的高校（如温州医科大学直接返回空）
      expect(r.school).not.toBe('温州医科大学')
    })
  })
})

// ---------- 浙江农林大学 ----------

describe('浙江农林大学', () => {
  const school = '浙江农林大学'
  // 折算: A=15, B=10, C=5, D=0; ≥90

  test('10A + 物化选考 → 匹配农学/林学等物化专业', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allA })), school)
    expect(majors).toContain('农学')
    expect(majors).toContain('林学')
    expect(majors).toContain('土木工程')
    expect(majors).toContain('英语')
  })

  test('allB（score=100）→ 达线匹配', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allB })), school)
    expect(majors.length).toBeGreaterThan(0)
  })

  test('allC（score=50）→ 不达线（< 90），无匹配', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allC })), school)
    expect(majors).toHaveLength(0)
  })

  test('生物学(1门)要求：选了生物 → 园林匹配', () => {
    // checkSel 把 '生物学（1门）' 中的 '生物学' 规范化为 '生物'
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allA, sel: ['物理', '化学', '生物'] })), school)
    expect(majors).toContain('园林')
  })

  test('生物学(1门)要求：未选生物 → 园林不匹配', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allA, sel: ['物理', '化学', '历史'] })), school)
    expect(majors).not.toContain('园林')
  })

  test('地理(1门)要求：选了地理 → 地理信息科学匹配', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allA, sel: ['地理', '历史', '政治'] })), school)
    expect(majors).toContain('地理信息科学')
  })
})

// ---------- 浙江中医药大学 ----------

describe('浙江中医药大学', () => {
  const school = '浙江中医药大学'
  // 折算: A=10, B=7, C=4, D=0; 多档阈值 82/79/70/67/61

  test('10A（score=100）+ 物化选考 → 所有档位专业均匹配', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allA })), school)
    expect(majors).toContain('中医学')
    expect(majors).toContain('临床医学')
    expect(majors).toContain('中药学')
    expect(majors).toContain('护理学')
    expect(majors).toContain('公共事业管理')
  })

  test('allB（score=70）→ 中药学/公共事业管理/护理学匹配，但无临床医学/中医学', () => {
    // score=70 >= 70 → 中药学(物化); >= 67 → 管理学; >= 61 → 护理; < 79 → 无临床; < 82 → 无中医学
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allB })), school)
    expect(majors).toContain('中药学')
    expect(majors).toContain('公共事业管理')
    expect(majors).toContain('护理学')
    expect(majors).not.toContain('临床医学')
    expect(majors).not.toContain('中医学')
  })

  test('4A+6B（score=82）→ 刚好达到中医学档（≥82）', () => {
    const grades4A6B = makeGrades({ 化学: 'B', 生物: 'B', 政治: 'B', 历史: 'B', 地理: 'B', 技术: 'B' })
    // score = 4*10 + 6*7 = 40+42 = 82 >= 82 ✓
    const majors = getMajors(matchAllSchools(makeStudent({ grades: grades4A6B })), school)
    expect(majors).toContain('中医学')
  })

  test('化学(1门)要求：选了化学 → 中医学（5+3一体化）匹配（score≥82）', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allA, sel: ['物理', '化学', '生物'] })), school)
    expect(majors).toContain('中医学（5+3一体化）')
  })

  test('化学(1门)要求：未选化学 → 中医学（5+3一体化）不匹配', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allA, sel: ['历史', '地理', '政治'] })), school)
    expect(majors).not.toContain('中医学（5+3一体化）')
    // 基础中医学（无选考要求）仍匹配
    expect(majors).toContain('中医学')
  })

  test('allC（score=40）→ 浙中医无匹配（< 61）', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allC })), school)
    expect(majors).toHaveLength(0)
  })
})

// ---------- 中国计量大学 ----------

describe('中国计量大学', () => {
  const school = '中国计量大学'
  // 折算: A=20, B=10, C=0, D=0; ≥100（C和D得0分）

  test('10A + 物化选考 → 计测类专业匹配', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allA })), school)
    expect(majors).toContain('自动化')
    expect(majors).toContain('测控技术与仪器')
    expect(majors).toContain('光电信息科学与工程')
  })

  test('5A+5B（score=150）→ 达线匹配', () => {
    const grades5A5B = makeGrades({ 生物: 'B', 政治: 'B', 历史: 'B', 地理: 'B', 技术: 'B' })
    const majors = getMajors(matchAllSchools(makeStudent({ grades: grades5A5B })), school)
    expect(majors.length).toBeGreaterThan(0)
  })

  test('5A+5C（score=100）→ 刚好达线（C=0，score=5*20=100）', () => {
    const grades5A5C = makeGrades({ 生物: 'C', 政治: 'C', 历史: 'C', 地理: 'C', 技术: 'C' })
    // score = 5*20 + 5*0 = 100 >= 100 ✓
    const majors = getMajors(matchAllSchools(makeStudent({ grades: grades5A5C })), school)
    expect(majors.length).toBeGreaterThan(0)
  })

  test('4A+6C（score=80）→ 不达线（C=0，score=4*20=80 < 100）', () => {
    const grades4A6C = makeGrades({ 化学: 'C', 生物: 'C', 政治: 'C', 历史: 'C', 地理: 'C', 技术: 'C' })
    const majors = getMajors(matchAllSchools(makeStudent({ grades: grades4A6C })), school)
    expect(majors).toHaveLength(0)
  })

  test('allB（score=100）→ 刚好达线', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allB })), school)
    expect(majors.length).toBeGreaterThan(0)
  })

  test('物理(1门)专业：仅物理无化学 → 质量管理工程等匹配', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allA, sel: ['物理', '历史', '地理'] })), school)
    expect(majors).toContain('质量管理工程')
    expect(majors).toContain('标准化工程')
    expect(majors).not.toContain('自动化')
  })
})

// ---------- 浙江科技大学 ----------

describe('浙江科技大学', () => {
  const school = '浙江科技大学'
  // 条件: A+B 门数 >= 6

  test('10A + 物化选考 → 物化专业和不限专业均匹配', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allA })), school)
    expect(majors).toContain('车辆工程（实验班）')
    expect(majors).toContain('机械类（中德联合培养）')
    expect(majors).toContain('德语')
    expect(majors).toContain('国际商务（中澳联合培养）')
  })

  test('6A+4C（cntAB=6）→ 刚好达线', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: sixA })), school)
    expect(majors.length).toBeGreaterThan(0)
  })

  test('5A+5C（cntAB=5）→ 不达线（< 6）', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: fiveA })), school)
    expect(majors).toHaveLength(0)
  })

  test('5A+1B+4C（cntAB=6）→ 达线匹配', () => {
    const grades5A1B4C = makeGrades({ 生物: 'B', 政治: 'C', 历史: 'C', 地理: 'C', 技术: 'C' })
    const majors = getMajors(matchAllSchools(makeStudent({ grades: grades5A1B4C })), school)
    expect(majors.length).toBeGreaterThan(0)
  })

  test('allB（cntAB=10）→ 达线匹配', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allB })), school)
    expect(majors.length).toBeGreaterThan(0)
  })
})

// ---------- 浙江财经大学 ----------

describe('浙江财经大学', () => {
  const school = '浙江财经大学'
  // 折算: A=15, B=9, C=3, D=0; ≥95 高分组, ≥80 低分组

  test('10A（score=150）→ 高分组和低分组均匹配', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allA })), school)
    expect(majors).toContain('财政学')
    expect(majors).toContain('金融学')
    expect(majors).toContain('金融学（中外合作）')
    expect(majors).toContain('市场营销（中外合作）')
  })

  test('allB（score=90）→ 仅低分组（≥80 but < 95）', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allB })), school)
    expect(majors).toContain('金融学（中外合作）')
    expect(majors).not.toContain('财政学')
    expect(majors).not.toContain('金融工程')
  })

  test('allC（score=30）→ 浙财大无匹配（< 80）', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allC })), school)
    expect(majors).toHaveLength(0)
  })

  test('高分组 + 物化选考 → 人工智能/软件工程等理工专业匹配', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allA })), school)
    expect(majors).toContain('人工智能')
    expect(majors).toContain('软件工程')
    expect(majors).toContain('数字经济')
  })
})

// ---------- 嘉兴大学 ----------

describe('嘉兴大学', () => {
  const school = '嘉兴大学'
  // 条件: cntA>=3 OR cntAB>=5（OR 逻辑）

  test('3A+7D（cntA=3）→ OR 条件满足，有匹配', () => {
    // cntA=3(语文数学外语), cntAB=3 < 5, 但 cntA=3 ≥ 3 → passes
    const grades = { 语文: 'A', 数学: 'A', 外语: 'A', 物理: 'D', 化学: 'D', 生物: 'D', 政治: 'D', 历史: 'D', 地理: 'D', 技术: 'D' }
    const majors = getMajors(matchAllSchools(makeStudent({ grades })), school)
    expect(majors.length).toBeGreaterThan(0)
    expect(majors).toContain('英语')
  })

  test('2A+3B+5C（cntA=2 < 3, cntAB=5）→ OR 条件满足', () => {
    const grades = { 语文: 'A', 数学: 'A', 外语: 'B', 物理: 'B', 化学: 'B', 生物: 'C', 政治: 'C', 历史: 'C', 地理: 'C', 技术: 'C' }
    const majors = getMajors(matchAllSchools(makeStudent({ grades })), school)
    expect(majors.length).toBeGreaterThan(0)
  })

  test('2A+2B+6C（cntA=2 < 3, cntAB=4 < 5）→ 嘉兴大学无匹配', () => {
    const grades = { 语文: 'A', 数学: 'A', 外语: 'B', 物理: 'B', 化学: 'C', 生物: 'C', 政治: 'C', 历史: 'C', 地理: 'C', 技术: 'C' }
    const majors = getMajors(matchAllSchools(makeStudent({ grades })), school)
    expect(majors).toHaveLength(0)
  })

  test('10A + 物化选考 → 临床医学/药学等物化专业匹配', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allA })), school)
    expect(majors).toContain('临床医学')
    expect(majors).toContain('药学')
    expect(majors).toContain('金融数学')
  })
})

// ---------- 浙大城市学院 ----------

describe('浙大城市学院', () => {
  const school = '浙大城市学院'
  // 折算: 语数外 A=15 其他 A=10，B=8，C=6，D=0; cap=100; ≥60

  test('10A（score=min(3*15+7*10,100)=100）→ 达线匹配', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allA })), school)
    expect(majors.length).toBeGreaterThan(0)
  })

  test('allC（score=10*6=60, cap=100 → 60）→ 刚好达线', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allC })), school)
    expect(majors.length).toBeGreaterThan(0)
  })

  test('allD（score=0）→ 浙大城市学院无匹配', () => {
    const gradesAllD = { 语文: 'D', 数学: 'D', 外语: 'D', 物理: 'D', 化学: 'D', 生物: 'D', 政治: 'D', 历史: 'D', 地理: 'D', 技术: 'D' }
    const majors = getMajors(matchAllSchools(makeStudent({ grades: gradesAllD })), school)
    expect(majors).toHaveLength(0)
  })

  test('化学(1门)要求：选了化学 → 护理学匹配', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allA, sel: ['化学', '生物', '历史'] })), school)
    expect(majors).toContain('护理学')
  })

  test('化学(1门)要求：未选化学 → 护理学不匹配', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allA, sel: ['历史', '地理', '政治'] })), school)
    expect(majors).not.toContain('护理学')
  })

  test('物化2门：选了物化 → 药学/土木工程匹配', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allA, sel: ['物理', '化学', '生物'] })), school)
    expect(majors).toContain('药学')
    expect(majors).toContain('土木工程')
  })
})

// ---------- 浙大宁波理工学院 ----------

describe('浙大宁波理工学院', () => {
  const school = '浙大宁波理工学院'
  // 物化组：需物理+化学; 不限科目组：外语A=20 特殊加权

  test('10A + 物化选考 → 物化组和不限科目组均匹配', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allA })), school)
    expect(majors).toContain('高分子材料与工程')
    expect(majors).toContain('机械设计制造及其自动化')
    expect(majors).toContain('国际经济与贸易（中外合作）')
    expect(majors).toContain('金融学（中外合作）')
  })

  test('10A + 无物理/化学选考 → 仅不限科目组专业', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allA, sel: ['历史', '地理', '政治'] })), school)
    expect(majors).toContain('国际经济与贸易（中外合作）')
    expect(majors).not.toContain('高分子材料与工程')
  })

  test('allD（score=0）→ 浙大宁波理工学院无匹配', () => {
    const gradesAllD = { 语文: 'D', 数学: 'D', 外语: 'D', 物理: 'D', 化学: 'D', 生物: 'D', 政治: 'D', 历史: 'D', 地理: 'D', 技术: 'D' }
    const majors = getMajors(matchAllSchools(makeStudent({ grades: gradesAllD })), school)
    expect(majors).toHaveLength(0)
  })
})

// ---------- 杭州师范大学 ----------

describe('杭州师范大学', () => {
  const school = '杭州师范大学'
  // 折算: A=10, B=7, C=4, D=1; 无 allD 检查（只需 qualityOk）
  // ≥75 → 小学教育; ≥65 → 学前+特殊教育; ≥45+化学(1门) → 护理学

  test('10A（score=100）→ 全档位匹配', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allA })), school)
    expect(majors).toContain('小学教育（师范）')
    expect(majors).toContain('学前教育（师范）')
    expect(majors).toContain('特殊教育（师范）')
  })

  test('allB（score=70）→ 学前教育和特殊教育（≥65 but < 75）', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allB })), school)
    expect(majors).toContain('学前教育（师范）')
    expect(majors).toContain('特殊教育（师范）')
    expect(majors).not.toContain('小学教育（师范）')
  })

  test('allB + 化学选考 → 护理学也匹配（score=70 ≥ 45）', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allB, sel: ['化学', '生物', '历史'] })), school)
    expect(majors).toContain('护理学')
  })

  test('无 allD 检查：有 D 等科目仍可参与（由 qualityOk 把关）', () => {
    // 杭师大无 allD 检查，allD 学生 score=10*1=10 < 45，所以无匹配，但不是因为 allD 失败
    const gradesAllD = { 语文: 'D', 数学: 'D', 外语: 'D', 物理: 'D', 化学: 'D', 生物: 'D', 政治: 'D', 历史: 'D', 地理: 'D', 技术: 'D' }
    const majors = getMajors(matchAllSchools(makeStudent({ grades: gradesAllD })), school)
    // score=10 < 45，没有任何档达线
    expect(majors).toHaveLength(0)
  })

  test('allC（score=40）→ 杭师大无匹配（< 45）', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allC })), school)
    expect(majors).toHaveLength(0)
  })
})

// ---------- 湖州师范大学 ----------

describe('湖州师范大学', () => {
  const school = '湖州师范大学'
  // 条件: cntAB >= 5

  test('10A + 物化选考 → 理工和文师专业均匹配', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allA })), school)
    expect(majors).toContain('小学教育（师范）')
    expect(majors).toContain('物理学（师范）')
    expect(majors).toContain('制药工程')
  })

  test('5A+5C（cntAB=5）→ 刚好达线', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: fiveA })), school)
    expect(majors.length).toBeGreaterThan(0)
  })

  test('4A+5C+1D（cntAB=4 < 5）→ 无匹配', () => {
    const grades = { 语文: 'A', 数学: 'A', 外语: 'A', 物理: 'A', 化学: 'C', 生物: 'C', 政治: 'C', 历史: 'C', 地理: 'C', 技术: 'D' }
    const majors = getMajors(matchAllSchools(makeStudent({ grades })), school)
    expect(majors).toHaveLength(0)
  })

  test('化学(1门)要求：选了化学 → 护理学匹配', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allA, sel: ['化学', '物理', '生物'] })), school)
    expect(majors).toContain('护理学')
  })

  test('化学(1门)要求：未选化学 → 护理学不匹配', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allA, sel: ['历史', '地理', '政治'] })), school)
    expect(majors).not.toContain('护理学')
  })
})

// ---------- 绍兴大学 ----------

describe('绍兴大学', () => {
  const school = '绍兴大学'
  // 折算: A=10, B=8, C=6, D=4; ≥60

  test('10A → 有匹配', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allA })), school)
    expect(majors.length).toBeGreaterThan(0)
  })

  test('allC（score=60）→ 刚好达线', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allC })), school)
    expect(majors.length).toBeGreaterThan(0)
    expect(majors).toContain('学前教育（中外合作办学）（师范）')
  })

  test('allD（score=40）→ 不达线（< 60），无匹配', () => {
    const gradesAllD = { 语文: 'D', 数学: 'D', 外语: 'D', 物理: 'D', 化学: 'D', 生物: 'D', 政治: 'D', 历史: 'D', 地理: 'D', 技术: 'D' }
    const majors = getMajors(matchAllSchools(makeStudent({ grades: gradesAllD })), school)
    expect(majors).toHaveLength(0)
  })

  test('物化2门：选物化 → 土木工程/药学匹配', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allA, sel: ['物理', '化学', '生物'] })), school)
    expect(majors).toContain('土木工程')
    expect(majors).toContain('药学')
  })
})

// ---------- 温州大学 ----------

describe('温州大学', () => {
  const school = '温州大学'
  // 折算: A=15, B=10, C=5, D=0; ≥100

  test('10A（score=150）→ 有匹配', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allA })), school)
    expect(majors).toContain('小学教育（师范）')
    expect(majors).toContain('法学')
    expect(majors).toContain('计算机科学与技术')
  })

  test('allB（score=100）→ 刚好达线', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allB })), school)
    expect(majors.length).toBeGreaterThan(0)
  })

  test('allC（score=50）→ 不达线（< 100），无匹配', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allC })), school)
    expect(majors).toHaveLength(0)
  })

  test('思想政治(1门)要求：选了政治 → 思想政治教育（师范）匹配', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allA, sel: ['政治', '历史', '地理'] })), school)
    expect(majors).toContain('思想政治教育（师范）')
  })
})

// ---------- 浙江外国语学院 ----------

describe('浙江外国语学院', () => {
  const school = '浙江外国语学院'
  // 条件: cntA>=1 OR cntAB>=6；无 allD 检查

  test('1A+9D（cntA=1）→ OR 满足，有匹配（无 allD 检查）', () => {
    const grades = { 语文: 'A', 数学: 'D', 外语: 'D', 物理: 'D', 化学: 'D', 生物: 'D', 政治: 'D', 历史: 'D', 地理: 'D', 技术: 'D' }
    const majors = getMajors(matchAllSchools(makeStudent({ grades })), school)
    expect(majors.length).toBeGreaterThan(0)
    expect(majors).toContain('小学教育（师范）')
  })

  test('0A+6B+4D（cntA=0 < 1, cntAB=6）→ OR 满足', () => {
    const grades = { 语文: 'B', 数学: 'B', 外语: 'B', 物理: 'B', 化学: 'B', 生物: 'B', 政治: 'D', 历史: 'D', 地理: 'D', 技术: 'D' }
    const majors = getMajors(matchAllSchools(makeStudent({ grades })), school)
    expect(majors.length).toBeGreaterThan(0)
  })

  test('0A+5B+5D（cntA=0 < 1, cntAB=5 < 6）→ 浙外院无匹配', () => {
    const grades = { 语文: 'B', 数学: 'B', 外语: 'B', 物理: 'B', 化学: 'B', 生物: 'D', 政治: 'D', 历史: 'D', 地理: 'D', 技术: 'D' }
    const majors = getMajors(matchAllSchools(makeStudent({ grades })), school)
    expect(majors).toHaveLength(0)
  })

  test('历史(1门)要求：选了历史 → 汉语言文学（师范）匹配', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allA, sel: ['历史', '地理', '政治'] })), school)
    expect(majors).toContain('汉语言文学（师范）')
  })

  test('历史(1门)要求：未选历史 → 汉语言文学（师范）不匹配', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allA, sel: ['物理', '化学', '生物'] })), school)
    expect(majors).not.toContain('汉语言文学（师范）')
  })
})

// ---------- 浙江水利水电学院 ----------

describe('浙江水利水电学院', () => {
  const school = '浙江水利水电学院'
  // 条件: allD + qualityB; 所有专业均需物化2门

  test('allD + 物化选考 → 水利工程专业匹配', () => {
    const gradesAllD = { 语文: 'D', 数学: 'D', 外语: 'D', 物理: 'D', 化学: 'D', 生物: 'D', 政治: 'D', 历史: 'D', 地理: 'D', 技术: 'D' }
    const majors = getMajors(matchAllSchools(makeStudent({ grades: gradesAllD, sel: ['物理', '化学', '生物'] })), school)
    expect(majors).toContain('水利水电工程')
    expect(majors).toContain('港口航道与海岸工程')
  })

  test('10A + 物化选考 → 所有专业均匹配', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allA })), school)
    expect(majors).toContain('水利水电工程')
    expect(majors).toContain('测绘工程')
    expect(majors).toHaveLength(10)
  })

  test('10A + 无物化选考 → 无专业匹配（所有专业均需物化）', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allA, sel: ['历史', '地理', '政治'] })), school)
    expect(majors).toHaveLength(0)
  })
})

// ---------- 杭州医学院 ----------

describe('杭州医学院', () => {
  const school = '杭州医学院'
  // 折算: A=10,B=9,C=7,D=4; 物化必须; ≥90 临床, ≥85 智能医学

  test('10A（score=100）+ 物化选考 → 临床医学和智能医学工程均匹配', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allA })), school)
    expect(majors).toContain('临床医学')
    expect(majors).toContain('智能医学工程')
  })

  test('allB（score=90）+ 物化选考 → 两个专业均匹配（刚好达到 ≥90）', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allB })), school)
    expect(majors).toContain('临床医学')
    expect(majors).toContain('智能医学工程')
  })

  test('9B+1C（score=88）+ 物化选考 → 仅智能医学工程（≥85 but < 90）', () => {
    const grades9B1C = makeGrades({ 语文: 'B', 数学: 'B', 外语: 'B', 物理: 'B', 化学: 'B', 生物: 'B', 政治: 'B', 历史: 'B', 地理: 'B', 技术: 'C' })
    // score = 9*9+1*7 = 81+7 = 88 >= 85 ✓ < 90
    const majors = getMajors(matchAllSchools(makeStudent({ grades: grades9B1C })), school)
    expect(majors).toContain('智能医学工程')
    expect(majors).not.toContain('临床医学')
  })

  test('10A + 无物化选考 → 杭州医学院无匹配', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allA, sel: ['历史', '地理', '政治'] })), school)
    expect(majors).toHaveLength(0)
  })

  test('allC（score=70）+ 物化选考 → 无匹配（< 85）', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allC, sel: ['物理', '化学', '生物'] })), school)
    expect(majors).toHaveLength(0)
  })
})

// ---------- 丽水学院 ----------

describe('丽水学院', () => {
  const school = '丽水学院'
  // 条件: cntAB >= 5

  test('10A → 有匹配', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allA })), school)
    expect(majors).toContain('小学教育（师范）')
    expect(majors).toContain('学前教育（师范）')
  })

  test('5A+5C（cntAB=5）→ 刚好达线', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: fiveA })), school)
    expect(majors.length).toBeGreaterThan(0)
  })

  test('4A+5C+1D（cntAB=4 < 5）→ 无匹配', () => {
    const grades = { 语文: 'A', 数学: 'A', 外语: 'A', 物理: 'A', 化学: 'C', 生物: 'C', 政治: 'C', 历史: 'C', 地理: 'C', 技术: 'D' }
    const majors = getMajors(matchAllSchools(makeStudent({ grades })), school)
    expect(majors).toHaveLength(0)
  })

  test('历史(1门)要求：选了历史 → 民族学匹配', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allA, sel: ['历史', '地理', '政治'] })), school)
    expect(majors).toContain('民族学')
  })

  test('历史(1门)要求：未选历史 → 民族学不匹配', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allA, sel: ['物理', '化学', '生物'] })), school)
    expect(majors).not.toContain('民族学')
  })
})

// ---------- 嘉兴南湖学院 ----------

describe('嘉兴南湖学院', () => {
  const school = '嘉兴南湖学院'
  // 条件: cntA>=2 OR cntAB>=4

  test('2A+8D（cntA=2）→ OR 满足', () => {
    const grades = { 语文: 'A', 数学: 'A', 外语: 'D', 物理: 'D', 化学: 'D', 生物: 'D', 政治: 'D', 历史: 'D', 地理: 'D', 技术: 'D' }
    const majors = getMajors(matchAllSchools(makeStudent({ grades, sel: ['物理', '化学', '生物'] })), school)
    // allD 检查也要通过（D >= D ✓）；所有专业需物化
    expect(majors.length).toBeGreaterThan(0)
  })

  test('1A+3B+6C（cntA=1 < 2, cntAB=4）→ OR 满足', () => {
    const grades = { 语文: 'A', 数学: 'B', 外语: 'B', 物理: 'B', 化学: 'C', 生物: 'C', 政治: 'C', 历史: 'C', 地理: 'C', 技术: 'C' }
    const majors = getMajors(matchAllSchools(makeStudent({ grades, sel: ['物理', '化学', '生物'] })), school)
    expect(majors.length).toBeGreaterThan(0)
  })

  test('1A+2B+7C（cntA=1 < 2, cntAB=3 < 4）→ 无匹配', () => {
    const grades = { 语文: 'A', 数学: 'B', 外语: 'B', 物理: 'C', 化学: 'C', 生物: 'C', 政治: 'C', 历史: 'C', 地理: 'C', 技术: 'C' }
    const majors = getMajors(matchAllSchools(makeStudent({ grades })), school)
    expect(majors).toHaveLength(0)
  })

  test('10A + 无物化选考 → 所有专业均需物化，无匹配', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allA, sel: ['历史', '地理', '政治'] })), school)
    expect(majors).toHaveLength(0)
  })
})

// ---------- 温州肯恩大学 ----------

describe('温州肯恩大学', () => {
  const school = '温州肯恩大学'
  // 折算: A=15, B=10, C=5, D=0; ≥85

  test('10A（score=150）→ 有匹配', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allA })), school)
    expect(majors).toContain('经济学（中外合作）')
    expect(majors).toContain('建筑学（中外合作）')
    expect(majors).toContain('计算机科学与技术（中外合作）')
  })

  test('allB（score=100）→ 达线（≥85）', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allB })), school)
    expect(majors.length).toBeGreaterThan(0)
  })

  test('allC（score=50）→ 不达线（< 85），无匹配', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allC })), school)
    expect(majors).toHaveLength(0)
  })

  test('6A+4C（score=90+20=110）→ 达线', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: sixA })), school)
    expect(majors.length).toBeGreaterThan(0)
  })

  test('物理(1门)专业：选了物理 → 管理科学（中外合作）匹配', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allA, sel: ['物理', '历史', '地理'] })), school)
    expect(majors).toContain('管理科学（中外合作）')
  })
})

// ---------- 宁波诺丁汉大学 ----------

describe('宁波诺丁汉大学', () => {
  const school = '宁波诺丁汉大学'
  // 条件: allD + qualityB; selReq 用 '物理, 化学（2门）'（含空格）

  test('allD + 任意选考 → 无科目要求专业匹配', () => {
    const gradesAllD = { 语文: 'D', 数学: 'D', 外语: 'D', 物理: 'D', 化学: 'D', 生物: 'D', 政治: 'D', 历史: 'D', 地理: 'D', 技术: 'D' }
    const majors = getMajors(matchAllSchools(makeStudent({ grades: gradesAllD, sel: ['历史', '地理', '政治'] })), school)
    expect(majors).toContain('国际商务（中外合作）')
    expect(majors).toContain('英语（中外合作）')
  })

  test('10A + 物化选考 → 理工科专业匹配（含空格的 selReq 正确解析）', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allA })), school)
    expect(majors).toContain('电气类（中外合作）')
    expect(majors).toContain('数学与应用数学（中外合作）')
    expect(majors).toContain('国际商务（中外合作）')
  })

  test('思想政治(1门)：选了政治 → 国际事务与国际关系（中外合作）匹配', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allA, sel: ['政治', '历史', '地理'] })), school)
    expect(majors).toContain('国际事务与国际关系（中外合作）')
  })

  test('思想政治(1门)：未选政治 → 国际事务与国际关系不匹配', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allA, sel: ['物理', '化学', '生物'] })), school)
    expect(majors).not.toContain('国际事务与国际关系（中外合作）')
  })
})

// ---------- 浙江越秀外国语学院 ----------

describe('浙江越秀外国语学院', () => {
  const school = '浙江越秀外国语学院'
  // 条件: qualityOk + 外语>=B + allD

  test('10A + 物化选考 → 日语/朝鲜语等匹配', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allA })), school)
    expect(majors).toContain('日语')
    expect(majors).toContain('朝鲜语')
    expect(majors).toContain('网络与新媒体（中外合作办学）')
    expect(majors).toContain('大数据管理与应用（中外合作）')
  })

  test('外语=B → 满足 >=B 要求，有匹配', () => {
    const grades = makeGrades({ 外语: 'B' })
    const majors = getMajors(matchAllSchools(makeStudent({ grades })), school)
    expect(majors.length).toBeGreaterThan(0)
  })

  test('外语=C → 不满足 >=B，无匹配', () => {
    const grades = makeGrades({ 外语: 'C' })
    const majors = getMajors(matchAllSchools(makeStudent({ grades })), school)
    expect(majors).toHaveLength(0)
  })

  test('外语=D → 无匹配', () => {
    const grades = makeGrades({ 外语: 'D' })
    const majors = getMajors(matchAllSchools(makeStudent({ grades })), school)
    expect(majors).toHaveLength(0)
  })

  test('物理(1门)要求：未选物理 → 大数据管理（中外合作）不匹配', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allA, sel: ['历史', '地理', '政治'] })), school)
    expect(majors).not.toContain('大数据管理与应用（中外合作）')
    expect(majors).toContain('日语')
  })
})

// ---------- 宁波财经大学 ----------

describe('宁波财经大学', () => {
  const school = '宁波财经大学'
  // 折算: A=15, B=9, C=6, D=4; cap=100; ≥60

  test('10A（score→cap=100）→ 有匹配', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allA })), school)
    expect(majors).toContain('财务管理（家族财富管理）')
    expect(majors).toContain('创业管理')
  })

  test('allC（score=60, cap=100 → 60）→ 刚好达线', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allC })), school)
    expect(majors.length).toBeGreaterThan(0)
  })

  test('allD（score=40 < 60）→ 不达线，无匹配', () => {
    const gradesAllD = { 语文: 'D', 数学: 'D', 外语: 'D', 物理: 'D', 化学: 'D', 生物: 'D', 政治: 'D', 历史: 'D', 地理: 'D', 技术: 'D' }
    const majors = getMajors(matchAllSchools(makeStudent({ grades: gradesAllD })), school)
    expect(majors).toHaveLength(0)
  })

  test('物理、化学(2门)要求：选物化 → 工业设计匹配', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allA, sel: ['物理', '化学', '生物'] })), school)
    expect(majors).toContain('工业设计')
  })

  test('物理、化学(2门)要求：未选物化 → 工业设计不匹配，其他无要求专业仍匹配', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allA, sel: ['历史', '地理', '政治'] })), school)
    expect(majors).not.toContain('工业设计')
    expect(majors).toContain('创业管理')
  })
})

// ---------- 温州商学院 ----------

describe('温州商学院', () => {
  const school = '温州商学院'
  // 条件: allD + qualityB; 简单结构

  test('allD + 物化选考 → 计算机类和无要求专业均匹配', () => {
    const gradesAllD = { 语文: 'D', 数学: 'D', 外语: 'D', 物理: 'D', 化学: 'D', 生物: 'D', 政治: 'D', 历史: 'D', 地理: 'D', 技术: 'D' }
    const majors = getMajors(matchAllSchools(makeStudent({ grades: gradesAllD, sel: ['物理', '化学', '生物'] })), school)
    expect(majors).toContain('金融学')
    expect(majors).toContain('会计学')
    expect(majors).toContain('计算机类（含计算机科学与技术、数据科学与大数据技术专业）')
  })

  test('allD + 无物化选考 → 仅无科目要求专业匹配', () => {
    const gradesAllD = { 语文: 'D', 数学: 'D', 外语: 'D', 物理: 'D', 化学: 'D', 生物: 'D', 政治: 'D', 历史: 'D', 地理: 'D', 技术: 'D' }
    const majors = getMajors(matchAllSchools(makeStudent({ grades: gradesAllD, sel: ['历史', '地理', '政治'] })), school)
    expect(majors).toContain('金融学')
    expect(majors).not.toContain('计算机类（含计算机科学与技术、数据科学与大数据技术专业）')
  })

  test('10A + 物化选考 → 全部专业匹配', () => {
    const majors = getMajors(matchAllSchools(makeStudent({ grades: allA })), school)
    expect(majors).toHaveLength(7)
  })
})
