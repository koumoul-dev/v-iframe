
<script setup>
import 'iframe-resizer/js/iframeResizer'

const syncedState = ref({})
const syncedStateNested = ref({})
const extraParams = ref({})
</script>
<template>
  <v-container>
    <v-row>
      <!--<v-col cols="12" sm="6" lg="4" xl="3">
          iframe with default aspect ratio
          <v-iframe src="./content-auto-resize.html" class="elevation-3" />
        </v-col>
        <v-col cols="12" sm="6" lg="4" xl="3">
          iframe with custom aspect ratio
          <v-iframe src="./content-auto-resize.html" :aspect-ratio="2" class="elevation-3" />
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
          iframe with explicit small height ignores aspect ratio
          <v-iframe src="./content-auto-resize.html" class="elevation-3" style="height: 100px" />
        </v-col>
        <v-col cols="12" sm="6" lg="4" xl="3">
          iframe with explicit large height ignores aspect ratio
          <v-iframe src="./content-auto-resize.html" class="elevation-3" style="height: 700px" />
        </v-col>
        <v-col cols="12" sm="6" lg="4" xl="3">
          iframe with message exchange
          <v-iframe ref="iframeMessage" src="./content-message.html" class="elevation-3" @message="onMessage" />
        </v-col>
        <v-col cols="12" sm="6" lg="4" xl="3">
          iframe with scrollTo instructions
          <v-iframe ref="iframeScroll" src="./content-scroll.html" class="elevation-3" style="height: 1500px" />
        </v-col>
      -->
      
      <!--<v-col cols="12" sm="8" lg="8" xl="4">
        <p>iframe with nav synchronization</p>
        <p>sync state: {{ syncedState }}</p>
        <p>param1: {{ $route.query.param1 }}</p>
        <p>child path: {{ $route.query.p }}</p>
        <v-btn :disabled="$route.query.param1 === 'parent'" @click="$router.push({path: $route.path, query: {param1: 'parent'}})">
          Push query param from parent
        </v-btn>
        <v-btn :disabled="$route.query.param1 !== 'parent'" @click="$router.push({path: $route.path, query: {}})">
          Remove query param from parent
        </v-btn>
          <v-iframe ref="iframeState" src="./embed" :sync-state="true" :query-params-extra="{extraParam: 1}" :query-params-exclude="['param2']" class="elevation-3" @state="e => syncedState = e" />
      </v-col>-->
      <v-col cols="12" sm="8" lg="8" xl="4">
        <p>iframe with nav extra query params from parent and local query params in iframe</p>
        <p>sync state: {{ syncedState }}</p>
        <p>param1: {{ extraParams.param1 }}</p>
        <v-btn :disabled="extraParams.param1 === 'parent'" @click="extraParams.param1 = 'parent'">
          Push query param from parent
        </v-btn>
        <v-btn :disabled="extraParams.param1 !== 'parent'" @click="delete extraParams.param1">
          Remove query param from parent
        </v-btn>
        <v-iframe ref="iframeState" src="./embed" :query-params-extra="extraParams" @state="e => syncedState = e" />
      </v-col>
      <!--<v-col cols="12" sm="8" lg="8" xl="4">
          <p>iframe with nested nav synchronization</p>
          <p>sync state: {{ syncedStateNested }}</p>
          <v-iframe ref="iframeStateNested" src="./nested.html" :sync-state="true" class="elevation-3" @state="e => syncedStateNested = e" />
        </v-col>-->
    </v-row>
  </v-container>
</template>
