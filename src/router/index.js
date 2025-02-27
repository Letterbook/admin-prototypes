import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [{
      path: '/',
      name: 'home',
      component: HomeView,
    }, {
      path: '/users',
      name: 'users',
      component: () => import('../views/UserListView.vue'),
    }, {
      path: '/users/:handle',
      name: 'user detail',
      component: () => import('../views/UserDetailView.vue'),
    }, {
      path: '/instances',
      name: 'instances',
      component: () => import('../views/InstanceListView.vue'),
    }, {
      path: '/reports',
      name: 'reports',
      component: () => import('../views/ReportsListView.vue')
    }, {
      path: '/reports/:id',
      name: 'report',
      component: () => import('../views/ReportView.vue')
    }],
})

export default router
