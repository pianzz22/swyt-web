const state = {
  loading: false
}

const mutations = {
  SET_LOADING(state, val) {
    state.loading = val
  }
}

const actions = {}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}
