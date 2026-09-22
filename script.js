'use strict';

const storageKeys = {
  favorites: 'northStarPreorderShortlist',
  formDraft: 'northStarContactDraft'
};

const productCatalog = [
  { id: 'signature-loaf', name: 'Signature Loaf', category: 'Bread' },
  { id: 'country-sourdough', name: 'Country sourdough', category: 'Bread' },
  { id: 'seeded-whole-grain', name: 'Seeded whole grain', category: 'Bread' },
  { id: 'soft-sandwich-loaf', name: 'Soft sandwich loaf', category: 'Bread' },
  { id: 'butter-croissants', name: 'Butter croissants', category: 'Pastry' },
  { id: 'fruit-danishes', name: 'Fruit danishes', category: 'Pastry' },
  { id: 'morning-buns', name: 'Morning buns', category: 'Pastry' },
  { id: 'celebration-cakes', name: 'Celebration cakes', category: 'Cake' },
  { id: 'sheet-cakes', name: 'Sheet cakes', category: 'Cake' },
  { id: 'small-occasion-cakes', name: 'Small occasion cakes', category: 'Cake' }
];

const validationRules = {
  nameMinLength: 2,
  itemMinLength: 10,
  emailPattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
};

function readJsonStorage(storage, key, fallback) {
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    return fallback;
  }
}

function writeJsonStorage(storage, key, value) {
  storage.setItem(key, JSON.stringify(value));
}

function getFavoriteIds() {
  const saved = readJsonStorage(localStorage, storageKeys.favorites, []);
  return Array.isArray(saved) ? saved : [];
}

function saveFavoriteIds(ids) {
  writeJsonStorage(localStorage, storageKeys.favorites, ids);
}

function getProductById(id) {
  return productCatalog.find((product) => product.id === id);
}

function renderShortlist() {
  const list = document.getElementById('shortlist-items');
  const status = document.getElementById('shortlist-status');
  const clearButton = document.getElementById('clear-shortlist');
  const preorderLink = document.getElementById('shortlist-preorder-link');

  if (!list || !status) {
    return;
  }

  const favoriteIds = getFavoriteIds();
  const favoriteProducts = favoriteIds.map(getProductById).filter(Boolean);

  list.replaceChildren();

  if (favoriteProducts.length === 0) {
    status.textContent = 'No products are saved yet. Choose items below to build a pre-order shortlist.';
  } else {
    status.textContent = `${favoriteProducts.length} ${favoriteProducts.length === 1 ? 'item is' : 'items are'} saved for your pre-order.`;
    favoriteProducts.forEach((product) => {
      const item = document.createElement('li');
      item.textContent = `${product.name} (${product.category})`;
      list.appendChild(item);
    });
  }

  if (clearButton) {
    clearButton.disabled = favoriteProducts.length === 0;
  }

  if (preorderLink) {
    preorderLink.hidden = favoriteProducts.length === 0;
  }

  document.querySelectorAll('[data-product-id]').forEach((button) => {
    const isSaved = favoriteIds.includes(button.dataset.productId);
    button.setAttribute('aria-pressed', String(isSaved));
    button.textContent = isSaved ? 'Saved to shortlist' : 'Save to shortlist';
  });
}

function toggleFavorite(productId) {
  const favorites = getFavoriteIds();
  const existingIndex = favorites.indexOf(productId);

  if (existingIndex >= 0) {
    favorites.splice(existingIndex, 1);
  } else {
    favorites.push(productId);
  }

  saveFavoriteIds(favorites);
  renderShortlist();
}

function initializeShortlist() {
  const buttons = document.querySelectorAll('[data-product-id]');
  if (buttons.length === 0) {
    return;
  }

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      toggleFavorite(button.dataset.productId);
    });
  });

  const clearButton = document.getElementById('clear-shortlist');
  if (clearButton) {
    clearButton.addEventListener('click', () => {
      saveFavoriteIds([]);
      renderShortlist();
    });
  }

  renderShortlist();
}

function getFormDraft(form) {
  return {
    name: form.elements.customer_name.value,
    email: form.elements.customer_email.value,
    pickupDate: form.elements.pickup_date.value,
    requestType: form.elements.request_type.value,
    itemDetails: form.elements.item_details.value,
    allergyNotes: form.elements.allergy_notes.value
  };
}

function saveFormDraft(form) {
  writeJsonStorage(sessionStorage, storageKeys.formDraft, getFormDraft(form));
  const savedMessage = document.getElementById('draft-status');
  if (savedMessage) {
    savedMessage.textContent = 'Your form draft is saved for this browser tab.';
  }
}

function restoreFormDraft(form) {
  const draft = readJsonStorage(sessionStorage, storageKeys.formDraft, null);
  if (!draft || typeof draft !== 'object') {
    return false;
  }

  form.elements.customer_name.value = draft.name || '';
  form.elements.customer_email.value = draft.email || '';
  form.elements.pickup_date.value = draft.pickupDate || '';
  form.elements.request_type.value = draft.requestType || '';
  form.elements.item_details.value = draft.itemDetails || '';
  form.elements.allergy_notes.value = draft.allergyNotes || '';
  return true;
}

function prefillSavedShortlist(form) {
  const favoriteIds = getFavoriteIds();
  const favoriteProducts = favoriteIds.map(getProductById).filter(Boolean);
  const note = document.getElementById('saved-shortlist-note');

  if (favoriteProducts.length === 0) {
    return false;
  }

  const names = favoriteProducts.map((product) => product.name);
  const itemDetails = form.elements.item_details;

  if (!itemDetails.value.trim()) {
    itemDetails.value = `Saved pre-order shortlist: ${names.join(', ')}`;
  }

  if (!form.elements.request_type.value) {
    form.elements.request_type.value = 'pre-order';
  }

  if (note) {
    note.hidden = false;
    note.textContent = `Your saved shortlist was added to the form: ${names.join(', ')}.`;
  }

  return true;
}

function setFieldError(fieldId, message) {
  const field = document.getElementById(fieldId);
  const error = document.getElementById(`${fieldId}-error`);

  if (field) {
    field.classList.toggle('input-error', Boolean(message));
    field.setAttribute('aria-invalid', String(Boolean(message)));
  }

  if (error) {
    error.textContent = message;
  }
}

function clearValidationErrors() {
  const fieldIds = ['customer-name', 'customer-email', 'pickup-date', 'request-type', 'item-details'];
  fieldIds.forEach((fieldId) => setFieldError(fieldId, ''));
}

function validateContactForm(form) {
  clearValidationErrors();
  const invalidFields = [];
  const name = form.elements.customer_name.value.trim();
  const email = form.elements.customer_email.value.trim();
  const pickupDate = form.elements.pickup_date.value;
  const requestType = form.elements.request_type.value;
  const itemDetails = form.elements.item_details.value.trim();

  if (name.length < validationRules.nameMinLength) {
    setFieldError('customer-name', 'Enter your name using at least 2 characters.');
    invalidFields.push('customer-name');
  }

  if (!validationRules.emailPattern.test(email)) {
    setFieldError('customer-email', 'Enter a valid email address, such as name@example.com.');
    invalidFields.push('customer-email');
  }

  if (!pickupDate) {
    setFieldError('pickup-date', 'Choose a pickup date for your request.');
    invalidFields.push('pickup-date');
  } else {
    const selected = new Date(`${pickupDate}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selected < today) {
      setFieldError('pickup-date', 'Choose today or a future date for pickup.');
      invalidFields.push('pickup-date');
    }
  }

  if (!requestType) {
    setFieldError('request-type', 'Choose whether this is a pre-order or a general question.');
    invalidFields.push('request-type');
  }

  if (itemDetails.length < validationRules.itemMinLength) {
    setFieldError('item-details', 'Add at least 10 characters so the bakery can understand your request.');
    invalidFields.push('item-details');
  }

  return invalidFields;
}

function handleFormSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const status = document.getElementById('form-status');
  const invalidFields = validateContactForm(form);

  if (invalidFields.length > 0) {
    if (status) {
      status.className = 'status-message form-error-summary';
      status.textContent = 'Please correct the highlighted fields before sending your request.';
    }
    document.getElementById(invalidFields[0])?.focus();
    saveFormDraft(form);
    return;
  }

  if (status) {
    status.className = 'status-message form-success';
    status.textContent = `Thanks, ${form.elements.customer_name.value.trim()}. Your request is ready for the bakery to review.`;
  }

  sessionStorage.removeItem(storageKeys.formDraft);
}

function initializeContactForm() {
  const form = document.getElementById('preorder-form');
  if (!form) {
    return;
  }

  const restored = restoreFormDraft(form);
  const shortlistAdded = prefillSavedShortlist(form);
  const draftStatus = document.getElementById('draft-status');

  if (draftStatus && restored) {
    draftStatus.textContent = 'Your saved form draft was restored for this browser tab.';
  } else if (draftStatus && shortlistAdded) {
    draftStatus.textContent = 'Your saved product shortlist was added to the request form.';
  }

  form.addEventListener('input', () => saveFormDraft(form));
  form.addEventListener('change', () => saveFormDraft(form));
  form.addEventListener('submit', handleFormSubmit);
}

function initializeSite() {
  initializeShortlist();
  initializeContactForm();
}

document.addEventListener('DOMContentLoaded', initializeSite);
