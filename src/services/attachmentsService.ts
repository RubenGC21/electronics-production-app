import { supabase } from 'src/lib/supabase';

const ATTACHMENTS_BUCKET = 'order-attachments';
const EVIDENCE_FOLDER = 'evidences';
const IMAGE_EXTENSIONS = new Set([
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
  'bmp',
  'svg',
  'avif',
  'tif',
  'tiff',
  'heic',
  'heif',
  'jfif',
]);

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
}

function sanitizeOrderFolder(orderNumber: string) {
  return orderNumber.replace(/[^a-zA-Z0-9_-]/g, '_');
}

function isImageFileName(fileName: string) {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  return IMAGE_EXTENSIONS.has(extension);
}

export interface OrderAttachmentItem {
  name: string;
  path: string;
  comment?: string;
  createdAt?: string;
}

export type OrderEvidenceItem = OrderAttachmentItem;

function encodeComment(comment?: string) {
  const normalized = comment?.trim();
  if (!normalized) {
    return '';
  }

  const utf8 = new TextEncoder().encode(normalized);
  let binary = '';
  utf8.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  const base64 = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  return `c_${base64}`;
}

function decodeComment(token?: string) {
  if (!token || !token.startsWith('c_')) {
    return '';
  }

  try {
    const base64 = token
      .slice(2)
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(token.slice(2).length / 4) * 4, '=');
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes).trim();
  } catch {
    return '';
  }
}

function parseAttachmentName(storedName: string) {
  const parts = storedName.split('__');
  if (parts.length >= 3) {
    const [, commentToken, ...nameParts] = parts;
    const fileName = nameParts.join('__');
    const comment = decodeComment(commentToken);
    return {
      fileName: fileName || storedName,
      comment: comment || undefined,
    };
  }

  return { fileName: storedName };
}

function buildStoredFileName(fileName: string, comment?: string) {
  const timestamp = Date.now();
  const safeFileName = sanitizeFileName(fileName);
  const encodedComment = encodeComment(comment);
  return encodedComment
    ? `${timestamp}__${encodedComment}__${safeFileName}`
    : `${timestamp}-${safeFileName}`;
}

async function uploadToStorage(path: string, file: File): Promise<string> {
  const { error: uploadError } = await supabase.storage
    .from(ATTACHMENTS_BUCKET)
    .upload(path, file, { upsert: true });

  if (uploadError) {
    throw uploadError;
  }

  return path;
}

function mapStorageEntryToAttachment(folder: string, itemName: string, createdAt?: string) {
  const parsed = parseAttachmentName(itemName);
  return {
    name: parsed.fileName,
    path: `${folder}/${itemName}`,
    ...(parsed.comment ? { comment: parsed.comment } : {}),
    ...(createdAt ? { createdAt } : {}),
  };
}

async function listStorageEntries(
  folder: string,
  limit: number,
  predicate: (itemName: string) => boolean,
): Promise<OrderAttachmentItem[]> {
  const { data, error } = await supabase.storage
    .from(ATTACHMENTS_BUCKET)
    .list(folder, { limit, sortBy: { column: 'name', order: 'desc' } });

  if (error) {
    throw error;
  }

  return (data ?? [])
    .filter((item) => !!item.name && !item.name.endsWith('/') && predicate(item.name))
    .map((item) => mapStorageEntryToAttachment(folder, item.name, item.created_at));
}

export async function uploadOrderAttachment(
  file: File,
  orderNumber: string,
  comment?: string,
): Promise<string> {
  const safeOrderNumber = sanitizeOrderFolder(orderNumber);
  const storedFileName = buildStoredFileName(file.name, comment);
  return uploadToStorage(`${safeOrderNumber}/${storedFileName}`, file);
}

export async function listOrderAttachments(orderNumber: string): Promise<OrderAttachmentItem[]> {
  const folder = sanitizeOrderFolder(orderNumber);
  return listStorageEntries(folder, 100, (itemName) => itemName !== EVIDENCE_FOLDER);
}

export async function uploadOrderEvidenceImage(
  file: File,
  orderNumber: string,
  comment?: string,
): Promise<string> {
  const safeOrderNumber = sanitizeOrderFolder(orderNumber);
  const storedFileName = buildStoredFileName(file.name, comment);
  return uploadToStorage(`${safeOrderNumber}/${EVIDENCE_FOLDER}/${storedFileName}`, file);
}

export async function listOrderEvidenceImages(orderNumber: string): Promise<OrderEvidenceItem[]> {
  const folder = `${sanitizeOrderFolder(orderNumber)}/${EVIDENCE_FOLDER}`;
  return listStorageEntries(folder, 200, isImageFileName);
}

export async function getOrderAttachmentSignedUrl(
  filePath: string,
  expiresInSeconds = 600,
): Promise<string> {
  if (/^https?:\/\//i.test(filePath)) {
    return filePath;
  }

  const { data, error } = await supabase.storage
    .from(ATTACHMENTS_BUCKET)
    .createSignedUrl(filePath, expiresInSeconds);

  if (!error && data?.signedUrl) {
    return data.signedUrl;
  }

  throw error ?? new Error('No se pudo generar URL firmada');
}
