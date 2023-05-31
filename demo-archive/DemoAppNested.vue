<template lang="html">
  <v-app>
    <v-container>
      <v-row>
        <v-col cols="12" sm="8" lg="8" xl="4">
          <p>nested iframe with nav synchronization</p>
          <p>sync state: {{ syncedState }}</p>
          <v-iframe ref="iframeState" src="./content-state.html" :sync-state="true" class="elevation-3" @state="e => syncedState = e" />
        </v-col>
      </v-row>
    </v-container>
  </v-app>
</template>

<script>
import VIframe from '../index.vue'

export default {
  components: { VIframe },
  data() {
    return {
      syncedState: {}
    }
  },
  methods: {
    onMessage(message) {
      console.log('nested page - received message from iframe', message)
      this.$refs.iframeMessage.sendMessage({ text: 'Response from nested parent' })
    }
  }
}
</script>

<style lang="css">
</style>
