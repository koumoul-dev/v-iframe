<template>
  <div class="v-iframe" :style="`width:${width}`">
    <v-responsive v-if="actualAspectRatio" :aspect-ratio="actualAspectRatio" style="height:100%;">
      <iframe v-if="actualWidth" v-bind="fullIframeAttrs" @load="iframeLoaded()" />
    </v-responsive>

    <v-snackbar
      v-if="notification"
      ref="notificationSnackbar"
      v-model="showNotification"
      class="ui-notification"
      v-bind="fullSnackbarProps"
    >
      <p>{{ notification.msg }}</p>
      <p
        v-if="notification.errorMsg"
        class="ml-3"
        v-html="notification.errorMsg"
      />

      <template #action="{ }">
        <v-btn
          icon
          @click.native="showNotification = false"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script>

const debug = require('debug')
const debugVIframe = debug('v-iframe')
debugVIframe.log = console.log.bind(console)
const debugIframeResizer = debug('iframe-resizer')
const rand = () => Math.random().toString(36).substr(2, 5)

export default {
  props: {
    src: {
      type: String,
      required: true
    },
    width: {
      type: String,
      default: '100%'
    },
    // if not given a default value will be processed
    // can be ignored if the iframe is managed by iframe-resizer or if a height is specified as style of the parent element
    aspectRatio: {
      type: Number,
      default: null
    },
    // delay to apply before calculating aspect ratio and rendering iframe
    // useful for example is there is a transition and you want to prevent some flickering effect
    delay: {
      type: Number,
      default: null
    },
    id: {
      type: String,
      default() {
        return `viframe-${rand()}-${rand()}`
      }
    },
    iframeAttrs: {
      type: Object,
      default() {
        return {}
      }
    },
    iframeResizer: {
      type: Boolean,
      default: true
    },
    redrawOnResize: {
      type: Boolean,
      default: false
    },
    lazy: {
      type: Boolean,
      default: true
    },
    scrolling: {
      type: String,
      default: 'no'
    },
    goToOptions: {
      type: Object,
      default() {
        return { offset: 8 }
      }
    },
    snackbarProps: {
      type: Object,
      default() {
        return { tile: true, right: true, bottom: true, timeout: 30000 }
      }
    },
    syncQueryParams: {
      type: Boolean,
      default: false
    },
    queryParamsExclude: {
      type: Array,
      default: null
    },
    queryParamsInclude: {
      type: Array,
      default: null
    },
    queryParamsExtra: {
      type: Object,
      default: () => ({})
    }
  },
  data: () => ({
    loaded: true,
    resized: false,
    actualWidth: null,
    originalSrc: null,
    notification: null,
    showNotification: false
  }),
  computed: {
    actualAspectRatio() {
      if (this.resized) return 10
      if (this.aspectRatio) return this.aspectRatio
      if (!this.actualWidth) return null
      if (this.actualWidth < 500) return 1
      if (this.actualWidth < 800) return 4 / 3
      if (this.actualWidth < 1200) return 16 / 9
      return 21 / 9
    },
    fullIframeAttrs() {
      return {
        id: this.id,
        src: this.originalSrc,
        scrolling: this.scrolling,
        frameborder: 0,
        loading: this.lazy ? 'lazy' : 'eager',
        ...this.iframeAttrs
      }
    },
    fullSnackbarProps() {
      const props = { ...this.snackbarProps }
      if (!this.notification) return props
      if (this.notification.type === 'error') props.timeout = 0
      if (this.notification.type === 'default') props.text = true
      props.color = this.notification.type
      return props
    }
  },
  watch: {
    src: {
      handler() {
        this.setSrc()
      },
      immediate: true
    }
  },
  created() {
    this.debug = debugVIframe.extend(this.id)
  },
  mounted() {
    this.debug('mount', this.src)
    // wait for context to be rendered and hopefully have definitive width (dialogs, etc)
    if (this.delay !== null) {
      setTimeout(() => this.resize(), this.delay)
    } else {
      // at least a nextTick
      this.$nextTick(() => this.resize())
    }
    // also wait a little extra to check in case of animation, etc
    setTimeout(() => this.resize(), 300)

    this.resizeListener = (e) => {
      // simple debounce on window resize
      if (this.resizeTimeout) clearTimeout(this.resizeTimeout)
      this.resizeTimeout = setTimeout(() => {
        this.resize()
      }, 300)
    }
    window.addEventListener('resize', this.resizeListener)

    // transmit message from iframe as a message event
    this.messageEventListener = (e) => {
      if (e.source !== this.iframeWindow) return
      if (typeof e.data === 'string' && (e.data.startsWith('[iFrameResizer]') || e.data.startsWith('[iFrameSizer'))) {
        console.log('nothing todo')
      } else if (typeof e.data === 'object' && (e.data.viframe || e.data.vIframe)) {
        // messages to be interpreted by viframe itself contain object with viframe=true
        debugVIframe('perform action', e.data)
        if (e.data.scroll === 'top') this.$vuetify.goTo('#' + this.id, this.goToOptions)
        if (typeof e.data.scroll === 'number') this.$vuetify.goTo('#' + this.id, { ...this.goToOptions, offset: -e.data.scroll })
        if (e.data.uiNotification) {
          if (this.showNotification) {
            this.showNotification = false
            setTimeout(() => this.setNotification(e.data.uiNotification), 300)
          }
          this.setNotification(e.data.uiNotification)
        }
        if (e.data.queryParams) {
          this.applyQueryParams(e.data.queryParams)
        }
      } else {
        debugVIframe('transmit message', e.data)
        this.$emit('message', e.data)
      }
    }
    window.addEventListener('message', this.messageEventListener)
  },
  destroyed() {
    window.removeEventListener('message', this.messageEventListener)
    window.removeEventListener('resize', this.resizeListener)
  },
  methods: {
    setSrc() {
      if (!this.src) {
        this.originalSrc = this.src
        return
      }
      const srcUrl = new URL(this.src, window.location.href)
      if (this.syncQueryParams) {
        const searchParams = new URL(window.location.href).searchParams
        if (this.queryParamsExtra) {
          Object.keys(this.queryParamsExtra).forEach(key => {
            searchParams.set(key, this.queryParamsExtra[key])
          })
        }
        if (this.queryParamsInclude) {
          for (const key of searchParams.keys()) {
            if (!this.queryParamsInclude.includes(key)) searchParams.delete(key)
          }
        }
        if (this.queryParamsExclude) {
          this.queryParamsExclude.forEach(key => {
            searchParams.delete(key)
          })
        }
        for (const key of searchParams.keys()) {
          srcUrl.searchParams.set(key, searchParams.get(key))
        }
        debugVIframe('apply query from parent to iframe', searchParams, srcUrl.href)
      }
      if (!this.originalSrc || !this.iframeWindow) {
        this.originalSrc = srcUrl.href
      } else {
        // replacing location instead of changing src prevents interacting with the browser history
        this.debug('replace location after change', srcUrl.href)
        try {
          this.iframeWindow.location.replace(srcUrl.href)
        } catch (err) {
          this.debug('failure to replace location', err)
          this.originalSrc = srcUrl.href
        }
      }
    },
    applyQueryParams(query) {
      const currentUrl = new URL(window.location.href)
      Object.keys(query).forEach(key => {
        if (this.queryParamsExtra && key in this.queryParamsExtra) return
        if (this.queryParamsInclude && !this.queryParamsInclude.includes(key)) return
        if (this.queryParamsExclude && this.queryParamsExclude.includes(key)) return
        currentUrl.searchParams.set(key, query[key])
      })
      debugVIframe('apply query from iframe to parent', currentUrl.href)
      history.pushState(null, '', currentUrl.href)
    },
    iframeLoaded () {
      this.loaded = true
      if (!this.iframeResizer) return
      if (!window.iFrameResize) console.error('iframe-resizer is not available.')
      else {
        if (this.scrolling !== 'no') console.error('iframeResizer=true is only compatible with scrolling=no.')
        // always try to apply iframe resizer, it it is not loaded inside the iframe it will do nothing
        window.iFrameResize({
          log: debugIframeResizer.enabled,
          scrolling: 'no',
          onResized: () => { this.resized = true }
        }, `#${this.id}`)
      }
    },
    sendMessage(message, targetOrigin = '*') {
      this.iframeWindow.postMessage(message, targetOrigin)
    },
    resize() {
      const newWidth = this.$el.getBoundingClientRect().width
      this.debug(`should we apply new width ? current=${this.actualWidth}, new=${newWidth}`)

      if (this.actualWidth === newWidth) return
      if (!newWidth) return
      if (this.actualWidth !== null && this.redrawOnResize) {
        // another nextTick to force a redraw of the iframe
        // it might create a flicking effect, but the iframe content might not manage resizing correctly
        this.debug('force iframe redraw after resize', this.actualWidth, newWidth)
        this.iframeWindow = null
        this.actualWidth = null
        this.$nextTick(() => this.applyNewWidth(newWidth))
      } else {
        this.applyNewWidth(newWidth)
      }
    },
    applyNewWidth(newWidth, recurse = true) {
      this.actualWidth = newWidth
      this.debug(`applied new width, width=${this.actualWidth}, aspectRatio=${this.actualAspectRatio}`)
      // another nextTick to wait for iframe to be rendered now that actualWidth was defined
      this.$nextTick(() => {
        const iframeElement = this.$el.getElementsByTagName('iframe')[0]
        if (!iframeElement) {
          if (recurse) return this.applyNewWidth(newWidth, false)
          else return console.error('v-iframe - iframe element was not created after setting its width')
        }
        this.iframeWindow = iframeElement.contentWindow
        setTimeout(() => {
          const rect = iframeElement.getBoundingClientRect()
          this.debug('check aspect ratio', newWidth, this.actualAspectRatio, rect.width / rect.height)
        }, 300)
      })
    },
    setNotification(notif) {
      if (typeof notif === 'string') notif = { msg: notif }
      if (notif.error) {
        notif.type = 'error'
        notif.errorMsg = (notif.error.response && (notif.error.response.data || notif.error.response.status)) || notif.error.message || notif.error
      }
      notif.type = notif.type || 'default'
      this.notification = notif
      this.showNotification = true
    }
  }
}
</script>

<style lang="css">
.v-iframe iframe {
  background-color: transparent;
  border: none;

  /* cf https://stackoverflow.com/questions/16937070/iframe-size-with-css-on-ios */
  height: 1px;
  min-height: 100%;
  width: 1px;
  min-width: 100%;
}

.v-iframe .ui-notification.v-snack .v-snack__wrapper {
  min-width: 256px;
}
.v-iframe .ui-notification.v-snack .v-snack__content {
  height: auto;
}
.v-iframe .ui-notification.v-snack .v-snack__content p {
  margin-bottom: 4px;
  margin-top: 4px;
}
</style>
</style>
