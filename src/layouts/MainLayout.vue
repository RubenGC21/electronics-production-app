<template>
  <q-layout view="lHh Lpr lFf">
    <q-header class="modern-header" @click="collapseDrawerOutside">
      <q-toolbar class="app-toolbar q-px-sm q-py-xs">
        <div class="toolbar-tab-title">{{ currentSectionTitle }}</div>
        <q-space />

        <q-btn
          flat
          round
          dense
          icon="notifications"
          aria-label="Notificaciones"
          class="header-icon-btn"
        >
          <q-badge v-if="notificationCount > 0" color="negative" rounded floating>
            {{ notificationCount }}
          </q-badge>
        </q-btn>

        <q-btn flat round dense aria-label="Perfil de usuario" class="header-icon-btn">
          <q-avatar size="34px" class="header-avatar" text-color="primary" icon="person" />
          <q-menu>
            <q-list style="min-width: 200px" class="q-pa-xs">
              <q-item clickable v-close-popup>
                <q-item-section>Ver perfil</q-item-section>
              </q-item>
              <q-item clickable v-close-popup>
                <q-item-section>Configuración</q-item-section>
              </q-item>
              <q-separator />
              <q-item clickable v-close-popup>
                <q-item-section>Cerrar sesión</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      mini-to-overlay
      :mini="isDrawerMini"
      :width="280"
      :mini-width="86"
      class="app-drawer"
    >
      <div class="drawer-shell">
        <div class="drawer-brand" :class="{ 'drawer-brand--mini': isDrawerMini }">
          <div v-if="!isDrawerMini" class="drawer-brand__copy">
            <div class="drawer-brand__title">Electronics Flow</div>
            <div class="drawer-brand__subtitle">Panel operativo</div>
          </div>
          <q-btn
            flat
            round
            dense
            icon="menu"
            aria-label="Ocultar o expandir menú lateral"
            class="drawer-toggle-btn"
            @click="toggleLeftDrawer"
          />
        </div>

        <div v-if="!isDrawerMini" class="drawer-section-label">Navegación</div>

        <q-list class="drawer-nav-list">
          <q-item
            v-for="item in navItems"
            :key="item.to"
            clickable
            v-ripple
            :to="item.to"
            exact
            class="drawer-nav-item"
            active-class="drawer-nav-item--active"
          >
            <q-item-section avatar class="drawer-nav-item__icon">
              <q-icon :name="item.icon" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ item.label }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </div>
    </q-drawer>

    <q-page-container class="app-page-container" @click="collapseDrawerOutside">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import { useSalesOrdersStore } from 'src/stores/SalesOrders';

const leftDrawerOpen = ref(true);
const isDrawerMini = ref(false);
const route = useRoute();
const salesOrdersStore = useSalesOrdersStore();
const { notificationCount } = storeToRefs(salesOrdersStore);
const navItems = [
  { label: 'Órdenes', to: '/orders', icon: 'assignment' },
  { label: 'Números de serie', to: '/serials', icon: 'qr_code_2' },
  { label: 'Clientes', to: '/customers', icon: 'groups' },
];

const currentSectionTitle = computed(() => {
  if (route.path === '/orders/new') {
    return 'Nueva orden';
  }

  if (route.path.startsWith('/serials')) {
    return 'Números de serie';
  }

  if (route.path.startsWith('/customers')) {
    return 'Clientes';
  }

  return 'Órdenes';
});

function toggleLeftDrawer() {
  isDrawerMini.value = !isDrawerMini.value;
  leftDrawerOpen.value = true;
}

function collapseDrawerOutside() {
  if (isDrawerMini.value) {
    return;
  }

  isDrawerMini.value = true;
}
</script>

<style scoped>
.app-drawer {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(246, 249, 252, 0.98)),
    #fff;
  border-right: 1px solid rgba(148, 163, 184, 0.18);
}

.drawer-shell {
  display: flex;
  min-height: 100%;
  flex-direction: column;
  padding: 20px 16px;
}

.drawer-brand {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 28px;
}

.drawer-brand--mini {
  flex-direction: column;
  justify-content: center;
  gap: 10px;
}

.drawer-brand__copy {
  flex: 1;
}

.drawer-brand__title {
  font-size: 1.45rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: #111827;
}

.drawer-brand__subtitle {
  margin-top: 4px;
  font-size: 0.9rem;
  color: #64748b;
}

.drawer-toggle-btn {
  color: #475569;
  background: #eef3f8;
}

.drawer-section-label {
  margin-bottom: 12px;
  padding: 0 10px;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #94a3b8;
}

.drawer-nav-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.drawer-nav-item {
  min-height: 56px;
  border-radius: 18px;
  padding: 4px 8px;
  color: #1f2937;
  font-size: 1.05rem;
  font-weight: 600;
  transition:
    background-color 0.18s ease,
    color 0.18s ease,
    transform 0.18s ease;
}

.drawer-nav-item:hover {
  background: rgba(226, 236, 248, 0.72);
}

.drawer-nav-item--active {
  color: #0f172a;
  background: #dfeaf7;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72);
}

.drawer-nav-item__icon {
  min-width: 44px;
  color: #0f62c9;
}

.app-page-container {
  background:
    radial-gradient(circle at top left, rgba(226, 237, 255, 0.42), transparent 34%),
    linear-gradient(180deg, #f8fafc 0%, #f3f6fb 100%);
}

.modern-header {
  backdrop-filter: blur(10px);
  background: rgba(248, 250, 252, 0.72);
  border-bottom: 1px solid rgba(226, 232, 240, 0.95);
}

.app-toolbar {
  min-height: 44px;
}

.toolbar-tab-title {
  font-size: 0.98rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #0f172a;
}

.header-icon-btn {
  margin-left: 6px;
  color: #475569;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(226, 232, 240, 0.95);
  box-shadow: 0 6px 16px rgba(148, 163, 184, 0.1);
}

.header-avatar {
  width: 28px;
  height: 28px;
  background: linear-gradient(180deg, #eff6ff 0%, #dbeafe 100%);
}

@media (max-width: 1023px) {
  .app-toolbar {
    min-height: 40px;
  }

  .toolbar-tab-title {
    font-size: 0.92rem;
  }
}

@media (max-width: 599px) {
  .drawer-shell {
    padding: 14px 12px;
  }

  .drawer-brand__title {
    font-size: 1.2rem;
  }

  .app-toolbar {
    min-height: 38px;
  }

  .toolbar-tab-title {
    font-size: 0.88rem;
  }
}
</style>
