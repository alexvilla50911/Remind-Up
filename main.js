const { app, BrowserWindow, Menu, Tray, nativeImage, ipcMain, Notification, shell } = require('electron');
const path = require('path');
const Store = require('electron-store');

const store = new Store({
  name: 'reminders',
  defaults: { reminders: [] }
});

let mainWindow = null;
let tray = null;


const scheduledTimers = new Map();


async function sendWebhookAlert(reminder) {
 //metodos para enviar x telegrtam o discord el reminder al cel
  return Promise.resolve();
}

function createWindow() {
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
    return;
  }

  mainWindow = new BrowserWindow({
    width: 480,
    height: 560,
    resizable: false,
    title: 'RemindUP',
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

  // Clic izquierdo: abre directamente el formulario.
  // Clic derecho: muestra el menú contextual (nuevo recordatorio / salir).
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
function scheduleReminder(reminder) {
  const delay = new Date(reminder.datetime).getTime() - Date.now();

  // Si ya pasó la fecha, no se programa.
  if (delay <= 0) return;

  // setTimeout tiene un límite máximo (~24.8 días). Para recordatorios más
  // lejanos se reprograma en tramos hasta llegar a la fecha final.
  const MAX_DELAY = 2147483647;

  const fire = () => {
    scheduledTimers.delete(reminder.id);

    const notification = new Notification({
      title: 'Recordatorio',
      body: reminder.text,
      sound: 'default'
    });
    notification.show();

    // Punto de extensión: además de la notificación nativa, reenviar la
    // alerta a un webhook externo (Telegram, Discord, etc.)
    sendWebhookAlert(reminder).catch((err) => {
      console.error('Error enviando webhook de recordatorio:', err);
    });

    markReminderAsNotified(reminder.id);
  };

  const timerId =
    delay > MAX_DELAY
      ? setTimeout(() => scheduleReminder(reminder), MAX_DELAY)
      : setTimeout(fire, delay);

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

// ---------------------------------------------------------------------------
// IPC: comunicación con el formulario (renderer)
// ---------------------------------------------------------------------------
ipcMain.handle('reminders:getAll', () => {
  return store.get('reminders', []);
});

ipcMain.handle('reminders:save', (_event, reminderInput) => {
  const reminder = {
    id: Date.now().toString(),
    text: reminderInput.text,
    datetime: reminderInput.datetime,
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
  // Se comporta como utilidad de barra de menús: sin ícono en el Dock ni
  // entrada en Cmd+Tab, solo el ícono del tray.
  if (process.platform === 'darwin') {
    app.dock.hide();
  }

  // Solo tiene sentido registrar el auto-inicio cuando corre como app
  // empaquetada (.app); en modo desarrollo apuntaría al binario de Electron
  // dentro de node_modules.
  if (app.isPackaged) {
    app.setLoginItemSettings({ openAtLogin: true });
  }

  buildMenu();
  createTray();
  scheduleAllPendingReminders();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// La app se queda "viva" en la barra de menús (macOS) aunque se cierre la
// ventana del formulario, para que el ícono del tray siga disponible.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
