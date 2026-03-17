import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', redirect: '/orders' },
      { path: 'orders', component: () => import('pages/OrdersPage.vue') },
      { path: 'orders/new', component: () => import('pages/OrderNewPage.vue') },
      { path: 'serials', component: () => import('pages/SerialNumbersPage.vue') },
      { path: 'customers', component: () => import('pages/CustomersPage.vue') },
      { path: 'clients', redirect: '/customers' },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
