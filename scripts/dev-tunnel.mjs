#!/usr/bin/env node
/*
 * Runs `next dev` and the ngrok tunnel together, so Creem webhooks can reach
 * the local app during a real checkout.
 *
 * Why a script rather than `next dev & ngrok ...`: a backgrounded shell job
 * survives Ctrl-C. You end up with an orphan holding port 3000 or an orphan
 * holding the reserved ngrok domain, and the next run fails with a port or
 * domain clash that looks like a config problem. This waits on both children
 * and takes the other one down whichever exits first.
 */
import { spawn } from 'node:child_process'

const TUNNEL_URL = 'https://my-portfolio.ngrok.app'
const PORT = '3000'

const children = []
let shuttingDown = false

function run(label, command, args) {
  const child = spawn(command, args, { stdio: 'inherit' })
  children.push(child)

  child.on('error', (err) => {
    console.error(`\n[${label}] failed to start: ${err.message}`)
    if (err.code === 'ENOENT') {
      console.error(
        `[${label}] "${command}" is not on PATH.` +
          (command === 'ngrok' ? ' Install it with: brew install ngrok' : '')
      )
    }
    shutdown(1)
  })

  child.on('exit', (code, signal) => {
    if (shuttingDown) return
    console.error(
      `\n[${label}] exited (${signal || `code ${code}`}). Stopping the other process.`
    )
    shutdown(code ?? 1)
  })

  return child
}

function shutdown(code) {
  if (shuttingDown) return
  shuttingDown = true
  for (const child of children) {
    if (!child.killed) child.kill('SIGTERM')
  }
  // Leave a moment for a clean exit, then go.
  setTimeout(() => process.exit(code), 300)
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => shutdown(0))
}

console.log(`Tunnel:  ${TUNNEL_URL}`)
console.log(`Webhook: ${TUNNEL_URL}/webhooks/creem\n`)

run('next', 'next', ['dev'])
run('ngrok', 'ngrok', ['http', PORT, '--url', TUNNEL_URL])
