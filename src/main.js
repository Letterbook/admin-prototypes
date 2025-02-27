import './assets/main.css'

import { createApp } from 'vue'

import ActivityLog from '@/components/ActivityLog.vue'
import Badge from '@/components/Badge.vue'
import Item from '@/components/Item.vue'
import RelatedReport from '@/components/RelatedReport.vue'
import ReportSubjectProfile from '@/components/ReportSubjectProfile.vue'

import store from '@/stores/letterbook'

import App from './App.vue'
import router from './router'

const app = createApp(App)
app.provide('store', store)

app.component('ActivityLog', ActivityLog)
app.component('Badge', Badge)
app.component('Item', Item)
app.component('RelatedReport', RelatedReport)
app.component('ReportSubjectProfile', ReportSubjectProfile)

app.use(router)

app.mount('#app')
