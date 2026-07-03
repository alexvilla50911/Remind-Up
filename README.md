# RemindUP

![platform](https://img.shields.io/badge/platform-macOS-lightgrey)
![electron](https://img.shields.io/badge/Electron-31-47848F?logo=electron&logoColor=white)
![node](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)
![license](https://img.shields.io/badge/license-ISC-blue)

Aplicación de escritorio nativa de barra de menús para macOS, pensada para crear recordatorios rápidos con notificaciones nativas del sistema. Proyecto personal, construido porque la app de Recordatorios de Apple no termina de convencerme.

## Vista previa

RemindUP vive como un ícono discreto en la barra de menús (junto al WiFi, batería, etc.) y abre un formulario flotante para crear un recordatorio en segundos.

## Características

- **Ícono persistente en la barra de menús** (`Tray`), sin ocupar espacio en el Dock ni en Cmd+Tab.
- **Formulario flotante** para crear recordatorios: texto libre + fecha/hora del evento.
- **Presets de anticipación** ("A la hora exacta", "5 minutos antes", "10 minutos antes", "15 minutos antes", "30 minutos antes", "1 hora antes") — la app calcula sola la hora real de aviso restando ese margen a la fecha del evento.
- **Fecha de hoy preseleccionada** al abrir el formulario, para no tener que escribirla cada vez.
- **Notificaciones nativas de macOS** cuando se cumple la hora calculada.
- **Integración con Telegram**: además de la notificación nativa, el mismo recordatorio se manda como mensaje de un bot propio de Telegram (`Recordatorio: {texto}`), para que llegue también al celular.
- **Persistencia local** en disco (JSON), sin backend ni base de datos externa.
- **Auto-inicio con el sistema** una vez empaquetada como `.app`.

## Stack técnico

| Capa | Tecnología |
|---|---|
| Runtime de escritorio | [Electron](https://www.electronjs.org/) 31 |
| Proceso principal | Node.js + API nativas de Electron (`Tray`, `Menu`, `Notification`, `BrowserWindow`) |
| Interfaz (renderer) | HTML, CSS y JavaScript vanilla (sin frameworks) |
| Comunicación IPC | `contextBridge` + `ipcMain`/`ipcRenderer`, con `contextIsolation` activado |
| Persistencia | [`electron-store`](https://github.com/sindresorhus/electron-store) (JSON en disco) |
| Notificaciones al celular | [Telegram Bot API](https://core.telegram.org/bots/api) vía `fetch` nativo |
| Empaquetado | [`@electron/packager`](https://github.com/electron/packager) |

### Dependencias

```json
{
  "dependencies": {
    "electron-store": "^8.2.0"
  },
  "devDependencies": {
    "@electron/packager": "^20.0.1",
    "electron": "^31.7.7"
  }
}
```

## Estructura del proyecto

```
RemindUP/
├── main.js          # Proceso principal: tray, menú, notificaciones, IPC, almacenamiento
├── preload.js        # Puente seguro (contextBridge) entre main y renderer
├── index.html         # Formulario de nuevo recordatorio
├── styles.css          # Estilos de la interfaz
├── renderer.js          # Lógica del formulario (submit, validaciones, cierre)
└── package.json
```

## Desarrollo local

Requiere [Node.js](https://nodejs.org/) 18 o superior.

```bash
git clone https://github.com/alexvilla50911/Remind-Up.git
cd Remind-Up
npm install
npm start
```

## Configurar Telegram

Los recordatorios se pueden reenviar a un bot propio de Telegram. Requiere dos datos:

1. **Token del bot**: se crea hablando con [@BotFather](https://t.me/BotFather) en Telegram (`/newbot`).
2. **Chat ID**: se obtiene mandándole un mensaje a tu bot y luego visitando `https://api.telegram.org/bot<TOKEN>/getUpdates`, buscando el campo `"chat":{"id": ...}`.

Ambos valores se guardan **fuera del repositorio**, en el archivo de datos de la app (`~/Library/Application Support/RemindUP/config.json`), para que el token nunca se suba a git ni a GitHub:

```json
{
  "telegramToken": "TU_TOKEN_AQUI",
  "telegramChatId": "TU_CHAT_ID_AQUI"
}
```

Si ese archivo no existe o está vacío, la app simplemente omite el envío a Telegram y solo muestra la notificación nativa de macOS.

## Empaquetar como aplicación de macOS

Genera un `.app` standalone en `dist/`, sin depender de Node ni de terminal para usarse día a día:

```bash
npm run package:mac
```

Luego mueve `dist/RemindUP-darwin-arm64/RemindUP.app` a `/Applications` y ábrela una vez con clic derecho → **Abrir** (no está firmada con una cuenta de desarrollador de Apple). A partir de ahí se auto-inicia con el sistema.

## Roadmap

- [x] Integrar webhook de Telegram para notificaciones al celular.
- [ ] Webhook alternativo a Discord.
- [ ] Listado y edición de recordatorios existentes.
- [ ] Recordatorios recurrentes.

## Autor

Hecho por **Alejandro Villarreal Carvajal**.

## Licencia

ISC
