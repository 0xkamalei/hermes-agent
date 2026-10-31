import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { SessionInfo } from '@/types/hermes'

import { $selectedStoredSessionId, $sessions } from './session'
import {
  $switcherIndex,
  $switcherOpen,
  $switcherSessions,
  closeSwitcher,
  commitOnCtrlUp,
  onSwitcherTabDown,
  onSwitcherTabUp,
  openOrAdvanceSwitcher,
  slotSessionId,
  SWITCHER_REVEAL_MS
} from './session-switcher'

const session = (id: string): SessionInfo => ({ id }) as SessionInfo

const seed = (ids: string[], selected: null | string) => {
  $sessions.set(ids.map(session))
  $selectedStoredSessionId.set(selected)
}

const tabTap = (direction: 1 | -1 = 1) => {
  onSwitcherTabDown()
  const target = openOrAdvanceSwitcher(direction)
  onSwitcherTabUp()

  return target
}

beforeEach(() => {
  vi.useRealTimers()
  closeSwitcher()
  $switcherSessions.set([])
  $switcherIndex.set(0)
})

afterEach(() => {
  seed([], null)
})

describe('openOrAdvanceSwitcher', () => {
  it('does nothing with fewer than two sessions', () => {
    seed(['a'], 'a')
    onSwitcherTabDown()

    expect(openOrAdvanceSwitcher(1)).toBeNull()
  })

  it('jumps immediately on a quick Tab tap without opening the HUD', () => {
    seed(['a', 'b', 'c'], 'a')

    expect(tabTap()).toBe('b')
    expect($switcherOpen.get()).toBe(false)
    expect(commitOnCtrlUp()).toBeNull()
  })

  it('does not open the HUD when Ctrl stays down but Tab was released quickly', () => {
    vi.useFakeTimers()
    seed(['a', 'b', 'c'], 'a')

    tabTap()
    vi.advanceTimersByTime(SWITCHER_REVEAL_MS)

    expect($switcherOpen.get()).toBe(false)
  })

  // LOCAL PATCH (030): the overlay is disabled — holding Tab past the reveal
  // delay must stay invisible. Every press is a direct neighbour jump.
  it('never opens the HUD when Tab stays held past the reveal delay', () => {
    vi.useFakeTimers()
    seed(['a', 'b', 'c'], 'a')

    onSwitcherTabDown()
    expect(openOrAdvanceSwitcher(1)).toBe('b')
    vi.advanceTimersByTime(SWITCHER_REVEAL_MS)

    expect($switcherOpen.get()).toBe(false)
    onSwitcherTabUp()
  })

  // LOCAL PATCH (030): a second press used to reveal the HUD. Upstream relied
  // on a real Ctrl keyup to clear `pendingBrowse`; without it the overlay
  // popped on every other press. Now each press just advances one session.
  it('keeps jumping on repeated presses instead of opening the HUD', () => {
    seed(['a', 'b', 'c'], 'a')

    // Mirrors the real call chain: `goToSession` lands the target, so the
    // next step advances from there and wraps past the end.
    const jump = () => {
      const target = tabTap()

      if (target) {
        $selectedStoredSessionId.set(target)
      }

      return target
    }

    expect(jump()).toBe('b')
    expect(jump()).toBe('c')
    expect(jump()).toBe('a')

    expect($switcherOpen.get()).toBe(false)
  })

  // LOCAL PATCH (030): with no overlay there is no highlight to commit.
  it('has nothing to commit on Ctrl up', () => {
    seed(['a', 'b', 'c'], 'a')

    expect(tabTap()).toBe('b')
    expect(commitOnCtrlUp()).toBeNull()
    expect($switcherOpen.get()).toBe(false)
  })
})

describe('slotSessionId', () => {
  // LOCAL PATCH (030): navigating no longer arms a stale snapshot, so slots
  // always resolve against the live session list.
  it('reads the live session list instead of an armed snapshot', () => {
    seed(['a', 'b', 'c'], 'a')
    tabTap()
    $sessions.set([session('x'), session('y')])

    expect(slotSessionId(1)).toBe('x')
    expect(slotSessionId(2)).toBe('y')
  })
})
