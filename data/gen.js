import { faker } from '@faker-js/faker'
import fs from 'fs/promises'

// const gaussRndo = () => {
// 	let u = 2*Math.random()-1
// 	let v = 2*Math.random()-1
// 	let r = u*u + v*v
// 	if (r == 0 || r >= 1) return gaussRnd()
// 	let c = u * Math.sqrt(-2*Math.log(r)/r)
// }

const coinToss = (bias=0.5) => Math.random() < bias

const posGauss = (cap) => {
	let u = Math.random()
	let v = Math.random()
	let r = u*u + v*v
	if (r == 0 || r >= 1) return posGauss()
	let c = u * Math.sqrt(-1*Math.log(r)/r) / 2
	if (cap && c > 1) return posGauss(cap)
	return c
}

const posGaussInt = (max) => Math.ceil(posGauss(true) * max)

const universe = {
	genTime: Math.floor(new Date()/1000),
 	peers: {},
 	users: {},
 	usersAtPeer: {},
 	posts: {},
 	reports: {},
 	reportedPosts: {},
 	reportedUsers: {},
}

const ageRnd = (maxAge, recency=1) => Math.round(Math.pow(Math.random(), recency) * maxAge)

const timeframe = 60 * 24 * 60 * 60

const randMember = (arr) => {
	const idx = Math.abs(Math.round(Math.random() * arr.length-1))
	return arr[idx]
}

const userProfiles = ['veryOnline', 'infrequent', 'lurker']

const makeUser = (peerDomain, fieldOverrides={}) => {
	const instance = universe.peers[peerDomain]
	let handle, actor
	let name = {}
	let { firstName, lastName } = fieldOverrides
	if (firstName) { name.firstName = firstName }
	else if (coinToss()) { name.firstName = faker.person.firstName() }
	if (lastName) { name.lastName = lastName }
	else if (coinToss()) { name.lastName = faker.person.lastName() }

	while (!universe.usersAtPeer[peerDomain].has(actor)) {
		handle = faker.internet.username(name)
	  actor = `@${handle}@${peerDomain}`
		universe.usersAtPeer[peerDomain].add(actor)
	}
	const age = Math.max(60, fieldOverrides.age ?
		ageRnd(fieldOverrides.age)
		: ageRnd(instance.age, instance.acctBias))
	const profile = randMember(userProfiles)
	const user = {
		handle, actor,
		displayName: faker.internet.displayName(name),
		bio: faker.person.bio(),
		age,
		instance: peerDomain,
		following: [],
		followedBy: new Set(),
		profile,
		posts: []
	}
	universe.users[user.actor] = user
	return user
}

const makePeerWithUsers = (domain) => {
	const userCount = posGaussInt(200)
	let age = Math.max(100, ageRnd(timeframe, (Math.random()/10)))
	if (domain == thisInstance) {
		age = Math.max(age, timeframe)
	}
	const acctBias = Math.random() * 2

	universe.peers[domain] = {
		domain, age, acctBias
	}
	universe.usersAtPeer[domain] = new Set()

	while (universe.usersAtPeer[domain].size <= userCount) {
		makeUser(domain)
	}
}

const thisInstance = universe.thisInstance = faker.internet.domainName()
const domains = new Set([thisInstance])
while (domains.size <= 30) {
	domains.add(faker.internet.domainName())
}
for (const domain of domains.values()) {
	makePeerWithUsers(domain)
}
const allUsers = Object.keys(universe.users)

function makeFollow(followingUser, followsUser) {
	const maxAge = Math.min(followingUser.age, followsUser.age)
	followingUser.following.push({
		following: followsUser.actor,
		age: ageRnd(maxAge),
	})
	try {followsUser.followedBy.add(followingUser.actor)}
	catch(e) {console.error(followsUser); throw e}
}

for (const actor of universe.usersAtPeer[thisInstance].values()) {
	const user = universe.users[actor]
	let [min, max] = {
		veryOnline: [50, 400],
		infrequent: [20, 200],
		lurker: [20, 200],
	}[user.profile]
	const followingCount = Math.floor(Math.random() * max) + min
	console.log(`${actor} following ${followingCount}`)
	while (Object.keys(user.following).length < followingCount) {
		const other = randMember(allUsers)
		if (other == actor) { continue }
		makeFollow(user, universe.users[other])
	}

	// we're only doing the graph users for this instance, and they might be followed by users on other instances
	[min, max] = {
		veryOnline: [50, 400],
		infrequent: [10, 200],
		lurker: [0, 20],
	}[user.profile]
	const followedByCount = Math.random() * max + min
	const following = user.following.map(({following}) => following)
	while (user.followedBy.size < followedByCount) {
		if (Math.random() < 0.5) {
			const other = randMember(following)
			if (!other) { continue }
			user.followedBy.add(other)
		} else {
			const other = randMember(allUsers)
			if (!other) { continue }
			if (other == actor) { continue }
			makeFollow(universe.users[other], user)
		}
	}
}

for (const actor of allUsers) {
	const user = universe.users[actor]
	if (user.following.length < 1 && user.followedBy.size < 1) {
		const inst = user.instance
		universe.usersAtPeer[inst].delete(actor)
		delete universe.users[actor]
	}
}

const oldestAccountAge = Math.max(
	...(Array.from(universe.usersAtPeer[thisInstance])
		.map(actor => universe.users[actor].age))
)

let now = oldestAccountAge

function makeId(idMap) {
	let id
	while (!id || idMap[id]) { id = faker.string.nanoid(10) }
	return id
}

function makePost(author, { age, content, mentions }={}) {
	const id = makeId(universe.posts)
	const post = {
		id, author,
		age: age || ageRnd(universe.users[author].age),
		content: content || faker.lorem.sentence(),
		mentions,
	}
	universe.posts[id] = post
	universe.users[author].posts.push(id)

	const user = universe.users[author]
	if (!user.lastActive || user.lastActive > post.age) {
		user.lastActive = Math.floor(Math.random() * post.age)
	}

	return post
}

while (now > 0) {
	const activeUsers = Object.values(universe.users).filter(u => u.age > now)
	let todayPosts = 0
	for (const user of activeUsers) {
		const postTodayChance = {
			veryOnline: 0.8, infrequent: 0.5, lurker: 0.05
		}[user.profile]
		if (Math.random() > postTodayChance) { continue }
		let maxPosts = {veryOnline: 10, infrequent: 5, lurker: 1 }[user.profile]
		const postCount = Math.round(Math.random() * maxPosts) + 1
		const posts = new Set()
		while (posts.size < postCount) {
			const post = makePost(user.actor, { age: Math.max(0, ageRnd(60*60*24)) })
			posts.add(post)
			todayPosts++
		}
	}
	console.log(`${todayPosts} posts ${Math.ceil(now/(60*60*24))} days ago`)
	now -= 60*60*24
}

for (const [_, user] of Object.entries(universe.users)) {
	const [lastPost] = user.posts.slice(-1)
	let lastActive = lastPost ? lastPost.age : user.age
	user.lastActive = Math.floor(Math.random() * lastActive)
}

let otherInstances = Object.keys(universe.peers).filter(p => p != thisInstance)
let genUsers = Object.keys(universe.users)
let ourUsers = [...universe.usersAtPeer[thisInstance]]

function randomFrom(from, exclude=[]) {
	let chosen
	while (!chosen || exclude.includes(chosen)) {
		chosen = from[Math.floor(Math.random() * from.length)]
	}
	return chosen
}

const policies = universe.policies = {
	spam: { id: 'spam', text: "thou shalt not spam", title: "Spam" }
}

function reportUser(user, id) {
	if (!universe.reportedUsers[user]) {
		universe.reportedUsers[user] = []
	}
	universe.reportedUsers[user].push(id)
}

function reportPost(post, id) {
	if (!universe.reportedPosts[post]) {
		universe.reportedPosts[post] = []
	}
	universe.reportedPosts[post].push(id)
}

function makeReport({ reporter, targets, summary, policies }) {
	const id = makeId(universe.reports)
	const report = { id, reporter, summary, targets: [] }
	report.policies = policies.map(p => p.id)
	for (const target of targets) {
		if (target.actor) {
			report.targets.push({ profile: target.actor })
			reportUser(target.actor, id)
		}
		if (target.author) {
			report.targets.push({ post: target.id })
			reportPost(target.id, id)
		}
	}
	report.age = ageRnd(Math.min(...targets.map(t => t.age)))
	universe.reports[id] = report
	return report
}

const spamComplaints = [
	"we don't like spam here!",
	"we've got a spam problem",
	"another spammer",
	"fry this spam please",
	"I'd rather have musubi",
]

// scenario 1: basic t&s violation, local offender
;(function() {
	let spammer = makeUser(thisInstance, { firstName: 'spammer', age: 60*60*48 })

	let post1 = makePost(spammer.actor, {
		content: 'click here for spam pills!',
	})

	let reporter1 = randomFrom(ourUsers)
	makeReport({
		reporter: reporter1,
		targets: [post1],
		summary: randMember(spamComplaints),
		policies: [policies.spam]
	})

	let post2 = makePost(spammer.actor, {
		content: 'spam spam spam buy my spam'
	})
	
	let reporter2 = randomFrom(ourUsers, [reporter1])
	makeReport({
		reporter: reporter2,
		targets: [post1, post2, spammer],
		summary: randMember(spamComplaints),
		policies: [policies.spam]
	})
})();

// scenario 2: basic t&s violation, remote offender
; (function() {
	let srcInstance = randMember(otherInstances)
	let spammer = makeUser(srcInstance, { firstName: 'spammer', age: 60*60*48 })
	const reporters = []
	for (let i = 0; i<3; i++) {
		let reporter = randomFrom(ourUsers, reporters)
		reporters.push(reporter)
		coinToss && makeFollow(spammer, universe.users[reporter])
		let post = makePost(spammer.actor, {
			content: `${reporter} hey buy my spam`,
			mentions: [reporter]
		})
		makeReport({
			reporter: reporter,
			targets: [post, coinToss(0.6) && spammer].filter(i=>i),
			summary: randMember(spamComplaints),
			policies: [coinToss(0.9) && policies.spam].filter(i=>i)
		})
	}
	for (let i = 0; i < 10; i++) {
		const user =  randomFrom(allUsers, reporters)
		reporters.push(user)
		makeFollow(spammer, universe.users[user])
	}
})()

console.log('writing main')
await fs.writeFile(
	'data/data.json', 
	JSON.stringify(
		universe,
		(_key, value) => (value instanceof Set ? [...value] : value), 
		2
	))

