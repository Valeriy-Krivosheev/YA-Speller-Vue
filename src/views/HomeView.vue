<template>
  <speller-header />
  <main class="container mx-auto">
    <h1 class="mb-24 text-2xl sm:text-3xl lg:text-5xl text-gray-700">Оцените работу Спеллера</h1>
    <speller-form v-model="text" />
  </main>
  <speller-footer />
</template>

<script setup lang="ts">
import SpellerHeader from '@/components/SpellerHeader.vue'
import SpellerForm from '@/components/SpellerForm.vue'
import SpellerFooter from '@/components/SpellerFooter.vue'
import { onMounted, ref } from 'vue'
import { initFlowbite } from 'flowbite'
onMounted(() => {
  initFlowbite()
})

const text = ref<string>('')
</script>
