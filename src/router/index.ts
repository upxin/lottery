import { createRouter, createWebHistory } from 'vue-router'
import Ssq from '@/views/ssq/index.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/ssq',
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
      meta: {
        show: true,
      },
    },
    {
      path: '/dlt',
      name: 'dlt',
      meta: {
        show: true,
      },
      component: () => import('@/views/dlt/index.vue'),
    },
    {
      path: '/dlt-single',
      name: 'DltSingle',
      component: () => import('@/views/dlt-single/index.vue'),
    },
    {
      path: '/test',
      name: 'test',
      component: () => import('@/views/test/index.vue'),
    },
    {
      path: '/count-ssq',
      name: 'CountSsq',
      component: () => import('@/views/count-ssq/index.vue'),
    },
    {
      path: '/count-dlt',
      name: 'CountDlt',
      component: () => import('@/views/count-dlt/index.vue'),
    },
  ],
})

export default router
