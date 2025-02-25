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