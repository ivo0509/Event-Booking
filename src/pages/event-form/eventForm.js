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

  return true;
}

export async function initEventForm(container, { mode, eventId }) {
  const form = container.querySelector('.event-form');
  const titleEl = container.querySelector('[data-form-title]');
  const subtitleEl = container.querySelector('[data-form-subtitle]');
  const categorySelect = container.querySelector('[data-category-select]');

  if (mode === 'edit') {
    titleEl.textContent = 'Edit event';
    subtitleEl.textContent = 'Update event details.';
    form.querySelector('[data-submit-btn]').innerHTML =
      '<i class="bi bi-check2 me-2"></i>Save changes';

    try {
      const event = await fetchEventById(eventId);
      if (!event) {
        toast.error('Event not found.');
        navigate('/events');
        return;
      }

      populateCategories(categorySelect, event.category);
      form.title.value = event.title;
      form.description.value = event.description ?? '';
      form.location.value = event.location ?? '';
      form.eventDate.value = toDatetimeLocalValue(event.eventDate);
      form.capacity.value = event.capacity;
    } catch (error) {
      toast.error(error.message || 'Failed to load event.');
      navigate('/events');
      return;
    }
  } else {
    populateCategories(categorySelect);
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const values = readForm(form);
    if (!validateForm(values)) return;

    setLoading(form, true);

    try {
      if (mode === 'edit') {
        await updateEvent(eventId, values);
        toast.info('Event updated.');
        navigate(`/event/${eventId}`);
        return;
      }

      const newEventId = await createEvent(values);
      toast.info('Event created.');
      navigate(`/event/${newEventId}`);
    } catch (error) {
      toast.error(error.message || 'Failed to save event.');
    } finally {
      setLoading(form, false);
    }
  });
}
