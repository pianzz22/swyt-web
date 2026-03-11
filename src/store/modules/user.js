const state = {
  userInfo: null,
  token: ''
}

const mutations = {
  SET_USER_INFO(state, info) {
    state.userInfo = info
  },
  SET_TOKEN(state, token) {
    state.token = token
  }
}

const actions = {}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}
