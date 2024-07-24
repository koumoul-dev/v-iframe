<script setup>
import '../public/content-window.js'
import { useRouter } from 'vue-router'

const router = useRouter()
window.vIframeOptions = { router }
</script>

<template>
    <v-container>
      <v-row>
        <v-col>
          <p>$route.fullPath: {{ $route.fullPath }}</p>
          <v-btn :disabled="$route.query.paramIframe === 'iframe'" @click="$router.push({path: $route.path, query: {...$route.query, paramIframe: 'iframe'}})">
            Push local query param
          </v-btn>
          <v-btn :disabled="$route.query.paramIframe !== 'iframe'" @click="$router.push({path: $route.path, query: {...$route.query, paramIframe: undefined}})">
            Remove local query param
          </v-btn>
        </v-col>
      </v-row>
    </v-container>
</template>