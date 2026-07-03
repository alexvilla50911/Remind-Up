const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('remindupAPI', {
  getReminders: () => ipcRenderer.invoke('reminders:getAll'),
  saveReminder: (reminder) => ipcRenderer.invoke('reminders:save', reminder),
  onFocusNewReminder: (callback) =>
    ipcRenderer.on('focus-new-reminder', callback)
});
