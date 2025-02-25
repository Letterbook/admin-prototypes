<script setup>
import 'temporal-polyfill/global'
import { inject } from 'vue'
const store = inject('store')
</script>

<template>
<main v-if="store.loaded">
	<table class="table">
		<thead>
			<tr>
				<th class="domain">Domain</th>
				<th class="mutuals">Connections</th>
				<th class="posts">Posts 7d</th>
				<th class="first date">First Seen</th>
				<th class="last seen">Last Seen</th>
			</tr>
		</thead>
		<tbody>
			<tr v-for="instance in store.instances()">
				<td class="domain">{{ instance.domain }}</td>
			</tr>
		</tbody>

	</table>
</main>
</template>
