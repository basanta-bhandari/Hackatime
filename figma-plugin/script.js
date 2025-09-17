// Main tracking logic for Figma plugin
let isTracking = false;
let currentProject = '';
let sessionStart = null;
let totalTime = 0;
let apiKey = '';

// Initialize plugin
async function init() {
  // Get API key from user
  apiKey = await figma.clientStorage.getAsync('hackatime_api_key');
  if (!apiKey) {
    apiKey = prompt('Enter your Hackatime API key:');
    if (apiKey) {
      await figma.clientStorage.setAsync('hackatime_api_key', apiKey);
    }
  }
  
  // Get current document name
  currentProject = figma.root.name || 'Untitled';
  
  // Start tracking
  startTracking();
}

function startTracking() {
  if (isTracking) return;
  
  isTracking = true;
  sessionStart = new Date();
  
  // Track user activity
  figma.on('selectionchange', onActivity);
  figma.on('currentpagechange', onActivity);
  
  // Send heartbeat every 30 seconds
  setInterval(sendHeartbeat, 30000);
  
  console.log(`Started tracking: ${currentProject}`);
}

function onActivity() {
  // Reset session timer when user is active
  sessionStart = new Date();
}

function sendHeartbeat() {
  if (!isTracking || !sessionStart) return;
  
  const now = new Date();
  const sessionTime = Math.floor((now - sessionStart) / 1000); // seconds
  
  // Only send if user was active in last 2 minutes
  if (sessionTime < 120) {
    totalTime += sessionTime;
    
    const data = {
      time: now.getTime() / 1000,
      project: currentProject,
      language: 'Figma',
      editor: 'Figma Desktop',
      operating_system: navigator.platform,
      machine: 'figma-user',
      user_agent: 'Figma Plugin',
      branch: 'main',
      entity: currentProject,
      type: 'file',
      category: 'designing'
    };
    
    sendToHackatime(data);
    sessionStart = new Date(); // Reset timer
  }
}

function sendToHackatime(data) {
  if (!apiKey) return;
  
  fetch('https://api.hackatime.com/api/v1/users/current/heartbeats', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
  .then(response => {
    if (response.ok) {
      console.log('Time logged:', Math.floor(totalTime/60), 'minutes');
      figma.ui.postMessage({
        type: 'update-time',
        project: currentProject,
        time: totalTime
      });
    }
  })
  .catch(error => {
    console.error('Failed to send data:', error);
  });
}

// Handle document changes
figma.on('documentchange', () => {
  // Stop current tracking
  if (isTracking) {
    sendHeartbeat(); // Send final data
  }
  
  // Start tracking new document
  currentProject = figma.root.name || 'Untitled';
  sessionStart = new Date();
  console.log(`Switched to: ${currentProject}`);
});

// Initialize
init();