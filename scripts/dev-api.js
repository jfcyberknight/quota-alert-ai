import { createServer } from 'http'
import { pathToFileURL, fileURLToPath } from 'url'
import { join, dirname } from 'path'
import fs from 'fs'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, '..')
dotenv.config({ path: join(projectRoot, '.env.local'), override: true })

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

const PORT = Number(process.env.PORT) || 3967

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

  if (!pathname.startsWith('/api/')) {
    res.writeHead(404)
    res.end('Not found')
    return
  }

  const funcName = pathname.replace('/api/', '').replace(/\/$/, '') || 'index'
  const funcPath = join(process.cwd(), 'api', `${funcName}.js`)

  async function runHandler() {
    try {
      const mod = await import(pathToFileURL(funcPath).href + '?t=' + Date.now())
      const result = await mod.default(req, patchRes(res))
      // Support Edge-style handlers that return a Response
      if (result && typeof result.status === 'number') {
        res.statusCode = result.status
        result.headers?.forEach((v, k) => res.setHeader(k, v))
        const body = await result.text()
        res.end(body)
      }
    } catch (e) {
      console.error(`[SERVER ERROR] ${e.stack}`)
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: e.message, stack: e.stack }))
    }
  }

  const isJsonPost = (req.method === 'POST' || req.method === 'PUT') && req.headers['content-type']?.includes('application/json')
  if (isJsonPost) {
    const chunks = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => {
      try {
        req.body = JSON.parse(Buffer.concat(chunks).toString('utf8'))
      } catch {
        req.body = {}
      }
      runHandler()
    })
    req.on('error', () => {
      req.body = {}
      runHandler()
    })
  } else {
    req.body = {}
    runHandler()
  }
})

server.listen(PORT, () => {
  console.log(`API dev server → http://localhost:${PORT}/api`)
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} déjà utilisé. Lance avec: PORT=${PORT + 1} API_PORT=${PORT + 1} npm run dev:full`)
  }
})
