const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // Supabase
    getSupabaseConfig: () => ipcRenderer.invoke('get-supabase-config'),
    setSupabaseConfig: (config) => ipcRenderer.invoke('set-supabase-config', config),
    
    // Environment
    isElectron: () => ipcRenderer.invoke('is-electron'),
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),
    getPlatform: () => ipcRenderer.invoke('get-platform'),
    isDev: () => ipcRenderer.invoke('is-dev'),
    
    // File operations
    saveFile: (filename, content) => ipcRenderer.invoke('save-file', { filename, content }),
    readFile: (filename) => ipcRenderer.invoke('read-file', filename),
    
    // External
    openExternal: (url) => ipcRenderer.invoke('open-external', url),
    showDialog: (options) => ipcRenderer.invoke('show-dialog', options),
    
    // Update events
    onUpdateStatus: (callback) => ipcRenderer.on('update-status', (event, status) => callback(status)),
    onUpdateAvailable: (callback) => ipcRenderer.on('update-available', (event, info) => callback(info)),
    onUpdateProgress: (callback) => ipcRenderer.on('update-progress', (event, progress) => callback(progress)),
    onUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', (event, info) => callback(info)),
    onUpdateError: (callback) => ipcRenderer.on('update-error', (event, error) => callback(error))
});

console.log('✅ Electron API exposed to renderer');