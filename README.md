# RemindUP

![platform](https://img.shields.io/badge/platform-macOS-lightgrey)
![electron](https://img.shields.io/badge/Electron-31-47848F?logo=electron&logoColor=white)
![node](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)
![license](https://img.shields.io/badge/license-ISC-blue)

Aplicación de escritorio nativa de barra de menús para macOS, pensada para crear recordatorios rápidos con notificaciones nativas del sistema. Proyecto personal, construido porque la app de Recordatorios de Apple no termina de convencerme.

## Vista previa

RemindUP vive como un ícono discreto en la barra de menús (junto al WiFi, batería, etc.) y abre un formulario flotante para crear un recordatorio en segundos.

<img width="517" height="28" alt="Captura de pantalla 2026-07-03 a la(s) 1 26 44 a m" src="https://github.com/user-attachments/assets/e03cdee9-1ac8-41e4-a006-eb37e1645ae3" />

<img width="514" height="614" alt="Captura de pantalla 2026-07-03 a la(s) 1 27 14 a m" src="https://github.com/user-attachments/assets/7a3d5c0a-6e17-4d36-bead-c3b648214da1" />


## Características

- **Ícono persistente en la barra de menús** (`Tray`), sin ocupar espacio en el Dock ni en Cmd+Tab.
- **Formulario flotante** para crear recordatorios: texto libre + fecha/hora de notificación.
- **Notificaciones nativas de macOS** cuando se cumple la fecha programada.
- **Persistencia local** en disco (JSON), sin backend ni base de datos externa.
- **Auto-inicio con el sistema** una vez empaquetada como `.app`.
- **Punto de extensión para webhooks** (Telegram/Discord) ya preparado en el proceso principal, para reenviar la alerta al celular más adelante.

## Stack técnico

| Capa | Tecnología |
|---|---|
| Runtime de escritorio | [Electron](https://www.electronjs.org/) 31 |
| Proceso principal | Node.js + API nativas de Electron (`Tray`, `Menu`, `Notification`, `BrowserWindow`) |
| Interfaz (renderer) | HTML, CSS y JavaScript vanilla (sin frameworks) |
| Comunicación IPC | `contextBridge` + `ipcMain`/`ipcRenderer`, con `contextIsolation` activado |
| Persistencia | [`electron-store`](https://github.com/sindresorhus/electron-store) (JSON en disco) |
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

## Empaquetar como aplicación de macOS

Genera un `.app` standalone en `dist/`, sin depender de Node ni de terminal para usarse día a día:

```bash
npm run package:mac
```

Luego mueve `dist/RemindUP-darwin-arm64/RemindUP.app` a `/Applications` y ábrela una vez con clic derecho → **Abrir** (no está firmada con una cuenta de desarrollador de Apple). A partir de ahí se auto-inicia con el sistema.

## Roadmap

- [ ] Integrar webhook de Telegram/Discord para notificaciones al celular.
- [ ] Listado y edición de recordatorios existentes.
- [ ] Recordatorios recurrentes.
- [ ] Almacenar Reminders en SupaBase para evitar que todo sea local.

## Autor

Hecho por **Alejandro Villarreal Carvajal**.

## Licencia

ISC
