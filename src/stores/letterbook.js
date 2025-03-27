import { Temporal } from 'temporal-polyfill'
import { reactive } from 'vue'

import rand from '@/util/rand'

// import data from '../../data/data.json'

function delay() {
	return new Promise(resolve => {
		setTimeout(
			() => { resolve () }, 
			Math.max(10, rand.normal(150, 100))
		)
	})
}

function setupData(data, now) {
	data.usersAtPeer = {}

	for (const user of Object.values(data.users)) {
		if (!data.usersAtPeer[user.instance]) {
			data.usersAtPeer[user.instance] = []
		}
		data.usersAtPeer[user.instance].push(user.actor)
		if (!user.followedBy) {
			user.followedBy = []
		}
		user.posts = []

		for (const { following, age } of user.following) {
			const other = data.users[following]
			if (!other.followedBy) { other.followedBy = [] }
			other.followedBy.push({
				actor: user.actor,
				age
			})
		}
	}

	for (const [id, post] of Object.entries(data.posts)) {
		data.users[post.author].posts.push(id)
	}


	for (const user of Object.values(data.users)) {
		user.lastActive = now.subtract({ seconds: user.lastActive })
		user.created = now.subtract({ seconds: user.age })
		user.isLocal = user.instance == data.thisInstance
	}
	for (const post of Object.values(data.posts)) {
		post.created = now.subtract({ seconds: post.age })
	}

	data.reportedSubjects = {}

	for (const report of Object.values(data.reports)) {
		report.created = now.subtract({ seconds: report.age })
		report.from = data.users[report.reporter]
		for (const target of report.targets) {
			const k = `${target.type}:${target.id}`
			if (!data.reportedSubjects[k]) {
				data.reportedSubjects[k] = []
			}
			data.reportedSubjects[k].push(report.id)
		}
	}
}

const start = Temporal.Now.instant()

export default reactive({
	loaded: false,
	start,

	now: start,
	thisInstance: '',
	data: {},
	log: {},

	async _initialize(pathPrefix) {
		const data = this.data = await fetch(`${pathPrefix}/src/assets/base.json`).then(r => r.json())
		this.thisInstance = data.thisInstance
		setupData(data, start)
		this.loaded = true
		console.log('data loaded', data)
	},

	startClock() {
		setInterval(() => {
			this.now = Temporal.Now.instant()
		}, 1000)
	},

	localUser(handle) {
		return this.data.users[`@${handle}@${this.thisInstance}`]
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

	reports() { 
		return Object.values(this.data.reports)
			.sort((a,b) => a.age - b.age)
	},
	report(id) { return this.data.reports[id] },

	reportsFor(type, id, exclude=[]) {
		return this.data.reportedSubjects[`${type}:${id}`]
			?.filter(id => !exclude.includes(id))
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
