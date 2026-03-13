<template>
  <div ref="container" class="cell-network-container"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface Node3D {
  x: number
  y: number
  z: number
  size: number
  color: string
}

interface Connection {
  from: Node3D
  to: Node3D
}

const container = ref<HTMLDivElement>()
let canvas: HTMLCanvasElement
let ctx: CanvasRenderingContext2D
let animationId: number
let nodes: Node3D[] = []
let connections: Connection[] = []
let rotationY = 0
let rotationX = 0

function initCanvas() {
  if (!container.value) return
  canvas = document.createElement('canvas')
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  canvas.style.position = 'absolute'
  canvas.style.top = '0'
  canvas.style.left = '0'
  canvas.style.border = 'none'
  canvas.style.outline = 'none'
  canvas.tabIndex = -1
  canvas.style.zIndex = '-1'
  container.value.appendChild(canvas)
  ctx = canvas.getContext('2d')!
}

function createStructure() {
  nodes = []
  connections = []
  
  // 创建大型3D细胞组织结构
  const gridSize = 20  // 网格大小：决定3D网格的维度，节点总数 = gridSize^3（当前8000个节点）
  const spacing = 80   // 节点间距：控制节点之间的距离，影响整体结构的大小和密度
  const offset = (gridSize - 1) * spacing / 2  // 偏移量：使网格居中于原点
  
  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      for (let z = 0; z < gridSize; z++) {
        const baseX = x * spacing - offset
        const baseY = y * spacing - offset
        const baseZ = z * spacing - offset
        
        // 随机化位置，模拟细胞组织的不规则性
        const randX = baseX + (Math.random() - 0.5) * spacing * 0.5  // 随机偏移：±spacing*0.5的范围
        const randY = baseY + (Math.random() - 0.5) * spacing * 0.5
        const randZ = baseZ + (Math.random() - 0.5) * spacing * 0.5
        
        const colors = ['#e0f7fa', '#f3e5f5', '#e8f5e8', '#fff3e0', '#fce4ec', '#f1f8e9']  // 节点颜色数组：随机选择这些柔和的颜色
        const color = colors[Math.floor(Math.random() * colors.length)]
        
        nodes.push({
          x: randX,
          y: randY,
          z: randZ,
          size: 4 + Math.random() * 2, // 随机大小：4-6像素之间
          color
        })
      }
    }
  }
  
  // 创建连接 - 连接邻近节点
  const maxDistance = spacing * 1.0  // 最大连接距离：等于spacing，控制哪些节点之间画线
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[i].x - nodes[j].x
      const dy = nodes[i].y - nodes[j].y
      const dz = nodes[i].z - nodes[j].z
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)  // 欧几里得距离
      
      if (distance < maxDistance) {
        connections.push({ from: nodes[i], to: nodes[j] })
      }
    }
  }
}

function rotatePoint(point: Node3D, angleY: number, angleX: number): { x: number, y: number, z: number } {
  // 绕Y轴旋转
  let x1 = point.x * Math.cos(angleY) - point.z * Math.sin(angleY)
  let z1 = point.x * Math.sin(angleY) + point.z * Math.cos(angleY)
  
  // 绕X轴旋转
  let y2 = point.y * Math.cos(angleX) - z1 * Math.sin(angleX)
  let z2 = point.y * Math.sin(angleX) + z1 * Math.cos(angleX)
  
  return { x: x1, y: y2, z: z2 }
}

function project3DTo2D(point: { x: number, y: number, z: number }): { x: number, y: number, scale: number } {
  const focalLength = 300  // 焦距：控制透视效果，值越大透视越弱
  const scale = focalLength / (focalLength + point.z)  // 缩放因子：基于Z深度计算
  return {
    x: point.x * scale + canvas.width / 2,  // 投影到屏幕X坐标
    y: point.y * scale + canvas.height / 2, // 投影到屏幕Y坐标
    scale
  }
}

function drawNode(node: Node3D) {
  const rotated = rotatePoint(node, rotationY, rotationX)
  const projected = project3DTo2D(rotated)
  
  if (projected.scale > 0) {
    // 确保节点完全不透明
    ctx.globalAlpha = 1.0
    ctx.fillStyle = node.color
    ctx.fillRect(
      projected.x - node.size * projected.scale / 2,
      projected.y - node.size * projected.scale / 2,
      node.size * projected.scale,
      node.size * projected.scale
    )
  }
}

function drawConnection(conn: Connection) {
  const fromRotated = rotatePoint(conn.from, rotationY, rotationX)
  const toRotated = rotatePoint(conn.to, rotationY, rotationX)
  
  const fromProj = project3DTo2D(fromRotated)
  const toProj = project3DTo2D(toRotated)
  
  if (fromProj.scale > 0 && toProj.scale > 0) {
    // 使用连接节点的颜色，让线条与节点颜色匹配
    const lineColors = ['#e0f7fa', '#f3e5f5', '#e8f5e8', '#fff3e0', '#fce4ec', '#f1f8e9']
    const randomColor = lineColors[Math.floor(Math.random() * lineColors.length)]
    
    ctx.strokeStyle = randomColor
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(fromProj.x, fromProj.y)
    ctx.lineTo(toProj.x, toProj.y)
    ctx.stroke()
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  
  // 按Z深度排序连接（远到近）
  const sortedConnections = connections.slice().sort((a, b) => {
    const aZ = (rotatePoint(a.from, rotationY, rotationX).z + rotatePoint(a.to, rotationY, rotationX).z) / 2
    const bZ = (rotatePoint(b.from, rotationY, rotationX).z + rotatePoint(b.to, rotationY, rotationX).z) / 2
    return bZ - aZ  // 从大到小，远的先绘制
  })
  
  // 绘制连接
  sortedConnections.forEach(conn => drawConnection(conn))
  
  // 按Z深度排序节点（远到近）
  const sortedNodes = nodes.slice().sort((a, b) => {
    const aZ = rotatePoint(a, rotationY, rotationX).z
    const bZ = rotatePoint(b, rotationY, rotationX).z
    return bZ - aZ  // 从大到小，远的先绘制
  })
  
  // 绘制节点
  sortedNodes.forEach(node => drawNode(node))
}

function animate() {
  rotationY += 0.0005  // Y轴旋转速度：每帧增加的角度（弧度），控制水平旋转速度
  rotationX += 0.0002  // X轴旋转速度：每帧增加的角度，控制垂直旋转速度
  draw()
  animationId = requestAnimationFrame(animate)
}

function resizeCanvas() {
  if (!canvas) return
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  // 重新创建结构
  createStructure()
}

onMounted(() => {
  initCanvas()
  createStructure()
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
.cell-network-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  border: none;
}
</style>
