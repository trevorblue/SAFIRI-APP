const TUTORIAL_KEY = 'safiri_tutorial_seen'

export function markTutorialSeen() {
  localStorage.setItem(TUTORIAL_KEY, '1')
}

export function hasTutorialBeenSeen() {
  return !!localStorage.getItem(TUTORIAL_KEY)
}
