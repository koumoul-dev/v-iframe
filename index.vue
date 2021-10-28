<template>
  <div class="v-iframe" :style="`width:${width}`">
    <v-responsive v-if="actualAspectRatio" :aspect-ratio="actualAspectRatio" style="height:100%;">
      <iframe v-if="actualWidth" :id="id" :src="originalSrc" scrolling="no" frameborder="0" v-bind="iframeAttrs" @load="iframeLoaded()" />
    </v-responsive>
  </div>
</template>

<script>

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
    log: {
      type: Boolean,
      default: false
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
    }
  },
  data: () => ({
    loaded: true,
    resized: false,
    actualWidth: null,
    originalSrc: null
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
    }
  },
  watch: {
    src: {
      handler() {
        if (!this.src || !this.originalSrc || !this.iframeWindow) {
          this.originalSrc = this.src
        } else {
          // replacing location instead of changing src prevents interacting with the browser history
          if (this.log) console.log('v-iframe - replace location', this.src)
          try {
            this.iframeWindow.location.replace(this.src)
          } catch (err) {
            if (this.log) console.log('v-iframe - failure to replace location', err)
            this.originalSrc = this.src
          }
        }
      },
      immediate: true
    }
  },
  mounted() {
    // wait for context to be rendered and hopefully have definitive width (dialogs, etc)
    if (this.delay !== null) {
      setTimeout(() => this.resize(), this.delay)
    } else {
      // at least a nextTick
      this.$nextTick(() => this.resize())
    }

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
      if (e.source === this.iframeWindow) {
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
    iframeLoaded () {
      this.loaded = true

      if (!window.iFrameResize) console.log('iframe-resizer is not available.')
      else {
        // always try to apply ifrmae resizer, it it is not loaded inside the iframe it will do nothing
        window.iFrameResize({
          log: this.log,
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
      if (this.actualWidth === newWidth) return
      if (this.actualWidth !== null) {
        // another nextTick to force a redraw of the iframe
        // it might create a flicking effect, but the iframe content might not manage resizing correctly
        if (this.log) console.log('v-iframe - context is resized', this.actualWidth, newWidth)
        this.iframeWindow = null
        this.actualWidth = null
        this.$nextTick(() => this.applyNewWidth(newWidth))
      } else {
        this.applyNewWidth(newWidth)
      }
    },
    applyNewWidth(newWidth, recurse = true) {
      this.actualWidth = newWidth
      // another nextTick to wait for iframe to be rendered now that actualWidth was defined
      this.$nextTick(() => {
        const iframeElement = this.$el.getElementsByTagName('iframe')[0]
        if (!iframeElement) {
          if (recurse) return this.applyNewWidth(newWidth, false)
          else return console.error('v-irame iframe element was not created after setting its width')
        }
        this.iframeWindow = iframeElement.contentWindow
        const rect = iframeElement.getBoundingClientRect()
        if (this.log) console.log('v-iframe - check aspect ratio', newWidth, this.actualAspectRatio, rect.width / rect.height)
      })
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
</style>
