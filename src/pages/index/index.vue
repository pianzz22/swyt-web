<template>
  <view class="page">
    <view class="page-center">
      <text class="page-title">swyt</text>
      <text class="page-sub">Taro + Vue 项目已初始化</text>
      <view class="nav-btn" @click="goSanwei">
        <text class="nav-btn-txt">进入三位一体页面</text>
      </view>
    </view>
  </view>
</template>

<script>
import Taro from '@tarojs/taro'
export default {
  name: 'Index',
  data() {
    return {}
  },
  methods: {
    goSanwei() {
      Taro.navigateTo({ url: '/pages/sanwei/index' })
    }
  }
}
</script>

<style lang="scss">
.page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f6fa;
}

.page-center {
  text-align: center;
}

.page-title {
  display: block;
  font-size: 32PX;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 12PX;
}

.page-sub {
  display: block;
  font-size: 14PX;
  color: #9ca3b0;
}

.nav-btn {
  margin-top: 32PX;
  background: #4a90d9;
  border-radius: 8PX;
  padding: 12PX 24PX;
  display: inline-block;
}

.nav-btn-txt {
  color: #fff;
  font-size: 14PX;
}
</style>
