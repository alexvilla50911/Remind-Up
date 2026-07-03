const form = document.getElementById('reminder-form');
const textInput = document.getElementById('text');
const datetimeInput = document.getElementById('datetime');
const offsetSelect = document.getElementById('offset');
const saveBtn = document.getElementById('save-btn');
const cancelBtn = document.getElementById('cancel-btn');
const status = document.getElementById('status');

function setDefaultDatetime() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  datetimeInput.value = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

setDefaultDatetime();

window.remindupAPI.onFocusNewReminder(() => {
  setDefaultDatetime();
  textInput.focus();
});

cancelBtn.addEventListener('click', () => {
  window.close();
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const text = textInput.value.trim();
  const datetime = datetimeInput.value;
  const offsetMinutes = Number(offsetSelect.value);

  if (!text || !datetime) return;

  saveBtn.disabled = true;
  status.classList.remove('error');
  status.textContent = '';

  try {
    await window.remindupAPI.saveReminder({ text, datetime, offsetMinutes });

    status.textContent = 'Recordatorio guardado';
    form.reset();
    setDefaultDatetime();
  } catch (err) {
    status.classList.add('error');
    status.textContent = 'Ocurrió un error al guardar el recordatorio';
    console.error(err);
  } finally {
    saveBtn.disabled = false;
  }
});
