<script setup>
const props = defineProps([])
</script>

<template>
<span class="badge"><slot></slot></span>
</template>

<style>
.badge {
  --badge-background: var(--bg-ii);
  margin: 0 var(--space-sm1);
  padding: 3px 5px;
  font-size: var(--font-sm2);
  background-color: var(--badge-background);
  border-radius: 5px;
  text-transform: uppercase;
  font-weight: bold;
}
</style>