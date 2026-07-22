const { contextBridge } = require('electron');

// ===== EKSPOS API KE RENDERER =====
contextBridge.exposeInMainWorld('electronAPI', {
  // Info aplikasi
  getVersion: () => '2.0.0',
  getPlatform: () => process.platform,
  
  // Untuk keperluan debugging
  log: (message) => console.log('[Electron]', message)
});

console.log('✅ Preload script loaded successfully!');