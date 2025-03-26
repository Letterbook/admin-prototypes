import { faker } from '@faker-js/faker'
import fs from 'fs/promises'
import { parseArgs } from 'util'

function gaussian(mean=0, stddev=1) {
	const u = 1 - Math.random()
	const v = Math.random()
	const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0*Math.PI*v)
	return z * stddev + mean
}

function gaussInt({mean=0, sttdev=10, min, max }={}) {
	let r = gaussian(mean, sttdev)
	if (min) { r = Math.max(r, min) }
	if (max) { r = Math.min(r, max) }
	return Math.round(r)
}

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

const ageRnd = (maxAge, recency=1) => Math.round(Math.pow(Math.random(), recency) * maxAge)

const randMember = (arr, pred = (r)=>r) => {
	let result
	let count = 0
	while (!result || !pred(result) || count < 100) {
		const idx = Math.abs(Math.round(Math.random() * arr.length-1))
		result = arr[idx]
		count++
	}
	if (!result) {
		console.warn('could not satisfy predicate for rand member')
	}
	return result
}

function findUnique(fn, existing=[]) {
	let val = fn()
	return existing.includes(val) ? findUnique(fn, existing) : val
}


const baseDataFile = 'src/assets/base.json'
let universe, thisInstance
const indexes = {
	otherPeers: [],
	usersAtPeer: {},
	postsbyUser: {},
}
try {
	await fs.access(baseDataFile, fs.constants.R_OK) // better error message if missing
	universe = JSON.parse(await fs.readFile(baseDataFile))
	thisInstance = universe.thisInstance
} catch(e) {
	console.warn('could not read base data file', e)
}

const timeframe = 60 * 24 * 60 * 60

const userTypes = {
	veryOnline: {
		followedWeight: 20,
		follows: {mean: 200, stddev: 100, min: 20, max: 500},
		followsBack: 0.7,
		posting: {mean: 10, stddev: 5, min: 0, max: 100},
	},
	infrequent: {
		followedWeight: 10,
		follows: {mean: 80, stddev: 40, min: 5, max: 200},
		followsBack: 0.4,
		posting: {mean: 5, stddev: 3, min: 0, max: 10},
	},
	lurker: {
		followedWeight: 5,
		follows: {mean: 40, stddev: 20, min: 5, max: 200},
		followsBack: 0.2,
		posting: {mean: 2, stddev: 1, min: 0, max: 5},
	},
}

const makeUser = (peerDomain, fieldOverrides={}) => {
	const instance = universe.peers[peerDomain]
	let name = {}
	let { firstName, lastName } = fieldOverrides
	if (firstName) { name.firstName = firstName }
	else if (coinToss()) { name.firstName = faker.person.firstName() }
	if (lastName) { name.lastName = lastName }
	else if (coinToss()) { name.lastName = faker.person.lastName() }

	const actor = findUnique(
		() => `${faker.internet.username(name)}@${peerDomain}`,
		universe.peers[peerDomain].users
	)
	const [handle] = actor.split('@')

	const age = Math.max(60, fieldOverrides.age ?
		ageRnd(fieldOverrides.age)
		: ageRnd(instance.age, instance.acctBias))
	const user = {
		handle, actor,
		displayName: faker.person.fullName(name),
		bio: faker.person.bio(),
		age, lastActive: age,
		instance: peerDomain,
		following: [],
		userType: randMember(Object.keys(userTypes)),
	}
	universe.users[user.actor] = user
	indexes.usersAtPeer[peerDomain].push(user.actor)
	indexes.postsbyUser[user.actor] = []
	return user
}

function makeFollow(followingUser, followsUser) {
	if (!followingUser.age) { throw "emptoy followingUser" }
	if (!followsUser.age) { throw "empty followsUser"}
	const maxAge = Math.min(followingUser.age, followsUser.age)
	followingUser.following.push({
		following: followsUser.actor,
		age: ageRnd(maxAge),
	})
}



function makeFollowings(user, { scale=1 } = {}) {
	const type = userTypes[user.userType]
	const followingCount = gaussInt(type.following) * scale
	let exclude = [user.actor, ...user.following.map(f => f.following)]
	while (user.following.length < followingCount) {
		let cumulativeActors = []
		let cumulativeWeights = []
		let cumulativeWeight = 0
		for (const u of Object.values(universe.users).filter(a => !exclude.includes(a.actor))) {
			cumulativeActors.push(u.actor)
			cumulativeWeight += userTypes[u.userType].followedWeight
			cumulativeWeights.push(cumulativeWeight)
		}
		const pos = Math.round(Math.random() * cumulativeWeight)
		const idx = cumulativeWeights.filter(n => n <= pos).length
		let other = universe.users[cumulativeActors[idx]]
		if (!other) { continue } // not sure what's going on here but
		exclude.push(other.actor)
		makeFollow(user, other)
		if (coinToss(userTypes[other.userType].folowsBack)) {
			makeFollow(other, user)
		}
	}
}

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
	indexes.postsbyUser[author].push(id)
	return post
}

function makePeer(opts={}) {
	const domain = opts.domain || findUnique(
			() => faker.internet.domainName(),
			Object.keys(universe.peers))
	const age = opts.age || Math.max(100, ageRnd(timeframe))
	const peer = {
		domain, age,
		acctAgeBias: Math.random() * 2,
	}
	console.log(`+ peer: ${domain} {age: ${Math.floor(age/(60*60*24))}d}`)
  universe.peers[domain] = peer
  indexes.usersAtPeer[domain] = []
  if (domain != thisInstance) { indexes.otherPeers.push(domain) }
  return peer
}

function makePeers(count) {
	for (let i = 0; i<count; i++) {
		makePeer()
	}
}

function makePeerUsers(domain, opts={}) {
	if (!universe.peers[domain]) { makePeer({ domain })}
	let userCount = opts.users || posGaussInt(opts.userMax || 200)
	for (let i =0; i<userCount; i++) {
		makeUser(domain)
	}
}

async function saveUniverse() {
	console.log(`writing base, peers: ${Object.values(universe.peers).length}, users: ${Object.values(universe.users).length}, posts: ${Object.values(universe.posts).length}`)
	await fs.writeFile(
		'src/assets/base.json',
		JSON.stringify(universe, null, 2)
	)
}

async function makeNewUniverse() {
	console.log('+ making new universe')
	thisInstance = faker.internet.domainName()
	universe = {
		genTime: Math.floor(new Date()/1000),
		thisInstance,
	 	peers: {},
	 	users: {},
	 	posts: {},
	 	reports: {},

	}
	makePeer({ domain: thisInstance, age: timeframe })
	makePeers(30)

	console.log('  - making users')
	for (const domain of Object.keys(universe.peers)) {
		makePeerUsers(domain, {
			users: domain == thisInstance && 150
		})
	}

	console.log('  - making followings')
	for (const user of Object.values(universe.users)) {
		makeFollowings(user, {})
	}

	console.log('  - making posts')
	for (const user of Object.values(universe.users)) {
		let now = Math.ceil(user.age / 86400) * 86400
		let posting = userTypes[user.userType].posting
		while (now > 0) {
			const today = gaussInt(posting)
			for (let i = 0; i<=today; i++) {
				const post = makePost(user.actor, {
					age: Math.max(user.age, ageRnd(86400) + now)
				})
				user.lastActive = Math.min(post.age, user.lastActive)
			}
			now -= 86400
		}
		user.lastActive = ageRnd(user.lastActive)
	}

}


// let otherInstances = Object.keys(universe.peers).filter(p => p != thisInstance)
// let genUsers = Object.keys(universe.users)
// let ourUsers = [...universe.peers[thisInstance].users]

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

function makeReport({ reporter, targets, summary, policies }) {
	const id = makeId(universe.reports)
	const report = { id, reporter, summary, targets: [] }
	report.policies = policies.map(p => p.id)
	for (const target of targets) {
		if (target.actor) {
			report.targets.push({ type: 'user', id: target.actor })
		} else if (target.author) {
			report.targets.push({ type: 'post', id: target.id })
		} else {
			console.error('unknown report target', target)
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

function ourUsers() {
	return indexes.usersAtPeer[thisInstance]
}

let scenario = ""
function isLocalUser(u) { return u.instance == thisInstance }
// 
// scenario 1: basic t&s violation, local offender
async function genScenario1() {
	console.log('+ making scenario 1')
	scenario="1.1"
	console.log('  - making spammer')
	let spammer = makeUser(thisInstance, { 
		age: 60*60*48 })
	console.log('  - making post')
	
	let post1 = makePost(spammer.actor, {
		content: 'click here for spam pills!',
	})

	console.log(`  - making report1: finding reporter among ${ourUsers().length} users`)
	let reporter1 = randomFrom(ourUsers())
	console.log('  - making report1: making report')

	makeReport({
		reporter: reporter1,
		targets: [post1],
		summary: randMember(spamComplaints),
		policies: [policies.spam]
	})

	let post2 = makePost(spammer.actor, {
		content: 'spam spam spam buy my spam'
	})
	
	console.log('  - making report 2')
	let reporter2 = randomFrom(ourUsers(), [reporter1])
	makeReport({
		reporter: reporter2,
		targets: [post1, post2, spammer],
		summary: randMember(spamComplaints),
		policies: [policies.spam]
	})
}

// scenario 1.2: basic t&s violation, remote offender
async function genScenario1_2() {
	console.log('making scenario 1.2')
	scenario="1.2"
	let srcInstance = randMember(indexes.otherPeers)
	let spammer = makeUser(srcInstance, { 
		age: 60*60*48 })
	const reporters = []

	for (let i = 0; i<3; i++) {
		let reporter = randomFrom(ourUsers(), reporters)
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
		const user =  randomFrom(ourUsers(), reporters)
		reporters.push(user)
		makeFollow(spammer, universe.users[user])
	}
}



// scenario 2: a local user is being brigaded (local abusers)
async function genScenario2() {
	console.log('making scenario 2')
	scenario = "2"
	let targetActor = randMember(ourUsers(), u => indexes.postsbyUser[u].length > 10)
	let target = universe.users[targetActor]

	for (let i = 0; i<posGauss(100)+10; i++) {
		let reporter = makeUser(thisInstance, {
			age: 60*60*48,
		})
		for (let i = 0; i < Math.random()*10; i++) {
			makeFollow(reporter, universe.users[randomFrom(Object.keys(universe.users))])
		}
		for (let i = 0; i < Math.random()*10; i++) {
			makePost(reporter.actor, {
				content: faker.company.buzzPhrase(),
			})
		}

		let reportFocii = []
		while (reportFocii.length < Math.floor(Math.random()*10)) {
			const tgtPostLen = indexes.postsbyUser[targetActor].length
			const idx = tgtPostLen - posGaussInt(tgtPostLen)
			const postId = indexes.postsbyUser[targetActor][idx]
			reportFocii.push(universe.posts[postId])
		}
		if (reportFocii.length < 1 || coinToss()) {
			reportFocii.push(target)
		}

		makeReport({
			reporter: reporter.actor,
			summary: randMember(spamComplaints),
			policies: [coinToss(0.9) && policies.spam].filter(i=>i),
			targets: reportFocii.filter(i => i)
		})
	}
};

// // scenario: a local user has a crusade against content
// ; (function() {
// 	let involved = []
// 	let reporter = randMember(ourUsers)
// 	let targets = []
// 	involved.push(reporter)
// 	while (involved.length < 20) {
// 		let target = randMember(allUsers, involved)
// 		targets.push(target)
// 		involved.push(target)
// 	}

// })

// console.log('writing main')
// await fs.writeFile(
// 	'src/assets/base.json', 
// 	JSON.stringify(
// 		universe,
// 		(_key, value) => (value instanceof Set ? [...value] : value), 
// 		2
// 	))



// comment/uncomnent here to manage operations performed

// creates an entirely new baseline set of instances/users/followings/posts
// you probably don't want to do this
await makeNewUniverse()

// scenario 1: basic t&s violation, local user
await genScenario1()
await genScenario1_2()
// scenario 2: a local user is being brigaded
await genScenario2()

universe.policies = policies

// but keep this one
await saveUniverse()
