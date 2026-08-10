import React, { useCallback, useEffect, useState } from 'react'
import { Box, Text, useInput } from 'ink'
import { TextInput } from '@inkjs/ui'
import InkTextInput from 'ink-text-input'

import type { QueueFilter, QueueItem, ReviewStatus } from './api'
import * as api from './api'
import type { User } from '../payload-types'
import { Detail } from './views/Detail'
import { Queue } from './views/Queue'

type Screen = 'login' | 'queue' | 'detail'
type LoginStage = 'email' | 'password'

export function App() {
  const [screen, setScreen] = useState<Screen>('login')
  const [user, setUser] = useState<User | null>(null)
  const [loginStage, setLoginStage] = useState<LoginStage>('email')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [busy, setBusy] = useState(false)

  const [filter, setFilter] = useState<QueueFilter>('pending')
  const [items, setItems] = useState<QueueItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selected, setSelected] = useState<QueueItem | null>(null)
  const [notice, setNotice] = useState('')

  const reload = useCallback(async (u: User, f: QueueFilter) => {
    setIsLoading(true)
    try {
      setItems(await api.fetchQueue(u, f))
      setNotice('')
    } catch {
      setItems([])
      setNotice('Could not load the queue. Are you a reviewer or admin?')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const runAction = useCallback(
    async (fn: () => Promise<unknown>, successMessage: string, backToQueue = true) => {
      if (!user || !selected) return
      setBusy(true)
      setNotice('')
      try {
        await fn()
        setNotice(successMessage)
        await reload(user, filter)
        if (backToQueue) setScreen('queue')
      } catch (error) {
        setNotice(error instanceof Error ? error.message : 'Action failed.')
      } finally {
        setBusy(false)
      }
    },
    [filter, reload, selected, user],
  )

  // Queue-screen keys only; Detail wires its own keys (gated on its notes editor).
  useInput(
    (input) => {
      if (input === 'q') {
        setScreen('login')
        setUser(null)
        setPassword('')
        setLoginStage('email')
        return
      }
      const next: Record<string, QueueFilter> = { p: 'pending', a: 'approved', r: 'rejected', l: 'all' }
      if (next[input] && user) {
        setFilter(next[input])
        void reload(user, next[input])
      }
    },
    { isActive: screen === 'queue' },
  )

  // Load the queue once after login and on every return to the queue screen.
  useEffect(() => {
    if (!user || screen !== 'queue') return
    const timer = setTimeout(() => void reload(user, filter), 0)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, screen])

  const submitLogin = useCallback(
    (submittedPassword: string) => {
      void (async () => {
        setBusy(true)
        setLoginError('')
        try {
          const loggedIn = await api.login(email, submittedPassword)
          if (!api.canTriage(loggedIn)) {
            setLoginError('This account cannot triage the queue — reviewer or admin role required.')
            setLoginStage('email')
            setPassword('')
            return
          }
          setUser(loggedIn)
          setScreen('queue')
        } catch {
          setLoginError('Sign-in failed. Check the email and password.')
          setLoginStage('email')
          setPassword('')
        } finally {
          setBusy(false)
        }
      })()
    },
    [email],
  )

  if (screen === 'login' || !user) {
    return (
      <Box flexDirection="column">
        <Text bold>Hồ Sơ Mở — review queue</Text>
        <Text dimColor>Sign in with a reviewer or admin account.</Text>
        <Box marginTop={1} flexDirection="column">
          {loginStage === 'email' ? (
            <Box gap={1}>
              <Text>Email:</Text>
              <TextInput
                defaultValue={email}
                onChange={setEmail}
                onSubmit={(value) => {
                  if (value.trim()) setLoginStage('password')
                }}
                placeholder="you@example.org"
              />
            </Box>
          ) : (
            <Box gap={1}>
              <Text>Password:</Text>
              <InkTextInput
                mask="*"
                value={password}
                onChange={setPassword}
                onSubmit={submitLogin}
                placeholder="••••••••"
              />
            </Box>
          )}
        </Box>
        {loginError ? <Text color="red">{loginError}</Text> : null}
        {busy ? <Text color="gray">Signing in…</Text> : null}
        <Box marginTop={1}>
          <Text dimColor>Enter to continue · Ctrl+C to quit</Text>
        </Box>
      </Box>
    )
  }

  return (
    <Box flexDirection="column">
      <Box gap={1} marginBottom={1}>
        <Text bold>Hồ Sơ Mở — review queue</Text>
        <Text dimColor>signed in as {user.publicName}</Text>
      </Box>

      {screen === 'queue' ? (
        <Queue
          filter={filter}
          isLoading={isLoading}
          items={items}
          onOpen={(item) => {
            setSelected(item)
            setNotice('')
            setScreen('detail')
          }}
        />
      ) : selected ? (
        <Detail
          busy={busy}
          item={selected}
          message={notice}
          onAction={(status: ReviewStatus) =>
            void runAction(() => api.setReviewStatus(user, selected.id, status), `Marked as ${status}.`)
          }
          onBack={() => setScreen('queue')}
          onSaveNotes={(notes) =>
            void runAction(
              () => api.saveReviewerNotes(user, selected.id, notes),
              'Notes saved.',
              false,
            )
          }
          onTogglePublish={() =>
            void runAction(
              () => api.setPublishInCase(user, selected.id, !selected.publishInCase),
              selected.publishInCase
                ? 'Removed from the public case page.'
                : 'Now shown on the public case page.',
            )
          }
        />
      ) : null}

      {notice && screen === 'queue' ? (
        <Box marginTop={1}>
          <Text color="yellow">{notice}</Text>
        </Box>
      ) : null}
    </Box>
  )
}
