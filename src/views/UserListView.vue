<script setup>
  import time from '@/util/time.js'
import { inject } from 'vue'
const store = inject('store')
</script>

<template>
  <main v-if="store.loaded">
    <table class="table">
      <thead>
        <tr class="super">
          <td colspan="2"></td>
          <td colspan="2" class="group-start">When</td>
          <td colspan="2" class="group-start">Connections</td>
          <td colspan="3" class="posts group-start">Posts</td>
        </tr>
        <tr class="main">
          <td class="user">Handle</td>
          <td class="user">Display Name</td>

          <td class="tenure group-start">Created</td>
          <td class="tenure">Active</td>

          <td class="following group-start">Follows</td>
          <td class="followers">Fol By</td>

          <td class="posts group-start">Ever</td>
          <td class="posts">30d</td>
          <td class="posts">7d</td>
        </tr>
      </thead>
      <tbody>
      <tr v-for="user in store.localUsers()">
        <td class="user">
          <div class="handle">
            <a href="">{{ user.handle }}</a>
          </div>
        </td>
        <td class="user">
          <div class="displayName">{{ user.displayName }}</div>
        </td>
        <td class="tenure group-start">
          {{ time.since(user.created, store.now) }}
        </td>
        <td class="tenure">
          {{ time.since(user.lastActive, store.now)}}
        </td>
        <td class="following group-start">{{ Object.keys(user.following).length }}</td>
        <td class="followers">{{ user.followedBy.length }}</td>
        <td class="posts group-start">
          {{ store.userPosts(user.actor).length }}
        </td>
        <td class="posts">
          {{ store.userPosts(user.actor, {after: 'P30D'}).length }}
        </td>
        <td class="posts">
          {{ store.userPosts(user.actor, {after: 'P7D'}).length }}
        </td>
      </tr>
      </tbody>
    </table>
  </main>
  <main v-else>
    Loading...
  </main>
</template>

<style>


tbody .tenure .period {
  display: flex;
  justify-content: space-between;
  column-gap: 0.25rem;
}

.handle {
  font-weight: bold;
}
.tenure, .following, .followers, .posts {
  font-variant-numeric: lining-nums;
  text-align: right;
  vertical-align: top;
}
.group-start {
  border-left: 1px solid var(--bg-i);
}
</style>
