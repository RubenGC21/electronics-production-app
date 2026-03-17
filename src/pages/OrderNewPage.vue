<template>
  <q-page class="order-new-page">
    <div class="order-new-page__background">
      <OrdersPage />
    </div>

    <div class="order-new-page__overlay q-pa-md">
      <q-card flat class="order-new-page__form order-form-card">
        <q-card-section class="order-form-card__header row items-center justify-between">
          <div class="row items-center no-wrap q-gutter-sm">
            <q-avatar color="primary" text-color="white" icon="assignment_add" />
            <div>
              <div class="text-h6 text-weight-bold">Nueva orden</div>
              <div class="text-caption text-grey-7">
                Captura la información para registrar la orden
              </div>
            </div>
          </div>
          <q-btn flat color="primary" icon="close" round @click="goBack" />
        </q-card-section>

        <q-separator />

        <q-card-section class="order-form-card__body">
          <q-form ref="orderFormRef" class="q-gutter-lg" @submit.prevent="onSubmit">
            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-6">
                <q-input
                  v-model="form.orderNumber"
                  label="Número de orden *"
                  outlined
                  :rules="orderNumberRules"
                />
              </div>

              <div class="col-12 col-md-6">
                <q-select
                  v-model="form.customerName"
                  label="Cliente *"
                  outlined
                  use-input
                  fill-input
                  hide-selected
                  input-debounce="0"
                  :options="filteredCustomerOptions"
                  :rules="[(value) => !!value?.trim() || 'El cliente es requerido']"
                  @filter="onCustomerFilter"
                  @new-value="onCustomerNewValue"
                  @input-value="onCustomerInputValue"
                >
                  <template #no-option>
                    <q-item>
                      <q-item-section class="text-grey-7">
                        No hay coincidencias para "{{ customerInputText.trim() }}"
                      </q-item-section>
                    </q-item>
                    <q-item
                      v-if="customerInputText.trim()"
                      clickable
                      v-close-popup
                      @click="addNewCustomerFromInput"
                    >
                      <q-item-section avatar>
                        <q-icon name="person_add" color="primary" />
                      </q-item-section>
                      <q-item-section class="text-primary">
                        Agregar nuevo cliente
                      </q-item-section>
                    </q-item>
                  </template>
                </q-select>
              </div>

              <div class="col-12 col-md-6">
                <q-select
                  v-model="form.destination"
                  label="Destino *"
                  outlined
                  emit-value
                  map-options
                  :options="destinationOptions"
                  :rules="[(value) => !!value || 'El destino es requerido']"
                >
                  <template #selected-item="scope">
                    <div class="row items-center no-wrap q-gutter-xs">
                      <q-icon :name="scope.opt.icon" size="18px" />
                      <span>{{ scope.opt.label }}</span>
                    </div>
                  </template>

                  <template #option="scope">
                    <q-item v-bind="scope.itemProps">
                      <q-item-section avatar>
                        <q-icon :name="scope.opt.icon" />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label>{{ scope.opt.label }}</q-item-label>
                      </q-item-section>
                    </q-item>
                  </template>
                </q-select>
              </div>

              <div class="col-12 col-md-6">
                <q-input
                  v-model="form.dueDate"
                  label="Fecha compromiso *"
                  type="date"
                  outlined
                  :rules="[(value) => !!value || 'La fecha compromiso es requerida']"
                />
              </div>
            </div>

            <div class="status-block">
              <div class="text-subtitle2 q-mb-sm">Estatus *</div>
              <q-btn-toggle
                v-model="form.status"
                spread
                no-caps
                unelevated
                toggle-color="primary"
                color="grey-3"
                text-color="dark"
                :options="statusOptions"
                :rules="[(value: OrderStatus | null) => !!value || 'El estatus es requerido']"
              />
            </div>

            <q-input
              v-model="form.comments"
              label="Comentarios"
              outlined
              type="textarea"
              autogrow
            />

            <q-file
              v-model="form.attachment"
              label="Adjuntar archivo PDF"
              outlined
              clearable
              use-chips
              accept=".pdf,application/pdf"
              max-files="1"
              :rules="pdfRules"
              hint="Solo se permiten archivos PDF."
            >
              <template #prepend>
                <q-icon name="attach_file" />
              </template>
            </q-file>

            <div class="row justify-end q-gutter-sm q-pt-sm">
              <q-btn flat no-caps label="Cancelar" @click="goBack" />
              <q-btn
                color="primary"
                unelevated
                no-caps
                icon="save"
                label="Guardar orden"
                type="submit"
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import type { QForm } from 'quasar';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import OrdersPage from 'src/pages/OrdersPage.vue';
import { uploadOrderAttachment } from 'src/services/attachmentsService';
import { getCustomers, getOrCreateCustomer } from 'src/services/customersService';
import { createOrder, getOrders, type OrderStatus } from 'src/services/ordersService';
import { useSalesOrdersStore } from 'src/stores/SalesOrders';

const $q = useQuasar();
const router = useRouter();
const salesOrdersStore = useSalesOrdersStore();

const orderFormRef = ref<QForm | null>(null);
const existingOrderNumbers = ref<string[]>([]);
const customerOptions = ref<string[]>([]);
const filteredCustomerOptions = ref<string[]>([]);
const customerInputText = ref('');
const creatingCustomerFromSelect = ref(false);

const statusOptions: { label: OrderStatus; value: OrderStatus }[] = [
  { label: 'Pendiente', value: 'Pendiente' },
  { label: 'En Progreso', value: 'En Progreso' },
  { label: 'Finalizado', value: 'Finalizado' },
];

const destinationOptions = [
  { label: 'Cliente', value: 'Cliente', icon: 'person' },
  { label: 'Soporte técnico', value: 'Soporte técnico', icon: 'support_agent' },
  { label: 'Depto. Mecánica', value: 'Depto. Mecánica', icon: 'precision_manufacturing' },
  { label: 'Oficina USA', value: 'Oficina USA', icon: 'apartment' },
  { label: 'Oficina México', value: 'Oficina México', icon: 'location_city' },
];

function getTodayDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const form = ref({
  orderNumber: '',
  customerName: '',
  destination: '',
  dueDate: getTodayDate(),
  status: 'Pendiente' as OrderStatus,
  comments: '',
  attachment: null as File | null,
});

const normalizeOrderNumber = (value: string) => value.trim().toLowerCase();

const orderNumberRules = computed(() => [
  (value: string) => !!value?.trim() || 'El número de orden es requerido',
  (value: string) =>
    !existingOrderNumbers.value.some((number) => number === normalizeOrderNumber(value)) ||
    'El número de orden ya existe',
]);

const pdfRules = [
  (file: File | null) =>
    !file ||
    file.type === 'application/pdf' ||
    file.name.toLowerCase().endsWith('.pdf') ||
    'Solo se permiten archivos PDF',
];

async function loadExistingOrderNumbers() {
  try {
    const orders = await getOrders();
    existingOrderNumbers.value = orders.map((order) => normalizeOrderNumber(order.orderNumber));
  } catch {
    $q.notify({
      type: 'negative',
      message: 'No se pudieron validar los números de orden existentes',
    });
  }
}

async function loadCustomers() {
  try {
    const customers = await getCustomers();
    customerOptions.value = customers.map((customer) => customer.name);
    filteredCustomerOptions.value = [...customerOptions.value];
  } catch {
    $q.notify({
      type: 'negative',
      message: 'No se pudieron cargar los clientes',
    });
  }
}

function onCustomerFilter(value: string, update: (callbackFn: () => void) => void) {
  customerInputText.value = value;
  update(() => {
    const query = value.trim().toLowerCase();
    filteredCustomerOptions.value = !query
      ? [...customerOptions.value]
      : customerOptions.value.filter((customer) => customer.toLowerCase().includes(query));
  });
}

function onCustomerNewValue(value: string, done: (val: string, mode?: 'add' | 'add-unique' | 'toggle') => void) {
  const normalizedName = value.trim().replace(/\s+/g, ' ');
  if (!normalizedName) {
    done('');
    return;
  }

  const existingOption = customerOptions.value.find(
    (option) => option.toLowerCase() === normalizedName.toLowerCase(),
  );
  const finalValue = existingOption ?? normalizedName;

  if (!existingOption) {
    customerOptions.value.push(finalValue);
    customerOptions.value.sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
    filteredCustomerOptions.value = [...customerOptions.value];
  }

  done(finalValue, 'add-unique');
}

function onCustomerInputValue(value: string) {
  customerInputText.value = value;
}

async function addNewCustomerFromInput() {
  const customerName = customerInputText.value.trim();
  if (!customerName || creatingCustomerFromSelect.value) {
    return;
  }

  creatingCustomerFromSelect.value = true;
  try {
    const customer = await getOrCreateCustomer(customerName);
    if (!customerOptions.value.some((name) => name.toLowerCase() === customer.name.toLowerCase())) {
      customerOptions.value.push(customer.name);
      customerOptions.value.sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
    }

    filteredCustomerOptions.value = [...customerOptions.value];
    form.value.customerName = customer.name;
    customerInputText.value = customer.name;
    $q.notify({ type: 'positive', message: `Cliente agregado: ${customer.name}` });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo agregar el cliente';
    $q.notify({ type: 'negative', message });
  } finally {
    creatingCustomerFromSelect.value = false;
  }
}

async function onSubmit() {
  const valid = await orderFormRef.value?.validate();

  if (!valid) {
    return;
  }

  try {
    const selectedCustomerName = form.value.customerName.trim();
    const typedCustomerName = customerInputText.value.trim();
    const trimmedCustomerName = selectedCustomerName || typedCustomerName;
    if (!trimmedCustomerName) {
      $q.notify({ type: 'warning', message: 'El cliente es requerido' });
      return;
    }

    form.value.customerName = trimmedCustomerName;
    const customer = await getOrCreateCustomer(trimmedCustomerName);
    if (!customerOptions.value.some((name) => name.toLowerCase() === customer.name.toLowerCase())) {
      customerOptions.value.push(customer.name);
      customerOptions.value.sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
      filteredCustomerOptions.value = [...customerOptions.value];
    }

    const attachmentUrl = form.value.attachment
      ? await uploadOrderAttachment(form.value.attachment, form.value.orderNumber.trim())
      : undefined;

    const createdOrder = await createOrder({
      orderNumber: form.value.orderNumber.trim(),
      customerId: customer.id,
      customerName: trimmedCustomerName,
      destination: form.value.destination,
      dueDate: form.value.dueDate,
      status: form.value.status,
      comments: form.value.comments,
      ...(attachmentUrl ? { attachmentUrl } : {}),
    });

    salesOrdersStore.notificationCount += 1;

    await router.push({
      path: '/orders',
      query: { createdOrder: createdOrder.orderNumber },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo crear la orden';
    $q.notify({ type: 'negative', message });
  }
}

function goBack() {
  void router.push('/orders');
}

onMounted(async () => {
  await loadExistingOrderNumbers();
  await loadCustomers();
});
</script>

<style scoped>
.order-new-page {
  position: relative;
}

.order-new-page__background {
  pointer-events: none;
  filter: saturate(0.9);
}

.order-new-page__overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  background: rgba(241, 245, 249, 0.54);
}

.order-new-page__form {
  width: 100%;
}

.order-form-card {
  border-radius: 16px;
  box-shadow: 0 20px 44px rgba(15, 23, 42, 0.2);
  overflow: hidden;
}

.order-form-card__header {
  background: linear-gradient(180deg, #ffffff, #f8fbff);
}

.order-form-card__body {
  background: #ffffff;
}

.status-block {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px;
}

@media (min-width: 1024px) {
  .order-new-page__form {
    width: 50%;
  }
}
</style>
