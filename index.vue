<template>
  <v-responsive :aspect-ratio="resized ? 10 : aspectRatio" :style="`width:${width}`" class="v-iframe">
    <iframe :id="id" :src="src" scrolling="no" frameborder="0" @load="iframeLoaded()" />
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
      type: String,
      default() {
        return this.$vuetify.breakpoint.smAndUp ? '1.5' : '1.0'
      }
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
    }
  },
  data: () => ({
    loaded: true,
    resized: false
  }),
  created() {
    this.messageEventListener = (e) => {
      if (e.source === this.iframeWindow) {
        this.$emit('message', e.data)
      }
    }
    window.addEventListener('message', this.messageEventListener)
  },
  destroyed() {
    window.removeEventListener('message', this.messageEventListener)
  },
  methods: {
    iframeLoaded () {
      this.loaded = true

      this.iframeWindow = this.$el.getElementsByTagName('iframe')[0].contentWindow

      if (!window.iFrameResize) console.log('iframe-resizer is not available.')
      else {
        window.iFrameResize({
          log: this.log,
          scrolling: 'no',
          onResized: () => { this.resized = true }
        }, `#${this.id}`)
      }
    },
    sendMessage(message) {
      this.iframeWindow.postMessage(message)
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
