// Content for the "Where to find your history file" guide on the upload
// page, plus the user-agent checks that open the visitor's own browser tab.

export const OS_LABELS = { mac: 'macOS', windows: 'Windows', linux: 'Linux' }

// How to open a pasted path on each system.
export const OPEN_FOLDER_HINTS = {
  mac: 'In Finder, press ⌘ Shift G, paste the path and press Return.',
  windows: 'Paste the path into the File Explorer address bar and press Enter.',
  linux: 'In your file manager, press Ctrl+L and paste the path. Ctrl+H shows hidden folders.',
}

// Browsers keep their history database open and busy, so a file picked
// straight from the profile folder can be incomplete.
export const SQLITE_TIP = 'Browsers keep this file busy while they’re open. Quit the browser first, or copy the file to your Desktop and upload the copy.'

export const BROWSERS = [
  {
    id: 'chrome',
    label: 'Chrome',
    methods: [
      {
        title: 'Upload Chrome’s History file',
        file: 'History',
        steps: [
          'Open the folder for your system below.',
          'Copy the file named History (it has no extension) to your Desktop.',
          'Choose that copy with “Choose file” above.',
        ],
        paths: {
          mac: '~/Library/Application Support/Google/Chrome/Default/History',
          windows: '%LOCALAPPDATA%\\Google\\Chrome\\User Data\\Default\\History',
          linux: '~/.config/google-chrome/Default/History',
        },
        note: 'Using another Chrome profile? Open chrome://version and look for “Profile Path”.',
      },
      {
        title: 'Or export it with Google Takeout',
        steps: [
          'Go to takeout.google.com and select “Deselect all”.',
          'Tick Chrome, then “Next step” and “Create export”.',
          'Download and unzip the export, then upload History.json from the Chrome folder (older exports call it BrowserHistory.json).',
        ],
        link: { href: 'https://takeout.google.com', text: 'Open Google Takeout' },
        note: 'Takeout only includes history synced to your Google account.',
      },
    ],
  },
  {
    id: 'firefox',
    label: 'Firefox',
    methods: [
      {
        title: 'Upload Firefox’s places.sqlite file',
        file: 'places.sqlite',
        steps: [
          'In Firefox, open about:support and select “Open Folder” (or “Show in Finder”) next to Profile Folder.',
          'Copy places.sqlite from that folder to your Desktop.',
          'Choose that copy with “Choose file” above.',
        ],
        paths: {
          mac: '~/Library/Application Support/Firefox/Profiles/<profile>/places.sqlite',
          windows: '%APPDATA%\\Mozilla\\Firefox\\Profiles\\<profile>\\places.sqlite',
          linux: '~/.mozilla/firefox/<profile>/places.sqlite',
        },
        note: '<profile> is a folder with a random name, usually ending in .default-release. On Ubuntu’s snap Firefox, look in ~/snap/firefox/common/.mozilla/firefox/.',
      },
    ],
  },
  {
    id: 'safari',
    label: 'Safari',
    methods: [
      {
        title: 'Upload Safari’s History.db file',
        file: 'History.db',
        steps: [
          'Open the folder below in Finder.',
          'Copy History.db to your Desktop.',
          'Choose that copy with “Choose file” above.',
        ],
        paths: { mac: '~/Library/Safari/History.db' },
        note: 'Safari only runs on Mac, so there’s no Windows or Linux location.',
      },
    ],
  },
  {
    id: 'edge',
    label: 'Edge',
    methods: [
      {
        title: 'Upload Edge’s History file',
        file: 'History',
        steps: [
          'Open the folder for your system below.',
          'Copy the file named History (it has no extension) to your Desktop.',
          'Choose that copy with “Choose file” above.',
        ],
        paths: {
          mac: '~/Library/Application Support/Microsoft Edge/Default/History',
          windows: '%LOCALAPPDATA%\\Microsoft\\Edge\\User Data\\Default\\History',
          linux: '~/.config/microsoft-edge/Default/History',
        },
        note: 'Using another Edge profile? Open edge://version and look for “Profile path”.',
      },
    ],
  },
  {
    id: 'other',
    label: 'Other',
    methods: [
      {
        title: 'Any browser: use an export extension',
        steps: [
          'Install a browsing-history export extension from your browser’s add-on store.',
          'Export your history as CSV or JSON.',
          'Upload that file with “Choose file” above.',
        ],
      },
      {
        title: 'Brave, Vivaldi and Opera',
        steps: [
          'These browsers keep a History file just like Chrome.',
          'Open brave://version, vivaldi://about or opera://about to see the profile folder.',
          'Copy History from that folder to your Desktop and upload the copy.',
        ],
        file: 'History',
      },
    ],
  },
]

// Picks the guide tab for a user-agent string. Order matters: Edge and
// Opera also say "Chrome", and Chrome also says "Safari".
export function detectBrowser(userAgent = '') {
  const ua = String(userAgent)
  if (/Edg(e|A|iOS)?\//.test(ua)) return 'edge'
  if (/OPR\/|Opera|Vivaldi|SamsungBrowser|YaBrowser/.test(ua)) return 'other'
  if (/Firefox\/|FxiOS\//.test(ua)) return 'firefox'
  if (/Chrome\/|Chromium\/|CriOS\//.test(ua)) return 'chrome'
  if (/Safari\//.test(ua) && /Version\//.test(ua)) return 'safari'
  return 'other'
}

// Puts the visitor's system first in each list of file locations.
export function detectOS(userAgent = '') {
  const ua = String(userAgent)
  if (/Windows/.test(ua)) return 'windows'
  if (/Macintosh|Mac OS X/.test(ua) && !/iPhone|iPad/.test(ua)) return 'mac'
  if (/Linux|X11|CrOS/.test(ua) && !/Android/.test(ua)) return 'linux'
  return null
}

export function orderedPaths(paths = {}, os = null) {
  const order = ['mac', 'windows', 'linux'].sort((a, b) => (b === os) - (a === os))
  return order.filter((key) => paths[key]).map((key) => ({ os: key, path: paths[key] }))
}
