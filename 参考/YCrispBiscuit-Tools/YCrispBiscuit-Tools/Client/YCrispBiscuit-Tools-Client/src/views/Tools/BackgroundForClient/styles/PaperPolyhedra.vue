<template>
  <div class="background-container">
    <canvas ref="canvas" class="background-canvas"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const canvas = ref<HTMLCanvasElement>()
let ctx: CanvasRenderingContext2D | null = null
let animationId: number
let particles: PaperParticle[] = []
let networkParticles: NetworkParticle[] = []

class NetworkParticle {
  x: number
  y: number
  vx: number
  vy: number
  size: number

  constructor(x: number, y: number) {
    this.x = x
    this.y = y
    this.vx = (Math.random() - 0.5) * 1
    this.vy = (Math.random() - 0.5) * 1
    this.size = Math.random() * 3 + 2
  }

  update(width: number, height: number) {
    this.x += this.vx
    this.y += this.vy

    if (this.x < 0 || this.x > width) this.vx *= -1
    if (this.y < 0 || this.y > height) this.vy *= -1

    this.x = Math.max(0, Math.min(width, this.x))
    this.y = Math.max(0, Math.min(height, this.y))
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
    ctx.fillStyle = '#ffffff' // 白色粒子
    ctx.fill()
  }
}

class PaperParticle {
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
  rotationX: number
  rotationY: number
  rotationZ: number
  rotSpeedX: number
  rotSpeedY: number
  rotSpeedZ: number
  size: number
  vertices: { x: number; y: number; z: number }[]

  constructor(x: number, y: number, z: number) {
    this.x = x
    this.y = y
    this.z = z
    this.vx = (Math.random() - 0.5) * 0.3
    this.vy = (Math.random() - 0.5) * 0.3
    this.vz = (Math.random() - 0.5) * 0.3
    this.rotationX = Math.random() * Math.PI * 2
    this.rotationY = Math.random() * Math.PI * 2
    this.rotationZ = Math.random() * Math.PI * 2
    this.rotSpeedX = (Math.random() - 0.5) * 0.01
    this.rotSpeedY = (Math.random() - 0.5) * 0.01
    this.rotSpeedZ = (Math.random() - 0.5) * 0.01
    this.size = Math.random() * 25 + 15

    // 创建多面体顶点（四面体）- 增加体积
    this.vertices = [
      { x: 0, y: 0, z: this.size },
      { x: this.size * 0.8, y: 0, z: -this.size * 0.3 },
      { x: -this.size * 0.4, y: this.size * 0.7, z: -this.size * 0.3 },
      { x: -this.size * 0.4, y: -this.size * 0.7, z: -this.size * 0.3 }
    ]
  }

  update(width: number, height: number) {
    this.x += this.vx
    this.y += this.vy
    this.z += this.vz

    // 边界反弹
    if (this.x < -width/2 || this.x > width/2) this.vx *= -1
    if (this.y < -height/2 || this.y > height/2) this.vy *= -1
    if (this.z < -150 || this.z > 150) this.vz *= -1

    this.rotationX += this.rotSpeedX
    this.rotationY += this.rotSpeedY
    this.rotationZ += this.rotSpeedZ
  }

  // 3D旋转矩阵变换
  rotate3D(point: { x: number; y: number; z: number }) {
    let { x, y, z } = point

    // X轴旋转
    const cosX = Math.cos(this.rotationX)
    const sinX = Math.sin(this.rotationX)
    const y1 = y * cosX - z * sinX
    const z1 = y * sinX + z * cosX
    y = y1
    z = z1

    // Y轴旋转
    const cosY = Math.cos(this.rotationY)
    const sinY = Math.sin(this.rotationY)
    const x2 = x * cosY + z * sinY
    const z2 = -x * sinY + z * cosY
    x = x2
    z = z2

    // Z轴旋转
    const cosZ = Math.cos(this.rotationZ)
    const sinZ = Math.sin(this.rotationZ)
    const x3 = x * cosZ - y * sinZ
    const y3 = x * sinZ + y * cosZ
    x = x3
    y = y3

    return { x, y, z }
  }

  // 透视投影到2D
  project(width: number, height: number) {
    const centerX = width / 2
    const centerY = height / 2
    const focalLength = 250

    const projected = this.vertices.map(vertex => {
      const rotated = this.rotate3D(vertex)
      const scale = focalLength / (focalLength + rotated.z + this.z)
      return {
        x: centerX + (rotated.x + this.x) * scale,
        y: centerY + (rotated.y + this.y) * scale,
        z: rotated.z + this.z
      }
    })

    return projected
  }

  draw(ctx: CanvasRenderingContext2D, projected: { x: number; y: number; z: number }[]) {
    // 绘制多面体边线
    const edges = [
      [0, 1], [0, 2], [0, 3],
      [1, 2], [2, 3], [3, 1]
    ]

    ctx.strokeStyle = '#ffffff' // 白色多面体边线
    ctx.lineWidth = 1

    edges.forEach(([i, j]) => {
      const v1 = projected[i]
      const v2 = projected[j]

      // 简单的深度测试
      if (v1.z > -50 && v2.z > -50) {
        ctx.beginPath()
        ctx.moveTo(v1.x, v1.y)
        ctx.lineTo(v2.x, v2.y)
        ctx.stroke()
      }
    })

    // 绘制顶点
    projected.forEach(vertex => {
      if (vertex.z > -50) {
        ctx.beginPath()
        ctx.arc(vertex.x, vertex.y, 2, 0, Math.PI * 2)
        ctx.fillStyle = '#ffffff'
        ctx.fill()
      }
    })
  }
}

const resizeCanvas = () => {
  if (!canvas.value) return
  const width = window.innerWidth || 1920
  const height = window.innerHeight || 1080
  canvas.value.width = width
  canvas.value.height = height
  initParticles(width, height)
}

function initParticles(width: number, height: number) {
  particles = []
  networkParticles = []

  // 初始化多面体粒子 - 增加数量和体积
  for (let i = 0; i < 12; i++) {
    particles.push(new PaperParticle(
      (Math.random() - 0.5) * width * 0.8,
      (Math.random() - 0.5) * height * 0.8,
      (Math.random() - 0.5) * 300
    ))
  }

  // 初始化网络粒子 - 增加数量
  for (let i = 0; i < 40; i++) {
    networkParticles.push(new NetworkParticle(
      Math.random() * width,
      Math.random() * height
    ))
  }
}

function drawNetworkConnections(ctx: CanvasRenderingContext2D, width: number, height: number) {
  // 绘制网络粒子间的连接线
  for (let i = 0; i < networkParticles.length; i++) {
    for (let j = i + 1; j < networkParticles.length; j++) {
      const dx = networkParticles[i].x - networkParticles[j].x
      const dy = networkParticles[i].y - networkParticles[j].y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance < 150) {
        ctx.beginPath()
        ctx.moveTo(networkParticles[i].x, networkParticles[i].y)
        ctx.lineTo(networkParticles[j].x, networkParticles[j].y)
        ctx.strokeStyle = `rgba(255, 255, 255, ${(1 - distance / 150) * 0.4})`
        ctx.lineWidth = 1
        ctx.stroke()
      }
    }
  }

  // 绘制多面体与网络粒子的连接
  particles.forEach(particle => {
    const projected = particle.project(width, height)
    const center = projected.reduce((acc, v) => ({ x: acc.x + v.x, y: acc.y + v.y }), { x: 0, y: 0 })
    center.x /= projected.length
    center.y /= projected.length

    networkParticles.forEach(netParticle => {
      const dx = center.x - netParticle.x
      const dy = center.y - netParticle.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance < 200) {
        ctx.beginPath()
        ctx.moveTo(center.x, center.y)
        ctx.lineTo(netParticle.x, netParticle.y)
        ctx.strokeStyle = `rgba(255, 255, 255, ${(1 - distance / 200) * 0.3})`
        ctx.lineWidth = 0.5
        ctx.stroke()
      }
    })
  })
}

function animate() {
  if (!ctx || !canvas.value) return

  const width = canvas.value.width
  const height = canvas.value.height

  ctx.clearRect(0, 0, width, height)

  // 更新和绘制网络粒子
  networkParticles.forEach(particle => {
    particle.update(width, height)
    particle.draw(ctx!)
  })

  // 更新和绘制多面体粒子
  particles.forEach(particle => {
    particle.update(width, height)
    const projected = particle.project(width, height)
    particle.draw(ctx!, projected)
  })

  // 绘制连接线
  drawNetworkConnections(ctx!, width, height)

  animationId = requestAnimationFrame(animate)
}

onMounted(() => {
  if (!canvas.value) return
  ctx = canvas.value.getContext('2d')
  if (!ctx) return

  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)

  animate()
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  window.removeEventListener('resize', resizeCanvas)
})
</script>

<style scoped>
.background-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  z-index: 0;
}

.background-canvas {
  display: block;
}
</style>
