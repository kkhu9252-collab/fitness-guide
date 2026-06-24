<script setup>
import { computed } from 'vue'
import AdminApp from './AdminApp.vue'
import PublicApp from './PublicApp.vue'

const isAdminRoute = computed(() => window.location.pathname.startsWith('/admin'))
</script>

<template>
  <AdminApp v-if="isAdminRoute" />
  <PublicApp v-else />
</template>
