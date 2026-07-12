import { supabase } from './supabase.js';

export const EVENT_IMAGES_BUCKET = 'event-images';

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

const EXTENSION_BY_TYPE = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export function validateImageFile(file) {
  if (!file) {
    return { valid: true };
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { valid: false, message: 'Only JPEG, PNG, and WebP images are allowed.' };
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return { valid: false, message: 'Image must be 5 MB or smaller.' };
  }

  return { valid: true };
}

export function buildImagePath(eventId, file) {
  const extension = EXTENSION_BY_TYPE[file.type] ?? 'img';
  const uniqueName = `${Date.now()}-${crypto.randomUUID()}.${extension}`;
  return `events/${eventId}/${uniqueName}`;
}

export function getEventImagePublicUrl(path) {
  if (!path) return null;

  const { data } = supabase.storage.from(EVENT_IMAGES_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadEventImage(eventId, file) {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.message);
  }

  const path = buildImagePath(eventId, file);
  const { error } = await supabase.storage.from(EVENT_IMAGES_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type,
  });

  if (error) throw error;
  return path;
}

export async function deleteEventImage(path) {
  if (!path) return;

  const { error } = await supabase.storage.from(EVENT_IMAGES_BUCKET).remove([path]);
  if (error) throw error;
}
