import { createServer } from 'http'
import { pathToFileURL, fileURLToPath } from 'url'
import { join, dirname } from 'path'
import fs from 'fs'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const logFile = join(__dirname, 'api_debug.log')

function logToFile(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`
  fs.appendFileSync(logFile, line, { flag: 'a' })
}

// Redirect console logs to file
const originalLog = console.log
const originalError = console.error
console.log = (...args) => {
  logToFile(args.join(' '))
  originalLog(...args)
}
console.error = (...args) => {
  logToFile(`ERROR: ${args.join(' ')}`)
  originalError(...args)
}

const PORT = 3000

function patchRes(res) {
  res.status = (code) => { res.statusCode = code; return res }
  res.json = (data) => {
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(data))
  }
  res.send = (data) => res.end(data)
  return res
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`)
  const pathname = url.pathname
  console.log(`[API] ${req.method} ${pathname}`)

  console.log(`[API] ${req.method} ${pathname}`)

  if (!pathname.startsWith('/svc/')) {
    res.writeHead(404)
    res.end('Not found')
    return
  }

  const funcName = pathname.replace('/svc/', '').replace(/\/$/, '') || 'index'
  const funcPath = join(process.cwd(), 'api', `${funcName}.js`)

  try {
    const mod = await import(pathToFileURL(funcPath).href + '?t=' + Date.now())
    await mod.default(req, patchRes(res))
  } catch (e) {
    console.error(`[SERVER ERROR] ${e.stack}`)
    res.writeHead(500, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: e.message, stack: e.stack }))
  }
})

server.listen(PORT, () => {
  console.log(`API dev server → http://localhost:${PORT}/svc`)
})
