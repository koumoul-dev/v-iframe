<template>
  <v-responsive :aspect-ratio="resized ? 10 : aspectRatio" :style="`width:${width}`" class="v-iframe">
    <div :style="wrapperStyle">
      <iframe :id="id" :src="src" height="100%" width="100%" :scrolling="loaded && scrolling ? 'yes' : 'no'" @load="iframeLoaded()" />
    </div>
  </v-responsive>
</template>

<script>
const iFrameResize = require('iframe-resizer/js/iframeResizer')

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
    scrolling: {
      type: Boolean,
      default: false
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
  computed: {
    wrapperStyle() {
      // hack for IOS that resizes all iframes
      // https://stackoverflow.com/questions/34320046/iframe-height-issues-on-ios-mobile-safari
      return this.resized ? '' : 'width:1px;min-width:100%;height:1px;min-height:100%;'
    }
  },
  methods: {
    iframeLoaded () {
      this.loaded = true
      iFrameResize({
        log: this.log,
        scrolling: this.scrolling,
        onResized: () => { this.resized = true }
      }, `#${this.id}`)
    }
  }
}
</script>

<style lang="css">
.v-iframe iframe {
  background-color: transparent;
  border: none;
}
</style>
