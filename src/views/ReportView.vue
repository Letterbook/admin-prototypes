<script setup>
import time from '@/util/time'
import { useRoute } from 'vue-router'
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

    for (const target of report.targets) {
      if (target.post) {
        let post = store.post(target.post)
        reportedPosts.push(post)
        post.authorInfo = postAuthors[post.author] = store.user(post.author)
        relatedReports[post.id] = store.reportsForPost(post.id, [report.id])
        relatedReports[post.author] = store.reportsForUser(post.author, [report.id])
      } else if (target.profile) {
        reportedProfiles.push(store.user(target.profile))
        relatedReports[target.profile] = store.reportsForUser(target.profile, [report.id])
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
  <main v-if="report" id="report">
    <div class="report-info">
      <h1>Report by @{{ reporter.handle }} on {{ time.mediumDate(report.created) }}</h1>
      <div class="report-meta">
        <div class="report-author">
          <Item label="Reported by">
            {{ reporter.displayName }}
            (<a :href="`/users/${reporter.handle}`">@{{ reporter.handle }}</a>)
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
              <a :href="`/posts/${post.id}`">{{ time.since(post.created, store.now) }}</a>
            </Item>
            <Item label="Author">
              <span v-if="post.authorInfo.isLocal"><a :href="`/users/${post.authorInfo.handle}`">@{{
                post.authorInfo.handle }}</a>
                <span class="badge">local</span>
              </span>
              <span v-else>
                <a :href="`/profiles/${post.authorInfo.actor}`">{{post.authorInfo.actor}}</a>
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

    <div class="report-activity">
      <h2>Activity Log</h2>
      <template v-if="log.length > 0">
        <template v-for="item of log">
          <div v-if="item.type == 'note'" class="log-item note">
            <div class="note-content">{{ item.text }}</div>
            - @{{item.author}}, {{ time.since(item.created, store.now) }}
          </div>
        </template>
      </template>
      <div v-else class="dim">
        no activity yet.
      </div>

      <form class="add-note" @submit="addNote">
        <textarea v-model="newNote" :disabled="store.addingNote" />
        <div>
          <button class="button" type="submit" :disabled="store.addingNote">Add Note</button>
          <span v-if="store.addingNote">Saving...</span>
        </div>
      </form>
    </div>
  </main>
  <main v-else>
    Report {{ $route.params.id }} not found.
  </main>
</template>
