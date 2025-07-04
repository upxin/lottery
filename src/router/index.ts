import { createRouter, createWebHistory } from 'vue-router'
import Kl from '../views/kl8/index.vue'
import Ssq from '@/views/ssq/index.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/kl8',
      name: 'kl8',
      component: Kl,
    },
    {
      path: '/ssq-h',
      name: 'ssq-h',
      component: () => import('@/views/ssq-h/index.vue'),
    },
    {
      path: '/ssq',
      name: 'ssq',
      component: Ssq,
    },
    {
      path: '/dlt',
      name: 'dlt',
      component: () => import('@/views/dlt/index.vue'),
    },
  ],
})

export default router
