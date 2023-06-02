import VIframe from '../../'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('VIframe', VIframe)
})