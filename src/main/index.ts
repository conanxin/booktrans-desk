import path from "node:path";
import { app, BrowserWindow } from "electron";
import { registerIpc } from "./ipc.js";

async function createWindow(): Promise<void> {
  const mainWindow = new BrowserWindow({
    width: 1180,
    height: 780,
    minWidth: 920,
    minHeight: 640,
    title: "BookTrans Desk",
    webPreferences: {
      preload: path.join(app.getAppPath(), "dist/main/preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  registerIpc(mainWindow);

  if (process.env.VITE_DEV_SERVER_URL) {
    await mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    await mainWindow.loadFile(path.join(app.getAppPath(), "dist/renderer/index.html"));
  }
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    void createWindow();
  }
});
