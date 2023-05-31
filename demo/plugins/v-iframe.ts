import VIframe from '../../'

export default defineNuxtPlugin((nuxtApp) => {
  console.log('COMPONENT V', VIframe)
  nuxtApp.vueApp.component('VIframe', VIframe)
})