<template lang="html">
  <v-app>
    <v-container>
      <v-row>
        <v-col cols="12" sm="6" lg="4" xl="3">
          iframe with default aspect ratio
          <v-iframe src="./content-auto-resize.html" class="elevation-3" />
        </v-col>
        <v-col cols="12" sm="6" lg="4" xl="3">
          iframe with custom aspect ratio
          <v-iframe src="./content-auto-resize.html" aspect-ratio="2" class="elevation-3" />
        </v-col>
        <v-col cols="12" sm="6" lg="4" xl="3">
          iframe with custom width
          <v-iframe src="./content-auto-resize.html" width="50%" class="elevation-3" />
        </v-col>
        <v-col cols="12" sm="6" lg="4" xl="3">
          iframe with iframe-resizer ignores aspect ratio
          <v-iframe src="./content-iframe-resizer.html" class="elevation-3" />
        </v-col>
        <v-col cols="12" sm="6" lg="4" xl="3">
          iframe with message exchange
          <v-iframe ref="iframeMessage" src="./content-message.html" class="elevation-3" @message="onMessage" />
        </v-col>
      </v-row>
    </v-container>
  </v-app>
</template>

<script>
import VIframe from '../index.vue'

export default {
  components: { VIframe },
  methods: {
    onMessage(message) {
      console.log('received message from iframe', message)
      this.$refs.iframeMessage.sendMessage({ text: 'Response from parent' })
    }
  }
}
</script>

<style lang="css">
</style>
