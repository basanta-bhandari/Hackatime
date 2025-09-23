# Hackatime for Figma

A Figma plugin that automatically tracks your design time and sends it to [Hackatime](https://hackatime.hackclub.com), helping you understand how much time you spend designing.

## Features

- **Automatic Time Tracking**: Tracks your active design time in Figma
- **Smart Activity Detection**: Only logs time when you're actively working
- **Project-Based Tracking**: Automatically detects and tracks different Figma documents
- **Real-time Heartbeats**: Sends activity data every 30 seconds when active
- **Privacy Focused**: Only tracks time and project names, no sensitive design data
- **Clean UI**: Beautiful, minimal interface that matches Figma's design language

## Installation

### Option 1: Install from Figma Community (Recommended)
1. Open Figma
2. Go to **Plugins** → **Browse all plugins**
3. Search for "Hackatime"
4. Click **Install**

### Option 2: Manual Installation (Development)
1. Clone this repository:
   ```bash
   git clone https://github.com/basanta-bhandari/Hackatime.git
   cd Hackatime
   ```

2. In Figma, go to **Plugins** → **Development** → **Import plugin from manifest**

3. Select the `manifest.json` file from this project

## Setup

1. **Get Your API Key**:
   - Visit [hackatime.hackclub.com](https://hackatime.hackclub.com)
   - Create an account or sign in
   - Go to Settings and copy your API key

2. **Configure the Plugin**:
   - Open the Hackatime plugin in Figma
   - Paste your API key
   - Test the connection
   - Click "Start Tracking"

3. **Start Designing**:
   - The plugin will automatically track your time
   - View your stats on the Hackatime dashboard

## How It Works

The plugin tracks your activity by monitoring:
- Selection changes in your design
- Page navigation
- Document switches
- Mouse/keyboard activity

It sends a "heartbeat" to Hackatime every 30 seconds when you're actively working, ensuring accurate time tracking without interrupting your workflow.

## Configuration Options

### Basic Settings
- **API Key**: Your personal Hackatime API key
- **Server URL**: Hackatime server (default: `https://hackatime.hackclub.com`)

### Advanced Settings (hackatime.cfg)
```ini
[settings]
api_url = https://hackatime.hackclub.com/api/hackatime/v1
api_key = YOUR_API_KEY_HERE
heartbeat_rate_limit_seconds = 30

# Optional settings
debug = true
default_project = MyProject
hide_filenames = false
hide_project_names = false
hostname = my-computer
```

## Privacy

This plugin respects your privacy:
- Tracks only time spent and project names
- No design content or file data is sent
- No screenshots or visual data collected
- Open source and transparent
- No personal files or design details transmitted

## Data Sent

The plugin sends only these data points:
- Timestamp of activity
- Project/document name
- Editor type ("Figma")
- Operating system
- Session duration
- Activity category ("designing")

## Development

### Project Structure
```
├── manifest.json       # Figma plugin manifest
├── script.js          # Main plugin logic
├── index.html         # Plugin UI
├── hackatime.cfg      # Configuration template
└── README.md          # Documentation
```

### Local Development
1. Make your changes to the code
2. In Figma, go to **Plugins** → **Development** → **Hot reload plugin**
3. Test your changes in Figma

### Building
No build process required - Figma loads the files directly.

## API Reference

The plugin uses the Hackatime API v1 endpoints:

### Authentication
```javascript
headers: {
  'Authorization': `Bearer ${apiKey}`,
  'Content-Type': 'application/json'
}
```

### Heartbeat Format
```javascript
{
  "time": 1640995200,           // Unix timestamp
  "project": "My Design File",  // Figma document name
  "language": "Figma",          // Always "Figma"
  "editor": "Figma Desktop",    // Editor type
  "operating_system": "MacOS",  // User's OS
  "machine": "figma-user",      // Machine identifier
  "user_agent": "Figma Plugin", // User agent
  "branch": "main",             // Default branch
  "entity": "My Design File",   // File entity
  "type": "file",               // Always "file"
  "category": "designing"       // Activity category
}
```

## Troubleshooting

### Plugin Won't Start
- Check your API key is correct
- Ensure you have internet connection
- Try refreshing Figma

### Time Not Being Tracked
- Make sure you're actively working (moving mouse, making selections)
- Check the plugin status indicator
- Verify your API key in settings

### Connection Issues
- Verify the server URL is correct
- Check if Hackatime service is online
- Try testing the connection in plugin settings

## Contributing

Contributions are welcome! Here's how to help:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Test in Figma
5. Submit a pull request

### Code Style
- Use modern JavaScript (ES6+)
- Follow existing code formatting
- Add comments for complex logic
- Test thoroughly before submitting

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- Email: bhandari.basanta.47@gmail.com
- Issues: GitHub Issues
- Discussion: Hack Club Slack

## Acknowledgments

- Built for [Hack Club](https://hackclub.com)'s Hackatime service
- Inspired by the original [WakaTime](https://wakatime.com) for code editors
- Thanks to the Figma community for feedback and testing

## Changelog

### v1.0.0
- Initial release
- Basic time tracking functionality
- Figma plugin UI
- Hackatime API integration
- Auto project detection

---

**Made by Basanta Bhandari**

Track your design time, level up your productivity.