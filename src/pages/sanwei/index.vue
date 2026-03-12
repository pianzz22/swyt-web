<template>
  <view class="sw-page">
    <view class="sw-page-title">
      <view class="sw-title-line1">灵光狮子帮你算算</view>
      <view class="sw-title-line2">今年三一考试能报哪些学校</view>
    </view>
    <!-- 学考等级卡片 -->
    <view class="sw-card">
      <view class="sw-card-hd">
        <text class="sw-hd-icon sw-hd-icon--blue">📄</text>
        <text class="sw-hd-title">学考等级</text>
        <text class="sw-badge">必填</text>
      </view>

      <view
        v-for="(item, idx) in subjects"
        :key="idx"
        class="sw-row"
      >
        <text class="sw-row-label">{{ item.name }}</text>
        <picker :range="gradeOptions" @change="onGradeChange(idx, $event)">
          <view class="sw-row-right">
            <text :class="item.grade ? 'sw-val' : 'sw-ph'">{{ item.grade || '请选择等级' }}</text>
            <text class="sw-arrow">›</text>
          </view>
        </picker>
      </view>
    </view>

    <!-- 其他卡片 -->
    <view class="sw-card">
      <view class="sw-card-hd">
        <text class="sw-hd-icon sw-hd-icon--red">📋</text>
        <text class="sw-hd-title">其他</text>
        <text class="sw-badge">必填</text>
      </view>

      <view class="sw-row" @click="openModal">
        <text class="sw-row-label">选考科目</text>
        <view class="sw-row-right">
          <text :class="selectedSubjects.length ? 'sw-val' : 'sw-ph'">
            {{ selectedSubjects.length ? selectedSubjects.join('、') : '请选择三个科目' }}
          </text>
          <text class="sw-arrow">›</text>
        </view>
      </view>

      <view class="sw-row" :class="{ 'sw-row--noborder': langIsOther }">
        <text class="sw-row-label">外语语种</text>
        <picker :range="langOptions" @change="onLangChange">
          <view class="sw-row-right">
            <text class="sw-val">{{ langIsOther ? '其他' : foreignLang }}</text>
            <text class="sw-arrow">›</text>
          </view>
        </picker>
      </view>
      <view v-if="langIsOther" class="sw-row sw-row--sub">
        <text class="sw-row-label"></text>
        <input
          class="sw-lang-input"
          placeholder="请输入语种"
          :value="foreignLang === '其他' ? '' : foreignLang"
          @input="onLangInput"
        />
      </view>

      <view class="sw-row sw-row--last">
        <text class="sw-row-label">综合素质评价</text>
        <view class="sw-row-right">
          <text class="sw-ph"></text>
        </view>
      </view>
      <view
        v-for="(item, idx) in qualityItems"
        :key="'q' + idx"
        class="sw-row sw-row--sub"
      >
        <text class="sw-row-label sw-row-label--indent">{{ item.name }}</text>
        <picker :range="qualityOptions" @change="onQualityItemChange(idx, $event)">
          <view class="sw-row-right">
            <text :class="item.grade ? 'sw-val' : 'sw-ph'">{{ item.grade || '请选择等级' }}</text>
            <text class="sw-arrow">›</text>
          </view>
        </picker>
      </view>
    </view>

    <!-- 说明 -->
    <view class="sw-tips">
      <view class="sw-tip">
        <text class="sw-tip-dot">•</text>
        <text class="sw-tip-txt">以上数据仅用于为您提供三位一体报名相关的服务，未经您的授权不会作其他用途</text>
      </view>
      <view class="sw-tip">
        <text class="sw-tip-dot">•</text>
        <text class="sw-tip-txt">暂不支持往届生三位一体报名相关服务</text>
      </view>
    </view>

    <!-- 提交 -->
    <view class="sw-footer">
      <view :class="['sw-submit', canSubmit ? 'sw-submit--on' : '']" @click="onSubmit">
        <text class="sw-submit-txt">提交</text>
      </view>
    </view>

    <!-- 选考科目弹窗 -->
    <view v-if="showModal" class="sw-mask" @click="closeModal">
      <view class="sw-modal" @click.stop>
        <view class="sw-modal-hd">
          <text class="sw-modal-title">选考科目（选3个）</text>
          <text class="sw-modal-x" @click="closeModal">✕</text>
        </view>
        <view class="sw-modal-body">
          <view
            v-for="(s, i) in optionalSubjects"
            :key="i"
            :class="['sw-opt', tempSelected.indexOf(s) !== -1 ? 'sw-opt--on' : '']"
            @click="toggleSubject(s)"
          >
            <text class="sw-opt-name">{{ s }}</text>
            <view v-if="tempSelected.indexOf(s) !== -1" class="sw-check">✓</view>
          </view>
        </view>
        <view class="sw-modal-ft">
          <text class="sw-modal-count">已选 {{ tempSelected.length }}/3</text>
          <view class="sw-btn sw-btn--cancel" @click="closeModal"><text>取消</text></view>
          <view :class="['sw-btn', tempSelected.length === 3 ? 'sw-btn--ok' : 'sw-btn--ok-dis']" @click="confirmSubjects"><text>确定</text></view>
        </view>
      </view>
    </view>

    <!-- 分析中遮罩 -->
    <view v-if="analyzing" class="sw-loading">
      <view class="sw-loading-box">
        <text class="sw-loading-icon">⏳</text>
        <text class="sw-loading-txt">正在分析中...</text>
        <text class="sw-loading-sub">根据所有高校规则逐一匹配</text>
      </view>
    </view>

    <!-- 结果弹窗 -->
    <view v-if="showResult" class="sw-result-mask">
      <view class="sw-result-box">
        <view class="sw-result-hd">
          <text class="sw-result-title">分析结果</text>
          <text class="sw-result-x" @click="showResult = false">✕</text>
        </view>
        <view v-if="results.length === 0" class="sw-result-empty">
          <text class="sw-result-empty-txt">暂无符合条件的学校</text>
          <text class="sw-result-empty-sub">请检查学考成绩、选考科目或综合素质评价是否满足要求</text>
        </view>
        <scroll-view v-else scroll-y class="sw-result-scroll">
          <view class="sw-result-inner">
            <text class="sw-result-count">共匹配到 {{ results.length }} 所学校</text>
            <view v-for="(item, i) in results" :key="i" class="sw-school-block">
              <view class="sw-school-name-row">
                <text class="sw-school-idx">{{ i + 1 }}</text>
                <text class="sw-school-name">{{ item.school }}</text>
              </view>
              <view v-for="(major, j) in item.majors" :key="j" class="sw-major-row">
                <text class="sw-major-dot">·</text>
                <text class="sw-major-name">{{ major.name }}</text>
              </view>
            </view>
          </view>
        </scroll-view>
        <view class="sw-result-ft">
          <view class="sw-result-close" @click="showResult = false">
            <text>关闭</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { matchAllSchools } from '../../data/sanwei-rules'

export default {
  name: 'Sanwei',
  data() {
    return {
      gradeOptions: ['A', 'B', 'C', 'D', 'E'],
      langOptions: ['英语', '日语', '俄语', '德语', '法语', '西班牙语', '其他'],
      optionalSubjects: ['物理', '化学', '生物', '政治', '历史', '地理', '技术'],
      subjects: [
        { name: '语文', grade: '' },
        { name: '数学', grade: '' },
        { name: '外语', grade: '' },
        { name: '思想政治', key: '政治', grade: '' },
        { name: '历史', grade: '' },
        { name: '地理', grade: '' },
        { name: '物理', grade: '' },
        { name: '化学', grade: '' },
        { name: '生物', grade: '' },
        { name: '技术', grade: '' },
      ],
      selectedSubjects: [],
      tempSelected: [],
      foreignLang: '英语',
      qualityOptions: ['A', 'B', 'C'],
      qualityItems: [
        { name: '品德表现', grade: '' },
        { name: '运动健康', grade: '' },
        { name: '艺术素养', grade: '' },
        { name: '创新实践', grade: '' },
      ],
      showModal: false,
      analyzing: false,
      showResult: false,
      results: [],
    }
  },
  computed: {
    langIsOther() {
      return this.foreignLang === '其他' || !['英语', '日语', '俄语', '德语', '法语', '西班牙语'].includes(this.foreignLang)
    },
    canSubmit() {
      return (
        this.subjects.every(function(s) { return s.grade !== '' }) &&
        this.selectedSubjects.length === 3 &&
        this.qualityItems.every(function(q) { return q.grade !== '' }) &&
        this.foreignLang !== '' && this.foreignLang !== '其他'
      )
    },
  },
  methods: {
    onGradeChange(idx, event) {
      this.$set(this.subjects, idx, Object.assign({}, this.subjects[idx], {
        grade: this.gradeOptions[event.detail.value]
      }))
    },
    onQualityItemChange(idx, event) {
      this.$set(this.qualityItems, idx, Object.assign({}, this.qualityItems[idx], {
        grade: this.qualityOptions[event.detail.value]
      }))
    },
    onLangChange(event) {
      this.foreignLang = this.langOptions[event.detail.value]
    },
    onLangInput(event) {
      this.foreignLang = event.detail.value
    },
    openModal() {
      this.tempSelected = this.selectedSubjects.slice()
      this.showModal = true
    },
    closeModal() {
      this.showModal = false
    },
    toggleSubject(s) {
      var idx = this.tempSelected.indexOf(s)
      if (idx > -1) {
        this.tempSelected.splice(idx, 1)
      } else if (this.tempSelected.length < 3) {
        this.tempSelected.push(s)
      }
    },
    confirmSubjects() {
      if (this.tempSelected.length !== 3) return
      this.selectedSubjects = this.tempSelected.slice()
      this.showModal = false
    },
    onSubmit() {
      if (!this.canSubmit) return
      var self = this
      self.analyzing = true
      self.showResult = false

      // 构建 student 对象
      var grades = {}
      this.subjects.forEach(function(s) { grades[s.key || s.name] = s.grade })

      // 取4项综合素质中最低等级作为综合素质评价
      var qOrder = ['A', 'B', 'C']
      var worstQ = 'A'
      this.qualityItems.forEach(function(q) {
        if (qOrder.indexOf(q.grade) > qOrder.indexOf(worstQ)) worstQ = q.grade
      })

      var student = {
        grades: grades,
        selectedSubjects: this.selectedSubjects.slice(),
        qualityGrade: worstQ,
        foreignLang: this.foreignLang,
      }

      // 模拟异步分析（实际计算同步，加 delay 为了 UX）
      setTimeout(function() {
        try {
          self.results = matchAllSchools(student)
        } catch (e) {
          self.results = []
        }
        self.analyzing = false
        self.showResult = true

        // 上报记录
        var body = {
          grade_yuwen:            grades['语文'],
          grade_shuxue:           grades['数学'],
          grade_waiyu:            grades['外语'],
          grade_sixiang_zhengzhi: grades['政治'],
          grade_lishi:            grades['历史'],
          grade_dili:             grades['地理'],
          grade_wuli:             grades['物理'],
          grade_huaxue:           grades['化学'],
          grade_shengwu:          grades['生物'],
          grade_jishu:            grades['技术'],
          quality_grade:          student.qualityGrade,
          selected_subjects:      student.selectedSubjects.join(','),
          foreign_lang:           student.foreignLang,
          matched_count:          self.results.length,
          matched_result:         self.results,
        }
        fetch('https://h5.dskb.cn/champion-api/swyt/record', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }).catch(function() {}) // 上报失败不影响用户
      }, 1200)
    },
  },
}
</script>

<style lang="scss">
.sw-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #b3cee8 0%, #ddeaf6 120PX, #edf2f8 300PX, #edf2f8 100%);
  padding: 16PX 16PX 0;
  box-sizing: border-box;
}
.sw-page-title {
  text-align: left;
  padding: 8PX 4PX 16PX;
}
.sw-title-line1 {
  font-size: 34PX;
  font-weight: bold;
  color: #1a3c5e;
  line-height: 1.4;
}
.sw-title-line2 {
  font-size: 22PX;
  font-weight: bold;
  color: #1a3c5e;
  line-height: 1.4;
  margin-top: 2PX;
}

.sw-card {
  background: #fff;
  border-radius: 14PX;
  padding: 0 16PX;
  margin-bottom: 16PX;
  box-shadow: 0 1PX 8PX rgba(0, 0, 0, 0.06);
}

.sw-card-hd {
  display: flex;
  align-items: center;
  padding: 16PX 0 14PX;
  border-bottom: 1PX solid #f0f0f0;
}

.sw-hd-icon {
  font-size: 18PX;
  margin-right: 8PX;
  width: 26PX;
  text-align: center;
}

.sw-hd-icon--blue { color: #4a90d9; }
.sw-hd-icon--red  { color: #e85c45; }

.sw-hd-title {
  font-size: 15PX;
  font-weight: 600;
  color: #1a1a1a;
  flex: 1;
}

.sw-badge {
  background: #f35e50;
  color: #fff;
  font-size: 11PX;
  padding: 2PX 8PX;
  border-radius: 4PX;
}

.sw-row {
  display: flex;
  align-items: center;
  min-height: 50PX;
  border-bottom: 1PX solid #f2f2f2;
}

.sw-row--last { border-bottom: none; }
.sw-row--noborder { border-bottom: none; }
.sw-row--sub { padding-top: 0; }
.sw-lang-input { flex: 1; font-size: 14PX; color: #222; border: 1PX solid #e0e4ef; border-radius: 6PX; padding: 6PX 10PX; background: #f8f9fc; }

.sw-row-label {
  font-size: 14PX;
  color: #222;
  width: 100PX;
  flex-shrink: 0;
  white-space: nowrap;
}
.sw-row-label--indent {
  padding-left: 16PX;
  color: #555;
  font-size: 13PX;
}

.sw-row-right {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.sw-val {
  font-size: 14PX;
  color: #333;
  text-align: right;
}

.sw-ph {
  font-size: 14PX;
  color: #bbb;
  text-align: right;
}

.sw-arrow {
  font-size: 20PX;
  color: #bbb;
  margin-left: 6PX;
  line-height: 1;
}

.sw-tips { padding: 4PX 4PX 0; }

.sw-tip {
  display: flex;
  align-items: flex-start;
  margin-bottom: 10PX;
}

.sw-tip-dot {
  font-size: 13PX;
  color: #aaa;
  line-height: 1.6;
  margin-right: 4PX;
  flex-shrink: 0;
}

.sw-tip-txt {
  font-size: 13PX;
  color: #aaa;
  line-height: 1.6;
}

/* 底部 */
.sw-footer {
  padding: 20PX 0 40PX;
}

.sw-submit {
  border-radius: 50PX;
  height: 48PX;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #d0d0d0;
}

.sw-submit--on {
  background: linear-gradient(135deg, #4a90d9, #357abd);
}

.sw-submit-txt {
  font-size: 16PX;
  color: #fff;
  font-weight: 500;
  letter-spacing: 2PX;
}

/* 选考弹窗 */
.sw-mask {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 100;
  display: flex;
  align-items: flex-end;
}

.sw-modal {
  background: #fff;
  width: 100%;
  border-radius: 16PX 16PX 0 0;
  padding-bottom: 28PX;
}

.sw-modal-hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18PX 20PX 14PX;
  border-bottom: 1PX solid #f0f0f0;
}

.sw-modal-title { font-size: 15PX; font-weight: 600; color: #222; }
.sw-modal-x { font-size: 16PX; color: #999; padding: 4PX 8PX; }

.sw-modal-body { padding: 0 20PX; }

.sw-opt {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 52PX;
  border-bottom: 1PX solid #f5f5f5;
}

.sw-opt:last-child { border-bottom: none; }
.sw-opt--on .sw-opt-name { color: #4a90d9; }
.sw-opt-name { font-size: 14PX; color: #333; }

.sw-check {
  width: 22PX; height: 22PX;
  background: #4a90d9;
  border-radius: 50%;
  color: #fff;
  font-size: 12PX;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sw-modal-ft {
  display: flex;
  align-items: center;
  gap: 12PX;
  padding: 16PX 20PX 0;
}

.sw-modal-count {
  font-size: 13PX;
  color: #999;
  flex-shrink: 0;
}

.sw-btn {
  flex: 1;
  height: 46PX;
  border-radius: 23PX;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15PX;
}

.sw-btn--cancel { background: #f5f5f5; color: #666; }
.sw-btn--ok { background: linear-gradient(135deg, #4a90d9, #357abd); color: #fff; font-weight: 500; }
.sw-btn--ok-dis { background: #d0d0d0; color: #fff; font-weight: 500; }

/* 分析中遮罩 */
.sw-loading {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sw-loading-box {
  background: #fff;
  border-radius: 16PX;
  padding: 32PX 40PX;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10PX;
  min-width: 200PX;
}

.sw-loading-icon { font-size: 36PX; }
.sw-loading-txt { font-size: 16PX; font-weight: 600; color: #222; }
.sw-loading-sub { font-size: 12PX; color: #999; }

/* 结果弹窗 */
.sw-result-mask {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20PX;
  box-sizing: border-box;
}

.sw-result-box {
  background: #fff;
  border-radius: 16PX;
  width: 100%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sw-result-hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18PX 20PX 14PX;
  border-bottom: 1PX solid #f0f0f0;
  flex-shrink: 0;
}

.sw-result-title { font-size: 16PX; font-weight: 600; color: #222; }
.sw-result-x { font-size: 18PX; color: #999; padding: 4PX 8PX; }

.sw-result-scroll {
  flex: 1;
  overflow-y: auto;
  height: 55vh;
}

.sw-result-inner {
  padding: 12PX 20PX;
}

.sw-result-count {
  display: block;
  font-size: 13PX;
  color: #4a90d9;
  font-weight: 500;
  margin-bottom: 12PX;
}

.sw-result-empty {
  padding: 40PX 20PX;
  text-align: center;
}

.sw-result-empty-txt {
  display: block;
  font-size: 15PX;
  color: #333;
  font-weight: 500;
  margin-bottom: 8PX;
}

.sw-result-empty-sub {
  display: block;
  font-size: 13PX;
  color: #999;
  line-height: 1.6;
}

.sw-school-block {
  margin-bottom: 16PX;
  border: 1PX solid #eef2f8;
  border-radius: 10PX;
  overflow: hidden;
}

.sw-school-name-row {
  display: flex;
  align-items: center;
  background: #f0f6ff;
  padding: 10PX 14PX;
}

.sw-school-idx {
  width: 22PX;
  height: 22PX;
  background: #4a90d9;
  border-radius: 50%;
  color: #fff;
  font-size: 11PX;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 10PX;
  flex-shrink: 0;
  text-align: center;
  line-height: 22PX;
}

.sw-school-name {
  font-size: 14PX;
  font-weight: 600;
  color: #1a3a6b;
}

.sw-major-row {
  display: flex;
  align-items: center;
  padding: 8PX 14PX;
  border-top: 1PX solid #f5f5f5;
}

.sw-major-dot { font-size: 14PX; color: #aaa; margin-right: 6PX; flex-shrink: 0; }
.sw-major-name { font-size: 13PX; color: #333; flex: 1; line-height: 1.4; }

.sw-result-ft {
  padding: 12PX 20PX 20PX;
  flex-shrink: 0;
  border-top: 1PX solid #f0f0f0;
}

.sw-result-close {
  height: 46PX;
  border-radius: 23PX;
  background: linear-gradient(135deg, #4a90d9, #357abd);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15PX;
  color: #fff;
  font-weight: 500;
}
</style>
