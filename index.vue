<template>
  <v-responsive :aspect-ratio="resized ? 10 : actualAspectRatio" :style="`width:${width}`" class="v-iframe">
    <iframe v-if="actualWidth !== null" :id="id" :src="src" scrolling="no" frameborder="0" v-bind="iframeAttrs" @load="iframeLoaded()" />
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
    actualWidth: null
  }),
  computed: {
    actualAspectRatio() {
      if (this.aspectRatio) return this.aspectRatio
      if (!this.actualWidth) return 16 / 9
      if (this.actualWidth < 500) return 1
      if (this.actualWidth < 800) return 4 / 3
      if (this.actualWidth < 1200) return 16 / 9
      return 21 / 9
    }
  },
  async mounted() {
    // first nextTick to wait for context to be rendered and hopefully have definitive width (dialogs, etc)
    await this.$nextTick()
    this.resizeListener = async (e) => {
      const newWidth = this.$el.getBoundingClientRect().width
      if (this.actualWidth !== null && this.actualWidth !== newWidth) {
        // second nextTick to force a redraw of the iframe
        // it might create a flicking effect, but the iframe content might not manage resizing correctly
        console.log('v-iframe - context is resized', this.actualWidth)
        this.iframeWindow = null
        this.actualWidth = null
        await this.$nextTick()
      }
      this.actualWidth = newWidth
      // third nextTick to wait for iframe to be rendered now that actualWidth was defined
      await this.$nextTick()
      this.iframeWindow = this.$el.getElementsByTagName('iframe')[0].contentWindow
    }
    this.resizeListener()
    window.addEventListener('resize', this.resizeListener)

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
