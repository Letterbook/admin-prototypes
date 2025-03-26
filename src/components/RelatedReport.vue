<script setup>
import { inject } from 'vue'
import { RouterLink } from 'vue-router';
import time from '@/util/time'

const props = defineProps(['report'])

const store = inject('store')
</script>

<template>
<div class="related-report">
	– 
	<RouterLink :to="`/reports/${props.report.id}`">
		{{ time.since(props.report.created, store.now) }} by
		@{{ props.report.from.handle }}
	</RouterLink>
</div>
</template>