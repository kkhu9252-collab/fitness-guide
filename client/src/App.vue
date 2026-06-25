<script setup>
import { computed } from 'vue'
import AdminApp from './AdminApp.vue'
import PublicApp from './PublicApp.vue'

const basePath = import.meta.env.BASE_URL || '/'

function pathWithoutBase(pathname) {
  if (basePath !== '/' && pathname.startsWith(basePath)) {
    return `/${pathname.slice(basePath.length)}`
  }
  return pathname
}

const isAdminRoute = computed(() => pathWithoutBase(window.location.pathname).startsWith('/admin'))
</script>

<template>
  <AdminApp v-if="isAdminRoute" />
  <PublicApp v-else />
</template>
