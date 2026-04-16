# Hackatime for Figma
Ever wonder how much time you actually spend in Figma? This plugin tracks it for you and pushes the data to Hackatime, no manual logging, no interruptions, just your real design hours reflected on your dashboard.
What it does:

-Tracks your active design time automatically (not just when Figma is open ; when you're actually working)
-Knows which project you're in and logs it accordingly
-Sends a heartbeat every 30 seconds so the data stays accurate
-Handles going offline gracefully and syncs back when you reconnect
-Saves your settings as you type ; no "save" button to forget

It doesn't collect screenshots, file contents, or anything sensitive. Just timestamps, project names, and activity signals.

# Installation:
'
bash git clone https://github.com/basanta-bhandari/Hackatime.git
cd Hackatime
'
-Then in Figma: Plugins -> Development -> Import plugin from manifest -> pick manifest.json from the figma-plugin folder.
Setup
-Head to hackatime.hackclub.com, sign in, and grab your API key from Settings
-Open the plugin in Figma, paste your key, and hit "Test Connection"
-Click "Start Tracking" ; you're done

The plugin needs HTTPS and access to *.hackclub.com. That's it.
How the tracking works
The plugin watches for:
-Selection changes
-Page navigation
-Document switches
-General mouse/keyboard activity
When it picks up activity, it sends a heartbeat. Go idle and it just... doesn't. That's the whole mechanism.

# Advanced config
You probably won't need this. But if the defaults don't work for you, drop a hackatime.cfg next to the plugin files:

ini[settings]
api_url = https://hackatime.hackclub.com/api/hackatime/v1
api_key = YOUR_API_KEY_HERE
heartbeat_rate_limit_seconds = 30

# optional
debug = true
default_project = MyProject
hide_filenames = false
hostname = my-computer

What gets sent
Keeping it minimal — here's the full list:

Timestamp
Project/document name
Editor ("Figma")
OS
