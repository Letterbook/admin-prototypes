<script setup>
import time from '@/util/time'
import { useRoute, RouterLink } from 'vue-router'
import { watch, inject } from 'vue'

const store = inject('store')

const newNote = defineModel('newNote')

const route = useRoute()

let report, reporter, reportedPosts, reportedProfiles, 
  postAuthors, policies,
  relatedReports,
  entity,
  log

function loadReport(id) {
  report = store.report(id)
  if (report) {
    entity = `report:${id}`
    reporter = store.user(report.reporter)
    reportedPosts = []
    reportedProfiles = []
    postAuthors = {}
    policies = report.policies.map(id => store.policy(id))
    relatedReports = {}
    log = store.log(entity)

    for (const { type, id, ...target} of report.targets) {
      if (type == "post") {
        let post = store.post(id)
        reportedPosts.push(post)
        post.authorInfo = postAuthors[post.author] = store.user(post.author)
        relatedReports[post.id] = store.reportsFor('post', post.id, [report.id])
        relatedReports[post.author] = store.reportsFor('user', post.author, [report.id])
      } else if (type == "user") {
        reportedProfiles.push(store.user(id))
        relatedReports[id] = store.reportsForUser(id, [report.id])
      }
    }
    for (const profile of reportedProfiles) {
      delete postAuthors[profile.actor]
    }
  }
}

watch(
  () => route.params.id,
  loadReport,
  { immediate: true }
)

async function addNote(e) {
  e.preventDefault()
  await store.addNote(entity, newNote.value)
  newNote.value = ''
  log = store.log(entity)
}
</script>

<template>
  <main v-if="report" id="report" class="base-details-screen">
    <div class="report-info">
      <h1 class="info-full-width">
      Report by @{{ reporter.handle }} on {{ time.mediumDate(report.created) }}</h1>
      <div class="report-meta">
        <div class="report-author">
          <Item label="Reported by">
            {{ reporter.displayName }}
            (<RouterLink :to="`/users/${reporter.handle}`">@{{ reporter.handle }}</RouterLink>)
          </Item>
          <Item label="Joined">{{ time.since(reporter.created, store.now) }}</Item>
          <Item label="Last Active"> {{ time.since(reporter.lastActive, store.now) }}</Item>

          <Item label="Connections">
            Follows {{ Object.entries(reporter.following).length }},
            Followed By {{ reporter.followedBy.length }}
          </Item>
          <Item label="Posts">
            {{ store.userPosts(reporter.actor).length }} –
            {{ store.userPosts(reporter.actor, { after: 'P30D' }).length }} 30d
          </Item>
        </div>

        <div class="report-about">
          <Item label="Submitted">{{ time.since(report.created, store.now) }}</Item>
          <Item label="Policies">
            <a v-for="policy of policies" :href="`/policies/${policy.id}`">{{ policy.title }}</a>
          </Item>
          <Item label="Reason">{{ report.summary }}</Item>
        </div>
      </div> <!-- report-meta -->

      <div class="report-focii">

        <div class="report-posts">
          <h2>Reported Posts</h2>
          <div v-for="post of reportedPosts" class="reported-post">
            <div class="post-content">{{ post.content }}</div>
            <Item label="Posted">
              <RouterLink :to="`/posts/${post.id}`">{{ time.since(post.created, store.now) }}</RouterLink>
            </Item>
            <Item label="Author">
              <span v-if="post.authorInfo.isLocal"><a :href="`/users/${post.authorInfo.handle}`">@{{
                post.authorInfo.handle }}</a>
                <span class="badge">local</span>
              </span>
              <span v-else>
                <RouterLink :to="`/profiles/${post.authorInfo.actor}`">{{post.authorInfo.actor}}</RouterLink>
              </span>
            </Item>
            <Item v-if="relatedReports[post.id]?.length > 0" label="Related Reports">
              <RelatedReport v-for="report of relatedReports[post.id]" :report="report" />
            </Item>
          </div>
        </div>

        <div class="report-profiles">
          <h2 v-if="reportedProfiles.length > 0">Reported Profiles</h2>
          <ReportSubjectProfile v-for="profile of reportedProfiles" :profile="profile"
            :relatedReports="relatedReports[profile.actor]" />

          <h2 v-if="Object.entries(postAuthors).length > 0">Unreported Post Authors</h2>
          <ReportSubjectProfile v-for="profile of Object.values(postAuthors)" :profile="profile"
            :relatedReports="relatedReports[profile.actor]" />
        </div>

      </div> <!-- report-focii -->

    </div> <!-- report-info -->


    <ActivityLog :entity="entity" />
  </main>
  <main v-else>
    Report {{ $route.params.id }} not found.
  </main>
</template>
