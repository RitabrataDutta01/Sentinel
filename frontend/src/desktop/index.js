/**
 * Desktop Services Initializer
 * Coordinates initialization of all Electron desktop features
 */
import { isElectron as isElectronUtil, getElectronInfo as getElectronInfoUtil, electron } from '../lib/electron.js'
import { shortcutManager } from './shortcuts.js'

/**
 * Initialize all desktop features
 * This should be called once when the application starts under Electron
 */
export async function initializeDesktopFeatures() {
  // Check if we're running under Electron
  if (!isElectronUtil()) {
    console.info('Desktop features initialization skipped: Not running under Electron')
    return false
  }

  console.log('Initializing Electron desktop features...')

  // Dynamically import desktop feature modules
  let initializeMenu, initializeTray, initializeShortcuts
  try {
    const menuModule = await import('./menu.js')
    initializeMenu = menuModule.initializeMenu
    const trayModule = await import('./tray.js')
    initializeTray = trayModule.initializeTray
    const shortcutsModule = await import('./shortcuts.js')
    initializeShortcuts = shortcutsModule.initializeShortcuts
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
    await electron.showNotification('Sentinel Ready', {
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
 * Clean up desktop features when application is shutting down
 */
export async function cleanupDesktopFeatures() {
  // Check if we're running under Electron
  if (!isElectronUtil()) {
    console.warn('Desktop features cleanup skipped: Not running under Electron')
    return
  }

  console.log('Cleaning up desktop features...')

  // Clean up shortcuts via main process
  try {
    await electron.cleanupShortcuts?.()
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
  return isElectronUtil()
}

/**
 * Utility function to get Electron version info
 * @returns {Promise<Object|null>}
 */
export async function getElectronInfo() {
  return getElectronInfoUtil()
}

// Re-export shortcutManager from shortcuts.js
export { shortcutManager }