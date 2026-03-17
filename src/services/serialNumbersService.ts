import { supabase } from 'src/lib/supabase';

export interface SerialNumberRow {
  id: number;
  serial_number: string;
  product_name?: string | null;
  work_order_id: number;
  created_at?: string;
}

export interface SerialNumberRecord {
  id: number;
  serialNumber: string;
  productName?: string;
  workOrderId: number;
  createdAt?: string;
}

export interface ExistingSerialRegistration {
  serialNumber: string;
  workOrderId: number;
  orderNumber: string;
}

const mapRowToSerial = (row: SerialNumberRow): SerialNumberRecord => ({
  id: row.id,
  serialNumber: row.serial_number,
  ...(row.product_name ? { productName: row.product_name } : {}),
  workOrderId: row.work_order_id,
  ...(row.created_at ? { createdAt: row.created_at } : {}),
});

export async function getSerialNumbers(): Promise<SerialNumberRecord[]> {
  const { data, error } = await supabase
    .from('serial_numbers')
    .select('*')
    .order('id', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => mapRowToSerial(row as SerialNumberRow));
}

export async function addSerialNumber(serialNumber: string, workOrderId: number): Promise<SerialNumberRecord> {
  const { data, error } = await supabase
    .from('serial_numbers')
    .insert([
      {
        serial_number: serialNumber,
        work_order_id: workOrderId,
      },
    ])
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return mapRowToSerial(data as SerialNumberRow);
}

export async function deleteSerialNumber(id: number): Promise<void> {
  const { error } = await supabase.from('serial_numbers').delete().eq('id', id);

  if (error) {
    throw error;
  }
}

export async function getSerialsByOrder(workOrderId: number): Promise<SerialNumberRecord[]> {
  const { data, error } = await supabase
    .from('serial_numbers')
    .select('*')
    .eq('work_order_id', workOrderId)
    .order('id', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => mapRowToSerial(row as SerialNumberRow));
}

export async function findSerialRegistration(
  serialNumber: string,
): Promise<ExistingSerialRegistration | null> {
  const normalizedSerial = serialNumber.trim();
  if (!normalizedSerial) {
    return null;
  }

  const { data: serialRow, error: serialError } = await supabase
    .from('serial_numbers')
    .select('serial_number, work_order_id')
    .ilike('serial_number', normalizedSerial)
    .limit(1)
    .maybeSingle();

  if (serialError) {
    throw serialError;
  }

  if (!serialRow) {
    return null;
  }

  const { data: orderRow, error: orderError } = await supabase
    .from('work_orders')
    .select('order_number')
    .eq('id', serialRow.work_order_id)
    .maybeSingle();

  if (orderError) {
    throw orderError;
  }

  return {
    serialNumber: serialRow.serial_number,
    workOrderId: serialRow.work_order_id,
    orderNumber: orderRow?.order_number ?? `ID-${serialRow.work_order_id}`,
  };
}
