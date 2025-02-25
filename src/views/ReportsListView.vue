<script setup>
import time from '@/util/time'
import { inject } from 'vue'
const store = inject('store')

  function truncate(s, count) {
    if (s.length <= count + 5) { return s}
    return s.slice(0, count)+`...`
  }


  function focus(report) {
    const posts = []
    const profiles = []
    for (const t of report.targets) {
      if (t.profile) { profiles.push(t) }
      if (t.post) { posts.push(t) }
    }
    const out = []
    if (posts.length > 0) { out.push(`${posts.length} posts`) }
    if (profiles.length > 1) { out.push(`${profiles.lenght} profiles`) }
    if (profiles.length == 1) { out.push(store.user(profiles[0].profile).handle) }
    return out.join(', ')
  }
</script>

<template>
<main>
  <table class="table">
    <thead>
      <tr class="main">
        <td class="nav"></td>
        <td class="time">Created</td>
        <td class="from">Reporter</td>
        <td class="focus">Focus</td>
        <td class="summary">Summary</td>
        <td class="moderators">Moderators</td>
        <td class="labels">Labels</td>
      </tr>
    </thead>
    <tbody>
    <tr v-for="report in store.reports()">
      <td class="nav"><a :href="`/reports/${report.id}`">→</a></td>
      <td class="age">
        {{ time.since(report.created, store.now) }}
      </td>
      <td class="from">
        {{ store.user(report.reporter).handle }}
      </td>
      <td class="focus">{{ focus(report) }}</td>
      <td class="summary">{{ report.summary }}</td>
      <td class="involved"></td>
      <td class="labels"></td>
    </tr>
    </tbody>
  </table>
</main>
</template>

<style>
</style>
