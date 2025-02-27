<script setup>
import { watch, inject } from 'vue'
const store = inject('store')

const props = defineProps(['entity'])
const newNote = defineModel('newNote')

async function addNote(e) {
  e.preventDefault()
  await store.addNote(entity, newNote.value)
  newNote.value = ''
  log = store.log(entity)
}
</script>

<template>
<div class="activity-log">
	<h2>Activity Log</h2>

	<div v-if="store.log($props.entity).length == 0" class="dim">
		No activity yet.
	</div>
	<template v-else>
		<template v-for="item of store.log($props.entity)">
			<div v-if="item.type == 'note'" class="log-item note">
	            <div class="note-content">{{ item.text }}</div>
    	        - @{{item.author}}, {{ time.since(item.created, store.now) }}
			</div>
		</template>
	</template>

	<form class="add-note" @submit="addNote">
        <textarea v-model="newNote" :disabled="store.addingNote" />
        <div>
          <button class="button" type="submit" :disabled="store.addingNote">Add Note</button>
          <span v-if="store.addingNote">Saving...</span>
        </div>
    </form>
</div>
</template>

<style>
.activity-log {
	display: grid;
	row-gap: var(--space-md);
	align-content: start;

	.note {
		border: 1px solid var(--bg-ii);
    	border-radius: var(--radius-sm);
    	padding: var(--space-sm3) var(--space-sm2);
    	background-color: var(--bg-i);
	}

	.add-note {
		display: grid;
		row-gap: var(--space-sm2);
	}
}
</style>