import { isAdmin } from '../../lib/auth.js';
import {
  deleteEventImage,
  getEventImagePublicUrl,
  uploadEventImage,
  validateImageFile,
} from '../../lib/eventImages.js';
import { EVENT_CATEGORIES, createEvent, fetchEventById, updateEvent } from '../../lib/events.js';
import { fromDatetimeLocalValue, toDatetimeLocalValue } from '../../lib/format.js';
import { navigate } from '../../router/router.js';
import { toast } from '../../lib/toast.js';

function populateCategories(selectEl, selected) {
  selectEl.innerHTML = EVENT_CATEGORIES.map(
    (category) =>
      `<option value="${category.name}"${category.name === selected ? ' selected' : ''}>${category.name}</option>`,
  ).join('');
}

function setLoading(form, loading) {
  const button = form.querySelector('[data-submit-btn]');
  if (!button) return;

  if (loading) {
    button.disabled = true;
    button.dataset.originalHtml = button.innerHTML;
    button.innerHTML =
      '<span class="spinner-border spinner-border-sm me-2"></span>Saving…';
  } else {
    button.disabled = false;
    if (button.dataset.originalHtml) {
      button.innerHTML = button.dataset.originalHtml;
    }
  }
}

function readForm(form) {
  return {
    title: form.title.value.trim(),
    description: form.description.value.trim(),
    location: form.location.value.trim(),
    category: form.category.value,
    eventDate: fromDatetimeLocalValue(form.eventDate.value),
    capacity: Number(form.capacity.value),
    ticketPrice: Number(form.ticketPrice.value),
  };
}

function validateForm(values) {
  if (!values.title || !values.location || !values.eventDate || !values.category) {
    toast.error('Please fill in all required fields.');
    return false;
  }

  if (!Number.isInteger(values.capacity) || values.capacity < 1) {
    toast.error('Capacity must be at least 1.');
    return false;
  }

  if (Number.isNaN(values.ticketPrice) || values.ticketPrice < 0) {
    toast.error('Ticket price must be 0 or greater.');
    return false;
  }

  return true;
}

function revokePreviewUrl(url) {
  if (url?.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}

function showImagePreview(previewWrap, previewImg, src) {
  if (!previewWrap || !previewImg || !src) {
    previewWrap?.classList.add('d-none');
    if (previewImg) previewImg.removeAttribute('src');
    return;
  }

  previewImg.src = src;
  previewWrap.classList.remove('d-none');
}

async function saveCoverImage({ eventId, pendingImageFile, existingCoverPath }) {
  const newPath = await uploadEventImage(eventId, pendingImageFile);

  if (existingCoverPath && existingCoverPath !== newPath) {
    await deleteEventImage(existingCoverPath).catch(() => {});
  }

  return newPath;
}

export async function initEventForm(container, options = {}) {
  const {
    mode,
    eventId,
    backHref = '/events',
    cancelHref = '/events',
    successHref,
    notFoundHref = '/events',
  } = options;

  const form = container.querySelector('.event-form');
  const titleEl = container.querySelector('[data-form-title]');
  const subtitleEl = container.querySelector('[data-form-subtitle]');
  const categorySelect = container.querySelector('[data-category-select]');
  const backLink = container.querySelector('[data-back-link]');
  const cancelLink = container.querySelector('[data-cancel-link]');
  const coverSection = container.querySelector('[data-cover-image-section]');
  const coverInput = container.querySelector('[data-cover-image-input]');
  const previewWrap = container.querySelector('[data-cover-image-preview]');
  const previewImg = container.querySelector('[data-cover-image-preview-img]');
  const removeImageBtn = container.querySelector('[data-cover-image-remove]');

  let pendingImageFile = null;
  let originalCoverPath = null;
  let removeCoverImage = false;
  let previewObjectUrl = null;
  let previewSource = 'none';

  function setPreview(source, src = null) {
    previewSource = source;
    showImagePreview(previewWrap, previewImg, src);
  }

  function clearPendingSelection() {
    pendingImageFile = null;
    coverInput.value = '';
    revokePreviewUrl(previewObjectUrl);
    previewObjectUrl = null;
  }

  function restoreExistingPreview() {
    if (originalCoverPath && !removeCoverImage) {
      setPreview('existing', getEventImagePublicUrl(originalCoverPath));
      return;
    }

    setPreview('none');
  }

  function handleRemoveImage() {
    if (previewSource === 'pending') {
      clearPendingSelection();
      restoreExistingPreview();
      return;
    }

    if (previewSource === 'existing') {
      removeCoverImage = true;
      clearPendingSelection();
      setPreview('none');
    }
  }

  if (backLink) backLink.setAttribute('href', backHref);
  if (cancelLink) cancelLink.setAttribute('href', cancelHref);

  const admin = await isAdmin();
  if (admin) {
    coverSection?.classList.remove('d-none');
  }

  removeImageBtn?.addEventListener('click', handleRemoveImage);

  coverInput?.addEventListener('change', () => {
    const file = coverInput.files?.[0] ?? null;

    if (!file) {
      clearPendingSelection();
      restoreExistingPreview();
      return;
    }

    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast.error(validation.message);
      coverInput.value = '';
      return;
    }

    removeCoverImage = false;
    pendingImageFile = file;
    revokePreviewUrl(previewObjectUrl);
    previewObjectUrl = URL.createObjectURL(file);
    setPreview('pending', previewObjectUrl);
  });

  if (mode === 'edit') {
    titleEl.textContent = 'Edit event';
    subtitleEl.textContent = 'Update event details.';
    form.querySelector('[data-submit-btn]').innerHTML =
      '<i class="bi bi-check2 me-2"></i>Save changes';

    try {
      const event = await fetchEventById(eventId);
      if (!event) {
        toast.error('Event not found.');
        navigate(notFoundHref);
        return;
      }

      originalCoverPath = event.coverImagePath;
      populateCategories(categorySelect, event.category);
      form.title.value = event.title;
      form.description.value = event.description ?? '';
      form.location.value = event.location ?? '';
      form.eventDate.value = toDatetimeLocalValue(event.eventDate);
      form.capacity.value = event.capacity;
      form.ticketPrice.value = event.ticketPrice ?? 0;

      if (admin && event.coverImageUrl) {
        setPreview('existing', event.coverImageUrl);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to load event.');
      navigate(notFoundHref);
      return;
    }
  } else {
    populateCategories(categorySelect);
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const values = readForm(form);
    if (!validateForm(values)) return;

    if (pendingImageFile) {
      const validation = validateImageFile(pendingImageFile);
      if (!validation.valid) {
        toast.error(validation.message);
        return;
      }
    }

    setLoading(form, true);

    try {
      if (mode === 'edit') {
        let coverImagePath = originalCoverPath;

        if (admin) {
          if (pendingImageFile) {
            coverImagePath = await saveCoverImage({
              eventId,
              pendingImageFile,
              existingCoverPath: originalCoverPath,
            });
          } else if (removeCoverImage && originalCoverPath) {
            await deleteEventImage(originalCoverPath);
            coverImagePath = null;
          }
        }

        await updateEvent(eventId, {
          ...values,
          coverImagePath: admin ? coverImagePath : undefined,
        });
        toast.info('Event updated.');
        revokePreviewUrl(previewObjectUrl);
        navigate(successHref ?? `/event/${eventId}`);
        return;
      }

      const newEventId = await createEvent(values);

      if (admin && pendingImageFile) {
        const coverImagePath = await saveCoverImage({
          eventId: newEventId,
          pendingImageFile,
          existingCoverPath: null,
        });
        await updateEvent(newEventId, { ...values, coverImagePath });
      }

      toast.info('Event created.');
      revokePreviewUrl(previewObjectUrl);
      navigate(successHref ?? `/event/${newEventId}`);
    } catch (error) {
      toast.error(error.message || 'Failed to save event.');
    } finally {
      setLoading(form, false);
    }
  });
}
