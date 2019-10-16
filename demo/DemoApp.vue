<template lang="html">
  <v-app>
    <v-container>
      <v-row>
        <v-col cols="4">
          iframe with default aspect ratio
          <v-iframe src="./content1.html" class="elevation-3" />
        </v-col>
        <v-col cols="4">
          iframe with custom aspect ratio
          <v-iframe src="./content1.html" aspect-ratio="2" class="elevation-3" />
        </v-col>
        <v-col cols="4">
          iframe with custom width
          <v-iframe src="./content1.html" width="50%" class="elevation-3" />
        </v-col>
        <v-col cols="4">
          resized iframe ignores aspect ratio
          <v-iframe src="./content2.html" class="elevation-3" />
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
