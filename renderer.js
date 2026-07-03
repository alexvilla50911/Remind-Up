const form = document.getElementById('reminder-form');
const textInput = document.getElementById('text');
const datetimeInput = document.getElementById('datetime');
const saveBtn = document.getElementById('save-btn');
const status = document.getElementById('status');

// Cuando el menú "Recordatorios > Nuevo recordatorio" o el atajo Cmd+N
// disparan la ventana, se enfoca directamente el campo de texto.
window.remindupAPI.onFocusNewReminder(() => {
  textInput.focus();
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const text = textInput.value.trim();
  const datetime = datetimeInput.value;

  if (!text || !datetime) return;

  saveBtn.disabled = true;
  status.textContent = '';

  try {
    await window.remindupAPI.saveReminder({ text, datetime });

    status.textContent = 'Recordatorio guardado ✓';
    form.reset();
  } catch (err) {
    status.style.color = '#e74c3c';
    status.textContent = 'Ocurrió un error al guardar el recordatorio';
    console.error(err);
  } finally {
    saveBtn.disabled = false;
  }
});
