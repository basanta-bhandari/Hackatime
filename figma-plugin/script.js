// Hackatime for Figma - Main Plugin
// Track your Figma design time automatically
// Made by Basanta Bhandari (bhandari.basanta.47@gmail.com)

let isTracking = false;
let trackingTimer = null;
let heartbeatInterval = null;
let lastActivity = null;
let lastHeartbeat = 0;
let currentSettings = {
  apiKey: '',
  serverUrl: 'https://hackatime.hackclub.com'
};

// Plugin lifecycle
figma.showUI(__html__, { 
  width: 420, 
  height: 560,
  title: 'Hackatime - Time Tracker'
});

// Load saved settings on startup
loadSettings();

// Listen for UI messages
figma.ui.onmessage = async (message) => {
  console.log('Plugin received:', message.type);
  
  try {
    switch (message.type) {
      case 'get-settings':
        figma.ui.postMessage({
          type: 'settings-loaded',
          settings: currentSettings
        });
        break;

      case 'save-settings':
        await saveSettings(message.settings);
        figma.ui.postMessage({
          type: 'settings-saved',
          message: 'Settings saved successfully'
        });
        break;

      case 'test-connection':
        await testConnection(message.settings);
        break;

      case 'start-tracking':
        await startTracking(message.settings);
        break;

      case 'stop-tracking':
        stopTracking();
        break;

      default:
        console.warn('Unknown message type:', message.type);
    }
  } catch (error) {
    console.error('Error handling message:', error);
    figma.ui.postMessage({
      type: 'error',
      message: `Error: ${error.message}`
    });
  }
};

// Settings management
async function loadSettings() {
  try {
    const apiKey = await figma.clientStorage.getAsync('hackatime-api-key') || '';
    const serverUrl = await figma.clientStorage.getAsync('hackatime-server-url') || 'https://hackatime.hackclub.com';
    
    currentSettings = { apiKey, serverUrl };
    console.log('Settings loaded');
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
}

async function saveSettings(settings) {
  try {
    await figma.clientStorage.setAsync('hackatime-api-key', settings.apiKey);
    await figma.clientStorage.setAsync('hackatime-server-url', settings.serverUrl);
    currentSettings = { ...settings };
    console.log('Settings saved');
  } catch (error) {
    console.error('Failed to save settings:', error);
    throw new Error('Failed to save settings');
  }
}

// Connection testing
async function testConnection(settings) {
  figma.ui.postMessage({ type: 'testing-connection' });
  
  try {
    // Validate settings first
    if (!settings.apiKey || settings.apiKey.length < 10) {
      throw new Error('Invalid API key format');
    }
    
    if (!settings.serverUrl || !isValidUrl(settings.serverUrl)) {
      throw new Error('Invalid server URL format');
    }

    // Test with a simple heartbeat
    const testPayload = {
      entity: 'figma-connection-test',
      type: 'app',
      category: 'debugging',
      time: Date.now() / 1000,
      is_write: false,
      language: 'Figma',
      project: 'Connection Test'
    };

    const response = await sendHeartbeat(testPayload, settings);
    
    if (response.ok) {
      figma.ui.postMessage({
        type: 'connection-tested',
        success: true,
        message: 'Connection successful!'
      });
    } else {
      throw new Error(`Server returned ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Connection test failed:', error);
    figma.ui.postMessage({
      type: 'connection-tested',
      success: false,
      message: error.message
    });
  }
}

// Tracking control
async function startTracking(settings) {
  if (isTracking) {
    figma.ui.postMessage({
      type: 'error',
      message: 'Tracking is already active'
    });
    return;
  }

  try {
    // Save settings if provided
    if (settings) {
      await saveSettings(settings);
    }

    // Validate current settings
    if (!currentSettings.apiKey) {
      throw new Error('API key is required');
    }

    if (!currentSettings.serverUrl) {
      throw new Error('Server URL is required');
    }

    isTracking = true;
    lastActivity = Date.now();
    
    // Send initial heartbeat in background (don't block UI)
    sendActivity('Started tracking', 'debugging', false).catch(console.error);
    
    // Set up document change listener for instant feedback
    setupDocumentListeners();
    
    // Set up periodic heartbeats (every 2 minutes)
    heartbeatInterval = setInterval(async () => {
      if (isTracking) {
        await sendActivity('Periodic activity', 'designing', false);
      }
    }, 120000); // 2 minutes
    
    figma.ui.postMessage({
      type: 'tracking-started',
      message: 'Tracking started successfully'
    });
    
    console.log('Tracking started');
  } catch (error) {
    console.error('Failed to start tracking:', error);
    isTracking = false;
    figma.ui.postMessage({
      type: 'error',
      message: `Failed to start tracking: ${error.message}`
    });
  }
}

function stopTracking() {
  if (!isTracking) return;
  
  isTracking = false;
  
  // Clear intervals and listeners
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
  
  // Remove document listeners
  removeDocumentListeners();
  
  figma.ui.postMessage({
    type: 'tracking-stopped',
    message: 'Tracking stopped'
  });
  
  console.log('Tracking stopped');
}

// Activity tracking
let documentChangeHandler = null;

function setupDocumentListeners() {
  // Create handler function that we can remove later
  documentChangeHandler = async () => {
    if (isTracking) {
      const now = Date.now();
      // Rate limit: don't send heartbeats more than once every 10 seconds
      if (now - lastHeartbeat > 30000) {
        await sendActivity('Document modified', 'building', true);
      }
    }
  };
  
  // Listen for document changes
  figma.on('documentchange', documentChangeHandler);
}

function removeDocumentListeners() {
  if (documentChangeHandler) {
    figma.off('documentchange', documentChangeHandler);
    documentChangeHandler = null;
  }
}

async function sendActivity(description, category, isWrite) {
  if (!isTracking) return;
  
  const now = Date.now();
  
  // Rate limiting: same file within 2 minutes
  const currentFile = figma.root.name || 'Untitled';
  if (lastActivity === currentFile && (now - lastHeartbeat) < 120000 && !isWrite) {
    return;
  }
  
  const payload = {
    entity: currentFile,
    type: 'file',
    category: category,
    time: now / 1000,
    is_write: isWrite,
    language: 'Figma',
    project: extractProjectName(currentFile),
    branch: getCurrentPage()
  };
  
  try {
    const response = await sendHeartbeat(payload, currentSettings);
    
    if (response.ok) {
      lastHeartbeat = now;
      lastActivity = currentFile;
      
      figma.ui.postMessage({
        type: 'heartbeat-sent',
        message: description,
        category: category
      });
    } else {
      throw new Error(`${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error('Failed to send heartbeat:', error);
    figma.ui.postMessage({
      type: 'heartbeat-error',
      message: error.message
    });
  }
}

// Network layer
async function sendHeartbeat(payload, settings) {
  const url = `${settings.serverUrl.replace(/\/$/, '')}/api/hackatime/v1/heartbeats`;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
  
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${settings.apiKey}`,
      'User-Agent': 'Hackatime-Figma-Plugin/1.0.0'
    },
    body: JSON.stringify(payload),
    signal: controller.signal
  };
  
  try {
    console.log('Sending heartbeat:', payload.entity, payload.category);
    const response = await fetch(url, options);
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - check connection');
    }
    throw error;
  }
}

// Utility functions
function isValidUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function extractProjectName(fileName) {
  // Extract project name from file name
  // Remove common file extensions and clean up
  return fileName
    .replace(/\.(fig|figma)$/i, '')
    .replace(/[_-]/g, ' ')
    .trim() || 'Figma Project';
}

function getCurrentPage() {
  try {
    return figma.currentPage ? figma.currentPage.name : 'Main';
  } catch {
    return 'Main';
  }
}

// Plugin cleanup
figma.on('close', () => {
  console.log('Plugin closing, cleaning up...');
  stopTracking();
});

// Handle runtime errors gracefully - Figma-compatible version
window.addEventListener('error', (event) => {
  console.error('Runtime error:', event.error);
  figma.ui.postMessage({
    type: 'error',
    message: 'An unexpected error occurred. Please try again.'
  });
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled Promise rejection:', event.reason);
  figma.ui.postMessage({
    type: 'error',
    message: 'Connection error occurred. Please check your settings.'
  });
});

console.log('Hackatime for Figma plugin loaded successfully');