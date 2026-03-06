import { supabase } from 'src/lib/supabase';

export type OrderStatus = 'Pendiente' | 'En Progreso' | 'Finalizado';

export interface WorkOrderRow {
  id: number;
  order_number: string;
  customer_name: string;
  destination: string;
  due_date: string;
  status: OrderStatus;
  comments: string | null;
  attachment_url: string | null;
  created_at?: string;
}

export interface WorkOrder {
  id: number;
  orderNumber: string;
  customerName: string;
  destination: string;
  dueDate: string;
  status: OrderStatus;
  comments?: string;
  attachmentUrl?: string;
}

export interface CreateOrderInput {
  orderNumber: string;
  customerName: string;
  destination: string;
  dueDate: string;
  status: OrderStatus;
  comments?: string;
  attachmentUrl?: string;
}

export interface UpdateOrderInput {
  customerName?: string;
  destination?: string;
  dueDate?: string;
  status?: OrderStatus;
  comments?: string;
  attachmentUrl?: string | null;
}

const mapRowToOrder = (row: WorkOrderRow): WorkOrder => ({
  id: row.id,
  orderNumber: row.order_number,
  customerName: row.customer_name,
  destination: row.destination,
  dueDate: row.due_date,
  status: row.status,
  ...(row.comments ? { comments: row.comments } : {}),
  ...(row.attachment_url ? { attachmentUrl: row.attachment_url } : {}),
});

export async function getOrders(): Promise<WorkOrder[]> {
  const { data, error } = await supabase
    .from('work_orders')
    .select('*')
    .order('id', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => mapRowToOrder(row as WorkOrderRow));
}

export async function createOrder(order: CreateOrderInput): Promise<WorkOrder> {
  const payload = {
    order_number: order.orderNumber,
    customer_name: order.customerName,
    destination: order.destination,
    due_date: order.dueDate,
    status: order.status,
    comments: order.comments?.trim() || null,
    attachment_url: order.attachmentUrl ?? null,
  };

  const { data, error } = await supabase.from('work_orders').insert([payload]).select('*').single();

  if (error) {
    throw error;
  }

  return mapRowToOrder(data as WorkOrderRow);
}

export async function updateOrder(id: number, order: UpdateOrderInput): Promise<WorkOrder> {
  const payload: {
    customer_name?: string;
    destination?: string;
    due_date?: string;
    status?: OrderStatus;
    comments?: string | null;
    attachment_url?: string | null;
  } = {};

  if (order.customerName !== undefined) payload.customer_name = order.customerName;
  if (order.destination !== undefined) payload.destination = order.destination;
  if (order.dueDate !== undefined) payload.due_date = order.dueDate;
  if (order.status !== undefined) payload.status = order.status;
  if (order.comments !== undefined) payload.comments = order.comments.trim() || null;
  if (order.attachmentUrl !== undefined) payload.attachment_url = order.attachmentUrl;

  const { data, error } = await supabase
    .from('work_orders')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return mapRowToOrder(data as WorkOrderRow);
}

export async function deleteOrder(id: number): Promise<void> {
  const { error } = await supabase.from('work_orders').delete().eq('id', id);

  if (error) {
    throw error;
  }
}
