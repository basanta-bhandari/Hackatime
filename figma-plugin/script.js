// Main tracking logic for Figma plugin
let isTracking = false;
let currentProject = '';
let sessionStart = null;
let totalTime = 0;
let apiKey = '';
let serverUrl = 'https://hackatime.hackclub.com';
let heartbeatInterval = null;
let settings = { apiKey: '', serverUrl: 'https://hackatime.hackclub.com' };

// Show the UI immediately
figma.showUI(__html__, { width: 420, height: 600 });

// Handle messages from UI
figma.ui.onmessage = async (msg) => {
  try {
    switch (msg.type) {
      case 'get-settings':
        await loadSettings();
        break;
        
      case 'test-connection':
        await testConnection(msg.settings);
        break;
        
      case 'start-tracking':
        await startTracking(msg.settings);
        break;
        
      case 'stop-tracking':
        stopTracking();
        break;
        
      case 'save-settings':
        await saveSettings(msg.settings);
        break;
        
      default:
        console.log('Unknown message type:', msg.type);
    }
  } catch (error) {
    console.error('Error handling message:', error);
    figma.ui.postMessage({
      type: 'error',
      message: error.message || 'An error occurred'
    });
  }
};

async function loadSettings() {
  try {
    const savedApiKey = await figma.clientStorage.getAsync('hackatime_api_key');
    const savedServerUrl = await figma.clientStorage.getAsync('hackatime_server_url');
    
    settings = {
      apiKey: savedApiKey || '',
      serverUrl: savedServerUrl || 'https://hackatime.hackclub.com'
    };
    
    apiKey = settings.apiKey;
    serverUrl = settings.serverUrl;
    
    figma.ui.postMessage({
      type: 'settings-loaded',
      settings: settings
    });
    
    // Auto-start tracking if we have valid settings
    if (apiKey && serverUrl) {
      currentProject = figma.root.name || 'Untitled';
      // Don't auto-start, let user choose
    }
  } catch (error) {
    console.error('Error loading settings:', error);
    figma.ui.postMessage({
      type: 'settings-loaded',
      settings: { apiKey: '', serverUrl: 'https://hackatime.hackclub.com' }
    });
  }
}

async function testConnection(testSettings) {
  figma.ui.postMessage({ type: 'testing-connection' });
  
  try {
    const response = await fetch(`${testSettings.serverUrl}/api/v1/users/current`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${testSettings.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      figma.ui.postMessage({
        type: 'connection-tested',
        success: true,
        message: 'Connection successful!'
      });
    } else {
      const errorText = await response.text();
      figma.ui.postMessage({
        type: 'connection-tested',
        success: false,
        message: `Connection failed: ${response.status} ${errorText}`
      });
    }
  } catch (error) {
    figma.ui.postMessage({
      type: 'connection-tested',
      success: false,
      message: `Network error: ${error.message}`
    });
  }
}

async function startTracking(trackingSettings) {
  try {
    if (isTracking) {
      figma.ui.postMessage({
        type: 'error',
        message: 'Already tracking'
      });
      return;
    }
    
    // Save and use the provided settings
    await saveSettings(trackingSettings);
    
    isTracking = true;
    sessionStart = new Date();
    currentProject = figma.root.name || 'Untitled';
    
    // Set up event listeners
    figma.on('selectionchange', onActivity);
    figma.on('currentpagechange', onActivity);
    figma.on('documentchange', onDocumentChange);
    
    // Start heartbeat interval
    heartbeatInterval = setInterval(sendHeartbeat, 30000);
    
    figma.ui.postMessage({
      type: 'tracking-started'
    });
    
    console.log(`Started tracking: ${currentProject}`);
    
  } catch (error) {
    console.error('Error starting tracking:', error);
    figma.ui.postMessage({
      type: 'error',
      message: 'Failed to start tracking: ' + error.message
    });
  }
}

function stopTracking() {
  if (!isTracking) return;
  
  isTracking = false;
  
  // Clear interval
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
  
  // Remove event listeners
  figma.off('selectionchange', onActivity);
  figma.off('currentpagechange', onActivity);
  figma.off('documentchange', onDocumentChange);
  
  // Send final heartbeat
  if (sessionStart) {
    sendHeartbeat();
  }
  
  figma.ui.postMessage({
    type: 'tracking-stopped'
  });
  
  console.log('Stopped tracking');
}

async function saveSettings(newSettings) {
  try {
    await figma.clientStorage.setAsync('hackatime_api_key', newSettings.apiKey);
    await figma.clientStorage.setAsync('hackatime_server_url', newSettings.serverUrl);
    
    settings = { ...newSettings };
    apiKey = newSettings.apiKey;
    serverUrl = newSettings.serverUrl;
    
    figma.ui.postMessage({
      type: 'settings-saved'
    });
  } catch (error) {
    console.error('Error saving settings:', error);
    figma.ui.postMessage({
      type: 'error',
      message: 'Failed to save settings'
    });
  }
}

function onActivity() {
  if (!isTracking) return;
  
  // Reset session timer when user is active
  sessionStart = new Date();
  
  figma.ui.postMessage({
    type: 'heartbeat-sent',
    message: currentProject,
    category: 'designing'
  });
}

function onDocumentChange() {
  if (!isTracking) return;
  
  // Send heartbeat for current project
  sendHeartbeat();
  
  // Update project name
  const newProject = figma.root.name || 'Untitled';
  if (newProject !== currentProject) {
    currentProject = newProject;
    sessionStart = new Date();
    console.log(`Switched to: ${currentProject}`);
  }
}

function sendHeartbeat() {
  if (!isTracking || !sessionStart || !apiKey) return;
  
  const now = new Date();
  const sessionTime = Math.floor((now - sessionStart) / 1000); // seconds
  
  // Only send if user was active in last 2 minutes
  if (sessionTime < 120) {
    totalTime += sessionTime;
    
    const data = {
      time: Math.floor(now.getTime() / 1000),
      project: currentProject,
      language: 'Figma',
      editor: 'Figma Desktop',
      operating_system: figma.viewport ? 'Desktop' : 'Web',
      machine: 'figma-user',
      user_agent: 'Figma Plugin Hackatime',
      branch: 'main',
      entity: currentProject,
      type: 'file',
      category: 'designing'
    };
    
    sendToHackatime(data);
    sessionStart = new Date(); // Reset timer
  }
}

async function sendToHackatime(data) {
  if (!apiKey || !serverUrl) return;
  
  try {
    const response = await fetch(`${serverUrl}/api/v1/users/current/heartbeats`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (response.ok) {
      console.log('Time logged:', Math.floor(totalTime / 60), 'minutes');
      figma.ui.postMessage({
        type: 'heartbeat-sent',
        message: `Logged ${Math.floor(sessionTime)} seconds to ${currentProject}`,
        category: 'designing'
      });
    } else {
      const errorText = await response.text();
      console.error('Failed to send heartbeat:', response.status, errorText);
      figma.ui.postMessage({
        type: 'heartbeat-error',
        message: `API error: ${response.status}`
      });
    }
  } catch (error) {
    console.error('Network error sending heartbeat:', error);
    figma.ui.postMessage({
      type: 'heartbeat-error',
      message: 'Network error'
    });
  }
}