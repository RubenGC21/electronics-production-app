<template>
  <q-page class="q-pa-md">
    <div class="row items-center justify-between q-col-gutter-md q-mb-md">
      <div class="col-auto">
        <h5 class="q-my-none">Órdenes</h5>
      </div>
      <div class="col-auto">
        <q-btn color="primary" label="Nueva orden" icon="add" to="/orders/new" />
      </div>
    </div>

    <div v-if="!isDetailsOpen" class="row q-col-gutter-md q-mb-md">
      <div class="col-12 col-md-4">
        <q-card
          flat
          class="stats-card stats-card--pending"
          :class="{ 'stats-card--active': selectedStatus === 'Pendiente' }"
          @click="toggleStatusFilter('Pendiente')"
        >
          <q-card-section class="stats-card__content">
            <div>
              <div class="text-subtitle2">Órdenes Pendientes</div>
              <div class="text-h4 text-weight-bold">{{ pendingCount }}</div>
            </div>
            <q-icon name="schedule" size="32px" />
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-4">
        <q-card
          flat
          class="stats-card stats-card--progress"
          :class="{ 'stats-card--active': selectedStatus === 'En Progreso' }"
          @click="toggleStatusFilter('En Progreso')"
        >
          <q-card-section class="stats-card__content">
            <div>
              <div class="text-subtitle2">Órdenes en progreso</div>
              <div class="text-h4 text-weight-bold">{{ inProgressCount }}</div>
            </div>
            <q-icon name="autorenew" size="32px" />
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-4">
        <q-card
          flat
          class="stats-card stats-card--done"
          :class="{ 'stats-card--active': selectedStatus === 'Finalizado' }"
          @click="toggleStatusFilter('Finalizado')"
        >
          <q-card-section class="stats-card__content">
            <div>
              <div class="text-subtitle2">Órdenes finalizadas</div>
              <div class="text-h4 text-weight-bold">{{ doneCount }}</div>
            </div>
            <q-icon name="task_alt" size="32px" />
          </q-card-section>
        </q-card>
      </div>
    </div>

    <div v-if="!selectedOrder" class="row q-col-gutter-md">
      <div class="col-12">
        <q-table
          :rows="filteredOrders"
          :columns="columns"
          row-key="id"
          flat
          bordered
          :loading="loadingOrders"
          :pagination="{ rowsPerPage: 10 }"
          @row-click="onRowClick"
        >
          <template #top-right>
            <q-input
              v-model="search"
              dense
              outlined
              debounce="250"
              placeholder="Buscar por número, cliente o destino"
              style="min-width: 320px"
            >
              <template #append>
                <q-icon name="search" />
              </template>
            </q-input>
          </template>

          <template #body-cell-dueDate="props">
            <q-td :props="props">
              {{ formatDueDate(props.row.dueDate) }}
            </q-td>
          </template>

          <template #body-cell-comments="props">
            <q-td :props="props">
              {{ truncateComments(props.row.comments) }}
            </q-td>
          </template>

          <template #no-data>
            <div class="full-width row flex-center q-pa-md text-grey-7">
              No hay órdenes para mostrar.
            </div>
          </template>
        </q-table>
      </div>
    </div>

    <div v-else class="row">
      <div class="col-12">
        <q-card flat bordered class="details-panel">
          <q-card-section class="row items-center justify-between">
            <div class="row items-center q-gutter-sm">
              <q-btn flat dense icon="arrow_back" @click="closeOrderDetails" />
              <div class="text-h6">Detalle de orden {{ selectedOrder?.orderNumber }}</div>
            </div>
            <q-btn flat round dense icon="close" @click="closeOrderDetails" />
          </q-card-section>

          <q-separator />

          <q-card-section class="details-ribbon">
            <div class="details-ribbon__status">
              <span class="text-caption text-grey-7">Estatus</span>
              <div class="status-icon-row">
                <q-btn
                  no-caps
                  unelevated
                  icon="schedule"
                  label="Pendiente"
                  :color="selectedOrder?.status === 'Pendiente' ? 'warning' : 'grey-3'"
                  :text-color="selectedOrder?.status === 'Pendiente' ? 'white' : 'dark'"
                  @click="updateSelectedOrderStatus('Pendiente')"
                />
                <q-btn
                  no-caps
                  unelevated
                  icon="autorenew"
                  label="En Progreso"
                  :color="selectedOrder?.status === 'En Progreso' ? 'primary' : 'grey-3'"
                  :text-color="selectedOrder?.status === 'En Progreso' ? 'white' : 'dark'"
                  @click="updateSelectedOrderStatus('En Progreso')"
                />
                <q-btn
                  no-caps
                  unelevated
                  icon="task_alt"
                  label="Finalizado"
                  :color="selectedOrder?.status === 'Finalizado' ? 'positive' : 'grey-3'"
                  :text-color="selectedOrder?.status === 'Finalizado' ? 'white' : 'dark'"
                  @click="updateSelectedOrderStatus('Finalizado')"
                />
              </div>
            </div>

            <div class="details-ribbon__actions">
              <q-btn
                flat
                round
                icon="qr_code_2"
                aria-label="Agregar números de serie"
                @click="onAddSerialNumbers"
              >
                <q-tooltip>Agregar números de serie</q-tooltip>
              </q-btn>
              <q-btn flat round icon="image" aria-label="Agregar evidencias" @click="onAddEvidence">
                <q-tooltip>Agregar evidencias</q-tooltip>
              </q-btn>
              <q-btn flat round icon="more_vert" aria-label="Opciones de orden">
                <q-tooltip>Opciones</q-tooltip>
                <q-menu>
                  <q-list style="min-width: 180px">
                    <q-item clickable v-close-popup @click="openAddAttachmentDialog">
                      <q-item-section avatar>
                        <q-icon name="upload_file" />
                      </q-item-section>
                      <q-item-section>Agregar adjunto</q-item-section>
                    </q-item>
                    <q-item clickable v-close-popup @click="startEditOrder">
                      <q-item-section avatar>
                        <q-icon name="edit" />
                      </q-item-section>
                      <q-item-section>Editar orden</q-item-section>
                    </q-item>
                    <q-item clickable v-close-popup @click="deleteSelectedOrder">
                      <q-item-section avatar>
                        <q-icon name="delete" color="negative" />
                      </q-item-section>
                      <q-item-section class="text-negative">Eliminar orden</q-item-section>
                    </q-item>
                  </q-list>
                </q-menu>
              </q-btn>
            </div>
          </q-card-section>

          <q-separator />

          <q-card-section v-if="selectedOrder" class="q-gutter-md">
            <template v-if="!isEditing">
              <div><strong>Número:</strong> {{ selectedOrder.orderNumber }}</div>
              <div><strong>Cliente:</strong> {{ selectedOrder.customerName }}</div>
              <div><strong>Destino:</strong> {{ selectedOrder.destination }}</div>
              <div>
                <strong>Fecha compromiso:</strong> {{ formatDueDate(selectedOrder.dueDate) }}
              </div>
              <div><strong>Estatus:</strong> {{ selectedOrder.status }}</div>
              <div><strong>Comentarios:</strong> {{ selectedOrder.comments || '-' }}</div>
            </template>

            <template v-else>
              <q-form ref="editOrderFormRef" class="q-gutter-md" @submit.prevent="saveEditOrder">
                <q-input
                  v-model="editForm.customerName"
                  label="Cliente *"
                  outlined
                  :rules="[(value) => !!value?.trim() || 'El cliente es requerido']"
                />
                <q-input
                  v-model="editForm.destination"
                  label="Destino *"
                  outlined
                  :rules="[(value) => !!value?.trim() || 'El destino es requerido']"
                />
                <q-input
                  v-model="editForm.dueDate"
                  label="Fecha compromiso *"
                  type="date"
                  outlined
                  :rules="[(value) => !!value || 'La fecha compromiso es requerida']"
                />
                <q-input
                  v-model="editForm.comments"
                  label="Comentarios"
                  outlined
                  type="textarea"
                  autogrow
                />

                <q-file
                  v-model="editForm.attachment"
                  label="Modificar archivo PDF"
                  outlined
                  clearable
                  use-chips
                  accept=".pdf,application/pdf"
                  max-files="1"
                  :rules="pdfRules"
                  hint="Opcional. Solo se permiten archivos PDF."
                >
                  <template #prepend>
                    <q-icon name="attach_file" />
                  </template>
                </q-file>

                <div class="row justify-end q-gutter-sm q-pt-sm">
                  <q-btn flat no-caps label="Cancelar" @click="cancelEditOrder" />
                  <q-btn
                    color="primary"
                    no-caps
                    unelevated
                    icon="save"
                    label="Guardar cambios"
                    type="submit"
                  />
                </div>
              </q-form>
            </template>

            <q-separator class="q-my-md" />

            <div>
              <div class="row items-center q-gutter-sm q-mb-sm">
                <div class="text-subtitle1 text-weight-medium">Archivos adjuntos</div>
                <q-badge color="deep-orange" text-color="white" rounded>
                  {{ orderAttachments.length }}
                </q-badge>
              </div>

              <div v-if="loadingAttachments" class="row q-col-gutter-sm">
                <div class="col-12 col-md-6 col-lg-4" v-for="index in 3" :key="index">
                  <q-skeleton height="64px" class="rounded-borders" />
                </div>
              </div>

              <div v-else-if="orderAttachments.length" class="row q-col-gutter-sm">
                <div
                  v-for="attachment in orderAttachments"
                  :key="attachment.path"
                  class="col-12 col-sm-6 col-md-4 col-lg-3"
                >
                  <q-card flat bordered class="attachment-mini-card">
                    <q-card-section class="q-pa-sm">
                      <div class="row items-center no-wrap q-gutter-sm">
                        <q-icon
                          :name="getAttachmentIcon(attachment.name)"
                          :color="getAttachmentIconColor(attachment.name)"
                          size="24px"
                        />
                        <div class="col">
                          <div class="text-body2 text-weight-medium ellipsis">
                            {{ attachment.name }}
                          </div>
                        </div>
                        <q-btn
                          flat
                          round
                          dense
                          color="primary"
                          icon="open_in_new"
                          :loading="openingAttachment"
                          @click="openAttachmentByPath(attachment.path)"
                        />
                      </div>
                      <div class="text-caption text-grey-8 q-mt-xs">
                        Comentario: {{ attachment.comment || '-' }}
                      </div>
                    </q-card-section>
                  </q-card>
                </div>
              </div>

              <div v-else class="text-grey-7">No hay archivos adjuntos.</div>
            </div>

            <q-separator class="q-my-md" />

            <div>
              <div class="row items-center q-gutter-sm q-mb-sm">
                <div class="text-subtitle1 text-weight-medium">Números de serie</div>
                <q-badge color="primary" text-color="white" rounded>
                  {{ selectedOrderSerials.length }}
                </q-badge>
              </div>
              <q-list v-if="selectedOrderSerials.length" bordered separator class="rounded-borders">
                <q-item v-for="serial in pagedSelectedOrderSerials" :key="serial.id">
                  <q-item-section avatar>
                    <q-icon name="qr_code_2" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ serial.serialNumber }}</q-item-label>
                    <q-item-label caption class="text-grey-7">
                      Agregado: {{ formatDateTime(serial.createdAt) }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
              <div
                v-if="selectedOrderSerials.length > 0"
                class="row items-center justify-between q-mt-sm"
              >
                <div class="row items-center q-gutter-sm">
                  <span class="text-caption text-grey-7">Registros por página</span>
                  <q-select
                    v-model="serialsPerPage"
                    dense
                    outlined
                    emit-value
                    map-options
                    :options="serialsPerPageOptions"
                    style="min-width: 90px"
                  />
                </div>

                <q-pagination
                  v-if="selectedOrderSerialPages > 1"
                  v-model="selectedOrderSerialPage"
                  color="primary"
                  :max="selectedOrderSerialPages"
                  :max-pages="6"
                  boundary-links
                  direction-links
                />
              </div>
              <div v-else class="text-grey-7">No hay números de serie registrados.</div>
            </div>

            <q-separator class="q-my-md" />

            <div>
              <div class="row items-center q-gutter-sm q-mb-sm">
                <div class="text-subtitle1 text-weight-medium">Evidencias</div>
                <q-badge color="purple" text-color="white" rounded>
                  {{ orderEvidences.length }}
                </q-badge>
              </div>

              <div v-if="loadingEvidences" class="row q-col-gutter-sm">
                <div class="col-12 col-md-4" v-for="index in 3" :key="`ev-skeleton-${index}`">
                  <q-skeleton height="160px" class="rounded-borders" />
                </div>
              </div>

              <q-carousel
                v-else-if="evidenceSlides.length"
                v-model="evidenceSlide"
                animated
                arrows
                navigation
                swipeable
                height="240px"
                class="bg-grey-1 rounded-borders"
                control-color="purple"
              >
                <q-carousel-slide
                  v-for="(slide, slideIndex) in evidenceSlides"
                  :key="`slide-${slideIndex}`"
                  :name="slideIndex"
                  class="q-pa-sm"
                >
                  <div class="row q-col-gutter-sm evidence-multi-slide">
                    <div
                      v-for="evidence in slide"
                      :key="evidence.path"
                      class="col-4"
                    >
                      <q-img
                        :src="evidence.signedUrl || ''"
                        ratio="1"
                        fit="cover"
                        class="rounded-borders cursor-pointer evidence-thumb"
                        @click="openEvidencePreview(evidence)"
                        @error="onEvidenceImageError(evidence)"
                      >
                        <template #error>
                          <div class="absolute-full flex flex-center bg-grey-3 text-grey-8 text-caption">
                            Sin vista previa
                          </div>
                        </template>
                        <div class="absolute-bottom evidence-thumb__caption">
                          <div class="ellipsis">{{ evidence.comment || 'Sin comentario' }}</div>
                        </div>
                      </q-img>
                    </div>
                  </div>
                </q-carousel-slide>
              </q-carousel>

              <div v-else class="text-grey-7">No hay evidencias de imagen registradas.</div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <q-dialog v-model="scanDialogOpen">
      <q-card style="min-width: 380px; width: 620px; max-width: 95vw">
        <q-card-section class="row items-center justify-between">
          <div class="row items-center q-gutter-sm">
            <div class="text-h6">Escanear números de serie</div>
            <q-badge color="primary" text-color="white" rounded>
              {{ scannedSerials.length }}
            </q-badge>
          </div>
          <q-btn flat round dense icon="close" v-close-popup />
        </q-card-section>

        <q-separator />

        <q-card-section class="q-gutter-md">
          <div class="row q-col-gutter-sm items-center">
            <div class="col">
              <q-input
                v-model="serialInput"
                outlined
                label="Número de serie"
                placeholder="Escanea o escribe y presiona Enter"
                @keyup.enter="addSerialFromInput"
              />
            </div>
            <div class="col-auto">
              <q-btn color="primary" icon="add" label="Agregar" @click="addSerialFromInput" />
            </div>
          </div>

          <q-list bordered separator class="rounded-borders">
            <q-item v-for="serial in scannedSerials" :key="serial">
              <q-item-section avatar>
                <q-icon name="qr_code_2" />
              </q-item-section>
              <q-item-section>{{ serial }}</q-item-section>
              <q-item-section side>
                <q-btn
                  flat
                  round
                  dense
                  icon="close"
                  color="negative"
                  @click="removeScannedSerial(serial)"
                />
              </q-item-section>
            </q-item>

            <q-item v-if="scannedSerials.length === 0">
              <q-item-section class="text-grey-7">Sin números de serie capturados.</q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>
    </q-dialog>

    <q-dialog v-model="addAttachmentDialogOpen" persistent>
      <q-card style="min-width: 380px; width: 560px; max-width: 95vw">
        <q-card-section class="row items-center justify-between">
          <div class="text-h6">Agregar archivo adjunto</div>
          <q-btn flat round dense icon="close" @click="closeAddAttachmentDialog" />
        </q-card-section>

        <q-separator />

        <q-card-section class="q-gutter-md">
          <q-file
            v-model="attachmentForm.file"
            outlined
            clearable
            use-chips
            max-files="1"
            label="Seleccionar archivo"
          >
            <template #prepend>
              <q-icon name="attach_file" />
            </template>
          </q-file>

          <q-input
            v-model="attachmentForm.comment"
            outlined
            type="textarea"
            autogrow
            label="Comentario del archivo"
            maxlength="240"
            counter
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat no-caps label="Cerrar" @click="closeAddAttachmentDialog" />
          <q-btn
            color="primary"
            no-caps
            unelevated
            icon="upload_file"
            label="Subir adjunto"
            :loading="uploadingAttachment"
            :disable="!attachmentForm.file || uploadingAttachment"
            @click="submitAddAttachment"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="addEvidenceDialogOpen" persistent>
      <q-card style="min-width: 380px; width: 560px; max-width: 95vw">
        <q-card-section class="row items-center justify-between">
          <div class="text-h6">Agregar evidencia (imagen)</div>
          <q-btn flat round dense icon="close" @click="closeAddEvidenceDialog" />
        </q-card-section>

        <q-separator />

        <q-card-section class="q-gutter-md">
          <q-file
            v-model="evidenceForm.image"
            outlined
            clearable
            use-chips
            max-files="1"
            accept=".png,.jpg,.jpeg,.webp,.gif,.bmp,.svg,.heic,.heif,.tif,.tiff,image/*"
            label="Seleccionar imagen"
            :rules="evidenceImageRules"
            hint="Formatos: PNG, JPG, WEBP, GIF, BMP, SVG, HEIC, TIFF"
          >
            <template #prepend>
              <q-icon name="image" />
            </template>
          </q-file>

          <q-input
            v-model="evidenceForm.comment"
            outlined
            type="textarea"
            autogrow
            label="Comentario de evidencia"
            maxlength="240"
            counter
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat no-caps label="Cerrar" @click="closeAddEvidenceDialog" />
          <q-btn
            color="purple"
            no-caps
            unelevated
            icon="upload_file"
            label="Subir evidencia"
            :loading="uploadingEvidence"
            :disable="!evidenceForm.image || uploadingEvidence"
            @click="submitAddEvidence"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="evidencePreviewOpen" maximized>
      <q-card class="bg-black text-white">
        <q-card-section class="row items-center justify-between">
          <div class="text-subtitle1 ellipsis">
            {{ evidencePreviewItem?.comment || evidencePreviewItem?.name || 'Vista de evidencia' }}
          </div>
          <q-btn flat round dense icon="close" color="white" v-close-popup />
        </q-card-section>
        <q-separator dark />
        <q-card-section class="q-pa-none evidence-preview-wrap">
          <q-img
            v-if="evidencePreviewItem?.signedUrl"
            :src="evidencePreviewItem.signedUrl"
            fit="contain"
            class="evidence-preview-image"
          />
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import type { QForm, QTableColumn } from 'quasar';
import { useQuasar } from 'quasar';
import { useRoute, useRouter } from 'vue-router';
import {
  getOrderAttachmentSignedUrl,
  listOrderAttachments,
  listOrderEvidenceImages,
  uploadOrderEvidenceImage,
  uploadOrderAttachment,
  type OrderAttachmentItem,
  type OrderEvidenceItem,
} from 'src/services/attachmentsService';
import type { OrderStatus, WorkOrder } from 'src/services/ordersService';
import { deleteOrder, getOrders, updateOrder } from 'src/services/ordersService';
import {
  addSerialNumber,
  deleteSerialNumber,
  findSerialRegistration,
  getSerialsByOrder,
} from 'src/services/serialNumbersService';

const SIGNED_URL_EXPIRES_SECONDS = 600;
const IMAGE_EXTENSIONS = new Set([
  'png',
  'jpg',
  'jpeg',
  'webp',
  'gif',
  'bmp',
  'svg',
  'heic',
  'heif',
  'tif',
  'tiff',
]);

const $q = useQuasar();
const route = useRoute();
const router = useRouter();

const loadingOrders = ref(false);
const search = ref('');
const orders = ref<WorkOrder[]>([]);

interface OrderSerialItem {
  id: number;
  serialNumber: string;
  createdAt?: string;
}

interface OrderEvidenceGalleryItem extends OrderEvidenceItem {
  signedUrl?: string;
}

const selectedOrder = ref<WorkOrder | null>(null);
const selectedStatus = ref<OrderStatus | null>(null);
const selectedOrderSerials = ref<OrderSerialItem[]>([]);
const orderAttachments = ref<OrderAttachmentItem[]>([]);
const orderEvidences = ref<OrderEvidenceGalleryItem[]>([]);
const evidenceSlide = ref(0);
const addAttachmentDialogOpen = ref(false);
const addEvidenceDialogOpen = ref(false);
const evidencePreviewOpen = ref(false);
const evidencePreviewItem = ref<OrderEvidenceGalleryItem | null>(null);
const selectedOrderSerialPage = ref(1);
const serialsPerPage = ref(10);
const uploadingAttachment = ref(false);
const uploadingEvidence = ref(false);
const loadingAttachments = ref(false);
const loadingEvidences = ref(false);
const evidenceLoadErrorPaths = ref(new Set<string>());
const serialsPerPageOptions = [
  { label: '5', value: 5 },
  { label: '10', value: 10 },
  { label: '100', value: 100 },
];

const isEditing = ref(false);
const editOrderFormRef = ref<QForm | null>(null);
const openingAttachment = ref(false);
const editForm = ref({
  customerName: '',
  destination: '',
  dueDate: '',
  comments: '',
  attachment: null as File | null,
});
const attachmentForm = ref({
  file: null as File | null,
  comment: '',
});
const evidenceForm = ref({
  image: null as File | null,
  comment: '',
});

function getFileExtension(fileName: string) {
  return fileName.split('.').pop()?.toLowerCase() || '';
}

function resetAttachmentForm() {
  attachmentForm.value = {
    file: null,
    comment: '',
  };
}

function resetEvidenceForm() {
  evidenceForm.value = {
    image: null,
    comment: '',
  };
}

const evidenceImageRules = [
  (file: File | null) => {
    if (!file) {
      return true;
    }

    const mime = file.type?.toLowerCase() || '';
    const extension = getFileExtension(file.name);

    return (
      mime.startsWith('image/') ||
      IMAGE_EXTENSIONS.has(extension) ||
      'Selecciona un archivo de imagen válido'
    );
  },
];

const pdfRules = [
  (file: File | null) =>
    !file ||
    file.type === 'application/pdf' ||
    file.name.toLowerCase().endsWith('.pdf') ||
    'Solo se permiten archivos PDF',
];

const scanDialogOpen = ref(false);
const serialInput = ref('');
const scannedSerials = ref<string[]>([]);
const scannedSerialIds = ref<Record<string, number>>({});

const columns: QTableColumn<WorkOrder>[] = [
  { name: 'orderNumber', label: 'Número', field: 'orderNumber', align: 'left', sortable: true },
  { name: 'customerName', label: 'Cliente', field: 'customerName', align: 'left', sortable: true },
  { name: 'destination', label: 'Destino', field: 'destination', align: 'left', sortable: true },
  { name: 'dueDate', label: 'Fecha compromiso', field: 'dueDate', align: 'left', sortable: true },
  { name: 'status', label: 'Estatus', field: 'status', align: 'left', sortable: true },
  { name: 'comments', label: 'Comentarios', field: 'comments', align: 'left' },
];

const filteredOrders = computed(() => {
  const query = search.value.trim().toLowerCase();
  const statusFilteredOrders = selectedStatus.value
    ? orders.value.filter((order) => order.status === selectedStatus.value)
    : orders.value;

  if (!query) {
    return statusFilteredOrders;
  }

  return statusFilteredOrders.filter((order) =>
    [order.orderNumber, order.customerName, order.destination].some((field) =>
      field.toLowerCase().includes(query),
    ),
  );
});

const pendingCount = computed(
  () => orders.value.filter((order) => order.status === 'Pendiente').length,
);
const inProgressCount = computed(
  () => orders.value.filter((order) => order.status === 'En Progreso').length,
);
const doneCount = computed(
  () => orders.value.filter((order) => order.status === 'Finalizado').length,
);
const isDetailsOpen = computed(() => !!selectedOrder.value);
const selectedOrderSerialPages = computed(() =>
  Math.max(1, Math.ceil(selectedOrderSerials.value.length / serialsPerPage.value)),
);
const pagedSelectedOrderSerials = computed(() => {
  const start = (selectedOrderSerialPage.value - 1) * serialsPerPage.value;
  return selectedOrderSerials.value.slice(start, start + serialsPerPage.value);
});
const evidenceSlides = computed(() => {
  const chunkSize = 3;
  const slides: OrderEvidenceGalleryItem[][] = [];
  for (let index = 0; index < orderEvidences.value.length; index += chunkSize) {
    slides.push(orderEvidences.value.slice(index, index + chunkSize));
  }
  return slides;
});

function truncateComments(value?: string) {
  if (!value) {
    return '-';
  }

  return value.length > 48 ? `${value.slice(0, 48)}...` : value;
}

function formatDueDate(value: string) {
  const dateOnlyPattern = /^(\d{4})-(\d{2})-(\d{2})$/;
  const match = value.match(dateOnlyPattern);

  if (match) {
    return `${match[3]}/${match[2]}/${match[1]}`;
  }

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? value : parsedDate.toLocaleDateString('es-MX');
}

function formatDateTime(value?: string) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('es-MX');
}

function getAttachmentIcon(fileName: string) {
  const extension = getFileExtension(fileName);
  if (extension === 'pdf') return 'picture_as_pdf';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'].includes(extension)) return 'image';
  if (['xls', 'xlsx', 'csv'].includes(extension)) return 'table_chart';
  if (['doc', 'docx', 'txt', 'rtf'].includes(extension)) return 'description';
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) return 'folder_zip';
  return 'attach_file';
}

function getAttachmentIconColor(fileName: string) {
  const extension = getFileExtension(fileName);
  if (extension === 'pdf') return 'negative';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'].includes(extension)) return 'primary';
  if (['xls', 'xlsx', 'csv'].includes(extension)) return 'positive';
  if (['doc', 'docx', 'txt', 'rtf'].includes(extension)) return 'blue-grey';
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) return 'deep-orange';
  return 'grey-7';
}

function upsertLocalOrder(updatedOrder: WorkOrder) {
  const index = orders.value.findIndex((order) => order.id === updatedOrder.id);
  if (index >= 0) {
    orders.value[index] = updatedOrder;
    return;
  }

  orders.value.unshift(updatedOrder);
}

async function loadOrders() {
  loadingOrders.value = true;
  try {
    orders.value = await getOrders();
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudieron cargar las órdenes' });
  } finally {
    loadingOrders.value = false;
  }
}

async function loadSerialsForSelectedOrder() {
  if (!selectedOrder.value) {
    selectedOrderSerials.value = [];
    selectedOrderSerialPage.value = 1;
    return;
  }

  try {
    const serials = await getSerialsByOrder(selectedOrder.value.id);
    selectedOrderSerials.value = serials.map((record) => ({
      id: record.id,
      serialNumber: record.serialNumber,
      ...(record.createdAt ? { createdAt: record.createdAt } : {}),
    }));
    selectedOrderSerialPage.value = 1;
  } catch {
    selectedOrderSerials.value = [];
    selectedOrderSerialPage.value = 1;
    $q.notify({ type: 'negative', message: 'No se pudieron cargar los números de serie' });
  }
}

function getAttachmentName(path: string) {
  const segments = path.split('/');
  return segments[segments.length - 1] || path;
}

async function loadAttachmentsForSelectedOrder() {
  if (!selectedOrder.value) {
    orderAttachments.value = [];
    return;
  }

  loadingAttachments.value = true;
  try {
    const attachmentItems = await listOrderAttachments(selectedOrder.value.orderNumber);
    const attachmentPath = selectedOrder.value.attachmentUrl;
    const hasCurrentAttachmentPath =
      !!attachmentPath &&
      !/^https?:\/\//i.test(attachmentPath) &&
      attachmentItems.some((attachment) => attachment.path === attachmentPath);

    if (attachmentPath && !hasCurrentAttachmentPath) {
      attachmentItems.unshift({
        name: getAttachmentName(attachmentPath),
        path: attachmentPath,
      });
    }

    orderAttachments.value = attachmentItems;
  } catch {
    orderAttachments.value = [];
    $q.notify({ type: 'negative', message: 'No se pudieron cargar los archivos adjuntos' });
  } finally {
    loadingAttachments.value = false;
  }
}

async function loadEvidencesForSelectedOrder() {
  if (!selectedOrder.value) {
    orderEvidences.value = [];
    evidenceSlide.value = 0;
    evidenceLoadErrorPaths.value.clear();
    return;
  }

  loadingEvidences.value = true;
  evidenceLoadErrorPaths.value.clear();
  try {
    const evidenceItems = await listOrderEvidenceImages(selectedOrder.value.orderNumber);
    let signedUrlErrors = 0;
    const evidencesWithSignedUrls = await Promise.all(
      evidenceItems.map(async (evidence) => {
        try {
          const signedUrl = await getOrderAttachmentSignedUrl(
            evidence.path,
            SIGNED_URL_EXPIRES_SECONDS,
          );
          return { ...evidence, signedUrl };
        } catch {
          signedUrlErrors += 1;
          return evidence;
        }
      }),
    );

    orderEvidences.value = evidencesWithSignedUrls;
    evidenceSlide.value = 0;
    if (signedUrlErrors > 0) {
      $q.notify({
        type: 'warning',
        message: `No se pudo generar la vista previa de ${signedUrlErrors} evidencia(s)`,
      });
    }
  } catch {
    orderEvidences.value = [];
    evidenceSlide.value = 0;
    $q.notify({ type: 'negative', message: 'No se pudieron cargar las evidencias' });
  } finally {
    loadingEvidences.value = false;
  }
}

async function openOrderDetails(order: WorkOrder) {
  selectedOrder.value = order;
  isEditing.value = false;
  closeAddAttachmentDialog();
  closeAddEvidenceDialog();
  await Promise.all([
    loadSerialsForSelectedOrder(),
    loadAttachmentsForSelectedOrder(),
    loadEvidencesForSelectedOrder(),
  ]);
}

function onRowClick(_event: Event, row: WorkOrder) {
  void openOrderDetails(row);
}

function closeOrderDetails() {
  selectedOrder.value = null;
  selectedOrderSerials.value = [];
  orderAttachments.value = [];
  orderEvidences.value = [];
  evidenceSlide.value = 0;
  evidenceLoadErrorPaths.value.clear();
  evidencePreviewOpen.value = false;
  evidencePreviewItem.value = null;
  closeAddAttachmentDialog();
  closeAddEvidenceDialog();
  selectedOrderSerialPage.value = 1;
  isEditing.value = false;
}

function openAddAttachmentDialog() {
  resetAttachmentForm();
  addAttachmentDialogOpen.value = true;
}

function closeAddAttachmentDialog() {
  resetAttachmentForm();
  addAttachmentDialogOpen.value = false;
}

function openAddEvidenceDialog() {
  resetEvidenceForm();
  addEvidenceDialogOpen.value = true;
}

function closeAddEvidenceDialog() {
  resetEvidenceForm();
  addEvidenceDialogOpen.value = false;
}

async function onEvidenceImageError(evidence: OrderEvidenceGalleryItem) {
  try {
    const refreshedSignedUrl = await getOrderAttachmentSignedUrl(
      evidence.path,
      SIGNED_URL_EXPIRES_SECONDS,
    );
    const index = orderEvidences.value.findIndex((item) => item.path === evidence.path);
    if (index >= 0) {
      const currentEvidence = orderEvidences.value[index];
      if (!currentEvidence) {
        return;
      }
      orderEvidences.value[index] = {
        name: currentEvidence.name,
        path: currentEvidence.path,
        ...(currentEvidence.comment ? { comment: currentEvidence.comment } : {}),
        ...(currentEvidence.createdAt ? { createdAt: currentEvidence.createdAt } : {}),
        signedUrl: refreshedSignedUrl,
      };
    }
  } catch {
    if (evidenceLoadErrorPaths.value.has(evidence.path)) {
      return;
    }
    evidenceLoadErrorPaths.value.add(evidence.path);
    $q.notify({
      type: 'warning',
      message: `No se pudo cargar la imagen de evidencia ${evidence.name}`,
    });
  }
}

async function openEvidencePreview(evidence: OrderEvidenceGalleryItem) {
  try {
    const signedUrl =
      evidence.signedUrl ||
      (await getOrderAttachmentSignedUrl(evidence.path, SIGNED_URL_EXPIRES_SECONDS));
    evidencePreviewItem.value = { ...evidence, signedUrl };
    evidencePreviewOpen.value = true;
  } catch {
    $q.notify({ type: 'warning', message: 'No se pudo generar vista previa de la imagen' });
  }
}

async function submitAddAttachment() {
  if (!selectedOrder.value || !attachmentForm.value.file) {
    return;
  }

  uploadingAttachment.value = true;
  try {
    const filePath = await uploadOrderAttachment(
      attachmentForm.value.file,
      selectedOrder.value.orderNumber,
      attachmentForm.value.comment,
    );

    const updatedOrder = await updateOrder(selectedOrder.value.id, { attachmentUrl: filePath });
    selectedOrder.value = updatedOrder;
    upsertLocalOrder(updatedOrder);
    await loadAttachmentsForSelectedOrder();
    closeAddAttachmentDialog();
    $q.notify({ type: 'positive', message: 'Archivo adjunto cargado correctamente' });
  } catch {
    $q.notify({ type: 'negative', message: 'Error al subir archivo' });
  } finally {
    uploadingAttachment.value = false;
  }
}

async function submitAddEvidence() {
  if (!selectedOrder.value || !evidenceForm.value.image) {
    return;
  }

  uploadingEvidence.value = true;
  try {
    await uploadOrderEvidenceImage(
      evidenceForm.value.image,
      selectedOrder.value.orderNumber,
      evidenceForm.value.comment,
    );
    await loadEvidencesForSelectedOrder();
    closeAddEvidenceDialog();
    $q.notify({ type: 'positive', message: 'Evidencia cargada correctamente' });
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudo cargar la evidencia' });
  } finally {
    uploadingEvidence.value = false;
  }
}

async function openAttachmentByPath(attachmentPath: string) {
  openingAttachment.value = true;
  try {
    const signedUrl = await getOrderAttachmentSignedUrl(attachmentPath, SIGNED_URL_EXPIRES_SECONDS);
    window.open(signedUrl, '_blank', 'noopener,noreferrer');
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudo abrir el archivo adjunto' });
  } finally {
    openingAttachment.value = false;
  }
}

function toggleStatusFilter(status: OrderStatus) {
  selectedStatus.value = selectedStatus.value === status ? null : status;
}

async function updateSelectedOrderStatus(status: OrderStatus) {
  if (!selectedOrder.value) {
    return;
  }

  try {
    const updatedOrder = await updateOrder(selectedOrder.value.id, { status });
    selectedOrder.value = updatedOrder;
    upsertLocalOrder(updatedOrder);
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudo actualizar el estatus' });
  }
}

function startEditOrder() {
  if (!selectedOrder.value) {
    return;
  }

  editForm.value = {
    customerName: selectedOrder.value.customerName,
    destination: selectedOrder.value.destination,
    dueDate: selectedOrder.value.dueDate,
    comments: selectedOrder.value.comments || '',
    attachment: null,
  };
  isEditing.value = true;
}

function cancelEditOrder() {
  isEditing.value = false;
}

async function saveEditOrder() {
  if (!selectedOrder.value) {
    return;
  }

  const valid = await editOrderFormRef.value?.validate();
  if (!valid) {
    return;
  }

  try {
    const attachmentUrl = editForm.value.attachment
      ? await uploadOrderAttachment(editForm.value.attachment, selectedOrder.value.orderNumber)
      : undefined;

    const updatedOrder = await updateOrder(selectedOrder.value.id, {
      customerName: editForm.value.customerName.trim(),
      destination: editForm.value.destination.trim(),
      dueDate: editForm.value.dueDate.trim(),
      comments: editForm.value.comments,
      ...(attachmentUrl ? { attachmentUrl } : {}),
    });

    selectedOrder.value = updatedOrder;
    upsertLocalOrder(updatedOrder);
    isEditing.value = false;
    await loadAttachmentsForSelectedOrder();
    $q.notify({ type: 'positive', message: 'Orden actualizada' });
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudo actualizar la orden' });
  }
}

async function deleteSelectedOrder() {
  if (!selectedOrder.value) {
    return;
  }

  const shouldDelete = window.confirm(`¿Eliminar la orden ${selectedOrder.value.orderNumber}?`);
  if (!shouldDelete) {
    return;
  }

  try {
    await deleteOrder(selectedOrder.value.id);
    orders.value = orders.value.filter((order) => order.id !== selectedOrder.value?.id);
    closeOrderDetails();
    $q.notify({ type: 'positive', message: 'Orden eliminada' });
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudo eliminar la orden' });
  }
}

function onAddSerialNumbers() {
  scannedSerials.value = [];
  scannedSerialIds.value = {};
  serialInput.value = '';
  scanDialogOpen.value = true;
}

function onAddEvidence() {
  openAddEvidenceDialog();
}

async function addSerialFromInput() {
  if (!selectedOrder.value) {
    return;
  }

  const serial = serialInput.value.trim();
  if (!serial) {
    return;
  }

  const existingRegistration = await findSerialRegistration(serial);
  if (existingRegistration) {
    $q.notify({
      type: 'warning',
      message: `El número de serie ${existingRegistration.serialNumber} ya fue registrado en la orden ${existingRegistration.orderNumber}`,
    });
    return;
  }

  try {
    const inserted = await addSerialNumber(serial, selectedOrder.value.id);
    scannedSerialIds.value[serial] = inserted.id;

    scannedSerials.value.push(serial);
    selectedOrderSerials.value.push({
      id: inserted.id,
      serialNumber: inserted.serialNumber,
      ...(inserted.createdAt ? { createdAt: inserted.createdAt } : {}),
    });
    selectedOrderSerialPage.value = selectedOrderSerialPages.value;
    serialInput.value = '';
    $q.notify({ type: 'positive', message: 'Número de serie guardado' });
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudo guardar el número de serie' });
    return;
  }
}

async function removeScannedSerial(serial: string) {
  const id = scannedSerialIds.value[serial];
  if (!id) {
    return;
  }

  try {
    await deleteSerialNumber(id);
    scannedSerials.value = scannedSerials.value.filter((value) => value !== serial);
    selectedOrderSerials.value = selectedOrderSerials.value.filter(
      (value) => value.serialNumber !== serial,
    );
    delete scannedSerialIds.value[serial];
    $q.notify({ type: 'positive', message: 'Número de serie eliminado' });
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudo eliminar el número de serie' });
  }
}

onMounted(async () => {
  await loadOrders();
});

watch(
  () => route.query.createdOrder,
  async (value) => {
    const orderNumber = Array.isArray(value) ? value[0] : value;

    if (!orderNumber) {
      return;
    }

    $q.notify({ type: 'positive', message: `Nueva orden creada: ${orderNumber}` });

    const nextQuery = { ...route.query };
    delete nextQuery.createdOrder;
    await router.replace({ path: '/orders', query: nextQuery });
    await loadOrders();
  },
  { immediate: true },
);

watch(serialsPerPage, () => {
  selectedOrderSerialPage.value = 1;
});
</script>

<style scoped>
.stats-card {
  border-radius: 16px;
  color: #fff;
  box-shadow: 0 10px 22px rgba(16, 24, 40, 0.16);
  cursor: pointer;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease;
}

.stats-card__content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 110px;
}

.stats-card--pending {
  background: linear-gradient(135deg, #f4c430 0%, #f59f00 100%);
}

.stats-card--progress {
  background: linear-gradient(135deg, #2196f3 0%, #1565c0 100%);
}

.stats-card--done {
  background: linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%);
}

.stats-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 26px rgba(16, 24, 40, 0.2);
}

.stats-card--active {
  outline: 3px solid rgba(255, 255, 255, 0.85);
  outline-offset: -3px;
}

.details-panel {
  min-height: 100%;
  border-radius: 12px;
}

.details-ribbon {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: #f8fafc;
}

.details-ribbon__status {
  flex: 1;
}

.status-icon-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
}

.details-ribbon__actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.attachment-mini-card {
  min-height: 88px;
}

.evidence-multi-slide {
  align-items: stretch;
}

.evidence-thumb {
  height: 210px;
}

.evidence-thumb__caption {
  padding: 4px 8px;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(7, 10, 20, 0.78) 100%);
  color: #fff;
  font-size: 11px;
}

.evidence-preview-wrap {
  height: calc(100vh - 88px);
}

.evidence-preview-image {
  width: 100%;
  height: 100%;
}
</style>
