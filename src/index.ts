import { commands, window, workspace } from 'vscode'
import type { ConfigurationChangeEvent, ExtensionContext } from 'vscode'

const EXT_ID = 'font-profile'
const CONTROLLED_ITEMS = ['editor.fontFamily', 'editor.fontLigatures', 'editor.fontSize', 'editor.fontWeight', 'editor.fontVariations']

interface Profile { [key: string]: any }

function setupProfiles(e?: ConfigurationChangeEvent) {
  if (e && !e.affectsConfiguration(EXT_ID)) return

  const extConfig = workspace.getConfiguration(EXT_ID)
  const allConfig = workspace.getConfiguration()
  // First time initialization, setup the default profile
  const profileName = extConfig.get<string>('profile')
  const profiles = extConfig.get<Profile>('profiles', {})
  if (!Object.keys(profiles).length) {
    const defaultProfile: Profile = {}
    CONTROLLED_ITEMS.forEach((key) => {
      defaultProfile[key] = allConfig.get(key)
    })
    if (profileName !== 'default')
      extConfig.update('profile', 'default', true)
    extConfig.update('profiles', { default: defaultProfile }, true)
    window.showInformationMessage('The default Font Profile initialized')
    return
  }
  // Check if the current profile is valid
  if (!profileName || !profiles[profileName]) {
    window.showErrorMessage(`Invalid profile: ${profileName}`)
    return
  }
  const profile = profiles[profileName]
  // check if any of the controlled items is changed and update it
  CONTROLLED_ITEMS.forEach((key) => {
    const preferredValue = profile[key]
    if (preferredValue != null && preferredValue !== allConfig.get(key)) {
      allConfig.update(key, preferredValue, true)
    }
  })
}

export function activate(ext: ExtensionContext) {
  setupProfiles()
  ext.subscriptions.push(
    workspace.onDidChangeConfiguration(setupProfiles),
    commands.registerCommand(`${EXT_ID}.switch`, () => {
      const extConfig = workspace.getConfiguration(EXT_ID)
      const profiles = extConfig.get<Profile>('profiles', {})
      const names = Object.keys(profiles)
      if (!names.length) {
        window.showErrorMessage('No profiles found')
        return
      }
      window.showQuickPick(names).then((name) => {
        if (name) {
          extConfig.update('profile', name, true)
        }
      })
    }))
}

export function deactivate() {
}
