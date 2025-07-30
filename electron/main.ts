import { app, BrowserWindow, ipcMain, dialog, screen } from 'electron';
import path from 'path';

function createWindow(): void {
	const mainWindow = new BrowserWindow({
		width: 1200,
		height: 800,
		fullscreen: true, // fullscreen as default
		autoHideMenuBar: true,
		webPreferences: {
			preload: path.join(__dirname, 'preload.js'),
			contextIsolation: true,
			nodeIntegration: false,
		},
	});

	// const startUrl = process.env.ELECTRON_START_URL || url.format({
	//   pathname: path.join(__dirname, '../templates/index.html'), 
	//   protocol: 'file:',
	//   slashes: true,
	// });

	// Use Vite dev server URL in development, otherwise use the built file
	const startUrl = process.env.ELECTRON_START_URL || 'http://localhost:5173';

	mainWindow.loadURL(startUrl);

	mainWindow.webContents.on('before-input-event', (event, input) => {
		if (input.key === 'F12' && input.type === 'keyDown') {
			mainWindow.webContents.toggleDevTools();
			event.preventDefault(); // prevents other F12 default actions if any
		}
	});

	mainWindow.webContents.on('did-finish-load', () => {
		// Get the screen resolution
		const primaryDisplay = screen.getPrimaryDisplay();
		const { width, height } = primaryDisplay.workAreaSize;

		let zoomFactor = Math.min(width / 1920, height / 1080);
		mainWindow.webContents.setZoomFactor(zoomFactor);
	});
}

ipcMain.handle('dialog:openFile', async () => {
	const { canceled, filePaths } = await dialog.showOpenDialog({
		properties: ['openFile'],
		filters: [
			{ name: 'Vector Files', extensions: ['shp', 'geojson'] },
			{ name: 'All Files', extensions: ['*'] }
		],
	});

	if (canceled || filePaths.length === 0) {
		return null;
	}
	return filePaths[0];
})

ipcMain.handle('dialog:openTiffFile', async () => {
	const { canceled, filePaths } = await dialog.showOpenDialog({
		properties: ['openFile'],
		filters: [
			{ name: 'TIF Files', extensions: ['tif', 'tiff'] },
			{ name: 'All Files', extensions: ['*'] }
		],
	});

	if (canceled || filePaths.length === 0) {
		return null;
	}
	return filePaths[0];
})

ipcMain.handle('dialog:openTxtFile', async () => {
	const { canceled, filePaths } = await dialog.showOpenDialog({
		properties: ['openFile'],
		filters: [
			{ name: 'TXT Files', extensions: ['txt'] },
			{ name: 'All Files', extensions: ['*'] }
		],
	});

	if (canceled || filePaths.length === 0) {
		return null;
	}
	return filePaths[0];
})

ipcMain.handle('dialog:openInpFile', async () => {
	const { canceled, filePaths } = await dialog.showOpenDialog({
		properties: ['openFile'],
		filters: [
			{ name: 'INP Files', extensions: ['inp'] },
			{ name: 'All Files', extensions: ['*'] }
		],
	});

	if (canceled || filePaths.length === 0) {
		return null;
	}
	return filePaths[0];
})

ipcMain.handle('dialog:openCsvFile', async () => {
	const { canceled, filePaths } = await dialog.showOpenDialog({
		properties: ['openFile'],
		filters: [
			{ name: 'CSV Files', extensions: ['csv'] },
			{ name: 'All Files', extensions: ['*'] }
		],
	});

	if (canceled || filePaths.length === 0) {
		return null;
	}
	return filePaths[0];
})

app.whenReady().then(() => {
	createWindow();

	// For macOS, re-create a window in the app
	// When the dock icon is clicked and there are no other windows open
	app.on('activate', function () {
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	});
});

app.on('window-all-closed', function () {
	if (process.platform !== 'darwin') app.quit();
});
