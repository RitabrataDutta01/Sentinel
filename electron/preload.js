const { contextBridge, ipcRenderer } = require('electron');

// Expose protected IPC renderer methods to the frontend
contextBridge.exposeInMainWorld('electronAPI', {
  // File system operations
  saveFile: (data) => ipcRenderer.invoke('save-file', data),
  openFile: () => ipcRenderer.invoke('open-file'),

  // Window operations
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  maximizeWindow: () => ipcRenderer.send('maximize-window'),
  closeWindow: () => ipcRenderer.send('close-window'),

  // Notifications
  showNotification: (title, options) => ipcRenderer.invoke('show-notification', { title, options }),

  // App information
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  isAppPackaged: () => ipcRenderer.invoke('is-app-packaged')
});

// Expose environment info
contextBridge.exposeInMainWorld('isDev', !process.env.NODE_ENV || process.env.NODE_ENV === 'development');
contextBridge.exposeInMainWorld('electronVersion', process.versions.electron);

// Listen for events from main process
contextBridge.exposeInMainWorld('electronEvents', {
  onNewSession: (callback) => ipcRenderer.on('new-session', callback),
  onExportReport: (callback) => ipcRenderer.on('export-report', callback),
  onNavigateSessions: (callback) => ipcRenderer.on('navigate-sessions', callback),
  onNavigateSettings: (callback) => ipcRenderer.on('navigate-settings', callback),
  onNewSimulation: (callback) => ipcRenderer.on('new-simulation', callback),
  onPauseResumeSimulation: (callback) => ipcRenderer.on('pause-resume-simulation', callback),
  onStopSimulation: (callback) => ipcRenderer.on('stop-simulation', callback),
  onExportTranscript: (callback) => ipcRenderer.on('export-transcript', callback),
  onOpenDocumentation: (callback) => ipcRenderer.on('open-documentation', callback),
  onOpenTutorials: (callback) => ipcRenderer.on('open-tutorials', callback),
  onZoomIn: (callback) => ipcRenderer.on('zoom-in', callback),
  onZoomOut: (callback) => ipcRenderer.on('zoom-out', callback),
  onZoomReset: (callback) => ipcRenderer.on('zoom-reset', callback),
  onToggleSidebar: (callback) => ipcRenderer.on('toggle-sidebar', callback),
  onFind: (callback) => ipcRenderer.on('find', callback),
  onUndo: (callback) => ipcRenderer.on('undo', callback),
  onRedo: (callback) => ipcRenderer.on('redo', callback),
  onSelectAll: (callback) => ipcRenderer.on('select-all', callback),
  onCheckUpdates: (callback) => ipcRenderer.on('check-updates', callback),
  onResumeLastSession: (callback) => ipcRenderer.on('resume-last-session', callback)
});