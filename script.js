const c = document.querySelector('#c')
const ctx = c.getContext('2d')

const trailC = document.createElement('canvas')
const trailCtx = trailC.getContext('2d')

const dpr = Math.min(2, window.devicePixelRatio || 1)

c.style.imageRendering = 'pixelated'
c.style.width = '100vw'
c.style.height = '100vh'

const b = 3
const b2 = b * 2

const w = 340
const h = 155

let baseX = 0
let baseY = 0

let dragging = false
let offsetX = 0
let offsetY = 0

let messageIndex = 0
let lastTrailTime = 0
let prevX = -9999
let prevY = -9999
let bsodActive = false
let mouseX = -100
let mouseY = -100
let useCustomCursor = true

const TRAIL_HOLD_MS = 15000

const messages = [
  'The program is not responding. The feelings, however, are very responsive.',
  'Critical affection detected. Windows cannot fix this problem.',
  'Error 404: emotional stability not found.',
  'This alert is stuck here because it has attachment issues.',
  'System warning: too adorable to terminate.',
  'Pressing OK will do absolutely nothing. Classic.'
]

const setup = () => {
  c.width = window.innerWidth * dpr
  c.height = window.innerHeight * dpr
  trailC.width = c.width
  trailC.height = c.height

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  trailCtx.setTransform(dpr, 0, 0, dpr, 0, 0)

  trailCtx.clearRect(0, 0, window.innerWidth, window.innerHeight)

  resetPosition()
}

const resetPosition = () => {
  baseX = window.innerWidth / 2 - w / 2
  baseY = window.innerHeight / 2 - h / 2
  prevX = -9999
  prevY = -9999
  lastTrailTime = 0
  trailCtx.clearRect(0, 0, window.innerWidth, window.innerHeight)
}

const drawWindow = (target, x, y, width, height) => {
  target.beginPath()
  target.rect(x, y, width, height)
  target.fillStyle = 'darkgray'
  target.fill()

  target.strokeStyle = 'black'
  target.stroke()
  target.closePath()

  target.beginPath()
  target.moveTo(x, y)
  target.lineTo(x + width, y)
  target.lineTo(x + width - b, y + b)
  target.lineTo(x + b, y + height - b)
  target.lineTo(x, y + height)
  target.lineTo(x, y)
  target.closePath()
  target.fillStyle = 'white'
  target.fill()

  target.fillStyle = 'lightgray'
  target.fillRect(x + b, y + b, width - b2, height - b2)
}

const drawButton = (target, x, y, width, height, label, disabled = false) => {
  drawWindow(target, x, y, width, height)

  target.fillStyle = disabled ? '#808080' : 'black'
  target.font = '11px Tahoma'
  target.textAlign = 'center'
  target.textBaseline = 'middle'
  target.fillText(label, x + width / 2, y + height / 2 + 1)
}

const wrapText = (target, text, x, y, maxWidth, lineHeight) => {
  const words = text.split(' ')
  let line = ''
  let lineY = y

  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + ' '
    const metrics = target.measureText(testLine)

    if (metrics.width > maxWidth && i > 0) {
      target.fillText(line, x, lineY)
      line = words[i] + ' '
      lineY += lineHeight
    } else {
      line = testLine
    }
  }

  target.fillText(line, x, lineY)
}

const drawAlert = (target, x, y, time) => {
  const cx = x + w / 2

  drawWindow(target, x, y, w, h)

  const gradient = target.createLinearGradient(x, y, x + w, y)
  gradient.addColorStop(0, '#000080')
  gradient.addColorStop(1, '#1084D0')

  target.fillStyle = gradient
  target.fillRect(x + b, y + b, w - b2, 22)

  target.fillStyle = 'white'
  target.font = 'bold 11px Tahoma'
  target.textAlign = 'left'
  target.textBaseline = 'alphabetic'
  target.fillText('Alert — Not Responding', x + 8, y + 18)

  drawButton(target, x + w - 28, y + 5, 20, 18, '×')

  target.fillStyle = '#ffd642'
  target.beginPath()
  target.moveTo(x + 42, y + 52)
  target.lineTo(x + 20, y + 96)
  target.lineTo(x + 64, y + 96)
  target.closePath()
  target.fill()
  target.strokeStyle = 'black'
  target.stroke()

  target.fillStyle = 'black'
  target.font = 'bold 18px Tahoma'
  target.textAlign = 'center'
  target.fillText('!', x + 42, y + 89)

  target.fillStyle = 'black'
  target.font = '11px Tahoma'
  target.textAlign = 'left'
  target.textBaseline = 'alphabetic'

  const glitch = Math.floor(time / 140) % 24 === 0 ? ' █' : ''
  wrapText(target, messages[messageIndex] + glitch, x + 78, y + 58, 230, 14)

  drawButton(target, cx - 50, y + h - 42, 100, 24, 'OK', true)
}

const drawCloud = (target, x, y, scale) => {
  target.fillStyle = 'rgba(255, 255, 255, 0.92)'
  target.beginPath()
  target.arc(x, y, 18 * scale, 0, Math.PI * 2)
  target.arc(x + 22 * scale, y - 6 * scale, 22 * scale, 0, Math.PI * 2)
  target.arc(x + 48 * scale, y, 16 * scale, 0, Math.PI * 2)
  target.arc(x + 28 * scale, y + 8 * scale, 14 * scale, 0, Math.PI * 2)
  target.fill()
}

const drawHillLayer = (target, sw, sh, horizon, amplitude, frequency, phase, color) => {
  target.fillStyle = color
  target.beginPath()
  target.moveTo(0, sh)

  for (let x = 0; x <= sw; x += 4) {
    const y =
      horizon +
      Math.sin(x * frequency + phase) * amplitude +
      Math.sin(x * frequency * 0.37 + phase * 1.4) * amplitude * 0.45
    target.lineTo(x, y)
  }

  target.lineTo(sw, sh)
  target.closePath()
  target.fill()
}

const drawScreensaver = (time) => {
  const sw = window.innerWidth
  const sh = window.innerHeight
  const t = time * 0.00008

  const sky = ctx.createLinearGradient(0, 0, 0, sh * 0.62)
  sky.addColorStop(0, '#0e4d8b')
  sky.addColorStop(0.45, '#4a9fd4')
  sky.addColorStop(1, '#b8dff5')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, sw, sh)

  drawCloud(ctx, sw * 0.12 + Math.sin(t) * 30, sh * 0.14, 1.1)
  drawCloud(ctx, sw * 0.55 + Math.sin(t * 0.7) * 40, sh * 0.1, 0.9)
  drawCloud(ctx, sw * 0.82 + Math.sin(t * 1.1) * 25, sh * 0.18, 0.75)

  const horizon = sh * 0.48

  drawHillLayer(ctx, sw, sh, horizon + 30, 28, 0.006, t * 0.8, '#1a5c1a')
  drawHillLayer(ctx, sw, sh, horizon + 55, 38, 0.009, t * 1.2 + 1, '#2d7a2d')
  drawHillLayer(ctx, sw, sh, horizon + 80, 48, 0.012, t * 1.6 + 2.5, '#3d9b3d')
  drawHillLayer(ctx, sw, sh, horizon + 105, 35, 0.015, t * 2 + 4, '#5cb85c')

  ctx.fillStyle = '#4a7a28'
  ctx.fillRect(0, sh * 0.78, sw, sh * 0.22)
}

const drawBsod = (time) => {
  const sw = window.innerWidth
  const sh = window.innerHeight
  const pulse = 0.88 + Math.sin(time * 0.006) * 0.12

  ctx.fillStyle = `rgb(${Math.floor(160 * pulse)}, 0, 0)`
  ctx.fillRect(0, 0, sw, sh)

  if (Math.random() < 0.18) {
    ctx.fillStyle = '#3a0000'
    ctx.fillRect(0, Math.random() * sh, sw, Math.random() * 12 + 2)
  }

  if (Math.floor(time / 80) % 19 === 0) {
    const jitter = (Math.random() - 0.5) * 8
    ctx.fillStyle = '#ff0000'
    ctx.fillRect(jitter, 0, sw, sh)
  }

  ctx.fillStyle = '#ffffcc'
  ctx.font = 'bold 15px "Courier New", Courier, monospace'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'

  const lines = [
    '*** STOP: 0x000000FEELINGS (FEELINGS_NOT_HANDLED)',
    '',
    'A fatal exception has occurred in your heart.',
    'The current relationship will be terminated.',
    '',
    '* Press any key to continue _',
    '* Press CTRL+ALT+DEL to restart your life',
    '',
    'Technical information:',
    '*** STOP: 0xC000021A (0xDEADBEEF, 0x00000000, 0x00000000)'
  ]

  let ty = sh * 0.12
  for (const line of lines) {
    const glitch = Math.random() < 0.04 ? ' ▓▒░' : ''
    ctx.fillText(line + glitch, 40, ty)
    ty += line === '' ? 10 : 22
  }

  const drawPixelHeart = (target, x, y, px, pulse) => {
    const heart = [
      '01100110',
      '11111111',
      '11111111',
      '01111110',
      '00111100',
      '00011000'
    ]
    const color = pulse > 0.5 ? '#ff8fab' : '#ff5c7a'

    for (let row = 0; row < heart.length; row++) {
      for (let col = 0; col < heart[row].length; col++) {
        if (heart[row][col] === '1') {
          target.fillStyle = color
          target.fillRect(x + col * px, y + row * px, px, px)
        }
      }
    }
  }

  const signature = 'тут была катя'
  const heartPx = 2
  const heartW = 8 * heartPx
  const heartPulse = Math.floor(time / 500) % 2
  const sigX = sw - 40
  const sigY = sh - 50

  ctx.font = 'italic 13px "Courier New", Courier, monospace'
  ctx.fillStyle = '#ffcccc'
  ctx.textAlign = 'right'
  ctx.textBaseline = 'top'

  const sigWidth = ctx.measureText(signature).width
  drawPixelHeart(ctx, sigX - sigWidth - heartW - 8, sigY + 1, heartPx, heartPulse)
  ctx.fillText(signature, sigX, sigY)

  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)'
  for (let y = 0; y < sh; y += 4) {
    ctx.fillRect(0, y, sw, 1)
  }
}

const drawHourglass = (hotspotX, hotspotY, time) => {
  const frame = Math.floor(time / 90) % 8
  const drainStep = frame % 4
  const flipped = frame >= 4
  const scale = 2
  const size = 16
  const cx = size / 2
  const neckY = 8

  const topBulbPath = () => {
    ctx.beginPath()
    ctx.moveTo(cx - 5.5, 1)
    ctx.lineTo(cx + 5.5, 1)
    ctx.lineTo(cx + 1, neckY)
    ctx.lineTo(cx - 1, neckY)
    ctx.closePath()
  }

  const botBulbPath = () => {
    ctx.beginPath()
    ctx.moveTo(cx - 1, neckY)
    ctx.lineTo(cx + 1, neckY)
    ctx.lineTo(cx + 5.5, 15)
    ctx.lineTo(cx - 5.5, 15)
    ctx.closePath()
  }

  ctx.save()
  ctx.imageSmoothingEnabled = false
  ctx.translate(hotspotX, hotspotY)
  ctx.scale(scale, scale)
  ctx.translate(-size / 2, -size / 2)

  if (flipped) {
    ctx.translate(cx, cx)
    ctx.rotate(Math.PI)
    ctx.translate(-cx, -cx)
  }

  ctx.strokeStyle = '#000000'
  ctx.lineWidth = 1
  ctx.fillStyle = '#ffffff'

  topBulbPath()
  ctx.fill()
  ctx.stroke()

  botBulbPath()
  ctx.fill()
  ctx.stroke()

  const topFill = Math.max(0, 1 - drainStep / 3)
  const botFill = drainStep / 3

  ctx.fillStyle = '#e8a317'

  if (topFill > 0.02) {
    ctx.save()
    topBulbPath()
    ctx.clip()
    ctx.fillRect(cx - 5, 2, 10, 5.5 * topFill)
    ctx.restore()
  }

  if (botFill > 0.02) {
    ctx.save()
    botBulbPath()
    ctx.clip()
    ctx.fillRect(cx - 5, 15 - 5.5 * botFill, 10, 5.5 * botFill)
    ctx.restore()
  }

  if (drainStep > 0 && drainStep < 3) {
    ctx.fillRect(cx - 0.5, neckY - 1.5, 1, 3)
  }

  ctx.restore()
}

const setCursorMode = (mode) => {
  useCustomCursor = mode === 'wait'

  if (mode === 'wait') {
    c.style.cursor = 'none'
    document.body.style.cursor = 'none'
  } else {
    c.style.cursor = mode
    document.body.style.cursor = mode
  }
}

const fadeTrails = (now) => {
  if (now - lastTrailTime < TRAIL_HOLD_MS) return

  trailCtx.globalCompositeOperation = 'destination-out'
  trailCtx.fillStyle = 'rgba(0, 0, 0, 0.012)'
  trailCtx.fillRect(0, 0, window.innerWidth, window.innerHeight)
  trailCtx.globalCompositeOperation = 'source-over'
}

const stampTrail = (x, y, time) => {
  if (Math.abs(x - prevX) < 1 && Math.abs(y - prevY) < 1) return

  drawAlert(trailCtx, x, y, time)
  lastTrailTime = time
  prevX = x
  prevY = y
}

const hitTest = (clientX, clientY) => {
  const x = baseX
  const y = baseY

  const isTitle =
    clientX >= x + b &&
    clientX <= x + w - b &&
    clientY >= y + b &&
    clientY <= y + 26

  const okX = x + w / 2 - 50
  const okY = y + h - 42

  const isOk =
    clientX >= okX &&
    clientX <= okX + 100 &&
    clientY >= okY &&
    clientY <= okY + 24

  const isClose =
    clientX >= x + w - 28 &&
    clientX <= x + w - 8 &&
    clientY >= y + 5 &&
    clientY <= y + 23

  if (isOk) return { part: 'ok', x, y }
  if (isClose) return { part: 'close', x, y }
  if (isTitle) return { part: 'title', x, y }

  return null
}

const onPointerDown = (event) => {
  if (bsodActive) return

  const hit = hitTest(event.clientX, event.clientY)

  if (!hit) return

  if (hit.part === 'close') {
    resetPosition()
    return
  }

  if (hit.part === 'ok') {
    bsodActive = true
    dragging = false
    setCursorMode('default')
    return
  }

  if (hit.part === 'title') {
    dragging = true
    offsetX = event.clientX - baseX
    offsetY = event.clientY - baseY
    setCursorMode('grabbing')
  }
}

const onPointerMove = (event) => {
  mouseX = event.clientX
  mouseY = event.clientY

  if (bsodActive) return

  if (dragging) {
    baseX = event.clientX - offsetX
    baseY = event.clientY - offsetY

    baseX = Math.max(-w + 60, Math.min(window.innerWidth - 60, baseX))
    baseY = Math.max(0, Math.min(window.innerHeight - 30, baseY))
    return
  }

  const hit = hitTest(event.clientX, event.clientY)

  if (hit && hit.part === 'title') {
    setCursorMode('grab')
  } else if (hit && hit.part === 'ok') {
    setCursorMode('pointer')
  } else if (hit && hit.part === 'close') {
    setCursorMode('pointer')
  } else {
    setCursorMode('wait')
  }
}

const onPointerUp = () => {
  dragging = false
  setCursorMode('wait')
}

const animate = (time) => {
  requestAnimationFrame(animate)

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  trailCtx.setTransform(dpr, 0, 0, dpr, 0, 0)

  if (bsodActive) {
    drawBsod(time)
    return
  }

  fadeTrails(time)

  drawScreensaver(time)

  ctx.drawImage(trailC, 0, 0, c.width, c.height, 0, 0, window.innerWidth, window.innerHeight)

  stampTrail(baseX, baseY, time)
  drawAlert(ctx, baseX, baseY, time)

  if (useCustomCursor && mouseX >= 0) {
    drawHourglass(mouseX, mouseY, time)
  }
}

c.addEventListener('mousedown', onPointerDown)
window.addEventListener('mousemove', onPointerMove)
window.addEventListener('mouseup', onPointerUp)

c.addEventListener('touchstart', (event) => {
  event.preventDefault()
  const touch = event.touches[0]
  onPointerDown({ clientX: touch.clientX, clientY: touch.clientY })
}, { passive: false })

c.addEventListener('touchmove', (event) => {
  event.preventDefault()
  const touch = event.touches[0]
  onPointerMove({ clientX: touch.clientX, clientY: touch.clientY })
}, { passive: false })

c.addEventListener('touchend', onPointerUp)

window.addEventListener('resize', setup)

setup()
setCursorMode('wait')
requestAnimationFrame(animate)
