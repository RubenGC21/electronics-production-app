<template>
  <q-page class="q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <h5 class="q-my-none">Números de serie</h5>
      <q-btn flat icon="refresh" label="Recargar" @click="loadSerials" />
    </div>

    <div class="row q-mb-md">
      <div class="col-12 col-md-5">
        <q-input
          v-model="serialSearch"
          dense
          outlined
          debounce="250"
          placeholder="Buscar número de serie"
        >
          <template #append>
            <q-icon name="search" />
          </template>
        </q-input>
      </div>
    </div>

    <q-table
      :rows="filteredSerialNumbers"
      :columns="columns"
      row-key="id"
      flat
      bordered
      :loading="loading"
      :pagination="{ rowsPerPage: 15 }"
    >
      <template #body-cell-createdAt="props">
        <q-td :props="props">
          {{ formatDateTime(props.row.createdAt) }}
        </q-td>
      </template>

      <template #no-data>
        <div class="full-width row flex-center q-pa-md text-grey-7">
          No hay números de serie registrados.
        </div>
      </template>
    </q-table>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import type { QTableColumn } from 'quasar';
import { useQuasar } from 'quasar';
import { getOrders } from 'src/services/ordersService';
import {
  getSerialNumbers,
  type SerialNumberRecord,
} from 'src/services/serialNumbersService';

interface SerialNumberTableRow extends SerialNumberRecord {
  orderNumber: string;
}

const $q = useQuasar();
const loading = ref(false);
const serialNumbers = ref<SerialNumberTableRow[]>([]);
const serialSearch = ref('');

const columns: QTableColumn<SerialNumberTableRow>[] = [
  { name: 'serialNumber', label: 'Número de serie', field: 'serialNumber', align: 'left', sortable: true },
  { name: 'orderNumber', label: 'Número de orden', field: 'orderNumber', align: 'left', sortable: true },
  { name: 'createdAt', label: 'Fecha', field: 'createdAt', align: 'left', sortable: true },
];

const filteredSerialNumbers = computed(() => {
  const query = serialSearch.value.trim().toLowerCase();
  if (!query) {
    return serialNumbers.value;
  }

  return serialNumbers.value.filter((item) => item.serialNumber.toLowerCase().includes(query));
});

function formatDateTime(value?: string) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('es-MX');
}

async function loadSerials() {
  loading.value = true;

  try {
    const [serials, orders] = await Promise.all([getSerialNumbers(), getOrders()]);
    const orderNumberById = new Map(orders.map((order) => [order.id, order.orderNumber]));

    serialNumbers.value = serials.map((serial) => ({
      ...serial,
      orderNumber: orderNumberById.get(serial.workOrderId) ?? `ID-${serial.workOrderId}`,
    }));
  } catch {
    $q.notify({
      type: 'negative',
      message: 'No se pudieron cargar los números de serie',
    });
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await loadSerials();
});
</script>
