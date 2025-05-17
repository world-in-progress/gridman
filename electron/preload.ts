import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // Define your APIs here
  // sendToMain: (channel: string, data: any) => ipcRenderer.send(channel, data),
});

console.log('Preload script loaded.');
