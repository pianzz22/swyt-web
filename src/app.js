import Vue from 'vue'
import './app.scss'
import 'element-ui/lib/theme-chalk/index.css'
import ElementUI from 'element-ui'
import store from './store'

Vue.use(ElementUI)

const App = {
  store,
  onShow(options) {},
  render(h) {
    return h('block', this.$slots.default)
  }
}

export default App
