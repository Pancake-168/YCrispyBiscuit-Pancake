<template>
  <div ref="container" class="line-network-container"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface MovingPoint {
  x: number
  y: number
  vx: number
  vy: number
  edge: 'top' | 'bottom' | 'left' | 'right'
  used: boolean
}

interface MovingLine {
  point1: MovingPoint
  point2: MovingPoint
}

const container = ref<HTMLDivElement>()
let canvas: HTMLCanvasElement
let ctx: CanvasRenderingContext2D
let animationId: number
let points: MovingPoint[] = []
let lines: MovingLine[] = []
const numPoints = 20 // 每条边上的点数

function initCanvas() {
  if (!container.value) return
  canvas = document.createElement('canvas')
  canvas.width = window.innerWidth + 2
  canvas.height = window.innerHeight + 2
  canvas.style.position = 'absolute'
  canvas.style.top = '-1px'
  canvas.style.left = '-1px'
  canvas.style.border = 'none'
  canvas.style.outline = 'none'
  canvas.tabIndex = -1
  canvas.style.zIndex = '-1'
  container.value.appendChild(canvas)
  ctx = canvas.getContext('2d')!
}

function createPoints() {
  const width = canvas.width
  const height = canvas.height
  points = []

  // 上边
  for (let i = 0; i < numPoints; i++) {
    points.push({
      x: (i / (numPoints - 1)) * width,
      y: 0,
      vx: Math.random() * 2 - 1,
      vy: 0,
      edge: 'top',
      used: false
    })
  }

  // 下边
  for (let i = 0; i < numPoints; i++) {
    points.push({
      x: (i / (numPoints - 1)) * width,
      y: height,
      vx: Math.random() * 2 - 1,
      vy: 0,
      edge: 'bottom',
      used: false
    })
  }

  // 左边
  for (let i = 0; i < numPoints; i++) {
    points.push({
      x: 0,
      y: (i / (numPoints - 1)) * height,
      vx: 0,
      vy: Math.random() * 2 - 1,
      edge: 'left',
      used: false
    })
  }

  // 右边
  for (let i = 0; i < numPoints; i++) {
    points.push({
      x: width,
      y: (i / (numPoints - 1)) * height,
      vx: 0,
      vy: Math.random() * 2 - 1,
      edge: 'right',
      used: false
    })
  }
}

function createLines() {
  lines = []
  const availablePoints = points.filter(p => !p.used)
  
  while (availablePoints.length >= 2) {
    const index1 = Math.floor(Math.random() * availablePoints.length)
    const point1 = availablePoints.splice(index1, 1)[0]
    point1.used = true
    
    const index2 = Math.floor(Math.random() * availablePoints.length)
    const point2 = availablePoints.splice(index2, 1)[0]
    point2.used = true
    
    lines.push({
      point1,
      point2
    })
  }
}

function updatePoints() {
  const width = canvas.width
  const height = canvas.height
  
  points.forEach(point => {
    point.x += point.vx
    point.y += point.vy
    
    // 检查边界并反转方向
    if (point.edge === 'top' || point.edge === 'bottom') {
      if (point.x <= 0 || point.x >= width) {
        point.vx = -point.vx
        point.x = Math.max(0, Math.min(width, point.x))
      }
    } else if (point.edge === 'left' || point.edge === 'right') {
      if (point.y <= 0 || point.y >= height) {
        point.vy = -point.vy
        point.y = Math.max(0, Math.min(height, point.y))
      }
    }
  })
}

function getLineIntersection(line1: MovingLine, line2: MovingLine): { x: number, y: number } | null {
  const p1 = line1.point1
  const p2 = line1.point2
  const p3 = line2.point1
  const p4 = line2.point2
  
  const denom = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x)
  if (Math.abs(denom) < 1e-10) return null // 平行
  
  const t = ((p1.x - p3.x) * (p3.y - p4.y) - (p1.y - p3.y) * (p3.x - p4.x)) / denom
  const u = -((p1.x - p2.x) * (p1.y - p3.y) - (p1.y - p2.y) * (p1.x - p3.x)) / denom
  
  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return {
      x: p1.x + t * (p2.x - p1.x),
      y: p1.y + t * (p2.y - p1.y)
    }
  }
  return null
}

function drawLine(line: MovingLine) {
  const { point1, point2 } = line
  
  // 计算直线方程
  const dx = point2.x - point1.x
  const dy = point2.y - point1.y
  
  if (dx === 0 && dy === 0) return // 点重合
  
  // 屏幕边界
  const left = 0
  const right = canvas.width
  const top = 0
  const bottom = canvas.height
  
  // 计算线与屏幕边界的交点
  const intersections: { x: number, y: number }[] = []
  
  // 与左边界的交点
  if (dx !== 0) {
    const t = (left - point1.x) / dx
    const y = point1.y + t * dy
    if (y >= top && y <= bottom) {
      intersections.push({ x: left, y })
    }
  }
  
  // 与右边界的交点
  if (dx !== 0) {
    const t = (right - point1.x) / dx
    const y = point1.y + t * dy
    if (y >= top && y <= bottom) {
      intersections.push({ x: right, y })
    }
  }
  
  // 与上边界的交点
  if (dy !== 0) {
    const t = (top - point1.y) / dy
    const x = point1.x + t * dx
    if (x >= left && x <= right) {
      intersections.push({ x, y: top })
    }
  }
  
  // 与下边界的交点
  if (dy !== 0) {
    const t = (bottom - point1.y) / dy
    const x = point1.x + t * dx
    if (x >= left && x <= right) {
      intersections.push({ x, y: bottom })
    }
  }
  
  // 如果有两个交点，绘制线段
  if (intersections.length >= 2) {
    ctx.strokeStyle = '#ffffff' // 统一颜色
    ctx.lineWidth = 0.5
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(intersections[0].x, intersections[0].y)
    ctx.lineTo(intersections[1].x, intersections[1].y)
    ctx.stroke()
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  
  // 绘制线
  lines.forEach(line => {
    drawLine(line)
  })
  
  // 计算并绘制交点
  const intersections: { x: number, y: number }[] = []
  for (let i = 0; i < lines.length; i++) {
    for (let j = i + 1; j < lines.length; j++) {
      const inter = getLineIntersection(lines[i], lines[j])
      if (inter && inter.x >= 0 && inter.x <= canvas.width && inter.y >= 0 && inter.y <= canvas.height) {
        intersections.push(inter)
      }
    }
  }
  
  // 绘制交点
  ctx.fillStyle = '#ffffff'
  intersections.forEach(inter => {
    ctx.beginPath()
    ctx.arc(inter.x, inter.y, 4, 0, Math.PI * 2)
    ctx.fill()
  })
  
  // 可选：绘制点（用于调试）
  // points.forEach(point => {
  //   ctx.fillStyle = point.used ? 'red' : 'blue'
  //   ctx.beginPath()
  //   ctx.arc(point.x, point.y, 3, 0, Math.PI * 2)
  //   ctx.fill()
  // })
}

function animate() {
  updatePoints()
  draw()
  animationId = requestAnimationFrame(animate)
}

function resizeCanvas() {
  if (!canvas) return
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  // 重新创建点和线
  createPoints()
  createLines()
}

onMounted(() => {
  initCanvas()
  createPoints()
  createLines()
  animate()
  
  window.addEventListener('resize', resizeCanvas)
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  window.removeEventListener('resize', resizeCanvas)
})
</script>

<style scoped>
.line-network-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  border: none;
}
</style>