const { autoUpdater } = require('electron-updater');
const { BrowserWindow, dialog } = require('electron');
const path = require('path');

function setupUpdater() {
    // Configure autoUpdater
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;

    // Event handlers
    autoUpdater.on('checking-for-update', () => {
        sendStatusToWindow('Checking for updates...');
    });

    autoUpdater.on('update-available', (info) => {
        sendStatusToWindow('Update available!');
        const win = BrowserWindow.getFocusedWindow();
        if (win) {
            dialog.showMessageBox(win, {
                type: 'info',
                title: 'Update Available',
                message: `Version ${info.version} is available.`,
                detail: 'The update will be downloaded automatically.',
                buttons: ['OK']
            });
        }
    });

    autoUpdater.on('update-not-available', () => {
        sendStatusToWindow('No updates available.');
    });

    autoUpdater.on('error', (err) => {
        sendStatusToWindow(`Update error: ${err.message}`);
    });

    autoUpdater.on('download-progress', (progress) => {
        sendStatusToWindow(`Downloading: ${progress.percent.toFixed(0)}%`);
    });

    autoUpdater.on('update-downloaded', (info) => {
        sendStatusToWindow(`Update ${info.version} downloaded. Installing...`);
        const win = BrowserWindow.getFocusedWindow();
        if (win) {
            dialog.showMessageBox(win, {
                type: 'info',
                title: 'Update Ready',
                message: `Version ${info.version} has been downloaded.`,
                detail: 'The app will restart to install the update.',
                buttons: ['Install Now', 'Later']
            }).then(({ response }) => {
                if (response === 0) {
                    autoUpdater.quitAndInstall();
                }
            });
        }
    });

    return autoUpdater;
}

function sendStatusToWindow(text) {
    const win = BrowserWindow.getFocusedWindow();
    if (win) {
        win.webContents.send('update-status', text);
    }
}

module.exports = { setupUpdater };