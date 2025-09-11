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
      path: '/ssq',
      name: 'ssq',
      component: Ssq,
      meta: {
        show: true,
      },
    },
    {
      path: '/ssq-h',
      name: 'ssq-h',
      meta: {
        show: true,
      },
      component: () => import('@/views/ssq-h/index.vue'),
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
      meta: {
        show: true,
      },
      component: () => import('@/views/dlt-single/index.vue'),
    },
    {
      path: '/test',
      name: 'test',
      meta: {
        show: true,
      },
      component: () => import('@/views/test/index.vue'),
    },
    {
      path: '/count-ssq',
      name: 'CountSsq',
      meta: {
        show: true,
      },
      component: () => import('@/views/count-ssq/index.vue'),
    },
    {
      path: '/count-dlt',
      name: 'CountDlt',
      meta: {
        show: true,
      },
      component: () => import('@/views/count-dlt/index.vue'),
    },
    {
      path: '/ssq-s',
      name: 'SsqSingle',
      meta: {
        show: true,
      },
      component: () => import('@/views/ssq-s/index.vue'),
    },
  ],
})

export default router
