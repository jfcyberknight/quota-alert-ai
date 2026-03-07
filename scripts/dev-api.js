import { createServer } from 'http'
import { pathToFileURL } from 'url'
import { join } from 'path'

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

  if (!pathname.startsWith('/api/')) {
    res.writeHead(404)
    res.end('Not found')
    return
  }

  const funcName = pathname.replace('/api/', '').replace(/\/$/, '') || 'index'
  const funcPath = join(process.cwd(), 'api', `${funcName}.js`)

  try {
    const mod = await import(pathToFileURL(funcPath).href + '?t=' + Date.now())
    mod.default(req, patchRes(res))
  } catch (e) {
    res.writeHead(500, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: e.message }))
  }
})

server.listen(PORT, () => {
  console.log(`API dev server → http://localhost:${PORT}/api`)
})
