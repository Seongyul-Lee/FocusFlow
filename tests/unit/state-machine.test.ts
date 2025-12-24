/**
 * State Machine Unit Tests
 *
 * PRD Section 3 정의 불변조건 검증:
 * 1. sessions는 "완료 Focus" 횟수와 항상 동일
 * 2. totalFocusMinutes는 "완료 Focus들의 (각 Focus duration 합)"과 항상 동일
 * 3. Skip/Reset은 sessions와 totalFocusMinutes를 절대 변경하지 않음
 * 4. completedSessions는 "종료된 Focus" 횟수(완료+Skip)와 동일
 * 5. longBreakCount는 "completedSessions가 4의 배수로 도달하여 Long Break가 시작된 횟수"와 동일
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  transition,
  createInitialState,
  validateInvariants,
  type TimerState,
  type TimerSettings,
} from '@/lib/state-machine'

describe('State Machine', () => {
  let state: TimerState
  const settings: TimerSettings = {
    focusDuration: 25,
    breakDuration: 5,
  }

  beforeEach(() => {
    state = createInitialState(settings.focusDuration)
  })

  describe('Initial State', () => {
    it('should create valid initial state', () => {
      expect(state.phase).toBe('focus')
      expect(state.status).toBe('idle')
      expect(state.timeLeft).toBe(25 * 60)
      expect(state.sessions).toBe(0)
      expect(state.completedSessions).toBe(0)
      expect(state.totalFocusMinutes).toBe(0)
      expect(state.longBreakCount).toBe(0)
      expect(state.targetEndAtMs).toBeNull()
      expect(validateInvariants(state)).toBe(true)
    })
  })

  describe('START Event', () => {
    it('should transition from idle to running', () => {
      const result = transition(state, { type: 'START' }, settings)
      expect(result.state.status).toBe('running')
      expect(result.state.targetEndAtMs).not.toBeNull()
      expect(validateInvariants(result.state)).toBe(true)
    })

    it('should ignore START when already running', () => {
      const runningState = { ...state, status: 'running' as const, targetEndAtMs: Date.now() + 1000 }
      const result = transition(runningState, { type: 'START' }, settings)
      expect(result.state).toEqual(runningState)
    })

    it('should ignore START when paused', () => {
      const pausedState = { ...state, status: 'paused' as const }
      const result = transition(pausedState, { type: 'START' }, settings)
      expect(result.state).toEqual(pausedState)
    })
  })

  describe('PAUSE Event', () => {
    it('should transition from running to paused', () => {
      const runningState = { ...state, status: 'running' as const, targetEndAtMs: Date.now() + 1000 }
      const result = transition(runningState, { type: 'PAUSE' }, settings)
      expect(result.state.status).toBe('paused')
      expect(result.state.targetEndAtMs).toBeNull()
      expect(validateInvariants(result.state)).toBe(true)
    })

    it('should ignore PAUSE when idle', () => {
      const result = transition(state, { type: 'PAUSE' }, settings)
      expect(result.state).toEqual(state)
    })
  })

  describe('RESUME Event', () => {
    it('should transition from paused to running', () => {
      const pausedState = { ...state, status: 'paused' as const, timeLeft: 600 }
      const result = transition(pausedState, { type: 'RESUME' }, settings)
      expect(result.state.status).toBe('running')
      expect(result.state.targetEndAtMs).not.toBeNull()
      expect(validateInvariants(result.state)).toBe(true)
    })

    it('should ignore RESUME when idle', () => {
      const result = transition(state, { type: 'RESUME' }, settings)
      expect(result.state).toEqual(state)
    })

    it('should ignore RESUME when running', () => {
      const runningState = { ...state, status: 'running' as const, targetEndAtMs: Date.now() + 1000 }
      const result = transition(runningState, { type: 'RESUME' }, settings)
      expect(result.state).toEqual(runningState)
    })
  })

  describe('SKIP Event', () => {
    describe('Focus Skip', () => {
      it('should increment completedSessions but NOT sessions', () => {
        const result = transition(state, { type: 'SKIP' }, settings)
        expect(result.state.phase).toBe('break')
        expect(result.state.completedSessions).toBe(1)
        expect(result.state.sessions).toBe(0) // 불변
        expect(result.state.totalFocusMinutes).toBe(0) // 불변
        expect(validateInvariants(result.state)).toBe(true)
      })

      it('should always go to Short Break (never Long Break)', () => {
        // Focus를 Skip하면 항상 Short Break (Long Break 안 됨)
        let currentState = state

        // 4번의 Focus Skip (각 Skip 후 Break도 Skip하여 다시 Focus로)
        for (let i = 0; i < 4; i++) {
          // Focus Skip → Short Break
          currentState = transition(currentState, { type: 'SKIP' }, settings).state
          expect(currentState.phase).toBe('break') // 항상 Short Break

          // Break Skip → Focus로 복귀
          if (i < 3) { // 마지막은 Break 상태로 유지
            currentState = transition(currentState, { type: 'SKIP' }, settings).state
            expect(currentState.phase).toBe('focus')
          }
        }

        expect(currentState.completedSessions).toBe(4)
        expect(currentState.longBreakCount).toBe(0) // Long Break 트리거 안 됨
      })

      it('should preserve statistics (sessions, totalFocusMinutes)', () => {
        const stateWithStats = {
          ...state,
          sessions: 5,
          totalFocusMinutes: 125,
        }
        const result = transition(stateWithStats, { type: 'SKIP' }, settings)
        expect(result.state.sessions).toBe(5) // 불변
        expect(result.state.totalFocusMinutes).toBe(125) // 불변
      })
    })

    describe('Break Skip', () => {
      it('should transition to Focus', () => {
        const breakState = { ...state, phase: 'break' as const, timeLeft: 300 }
        const result = transition(breakState, { type: 'SKIP' }, settings)
        expect(result.state.phase).toBe('focus')
        expect(result.state.timeLeft).toBe(25 * 60)
      })
    })

    describe('Long Break Skip', () => {
      it('should transition to Focus', () => {
        const longBreakState = { ...state, phase: 'longBreak' as const, timeLeft: 900 }
        const result = transition(longBreakState, { type: 'SKIP' }, settings)
        expect(result.state.phase).toBe('focus')
        expect(result.state.timeLeft).toBe(25 * 60)
      })
    })
  })

  describe('RESET Event', () => {
    it('should reset to initial Focus state', () => {
      const runningState = {
        ...state,
        phase: 'break' as const,
        status: 'running' as const,
        timeLeft: 100,
        targetEndAtMs: Date.now() + 1000,
      }
      const result = transition(runningState, { type: 'RESET' }, settings)
      expect(result.state.phase).toBe('focus')
      expect(result.state.status).toBe('idle')
      expect(result.state.timeLeft).toBe(25 * 60)
      expect(result.state.targetEndAtMs).toBeNull()
    })

    it('should preserve statistics (PRD requirement)', () => {
      const stateWithStats = {
        ...state,
        sessions: 10,
        completedSessions: 12,
        totalFocusMinutes: 250,
        longBreakCount: 3,
      }
      const result = transition(stateWithStats, { type: 'RESET' }, settings)
      expect(result.state.sessions).toBe(10) // 불변
      expect(result.state.completedSessions).toBe(12) // 불변
      expect(result.state.totalFocusMinutes).toBe(250) // 불변
      expect(result.state.longBreakCount).toBe(3) // 불변
      expect(validateInvariants(result.state)).toBe(true)
    })
  })

  describe('TIME_UP Event', () => {
    describe('Focus Completion', () => {
      it('should increment sessions, completedSessions, totalFocusMinutes', () => {
        const runningState = {
          ...state,
          status: 'running' as const,
          timeLeft: 0,
          targetEndAtMs: Date.now(),
        }
        const result = transition(runningState, { type: 'TIME_UP' }, settings)
        expect(result.state.sessions).toBe(1)
        expect(result.state.completedSessions).toBe(1)
        expect(result.state.totalFocusMinutes).toBe(25)
        expect(result.state.phase).toBe('break')
        expect(result.sideEffects?.notification).toBeDefined()
        expect(result.sideEffects?.sound).toBe(true)
        expect(validateInvariants(result.state)).toBe(true)
      })

      it('should trigger Long Break on 4th completion', () => {
        let currentState = { ...state, status: 'running' as const, timeLeft: 0, targetEndAtMs: Date.now() }

        // 1st, 2nd, 3rd completion → Short Break
        for (let i = 0; i < 3; i++) {
          const result = transition(currentState, { type: 'TIME_UP' }, settings)
          expect(result.state.phase).toBe('break')
          expect(result.state.longBreakCount).toBe(0)
          // Go back to Focus
          currentState = { ...result.state, phase: 'focus', status: 'running', timeLeft: 0, targetEndAtMs: Date.now() }
        }

        // 4th completion → Long Break
        const result = transition(currentState, { type: 'TIME_UP' }, settings)
        expect(result.state.phase).toBe('longBreak')
        expect(result.state.completedSessions).toBe(4)
        expect(result.state.longBreakCount).toBe(1)
        expect(validateInvariants(result.state)).toBe(true)
      })

      it('should trigger Long Break on 8th, 12th completion', () => {
        let currentState = state

        // Complete 8 Focus sessions
        for (let i = 1; i <= 8; i++) {
          currentState = { ...currentState, phase: 'focus', status: 'running', timeLeft: 0, targetEndAtMs: Date.now() }
          const result = transition(currentState, { type: 'TIME_UP' }, settings)
          currentState = result.state

          if (i % 4 === 0) {
            expect(result.state.phase).toBe('longBreak')
          } else {
            expect(result.state.phase).toBe('break')
          }
        }

        expect(currentState.completedSessions).toBe(8)
        expect(currentState.longBreakCount).toBe(2) // 4th, 8th
      })
    })

    describe('Break Completion', () => {
      it('should transition to Focus', () => {
        const breakState = {
          ...state,
          phase: 'break' as const,
          status: 'running' as const,
          timeLeft: 0,
          targetEndAtMs: Date.now(),
        }
        const result = transition(breakState, { type: 'TIME_UP' }, settings)
        expect(result.state.phase).toBe('focus')
        expect(result.state.timeLeft).toBe(25 * 60)
        expect(result.sideEffects?.notification).toBeDefined()
      })
    })

    describe('Long Break Completion', () => {
      it('should transition to Focus', () => {
        const longBreakState = {
          ...state,
          phase: 'longBreak' as const,
          status: 'running' as const,
          timeLeft: 0,
          targetEndAtMs: Date.now(),
        }
        const result = transition(longBreakState, { type: 'TIME_UP' }, settings)
        expect(result.state.phase).toBe('focus')
        expect(result.state.timeLeft).toBe(25 * 60)
      })
    })

    it('should ignore TIME_UP when not running', () => {
      const idleState = { ...state, timeLeft: 0 }
      const result = transition(idleState, { type: 'TIME_UP' }, settings)
      expect(result.state).toEqual(idleState)
    })
  })

  describe('Invariants', () => {
    it('sessions should never exceed completedSessions', () => {
      let currentState = state

      // Mix of TIME_UP and SKIP
      currentState = transition(currentState, { type: 'START' }, settings).state
      currentState = { ...currentState, timeLeft: 0 }
      currentState = transition(currentState, { type: 'TIME_UP' }, settings).state // sessions=1, completed=1

      currentState = { ...currentState, phase: 'focus', status: 'idle' }
      currentState = transition(currentState, { type: 'SKIP' }, settings).state // sessions=1, completed=2

      expect(currentState.sessions).toBe(1)
      expect(currentState.completedSessions).toBe(2)
      expect(currentState.sessions).toBeLessThanOrEqual(currentState.completedSessions)
      expect(validateInvariants(currentState)).toBe(true)
    })

    it('totalFocusMinutes should equal sessions * focusDuration', () => {
      let currentState = state

      // Complete 3 Focus sessions
      for (let i = 0; i < 3; i++) {
        currentState = { ...currentState, phase: 'focus', status: 'running', timeLeft: 0, targetEndAtMs: Date.now() }
        currentState = transition(currentState, { type: 'TIME_UP' }, settings).state
        currentState = { ...currentState, phase: 'focus', status: 'idle' }
      }

      expect(currentState.sessions).toBe(3)
      expect(currentState.totalFocusMinutes).toBe(3 * 25)
      expect(validateInvariants(currentState)).toBe(true)
    })

    it('should maintain invariants through complex scenario', () => {
      let currentState = state

      // Complex scenario: TIME_UP, SKIP, RESET mix
      currentState = { ...currentState, status: 'running', timeLeft: 0, targetEndAtMs: Date.now() }
      currentState = transition(currentState, { type: 'TIME_UP' }, settings).state // Focus complete

      currentState = { ...currentState, phase: 'focus', status: 'idle' }
      currentState = transition(currentState, { type: 'SKIP' }, settings).state // Focus skip

      currentState = transition(currentState, { type: 'RESET' }, settings).state // Reset

      expect(validateInvariants(currentState)).toBe(true)
      expect(currentState.sessions).toBe(1) // TIME_UP만 카운트
      expect(currentState.completedSessions).toBe(2) // TIME_UP + SKIP
      expect(currentState.totalFocusMinutes).toBe(25)
    })
  })
})
