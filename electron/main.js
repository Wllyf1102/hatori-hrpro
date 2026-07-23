const { app, BrowserWindow, ipcMain, Menu, dialog, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');

let mainWindow = null;
const isDev = process.env.NODE_ENV === 'development';

// Supabase config
let supabaseConfig = {
    url: process.env.SUPABASE_URL || '',
    key: process.env.SUPABASE_KEY || ''
};

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1024,
        minHeight: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
            preload: path.join(__dirname, 'preload.js')
        },
        icon: path.join(__dirname, '../assets/icon.png'),
        show: false,
        frame: true,
        titleBarStyle: 'default'
    });

    // Load index
    mainWindow.loadFile(path.join(__dirname, '../html/index.html'));

    // Show when ready
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        if (!isDev) {
            autoUpdater.checkForUpdatesAndNotify();
        }
    });

    // DevTools in development
    if (isDev) {
        mainWindow.webContents.openDevTools();
    }

    // Menu
    createMenu();

    // Cleanup
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

function createMenu() {
    const template = [
        {
            label: 'File',
            submenu: [
                { role: 'quit' }
            ]
        },
        {
            label: 'View',
            submenu: [
                { role: 'reload' },
                { role: 'forceReload' },
                { role: 'toggleDevTools' },
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' }
            ]
        },
        {
            label: 'Help',
            submenu: [
                {
                    label: 'Check for Updates',
                    click: () => autoUpdater.checkForUpdatesAndNotify()
                },
                {
                    label: 'About',
                    click: () => showAboutDialog()
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

function showAboutDialog() {
    dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'About HATORI HR Pro',
        message: 'HATORI HR Pro v' + app.getVersion(),
        detail: 'HR Management System for HATORI Group\n\n' +
                '© 2024 HATORI Group. All rights reserved.\n' +
                'Built with ❤️ using Electron and Supabase.',
        buttons: ['OK']
    });
}

// ========== APP LIFECYCLE ==========

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// ========== AUTO UPDATER ==========

autoUpdater.on('checking-for-update', () => {
    console.log('🔄 Checking for updates...');
    mainWindow?.webContents.send('update-status', 'checking');
});

autoUpdater.on('update-available', (info) => {
    console.log('📦 Update available:', info.version);
    mainWindow?.webContents.send('update-available', info);
});

autoUpdater.on('update-not-available', () => {
    console.log('✅ No updates available');
    mainWindow?.webContents.send('update-status', 'up-to-date');
});

autoUpdater.on('error', (err) => {
    console.error('❌ Update error:', err);
    mainWindow?.webContents.send('update-error', err.message);
});

autoUpdater.on('download-progress', (progress) => {
    mainWindow?.webContents.send('update-progress', progress);
});

autoUpdater.on('update-downloaded', (info) => {
    console.log('✅ Update downloaded:', info.version);
    mainWindow?.webContents.send('update-downloaded', info);
    
    setTimeout(() => {
        autoUpdater.quitAndInstall();
    }, 10000);
});

// ========== IPC HANDLERS ==========

ipcMain.handle('get-supabase-config', () => {
    return supabaseConfig;
});

ipcMain.handle('set-supabase-config', (event, config) => {
    supabaseConfig = config;
    return { success: true };
});

ipcMain.handle('is-electron', () => true);
ipcMain.handle('get-app-version', () => app.getVersion());
ipcMain.handle('get-platform', () => process.platform);
ipcMain.handle('is-dev', () => isDev);

ipcMain.handle('save-file', async (event, { filename, content }) => {
    try {
        const userDataPath = app.getPath('userData');
        const filePath = path.join(userDataPath, filename);
        fs.writeFileSync(filePath, content, 'utf8');
        return { success: true, path: filePath };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('read-file', async (event, filename) => {
    try {
        const userDataPath = app.getPath('userData');
        const filePath = path.join(userDataPath, filename);
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');
            return { success: true, content };
        }
        return { success: false, error: 'File not found' };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('open-external', (event, url) => {
    shell.openExternal(url);
});

ipcMain.handle('show-dialog', async (event, options) => {
    return await dialog.showMessageBox(mainWindow, options);
});
