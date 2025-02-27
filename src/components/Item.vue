<script setup>
const props = defineProps({
	label: String,
})
</script>

<template>
<div class="item">
	<strong class="label">{{ props.label }}</strong>
	<slot></slot>
</div>
</template>

<style>
.item {
  margin-left: var(--space-lg1);
  strong {
    margin-left: calc(-1 * var(--space-lg1));
    margin-right: var(--space-md);
  }
}
</style>