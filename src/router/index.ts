import { createRouter, createWebHistory } from 'vue-router'
import Kl from '../views/kl8/index.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/kl8',
    },
    {
      path: '/kl8',
      name: 'kl8',
      component: Kl,
    },
    {
      path: '/ssq-b',
      name: 'ssq-b',
      component: () => import('@/views/ssq-b/index.vue'),
    },
    {
      path: '/ssq',
      name: 'ssq',
      component: () => import('@/views/ssq/index.vue'),
    },
  ],
})

export default router
