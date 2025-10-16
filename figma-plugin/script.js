let isTracking = false;
let currentProject = '';
let sessionStart = null;
let totalTime = 0;
let apiKey = '';
let serverUrl = 'https://hackatime.hackclub.com';
let heartbeatInterval = null;

figma.showUI(__html__, { 
  width: 420, 
  height: 600,
  title: 'Hackatime for Figma'
});

async function init() {
  try {
    const savedApiKey = await figma.clientStorage.getAsync('hackatime_api_key');
    const savedServerUrl = await figma.clientStorage.getAsync('hackatime_server_url');
    
    apiKey = savedApiKey || '';
    serverUrl = savedServerUrl || 'https://hackatime.hackclub.com';
    
    figma.ui.postMessage({
      type: 'settings-loaded',
      settings: {
        apiKey: apiKey,
        serverUrl: serverUrl
      }
    });
    
    currentProject = figma.root.name || 'Untitled';
    
    console.log('Hackatime plugin initialized');
  } catch (error) {
    console.error('Error initializing plugin:', error);
    figma.ui.postMessage({
      type: 'error',
      message: 'Failed to initialize plugin: ' + error.message
    });
  }
}

figma.ui.onmessage = async (msg) => {
  try {
    console.log('Received message:', msg.type);
    
    switch (msg.type) {
      case 'get-settings':
        await init();
        break;
        
      case 'test-connection':
        await testConnection(msg.settings);
        break;
        
      case 'start-tracking':
        await startTracking(msg.settings);
        break;
        
      case 'stop-tracking':
        await stopTracking();
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
      message: 'Plugin error: ' + (error.message || 'Unknown error')
    });
  }
};

    async function testConnection(settings) {
      figma.ui.postMessage({ type: 'testing-connection' });
      
      try {
        console.log('Testing connection to:', settings.serverUrl);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const response = await fetch(`${settings.serverUrl}/api/v1/users/current`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${settings.apiKey}`,
            'Content-Type': 'application/json',
            'User-Agent': 'Figma-Hackatime-Plugin/1.0'
          },
          signal: controller.signal
        });    if (response.ok) {
      const userData = await response.json();
      figma.ui.postMessage({
        type: 'connection-tested',
        success: true,
        message: `Connected successfully! Welcome ${userData.username || 'user'}`
      });
    } else {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (e) {
        errorMessage = await response.text() || errorMessage;
      }
      
      figma.ui.postMessage({
        type: 'connection-tested',
        success: false,
        message: `Connection failed: ${errorMessage}`
      });
    }
  } catch (error) {
    console.error('Network error during test:', error);
    figma.ui.postMessage({
      type: 'connection-tested',
      success: false,
      message: `Network error: ${error.message}`
    });
  }
}

async function startTracking(settings) {
  try {
    if (isTracking) {
      figma.ui.postMessage({
        type: 'error',
        message: 'Already tracking'
      });
      return;
    }
    
    await saveSettings(settings);
    
    apiKey = settings.apiKey;
    serverUrl = settings.serverUrl;
    
    isTracking = true;
    sessionStart = new Date();
    currentProject = figma.root.name || 'Untitled';
    totalTime = 0;
    
    figma.on('selectionchange', onActivity);
    figma.on('currentpagechange', onActivity);
    figma.on('documentchange', onDocumentChange);
    
    heartbeatInterval = setInterval(() => {
      if (figma.currentPage) {  // Check if we have access to the document
        sendHeartbeat();
      }
    }, 30000);
    
    sendHeartbeat();
    
    figma.ui.postMessage({
      type: 'tracking-started',
      project: currentProject
    });
    
    console.log(`Started tracking project: ${currentProject}`);
    
  } catch (error) {
    console.error('Error starting tracking:', error);
    figma.ui.postMessage({
      type: 'error',
      message: 'Failed to start tracking: ' + error.message
    });
  }
}

async function stopTracking() {
  try {
    if (!isTracking) {
      figma.ui.postMessage({
        type: 'error',
        message: 'Not currently tracking'
      });
      return;
    }
    
    isTracking = false;
    
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }
    
    figma.off('selectionchange', onActivity);
    figma.off('currentpagechange', onActivity);
    figma.off('documentchange', onDocumentChange);
    
    if (sessionStart && apiKey) {
      await sendHeartbeat();
    }
    
    figma.ui.postMessage({
      type: 'tracking-stopped'
    });
    
    console.log('Stopped tracking');
    
  } catch (error) {
    console.error('Error stopping tracking:', error);
    figma.ui.postMessage({
      type: 'error',
      message: 'Error stopping tracking: ' + error.message
    });
  }
}

async function saveSettings(settings) {
  try {
    await figma.clientStorage.setAsync('hackatime_api_key', settings.apiKey);
    await figma.clientStorage.setAsync('hackatime_server_url', settings.serverUrl);
    
    figma.ui.postMessage({
      type: 'settings-saved'
    });
    
    console.log('Settings saved successfully');
  } catch (error) {
    console.error('Error saving settings:', error);
    figma.ui.postMessage({
      type: 'error',
      message: 'Failed to save settings: ' + error.message
    });
  }
}

function onActivity() {
  if (!isTracking || !sessionStart) return;
  
  sessionStart = new Date();
  
  figma.ui.postMessage({
    type: 'activity-detected',
    project: currentProject,
    time: new Date().toLocaleTimeString()
  });
}

function onDocumentChange() {
  if (!isTracking) return;
  
  try {
    if (sessionStart && apiKey) {
      sendHeartbeat();
    }
    
    const newProject = figma.root.name || 'Untitled';
    if (newProject !== currentProject) {
      currentProject = newProject;
      sessionStart = new Date();
      console.log(`Document changed to: ${currentProject}`);
      
      figma.ui.postMessage({
        type: 'project-changed',
        project: currentProject
      });
    }
  } catch (error) {
    console.error('Error handling document change:', error);
  }
}

async function sendHeartbeat() {
  if (!isTracking || !sessionStart || !apiKey || !serverUrl) {
    console.log('Skipping heartbeat - missing requirements');
    return;
  }
  
  try {
    const now = new Date();
    const sessionTime = Math.floor((now - sessionStart) / 1000);
    
    if (sessionTime >= 120) {
      console.log('Skipping heartbeat - no recent activity');
      return;
    }
    
    totalTime += sessionTime;
    
    const heartbeatData = {
      time: Math.floor(now.getTime() / 1000),
      project: currentProject,
      language: 'Figma',
      editor: 'Figma Desktop',
      operating_system: getOperatingSystem(),
      machine: 'figma-user',
      user_agent: 'Figma-Hackatime-Plugin/1.0',
      branch: 'main',
      entity: currentProject,
      type: 'file',
      category: 'designing',
      is_write: true,
      lines: 1
    };
    
    console.log('Sending heartbeat:', heartbeatData);
    
    const response = await fetchWithRetry(`${serverUrl}/api/v1/users/current/heartbeats`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Figma-Hackatime-Plugin/1.0'
      },
      body: JSON.stringify(heartbeatData)
    });
    
    if (response.ok) {
      console.log(`Heartbeat sent successfully. Total time: ${Math.floor(totalTime / 60)} minutes`);
      
      figma.ui.postMessage({
        type: 'heartbeat-success',
        message: `Logged ${sessionTime}s to ${currentProject}`,
        totalMinutes: Math.floor(totalTime / 60)
      });
    } else {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (e) {
        errorMessage = await response.text() || errorMessage;
      }
      
      console.error('Heartbeat failed:', errorMessage);
      figma.ui.postMessage({
        type: 'heartbeat-error',
        message: `Failed to log time: ${errorMessage}`
      });
    }
    
    sessionStart = new Date();
    
  } catch (error) {
    console.error('Error sending heartbeat:', error);
    figma.ui.postMessage({
      type: 'heartbeat-error',
      message: `Network error: ${error.message}`
    });
  }
}

function getOperatingSystem() {
  if (typeof navigator !== 'undefined' && navigator.platform) {
    if (navigator.platform.indexOf('Mac') !== -1) return 'macOS';
    if (navigator.platform.indexOf('Win') !== -1) return 'Windows';
    if (navigator.platform.indexOf('Linux') !== -1) return 'Linux';
  }
  return 'Desktop';
}

async function fetchWithRetry(url, options, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
        throw new Error(errorData.message || errorData.error || `HTTP ${response.status}`);
      }
      
      return response;
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
  
  throw lastError;
}

function isOnline() {
  return navigator.onLine;
}

init();