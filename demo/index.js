import Vue from 'vue'
import Vuetify from 'vuetify'
import 'vuetify/dist/vuetify.min.css'
import 'iframe-resizer/js/iframeResizer'
import DemoApp from './DemoApp.vue'

Vue.use(Vuetify)

new Vue({
  el: '#app',
  components: { DemoApp },
  render: h => h('demo-app'),
  vuetify: new Vuetify()
})
