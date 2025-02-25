<script setup>
import { inject } from 'vue'
import time from '@/util/time'

const props = defineProps(['profile', 'relatedReports'])
const store = inject('store')
</script>

<template>
<div class="reported-profile">
	<Item label="Display Name">{{ profile.displayName }}</Item>
	<div v-if="profile.isLocal">
		<Item label="Handle">
			<a :href="`/users/${profile.actor}`">{{ profile.handle }}</a>
			<Badge>Local</Badge>
		</Item>
		<Item label="Joined">{{ time.since(profile.created, store.now) }}</Item>
		<Item label="Last Active">{{ time.since(profile.lastActive, store.now) }}</Item>
		<Item label="Connections">
            Follows {{ Object.entries(profile.following).length }},
            Followed By {{ profile.followedBy.length }}
		</Item>
		<Item label="Posts">
			{{ store.userPosts(profile.actor).length }} –
			{{ store.userPosts(profile.actor, { after: 'P30D' }).length}} 30d
		</Item>
	</div>
	<div v-else>
		<Item label="Handle">
			<a :href="`/profiles/${profile.actor}`">{{profile.handle}}</a>
		</Item>
		<Item label="Peer">
			<a :href="`/instances/${profile.instance}`">{{profile.instance}}</a>
		</Item>
		<Item label="First Seen"></Item>
		<Item label="Last Seen"></Item>
	</div>


	<Item
		v-if="relatedReports?.length > 0"
		label="Related Reports"
		>
		<RelatedReport 
            v-for="report of relatedReports" 
            :report="report" />
	</Item>
</div>
</template>