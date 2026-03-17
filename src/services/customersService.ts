import { supabase } from 'src/lib/supabase';

interface CustomerRow {
  id: string;
  name: string | null;
  created_at?: string | null;
}

export interface CustomerRecord {
  id: string;
  name: string;
  createdAt?: string;
}

function normalizeCustomerName(name: string) {
  return name.trim().replace(/\s+/g, ' ');
}

function mapRowToCustomer(row: CustomerRow): CustomerRecord | null {
  const normalizedName = normalizeCustomerName(row.name ?? '');
  if (!normalizedName) {
    return null;
  }

  return {
    id: row.id,
    name: normalizedName,
    ...(row.created_at ? { createdAt: row.created_at } : {}),
  };
}

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

export async function getCustomers(): Promise<CustomerRecord[]> {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? [])
    .map((row) => mapRowToCustomer(row as CustomerRow))
    .filter((row): row is CustomerRecord => row !== null);
}

export async function findCustomerByName(name: string): Promise<CustomerRecord | null> {
  const normalizedName = normalizeCustomerName(name);
  if (!normalizedName) {
    return null;
  }

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .ilike('name', normalizedName)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapRowToCustomer(data as CustomerRow) : null;
}

export async function createCustomer(name: string): Promise<CustomerRecord> {
  const normalizedName = normalizeCustomerName(name);
  if (!normalizedName) {
    throw new Error('El nombre de cliente es requerido');
  }

  const { error } = await supabase
    .from('customers')
    .insert([{ name: normalizedName }]);

  if (error) {
    throw new Error(getErrorMessage(error, 'No se pudo crear el cliente'));
  }

  const createdCustomer = await findCustomerByName(normalizedName);
  if (!createdCustomer) {
    throw new Error('El cliente fue creado, pero no se pudo recuperar su registro');
  }

  return createdCustomer;
}

export async function getOrCreateCustomer(name: string): Promise<CustomerRecord> {
  const normalizedName = normalizeCustomerName(name);
  if (!normalizedName) {
    throw new Error('El nombre de cliente es requerido');
  }

  const existingCustomer = await findCustomerByName(normalizedName);
  if (existingCustomer) {
    return existingCustomer;
  }

  try {
    return await createCustomer(normalizedName);
  } catch (error: unknown) {
    const possibleDuplicate =
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === '23505';

    if (possibleDuplicate) {
      const duplicatedCustomer = await findCustomerByName(normalizedName);
      if (duplicatedCustomer) {
        return duplicatedCustomer;
      }
    }

    throw new Error(getErrorMessage(error, 'No se pudo guardar el cliente'));
  }
}
