<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated class="modern-header">
      <q-toolbar class="q-px-md q-py-sm">
        <q-btn
          flat
          round
          icon="menu"
          aria-label="Menu"
          class="header-icon-btn"
          @click="toggleLeftDrawer"
        />

        <div class="header-title-group q-ml-sm">
          <div class="header-title">Lista de órdenes</div>
        </div>

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
          <q-avatar size="30px" color="primary" text-color="white" icon="person" />
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

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered :width="150" class="bg-grey-1">
      <q-list padding>
        <q-item-label header class="text-grey-8"> Menú </q-item-label>

        <q-item clickable v-ripple to="/orders" exact active-class="text-primary bg-blue-1">
          <q-item-section avatar>
            <q-icon name="assignment" />
          </q-item-section>
          <q-item-section>Órdenes</q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/serials" exact active-class="text-primary bg-blue-1">
          <q-item-section avatar>
            <q-icon name="qr_code_2" />
          </q-item-section>
          <q-item-section>Números de serie</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useSalesOrdersStore } from 'src/stores/SalesOrders';

const leftDrawerOpen = ref(false);
const salesOrdersStore = useSalesOrdersStore();
const { notificationCount } = storeToRefs(salesOrdersStore);

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}
</script>

<style scoped>
.modern-header {
  backdrop-filter: blur(8px);
  background: linear-gradient(120deg, rgba(255, 255, 255, 0.98), rgba(240, 247, 255, 0.95));
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
}

.header-title-group {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}

.header-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #0f172a;
}

.header-subtitle {
  font-size: 0.77rem;
  color: #64748b;
  letter-spacing: 0.02em;
}

.header-icon-btn {
  margin-left: 6px;
  color: #334155;
  background: rgba(148, 163, 184, 0.14);
}
</style>
