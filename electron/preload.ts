import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
    openFileDialog: () => ipcRenderer.invoke('dialog:openFile'),
    openTiffFileDialog: () => ipcRenderer.invoke('dialog:openTiffFile')
});

console.log('Preload script loaded.');
