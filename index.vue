<template>
  <v-responsive :aspect-ratio="resized ? 10 : actualAspectRatio" :style="`width:${width}`" class="v-iframe">
    <iframe v-if="actualWidth" :id="id" :src="src" scrolling="no" frameborder="0" v-bind="iframeAttrs" @load="iframeLoaded()" />
  </v-responsive>
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
    aspectRatio: {
      type: Number
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
    actualWidth: null
  }),
  computed: {
    actualAspectRatio() {
      if (this.aspectRatio) return this.aspectRatio
      if (!this.actualWidth) return
      if (this.actualWidth < 600) return 1 // same as xs but on the current element not full page
      if (this.actualWidth < 960) return 4 / 3 // sm
      if (this.actualWidth < 1264) return 16 / 9 // md
      return 21 / 9
    }
  },
  mounted() {
    this.resizeListener = (e) => {
      this.actualWidth = this.$el.getBoundingClientRect().width
    }
    this.resizeListener()
    window.addEventListener('resize', this.resizeListener)
    this.$nextTick(() => {
      this.iframeWindow = this.$el.getElementsByTagName('iframe')[0].contentWindow
      this.messageEventListener = (e) => {
        if (e.source === this.iframeWindow) {
          this.$emit('message', e.data)
        }
      }
      window.addEventListener('message', this.messageEventListener)
    })
  },
  destroyed() {
    window.removeEventListener('message', this.messageEventListener)
    window.removeEventListener('message', this.resizeListener)
  },
  methods: {
    iframeLoaded () {
      this.loaded = true

      if (!window.iFrameResize) console.log('iframe-resizer is not available.')
      else {
        window.iFrameResize({
          log: this.log,
          scrolling: 'no',
          onResized: () => { this.resized = true }
        }, `#${this.id}`)
      }
    },
    sendMessage(message, targetOrigin = '*') {
      this.iframeWindow.postMessage(message, targetOrigin)
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
