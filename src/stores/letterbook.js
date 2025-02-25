import { Temporal } from 'temporal-polyfill'
import { reactive } from 'vue'

import rand from '@/util/rand'

import data from '../../data/data.json'

function delay() {
	return new Promise(resolve => {
		setTimeout(
			() => { resolve () }, 
			Math.max(10, rand.normal(150, 100))
		)
	})
}

const now = Temporal.Now.instant()

for (const user of Object.values(data.users)) {
	user.lastActive = now.subtract({ seconds: user.lastActive })
	user.created = now.subtract({ seconds: user.age })
	user.isLocal = user.instance == data.thisInstance
}
for (const post of Object.values(data.posts)) {
	post.created = now.subtract({ seconds: post.age })
}

for (const report of Object.values(data.reports)) {
	report.created = now.subtract({ seconds: report.age })
	report.from = data.users[report.reporter]
}

export default reactive({
	loaded: true,
	data,
	start: now,
	now,
	thisInstance: data.thisInstance,

	log: {},

	startClock() {
		setInterval(() => {
			this.now = Temporal.Now.instant()
		}, 1000)
	},

	localUsers() {
		return this.data.usersAtPeer[this.thisInstance]
			.map(actor => this.data.users[actor])
	},

	user(actor) { return this.data.users[actor] },
	userPosts(actor, { after } = {}) {
		let posts = (this.data.users[actor]?.posts || []).map(id => this.data.posts[id])
		if (after) { 
			const since = Temporal.Duration.from(after).total('seconds')
			posts = posts.filter(p => p.age < since) 
		}
		return posts
	},

	instances() {
		return Object.values(this.data.peers).map(inst => {
			let users = data.usersAtPeer[inst.domain].map(actor => data.users[actor])
			return { 
				...inst,
				users,
				posts: users.flatMap(u => u.posts.map(id => data.posts[id]))
			}
		})
	},

	policy(id) { return this.data.policies[id] },

	post(id) { return this.data.posts[id] },

	reports() { return this.data.reports },
	report(id) { return this.data.reports[id] },

	reportsForPost(postId, excludesReports = []) {
		return this.data.reportedPosts[postId]
			?.filter(id => !excludesReports.includes(id))
			.map(id => this.data.reports[id]) || []
	},
	reportsForUser(userId, excludesReports = []) {
		return this.data.reportedUsers[userId]
			?.filter(id => !excludesReports.includes(id))
			.map(id => this.data.reports[id]) || []
	},

	async addNote(id, text) {
		this.addingNote = true
		await delay()
		if (!this.log[id]) { this.log[id] = [] }
		this.log[id].push({
			type: 'note',
			created: Temporal.Now.instant(),
			text,
			author: 'moddy'
		})
		this.addingNote = null
	},

	log(id) {
		return this.log[id] || []
	}
})
