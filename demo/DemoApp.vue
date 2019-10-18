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
      </v-row>
    </v-container>
  </v-app>
</template>

<script>
import VIframe from '../index.vue'

export default {
  components: { VIframe }
}
</script>

<style lang="css">
</style>
