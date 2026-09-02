/**
 * Show a notification using Electron API
 * @param {string} title - Notification title
 * @param {Object} options - Notification options
 * @param {string} options.body - Notification body
 */
export async function showNotification(title, options) {
  // Check if we're running under Electron
  if (window.electronAPI && window.electronAPI.showNotification) {
    await window.electronAPI.showNotification(title, options);
    return;
  }

  // Fallback: log to console (in production, you might want to use a different fallback)
  console.log(`Notification: ${title}`, options);
}