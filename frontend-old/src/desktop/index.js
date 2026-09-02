/**
 * Desktop Services Initializer
 * Coordinates initialization of all Electron desktop features
 */

/**
 * Initialize all desktop features
 * This should be called once when the application starts under Electron
 */
export async function initializeDesktopFeatures() {
  // Check if we're running under Electron
  if (!window.electronAPI) {
    console.info('Desktop features initialization skipped: Not running under Electron')
    return false
  }

  console.log('Initializing Electron desktop features...')

  // Dynamically import desktop feature modules
  let initializeMenu, initializeTray, initializeShortcuts, shortcutManager
  try {
    const menuModule = await import('./menu.js')
    initializeMenu = menuModule.initializeMenu
    const trayModule = await import('./tray.js')
    initializeTray = trayModule.initializeTray
    const shortcutsModule = await import('./shortcuts.js')
    initializeShortcuts = shortcutsModule.initializeShortcuts
    shortcutManager = shortcutsModule.shortcutManager
  } catch (importError) {
    console.error('Failed to import desktop feature modules:', importError)
    return false
  }

  // Initialize menu bar
  try {
    await initializeMenu()
    console.log('✓ Application menu initialized')
  } catch (menuError) {
    console.error('✗ Failed to initialize application menu:', menuError)
    // Don't fail entirely for menu issues
  }

  // Initialize system tray
  let tray = null
  try {
    tray = await initializeTray()
    if (tray) {
      console.log('✓ System tray initialized')
    }
  } catch (trayError) {
    console.error('✗ Failed to initialize system tray:', trayError)
    // Don't fail entirely for tray issues
  }

  // Initialize global keyboard shortcuts
  try {
    await initializeShortcuts()
    console.log('✓ Global keyboard shortcuts initialized')
  } catch (shortcutError) {
    console.error('✗ Failed to initialize global shortcuts:', shortcutError)
    // Don't fail entirely for shortcut issues
  }

  // Set up window event listeners
  try {
    // Window events are handled via IPC in the main process
    // We just need to set up listeners for events coming from the main process

    console.log('Window event listeners set up via IPC')
  } catch (error) {
    console.error('Failed to set up window event listeners:', error)
  }

  // Show ready notification
  try {
    const { showNotification } = await import('./notification.js')
    await showNotification('Sentinel Ready', {
      body: 'Desktop application is ready to use'
    })
    console.log('✓ Ready notification sent')
  } catch (notifyError) {
    console.error('✗ Failed to send ready notification:', notifyError)
    // Don't fail entirely for notification issues
  }

  console.log('All desktop features initialization completed')
  return true
}

/**
 * Set up window event listeners for desktop-specific behavior
 */
async function setupWindowEvents() {
  try {
    // Window events are handled via IPC in the main process
    // We just need to set up listeners for events coming from the main process

    // Listen for window events from main process
    if (window.electronEvents) {
      // Window show/hide events
      window.electronEvents.onWindowShow?.(() => {
        console.log('Window shown')
        // Re-enable shortcuts when window gains focus via main process
        // This would be handled by sending a message to main process
      })

      window.electronEvents.onWindowHide?.(() => {
        console.log('Window hidden')
        // Optionally disable certain shortcuts when window is hidden
      })

      window.electronEvents.onWindowFocus?.(() => {
        console.log('Window focused')
        // Re-enable context-specific shortcuts
      })

      window.electronEvents.onWindowBlur?.(() => {
        console.log('Window blurred')
        // Optionally disable certain shortcuts when window loses focus
      })
    }

    console.log('Window event listeners set up')
  } catch (error) {
    console.error('Failed to set up window event listeners:', error)
  }
}

/**
 * Clean up desktop features when application is shutting down
 */
export async function cleanupDesktopFeatures() {
  // Check if we're running under Electron
  if (!window.electronAPI) {
    console.warn('Desktop features cleanup skipped: Not running under Electron')
    return
  }

  console.log('Cleaning up desktop features...')

  // Clean up shortcuts via main process
  try {
    await window.electronAPI.cleanupShortcuts?.()
    console.log('✓ Global shortcuts cleaned up')
  } catch (shortcutError) {
    console.error('✗ Error cleaning up shortcuts:', shortcutError)
  }

  console.log('Desktop features cleaned up')
}

/**
 * Utility function to check if running under Electron
 * @returns {boolean}
 */
export function isElectron() {
  return !!window.electronAPI
}

/**
 * Utility function to get Electron version info
 * @returns {Promise<Object|null>}
 */
export async function getElectronInfo() {
  try {
    if (!window.electronAPI) return null
    const version = await window.electronAPI.getAppVersion?.()
    const isPackaged = await window.electronAPI.isAppPackaged?.()
    return { version, isPackaged }
  } catch (error) {
    console.error('Failed to get Electron info:', error)
    return null
  }
}

// Re-export shortcutManager from shortcuts.js
export { shortcutManager } from './shortcuts.js'