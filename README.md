Hackatime Time Tracking Setup
A simple setup guide for integrating Hackatime time tracking with various development tools and IDEs.
What is Hackatime?
Hackatime is an open-source time tracking service compatible with WakaTime. It tracks your coding time across different editors and tools, providing insights into your development productivity.
Quick Start

Get your API key from hackatime.hackclub.com
Choose your setup method based on your workflow
Configure using the provided files in this repository

Setup Options
Option 1: WakaTime CLI (Universal)
Works with any editor that has WakaTime plugin support.
Installation:
bash# Install WakaTime CLI
pip install wakatime

# Or download from: https://github.com/wakatime/wakatime-cli/releases
Configuration:

Copy wakatime.cfg to your home directory:

Linux/Mac: ~/.wakatime.cfg
Windows: %USERPROFILE%\.wakatime.cfg


Update the API key in the config file with your Hackatime key
Install WakaTime plugin for your editor:

VS Code: Search for "WakaTime" in extensions
Neovim: Use your plugin manager to install wakatime/vim-wakatime
Sublime Text: Install via Package Control
And many more: Check WakaTime plugins



Option 2: Manual Integration
For custom applications or tools that don't have WakaTime plugins.
Requirements:

WakaTime CLI installed (see Option 1)
Basic scripting knowledge

Usage:
bash# Send a heartbeat manually
wakatime --entity "path/to/file" --time $(date +%s)

# With project name
wakatime --entity "path/to/file" --project "MyProject" --time $(date +%s)

# Mark as write operation
wakatime --entity "path/to/file" --write --time $(date +%s)
Option 3: Figma Desktop Plugin
For tracking time spent in Figma Desktop application.
Setup:

Download the plugin files from this repository
Import manifest.json in Figma Desktop:

Menu → Plugins → Development → Import plugin from manifest
Select the manifest.json file


Configure your API key in the plugin interface

Note: Only works with Figma Desktop, not Figma Web.
Configuration Files
wakatime.cfg
Main configuration file for WakaTime CLI integration.
ini[settings]
api_url = https://hackatime.hackclub.com/api/hackatime/v1
api_key = YOUR_API_KEY_HERE
heartbeat_rate_limit_seconds = 1000
manifest.json (Figma Plugin)
Figma Desktop plugin configuration.
index.html & script.js (Figma Plugin)
Figma Desktop plugin user interface and logic.
Troubleshooting
Common Issues
"Invalid API key" error:

Verify your API key is correct from hackatime.hackclub.com/settings
Check that the config file is in the correct location
Ensure no extra spaces or characters in the API key

"Connection failed" error:

Check internet connectivity
Verify the API URL: https://hackatime.hackclub.com/api/hackatime/v1
Try testing with curl:

bash  curl -H "Authorization: Bearer YOUR_API_KEY" \
       https://hackatime.hackclub.com/api/hackatime/v1/users/current
No time tracking data:

Ensure your editor's WakaTime plugin is enabled
Check that files are being saved (many plugins only track on save)
Verify the config file path is correct

Debug Mode
Enable debug logging by adding to your wakatime.cfg:
ini[settings]
debug = true
Check debug logs:

Linux/Mac: ~/.wakatime/wakatime.log
Windows: %USERPROFILE%\.wakatime\wakatime.log

Supported Editors & Tools

VS Code (via WakaTime extension)
Neovim/Vim (via vim-wakatime)
Sublime Text (via WakaTime package)
Atom (via wakatime-atom)
IntelliJ IDEA / PyCharm / WebStorm (via WakaTime plugin)
Emacs (via wakatime-mode)
Figma Desktop (via custom plugin in this repo)
Any editor with WakaTime support

API Integration
For custom integrations, use the Hackatime API:
Endpoint: https://hackatime.hackclub.com/api/hackatime/v1/heartbeats
Example POST request:
bashcurl -X POST https://hackatime.hackclub.com/api/hackatime/v1/heartbeats \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "entity": "path/to/file.js",
    "type": "file",
    "category": "coding",
    "time": 1640995200,
    "project": "MyProject",
    "language": "JavaScript",
    "is_write": false
  }'
Contributing
Found an issue or want to add support for another tool?

Open an issue describing the problem or tool
Submit a pull request with configuration files
Update this README with setup instructions

License
This setup guide and configuration files are provided as-is for educational purposes.
Resources

Hackatime Dashboard: hackatime.hackclub.com
WakaTime CLI: github.com/wakatime/wakatime-cli
WakaTime Plugins: wakatime.com/plugins
API Documentation: Available on the Hackatime dashboard

