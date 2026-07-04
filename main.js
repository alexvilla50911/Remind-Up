const { app, BrowserWindow, Menu, Tray, nativeImage, ipcMain, Notification, shell, powerMonitor } = require('electron');
const path = require('path');
const Store = require('electron-store');

const store = new Store({
  name: 'reminders',
  defaults: { reminders: [] }
});

const config = new Store({
  name: 'config',
  defaults: { telegramToken: '', telegramChatId: '' }
});

let mainWindow = null;
let tray = null;

const scheduledTimers = new Map();

async function sendWebhookAlert(reminder) {
  const token = config.get('telegramToken');
  const chatId = config.get('telegramChatId');

  if (!token || !chatId) return;

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: `Recordatorio: ${reminder.text}`
    })
  });

  if (!response.ok) {
    throw new Error(`Telegram respondió ${response.status}`);
  }
}

function createWindow() {
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
    return;
  }

  mainWindow = new BrowserWindow({
    width: 440,
    height: 560,
    resizable: false,
    title: 'RemindUP',
    backgroundColor: '#15132b',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile('index.html');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function openNewReminderWindow() {
  createWindow();
  if (mainWindow) {
    mainWindow.webContents.once('did-finish-load', () => {
      mainWindow.webContents.send('focus-new-reminder');
    });
  }
}

function createTray() {
  const icon = nativeImage.createEmpty();
  tray = new Tray(icon);
  tray.setTitle('RemindUP');
  tray.setToolTip('RemindUP - Recordatorios');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Nuevo recordatorio',
      accelerator: 'CmdOrCtrl+N',
      click: () => openNewReminderWindow()
    },
    { type: 'separator' },
    { label: 'Salir', role: 'quit' }
  ]);

  tray.on('click', () => openNewReminderWindow());
  tray.on('right-click', () => tray.popUpContextMenu(contextMenu));
}

function buildMenu() {
  const isMac = process.platform === 'darwin';

  const template = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about' },
              { type: 'separator' },
              { role: 'services' },
              { type: 'separator' },
              { role: 'hide' },
              { role: 'hideOthers' },
              { role: 'unhide' },
              { type: 'separator' },
              { role: 'quit' }
            ]
          }
        ]
      : []),
    {
      label: 'Archivo',
      submenu: [isMac ? { role: 'close' } : { role: 'quit' }]
    },
    {
      label: 'Edición',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'Recordatorios',
      submenu: [
        {
          label: 'Nuevo recordatorio',
          accelerator: 'CmdOrCtrl+N',
          click: () => openNewReminderWindow()
        }
      ]
    },
    {
      label: 'Ver',
      submenu: [{ role: 'reload' }, { role: 'toggleDevTools' }]
    },
    {
      label: 'Ventana',
      submenu: [{ role: 'minimize' }, { role: 'zoom' }, { role: 'front' }]
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'Acerca de RemindUP',
          click: () => shell.openExternal('https://github.com')
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

//notis
function fireReminder(reminder) {
  scheduledTimers.delete(reminder.id);

  const notification = new Notification({
    title: 'Recordatorio',
    body: reminder.text,
    sound: 'default'
  });
  notification.show();

  sendWebhookAlert(reminder).catch((err) => {
    console.error('Error enviando webhook de recordatorio:', err);
  });

  markReminderAsNotified(reminder.id);
}

function scheduleReminder(reminder) {
  const existingTimer = scheduledTimers.get(reminder.id);
  if (existingTimer) clearTimeout(existingTimer);

  const notifyAt = reminder.notifyAt || reminder.datetime;
  const delay = new Date(notifyAt).getTime() - Date.now();

  if (delay <= 0) {
    fireReminder(reminder);
    return;
  }

  const MAX_DELAY = 2147483647;

  const timerId =
    delay > MAX_DELAY
      ? setTimeout(() => scheduleReminder(reminder), MAX_DELAY)
      : setTimeout(() => fireReminder(reminder), delay);

  scheduledTimers.set(reminder.id, timerId);
}

function scheduleAllPendingReminders() {
  const reminders = store.get('reminders', []);
  reminders
    .filter((r) => !r.notified)
    .forEach((reminder) => scheduleReminder(reminder));
}

function markReminderAsNotified(id) {
  const reminders = store.get('reminders', []);
  const updated = reminders.map((r) =>
    r.id === id ? { ...r, notified: true } : r
  );
  store.set('reminders', updated);
}

ipcMain.handle('reminders:getAll', () => {
  return store.get('reminders', []);
});

ipcMain.handle('reminders:save', (_event, reminderInput) => {
  const offsetMinutes = Number(reminderInput.offsetMinutes) || 0;
  const notifyAt = new Date(
    new Date(reminderInput.datetime).getTime() - offsetMinutes * 60000
  ).toISOString();

  const reminder = {
    id: Date.now().toString(),
    text: reminderInput.text,
    datetime: reminderInput.datetime,
    offsetMinutes,
    notifyAt,
    notified: false,
    createdAt: new Date().toISOString()
  };

  const reminders = store.get('reminders', []);
  reminders.push(reminder);
  store.set('reminders', reminders);

  scheduleReminder(reminder);

  return reminder;
});

app.whenReady().then(() => {
  if (process.platform === 'darwin') {
    app.dock.hide();
  }

  if (app.isPackaged) {
    app.setLoginItemSettings({ openAtLogin: true });
  }

  buildMenu();
  createTray();
  scheduleAllPendingReminders();

  powerMonitor.on('resume', scheduleAllPendingReminders);
  powerMonitor.on('unlock-screen', scheduleAllPendingReminders);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
