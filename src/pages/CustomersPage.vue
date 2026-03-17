<template>
  <q-page class="q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <h5 class="q-my-none">Clientes</h5>
      <div class="row q-gutter-sm">
        <q-btn color="primary" icon="add" label="Agregar" @click="openAddCustomerDialog" />
        <q-btn flat icon="refresh" label="Recargar" @click="loadCustomers" />
      </div>
    </div>

    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12 col-md-6">
        <q-input
          v-model="search"
          dense
          outlined
          debounce="250"
          placeholder="Buscar cliente"
        >
          <template #append>
            <q-icon name="search" />
          </template>
        </q-input>
      </div>
    </div>

    <q-table
      :rows="filteredCustomers"
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
          No hay clientes registrados.
        </div>
      </template>
    </q-table>

    <q-dialog v-model="addCustomerDialogOpen" persistent>
      <q-card style="min-width: 360px; width: 520px; max-width: 95vw">
        <q-card-section class="row items-center justify-between">
          <div class="text-h6">Agregar cliente</div>
          <q-btn flat round dense icon="close" @click="closeAddCustomerDialog" />
        </q-card-section>

        <q-separator />

        <q-card-section>
          <q-form ref="addCustomerFormRef" @submit.prevent="createCustomerManually">
            <q-input
              v-model="newCustomerName"
              outlined
              autofocus
              label="Nombre del cliente *"
              :rules="[(value) => !!value?.trim() || 'El nombre es requerido']"
            />
          </q-form>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat no-caps label="Cancelar" @click="closeAddCustomerDialog" />
          <q-btn
            color="primary"
            no-caps
            icon="save"
            label="Guardar"
            :loading="savingCustomer"
            @click="createCustomerManually"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import type { QForm, QTableColumn } from 'quasar';
import { useQuasar } from 'quasar';
import {
  findCustomerByName,
  getCustomers,
  getOrCreateCustomer,
  type CustomerRecord,
} from 'src/services/customersService';

const $q = useQuasar();
const loading = ref(false);
const customers = ref<CustomerRecord[]>([]);
const search = ref('');
const newCustomerName = ref('');
const savingCustomer = ref(false);
const addCustomerDialogOpen = ref(false);
const addCustomerFormRef = ref<QForm | null>(null);

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    const rawMessage = (error as { message?: unknown }).message;
    if (typeof rawMessage === 'string' && rawMessage.trim()) {
      return rawMessage.trim();
    }
  }

  return fallback;
}

const columns: QTableColumn<CustomerRecord>[] = [
  { name: 'name', label: 'Nombre', field: 'name', align: 'left', sortable: true },
  { name: 'createdAt', label: 'Fecha de alta', field: 'createdAt', align: 'left', sortable: true },
];

const filteredCustomers = computed(() => {
  const query = search.value.trim().toLowerCase();
  if (!query) {
    return customers.value;
  }

  return customers.value.filter((customer) => customer.name.toLowerCase().includes(query));
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

async function loadCustomers() {
  loading.value = true;
  try {
    customers.value = await getCustomers();
  } catch (error) {
    const message = getErrorMessage(error, 'No se pudieron cargar los clientes');
    $q.notify({
      type: 'negative',
      message,
    });
  } finally {
    loading.value = false;
  }
}

async function createCustomerManually() {
  const formRef = addCustomerFormRef.value;
  const isValid = formRef ? await formRef.validate() : true;
  if (!isValid) {
    return;
  }

  const customerName = newCustomerName.value.trim();
  if (!customerName) {
    return;
  }

  try {
    savingCustomer.value = true;
    const existingCustomer = await findCustomerByName(customerName);
    if (existingCustomer) {
      $q.notify({ type: 'warning', message: 'El cliente ya existe' });
      return;
    }

    const createdCustomer = await getOrCreateCustomer(customerName);
    customers.value.unshift(createdCustomer);
    newCustomerName.value = '';
    addCustomerDialogOpen.value = false;
    $q.notify({ type: 'positive', message: 'Cliente agregado' });
  } catch (error) {
    const message = getErrorMessage(error, 'No se pudo agregar el cliente en Supabase');
    $q.notify({ type: 'negative', message });
  } finally {
    savingCustomer.value = false;
  }
}

function openAddCustomerDialog() {
  newCustomerName.value = '';
  addCustomerDialogOpen.value = true;
}

function closeAddCustomerDialog() {
  addCustomerDialogOpen.value = false;
  newCustomerName.value = '';
}

onMounted(async () => {
  await loadCustomers();
});
</script>
