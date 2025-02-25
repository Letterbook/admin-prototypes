<script setup>
import { RouterLink, RouterView } from 'vue-router'
import { inject, onMounted } from 'vue'

const store = inject('store')

onMounted(() => {
  store.startClock()
})
</script>

<template>
  <header id="mod-header">
    <div class="wrapper">
      <nav>
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/users">Users</RouterLink>
        <RouterLink to="/instances">Instances</RouterLink>
        <RouterLink to="/reports">Reports</RouterLink>
      </nav>
    </div>
    <div class="right">
      @Moddy
    </div>
  </header>

  <RouterView />
</template>

<style scoped>
header {
  border-bottom: 1px solid black;
  display: flex;
  align-items: baseline;
  justify-content: space-between;

  background-color: var(--bg-i);
}

nav, .right {
  display: flex;
  column-gap: var(--space-md);
  padding: var(--space-sm1) calc(2 * var(--space-md));

  a {
    color: var(--fg-link);
    text-decoration: none;
  }
}

</style>
