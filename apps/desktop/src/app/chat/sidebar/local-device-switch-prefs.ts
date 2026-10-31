import { Codecs, persistentAtom } from '@/lib/persisted'

// "Switch to This device?" is a one-time warning, not a safety gate: the
// conversation stays on the other gateway either way. Once the user has seen it
// they can opt out with "Switch and don't ask again" — the opt-out is remembered
// across restarts and only ever suppresses the SWITCH prompt. The install
// prompt (bootstrap needed) keeps confirming: opting out of a warning must never
// silently install Hermes.
export const SKIP_CONFIRM_KEY = 'hermes.desktop.localDeviceSwitch.skipConfirm'

export const $skipLocalSwitchConfirm = persistentAtom(SKIP_CONFIRM_KEY, false, Codecs.bool)
