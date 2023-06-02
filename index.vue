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

const rand = () => Math.random().toString(36).substr(2, 5)

const ssr = typeof window === 'undefined'

const isDebugActive = (key) => {
  return !ssr && window.localStorage && window.localStorage.debug && window.localStorage.debug.indexOf(key) !== -1
}
const isVIFrameDebugActive = isDebugActive('v-iframe')
function debugVIframe() {
  if (isVIFrameDebugActive) console.log.apply(console, arguments)
}
const isIFrameResizerDebugActive = isDebugActive('iframe-resizer')

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
    title: {
      type: String,
      default: null
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
    syncState: {
      type: Boolean,
      default: false
    },
    syncStateIgnorePath: {
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
    appliedSrc: null,
    notification: null,
    showNotification: false,
    syncedSrc: null,
    contentWindowRegistered: false
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
      const attrs = {
        id: this.id,
        src: this.appliedSrc,
        scrolling: this.scrolling,
        frameborder: 0,
        loading: this.lazy ? 'lazy' : 'eager',
        ...this.iframeAttrs
      }
      if (this.title) attrs.title = this.title
      return attrs
    },
    fullSnackbarProps() {
      const props = { ...this.snackbarProps }
      if (!this.notification) return props
      if (this.notification.type === 'error') props.timeout = 0
      if (this.notification.type === 'default') props.text = true
      props.color = this.notification.type
      return props
    },
    fullSrc() {
      if (ssr) return this.src
      const fullSrcUrl = new URL(this.src, window.location.href)
      if (this.queryParamsExtra) {
        Object.keys(this.queryParamsExtra).forEach(key => {
          fullSrcUrl.searchParams.set(key, this.queryParamsExtra[key])
        })
      }
      if (this.syncState) {
        let query
        if (this.$route) {
          query = { ...this.$route.query }
        } else {
          const searchParams = new URL(window.location.href).searchParams
          for (const key of [...searchParams.keys()]) {
            query[key] = searchParams.get(key)
          }
        }
        if (this.queryParamsInclude) {
          for (const key of Object.keys(query)) {
            if (!this.queryParamsInclude.includes(key) && key !== 'p') delete query[key]
          }
        }
        if (this.queryParamsExclude) {
          this.queryParamsExclude.forEach(key => {
            delete query[key]
          })
        }
        for (const key of Object.keys(query).filter(key => query[key] !== undefined && query[key] !== null)) {
          if (key === 'p' && !this.syncStateIgnorePath) {
            let prefix = fullSrcUrl.pathname
            if (!prefix.endsWith('/')) prefix += '/'
            fullSrcUrl.pathname = query.p
            if (query.p.startsWith('./')) {
              fullSrcUrl.pathname = query.p.replace('./', prefix)
            }
          } else {
            fullSrcUrl.searchParams.set(key, query[key])
          }
        }
      }
      fullSrcUrl.searchParams.sort()
      return fullSrcUrl.href
    }
  },
  watch: {
    src: {
      handler() {
        this.setSrc()
      },
      immediate: true
    },
    '$route.query'() {
      this.$nextTick(() => {
        this.setSrc()
      })
    }
  },
  mounted() {
    // debugVIframe('mount', this.src)
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

    this.popStateListener = (e) => {
      this.setSrc()
    }
    window.addEventListener('popstate', this.popStateListener)

    // transmit message from iframe as a message event
    this.messageEventListener = (e) => {
      if (e.source !== this.iframeWindow) return
      if (typeof e.data === 'string' && (e.data.startsWith('[iFrameResizer]') || e.data.startsWith('[iFrameSizer'))) {
        // nothing to do
      } else if (typeof e.data === 'object' && (e.data.viframe || e.data.vIframe || e.data['v-iframe'])) {
        // messages to be interpreted by viframe itself contain object with viframe=true
        debugVIframe('received action message from iframe', e.data)
        
        if (e.data.scroll === 'top') {
          if (this.$vuetify.goTo) {
            this.$vuetify.goTo('#' + this.id, this.goToOptions)
          } else {
            this.goTo()
          }
        }
        if (typeof e.data.scroll === 'number') {
          if (this.$vuetify.goTo) {
            goTo('#' + this.id, { ...this.goToOptions, offset: -e.data.scroll })
          } else {
            this.goTo(e.data.scroll)
          }
        }
        if (e.data.uiNotification) {
          if (this.showNotification) {
            this.showNotification = false
            setTimeout(() => this.setNotification(e.data.uiNotification), 300)
          }
          this.setNotification(e.data.uiNotification)
        }
        if (e.data.stateAction && e.data.href) {
          const newSyncedSrcUrl = new URL(e.data.href)
          newSyncedSrcUrl.searchParams.sort()
          this.syncedSrc = newSyncedSrcUrl.href
          this.emitState()
          if (this.syncState) {
            this.storeState(e.data.stateAction)
          }
        }
        // send by content-window.js to signify that this iframe content is capable of syncing state, etc
        if (e.data.contentWindow) {
          this.contentWindowRegistered = true
        }
      } else {
        // debugVIframe('transmit message', e.data)
        this.$emit('message', e.data)
      }
    }
    window.addEventListener('message', this.messageEventListener)
  },
  destroyed() {
    window.removeEventListener('message', this.messageEventListener)
    window.removeEventListener('resize', this.resizeListener)
    window.removeEventListener('popstate', this.popStateListener)
  },
  methods: {
    // simple temporary replacement of vuetify goTo
    // TODO: make vuetify service work in this context
    goTo(offset) {
      debugVIframe('use internal goTo method instead of vuetify')
      try {
        this.$el.scrollIntoView({behavior: 'smooth'})
      } catch(err) {
        console.error(err)
      }
    },
    setSrc() {
      if (!this.src) {
        this.appliedSrc = this.src
        return
      }
      if (this.syncedSrc === this.fullSrc) return
      debugVIframe(`apply state from parent to iframe
  - parent query: ${window.location.search}
  - new full src: ${this.fullSrc}
  - current synced src: ${this.syncedSrc}`)
      if (this.syncState) {
        this.syncedSrc = this.fullSrc
        this.emitState()
      }
      if (!this.appliedSrc || !this.iframeWindow) {
        // debugVIframe('set initial appliedSrc', this.fullSrc)
        this.appliedSrc = this.fullSrc
      } else {
        // replacing location instead of changing src prevents interacting with the browser history
        if (this.contentWindowRegistered) {
          debugVIframe('replace location after change using postMessage', this.fullSrc)
          this.sendMessage({ viframe: true, stateAction: 'replace', href: this.fullSrc })
        } else {
          debugVIframe('replace location after change using iframe.location.replace', this.fullSrc)
          try {
            this.iframeWindow.location.replace(this.fullSrc)
          } catch (err) {
            debugVIframe('failure to replace location, change src', err)
            this.appliedSrc = this.fullSrc
          }
        }
      }
    },
    storeState(action) {
      const newParentUrl = new URL(window.location.href)
      const originalSrcUrl = new URL(this.src, window.location.href)
      const syncedSrcUrl = new URL(this.syncedSrc)
      for (const key of [...newParentUrl.searchParams.keys()]) {
        if (this.queryParamsExclude && this.queryParamsExclude.includes(key)) continue
        if (syncedSrcUrl.searchParams.has(key)) continue
        newParentUrl.searchParams.delete(key)
      }
      for (const key of [...syncedSrcUrl.searchParams.keys()]) {
        if (this.queryParamsExtra && key in this.queryParamsExtra) continue
        if (this.queryParamsInclude && !this.queryParamsInclude.includes(key)) continue
        if (this.queryParamsExclude && this.queryParamsExclude.includes(key)) continue
        newParentUrl.searchParams.set(key, syncedSrcUrl.searchParams.get(key))
      }
      if (originalSrcUrl.pathname !== syncedSrcUrl.pathname && !this.syncStateIgnorePath) {
        let prefix = originalSrcUrl.pathname
        if (!prefix.endsWith('/')) prefix += '/'
        let p = syncedSrcUrl.pathname
        if (p.startsWith(prefix)) p = p.replace(prefix, './')
        newParentUrl.searchParams.set('p', p)
      }
      if (this.$route && this.$router) {
        const query = { ...this.$route.query }
        for (const key of [...newParentUrl.searchParams.keys()]) {
          query[key] = newParentUrl.searchParams.get(key)
        }
        for (const key of Object.keys(query)) {
          if (!newParentUrl.searchParams.has(key)) {
            query[key] = undefined
          }
        }
        if (JSON.stringify(query) === JSON.stringify(this.$route.query)) return
        debugVIframe(`apply state from iframe to parent using vue router
  - synced src: ${this.syncedSrc}
  - current query: ${JSON.stringify(this.$route.query)}
  - new query: ${JSON.stringify(query)}`)
        if (action === 'push') {
          this.$router.push({ query })
        } else {
          this.$router.replace({ query })
        }
      } else {
        if (newParentUrl.href === window.location.href) return
        debugVIframe('apply state from iframe to parent using window.history', this.syncedSrc, newParentUrl.search)
        if (action === 'push') {
          history.pushState(null, '', newParentUrl.href)
        } else {
          history.replaceState(null, '', newParentUrl.href)
        }
      }
    },
    iframeLoaded () {
      this.loaded = true
      if (!this.iframeResizer) return
      if (!window.iFrameResize) console.error('iframe-resizer is not available.')
      else {
        if (this.scrolling !== 'no') console.error('iframeResizer=true is only compatible with scrolling=no.')
        // always try to apply iframe resizer, it it is not loaded inside the iframe it will do nothing
        window.iFrameResize({
          log: isIFrameResizerDebugActive,
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
      // debugVIframe(`should we apply new width ? current=${this.actualWidth}, new=${newWidth}`)

      if (this.actualWidth === newWidth) return
      if (!newWidth) return
      if (this.actualWidth !== null && this.redrawOnResize) {
        // another nextTick to force a redraw of the iframe
        // it might create a flicking effect, but the iframe content might not manage resizing correctly
        // debugVIframe('force iframe redraw after resize', this.actualWidth, newWidth)
        this.iframeWindow = null
        this.actualWidth = null
        this.$nextTick(() => this.applyNewWidth(newWidth))
      } else {
        this.applyNewWidth(newWidth)
      }
    },
    applyNewWidth(newWidth, recurse = true) {
      this.actualWidth = newWidth
      // debugVIframe(`applied new width, width=${this.actualWidth}, aspectRatio=${this.actualAspectRatio}`)
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
          // debugVIframe('check aspect ratio', newWidth, this.actualAspectRatio, rect.width / rect.height)
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
    },
    emitState() {
      this.$emit('state', { href: this.syncedSrc })
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
