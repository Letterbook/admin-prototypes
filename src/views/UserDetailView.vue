<script setup>
import { watch, inject, isProxy, toRaw } from 'vue'
import { useRoute } from 'vue-router'
import time from '@/util/time.js'

const route = useRoute()

const store = inject('store')

let user
function loadUser(handle) {
  user = store.localUser(handle)
  if (user) {
    console.log(toRaw(user))

  }
}

watch(() => route.params.handle, loadUser, { immediate: true })
</script>

<template>
<main v-if={user} id="user">
  <div class="user-profile-info">
    <Item label="Handle">{{ user.handle }}</Item>
    <Item label="Display Name">{{ user.displayName }}</Item>
  </div>
  <div id="activity">
    <h2>Activity Log</h2>
  </div>
</main>
<main v-else>
  User {{ $route.params.handle }} not found
</main>
</template>