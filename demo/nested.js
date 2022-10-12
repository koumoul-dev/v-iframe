import Vue from 'vue'
import Vuetify from 'vuetify'
import 'vuetify/dist/vuetify.min.css'
import VueRouter from 'vue-router'
import 'iframe-resizer/js/iframeResizer'
import DemoAppNested from './DemoAppNested.vue'

Vue.use(Vuetify)
Vue.use(VueRouter)

new Vue({
  el: '#app',
  components: { DemoAppNested },
  render: h => h('demo-app-nested'),
  vuetify: new Vuetify(),
  router: new VueRouter()
})
