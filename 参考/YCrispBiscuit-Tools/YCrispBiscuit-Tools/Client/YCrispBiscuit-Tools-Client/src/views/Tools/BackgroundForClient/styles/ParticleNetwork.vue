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
let particles: Particle[] = []

class Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number

  constructor(x: number, y: number) {
    this.x = x
    this.y = y
    this.vx = (Math.random() - 0.5) * 2
    this.vy = (Math.random() - 0.5) * 2
    this.size = Math.random() * 3 + 1
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
    ctx.fillStyle = '#ffffff'
    ctx.fill()
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
  for (let i = 0; i < 50; i++) {
    particles.push(new Particle(Math.random() * width, Math.random() * height))
  }
}

function drawConnections(ctx: CanvasRenderingContext2D) {
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x
      const dy = particles[i].y - particles[j].y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance < 100) {
        ctx.beginPath()
        ctx.moveTo(particles[i].x, particles[i].y)
        ctx.lineTo(particles[j].x, particles[j].y)
        ctx.strokeStyle = `rgba(255, 255, 255, ${1 - distance / 100})`
        ctx.lineWidth = 1
        ctx.stroke()
      }
    }
  }
}

function animate() {
  if (!ctx || !canvas.value) return

  const width = canvas.value.width
  const height = canvas.value.height

  ctx.clearRect(0, 0, width, height)

  particles.forEach(particle => {
    particle.update(width, height)
    particle.draw(ctx!)
  })

  drawConnections(ctx!)

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
