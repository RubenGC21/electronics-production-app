import { acceptHMRUpdate, defineStore } from 'pinia';

export type SalesOrderStatus = 'Pendiente' | 'En Progreso' | 'Finalizado';

export interface SalesOrder {
  orderNumber: string;
  customerName: string;
  destination: string;
  dueDate: string;
  status: SalesOrderStatus;
  comments?: string;
  serialNumbers?: string[];
}

export interface CreateSalesOrderPayload {
  orderNumber: string;
  customerName: string;
  destination: string;
  dueDate: string;
  status?: SalesOrderStatus;
  comments?: string;
}

const normalizeOrderNumber = (value: string) => value.trim().toLowerCase();

export const useSalesOrdersStore = defineStore('sales-orders', {
  state: () => ({
    orders: [] as SalesOrder[],
    notificationCount: 0,
  }),

  getters: {
    hasOrderNumber: (state) => (orderNumber: string) =>
      state.orders.some((order) => normalizeOrderNumber(order.orderNumber) === normalizeOrderNumber(orderNumber)),
  },

  actions: {
    createSalesOrder(payload: CreateSalesOrderPayload) {
      const orderNumber = payload.orderNumber.trim();
      const customerName = payload.customerName.trim();
      const destination = payload.destination.trim();
      const dueDate = payload.dueDate.trim();
      const comments = payload.comments?.trim() || undefined;

      if (!orderNumber || !customerName || !destination || !dueDate) {
        throw new Error('Completa todos los campos requeridos');
      }

      if (this.hasOrderNumber(orderNumber)) {
        throw new Error('El número de orden ya existe');
      }

      const order: SalesOrder = {
        orderNumber,
        customerName,
        destination,
        dueDate,
        status: payload.status ?? 'Pendiente',
        ...(comments ? { comments } : {}),
      };

      this.orders.unshift(order);
      this.notificationCount += 1;
      return order;
    },

    clearNotifications() {
      this.notificationCount = 0;
    },

    updateSalesOrder(
      orderNumber: string,
      payload: Partial<Omit<SalesOrder, 'orderNumber'>>,
    ) {
      const index = this.orders.findIndex(
        (order) => normalizeOrderNumber(order.orderNumber) === normalizeOrderNumber(orderNumber),
      );

      if (index < 0) {
        throw new Error('No se encontró la orden');
      }

      const currentOrder = this.orders[index];
      if (!currentOrder) {
        throw new Error('No se encontró la orden');
      }

      const updatedOrder: SalesOrder = {
        orderNumber: currentOrder.orderNumber,
        customerName: payload.customerName ?? currentOrder.customerName,
        destination: payload.destination ?? currentOrder.destination,
        dueDate: payload.dueDate ?? currentOrder.dueDate,
        status: payload.status ?? currentOrder.status,
        ...('serialNumbers' in payload
          ? payload.serialNumbers && payload.serialNumbers.length > 0
            ? { serialNumbers: payload.serialNumbers }
            : {}
          : currentOrder.serialNumbers && currentOrder.serialNumbers.length > 0
            ? { serialNumbers: currentOrder.serialNumbers }
            : {}),
        ...('comments' in payload
          ? payload.comments
            ? { comments: payload.comments }
            : {}
          : currentOrder.comments
            ? { comments: currentOrder.comments }
            : {}),
      };

      this.orders[index] = updatedOrder;
      return updatedOrder;
    },

    updateSalesOrderStatus(orderNumber: string, status: SalesOrderStatus) {
      return this.updateSalesOrder(orderNumber, { status });
    },

    deleteSalesOrder(orderNumber: string) {
      const index = this.orders.findIndex(
        (order) => normalizeOrderNumber(order.orderNumber) === normalizeOrderNumber(orderNumber),
      );

      if (index < 0) {
        throw new Error('No se encontró la orden');
      }

      const [removedOrder] = this.orders.splice(index, 1);
      if (!removedOrder) {
        throw new Error('No se encontró la orden');
      }

      return removedOrder;
    },

    seedDemoData() {
      if (this.orders.length > 0) {
        return;
      }

      this.orders = [
        {
          orderNumber: 'SO-1001',
          customerName: 'Acme Electronics',
          destination: 'Monterrey, MX',
          dueDate: '2026-03-20',
          status: 'Pendiente',
          comments: 'Lote inicial de tarjetas de control',
        },
        {
          orderNumber: 'SO-1002',
          customerName: 'Globex Manufacturing',
          destination: 'Queretaro, MX',
          dueDate: '2026-03-28',
          status: 'En Progreso',
          comments: 'Incluye prueba funcional al 100%',
        },
      ];
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSalesOrdersStore, import.meta.hot));
}
