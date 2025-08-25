import { useRef } from 'react'

export type Enemy = {
  x: number
  y: number
  size: number
  speed: number
  isBoss?: boolean
  isEvacuating?: boolean
}

export type Projectile = {
  x: number
  y: number
  size: number
  speed: number
  dx: number
  dy: number
}

export function useEnemies(canvasWidth: number, canvasHeight: number) {
  const enemies = useRef<Enemy[]>([])
  const projectiles = useRef<Projectile[]>([])
  const spawnIntervalTime = useRef(2000)
  const enemyBaseSpeed = useRef(0.7)
  const bossSpawned = useRef(false)
  const lastBossShot = useRef(0)
  const stopSpawning = useRef(false)
  const bossExtraShots = useRef(0) // Contador de bolas extra

  const spawnEnemy = () => {
    const size = 20
    const edge = Math.floor(Math.random() * 4)
    let x = 0
    let y = 0
    switch (edge) {
      case 0:
        x = Math.random() * canvasWidth
        y = -size
        break
      case 1:
        x = canvasWidth + size
        y = Math.random() * canvasHeight
        break
      case 2:
        x = Math.random() * canvasWidth
        y = canvasHeight + size
        break
      case 3:
        x = -size
        y = Math.random() * canvasHeight
        break
    }
    enemies.current.push({ x, y, size, speed: enemyBaseSpeed.current })
  }

  const increaseDifficulty = () => {
    enemyBaseSpeed.current += 0.1
    spawnIntervalTime.current = Math.max(400, spawnIntervalTime.current - 200)
    enemies.current.forEach((enemy) => (enemy.speed = enemyBaseSpeed.current))
  }

  const resetEnemies = () => {
    enemies.current = []
    projectiles.current = []
    spawnIntervalTime.current = 500
    enemyBaseSpeed.current = 0.7
    bossSpawned.current = false
    lastBossShot.current = 0
    stopSpawning.current = false
    bossExtraShots.current = 0
  }

  const evacuateEnemies = () => {
    enemies.current.forEach(enemy => {
      enemy.isEvacuating = true
    })
    stopSpawning.current = true
  }

  const spawnBoss = () => {
    // Verificar que no haya ya un boss
    if (bossSpawned.current || enemies.current.some(enemy => enemy.isBoss)) {
      return
    }
    
    const bossSize = 80
    const bossSpeed = 0.5
    
    // Spawnear el boss desde fuera del canvas (como los enemigos normales)
    const edge = Math.floor(Math.random() * 4)
    let x = 0
    let y = 0
    switch (edge) {
      case 0: // Arriba
        x = Math.random() * canvasWidth
        y = -bossSize
        break
      case 1: // Derecha
        x = canvasWidth + bossSize
        y = Math.random() * canvasHeight
        break
      case 2: // Abajo
        x = Math.random() * canvasWidth
        y = canvasHeight + bossSize
        break
      case 3: // Izquierda
        x = -bossSize
        y = Math.random() * canvasHeight
        break
    }
    
    enemies.current.push({ 
      x, 
      y, 
      size: bossSize, 
      speed: bossSpeed, 
      isBoss: true 
    })
    bossSpawned.current = true
  }

  const bossShoot = (playerX: number, playerY: number) => {
    const boss = enemies.current.find(enemy => enemy.isBoss)
    if (!boss) return

    const now = Date.now()
    if (now - lastBossShot.current < 2000) return // Disparar cada 2 segundos

    // Calcular dirección hacia el jugador
    const dx = playerX - boss.x
    const dy = playerY - boss.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    
    if (dist > 0) {
      const normalizedDx = dx / dist
      const normalizedDy = dy / dist
      
      // Crear proyectil normal
      const projectile: Projectile = {
        x: boss.x + boss.size / 2,
        y: boss.y + boss.size / 2,
        size: 8,
        speed: 3,
        dx: normalizedDx,
        dy: normalizedDy
      }
      
      projectiles.current.push(projectile)
      lastBossShot.current = now
      
      // Disparar bolas extra según el contador
      for (let i = 0; i < bossExtraShots.current; i++) {
        // Dirección aleatoria para las bolas extra
        const randomAngle = Math.random() * 2 * Math.PI
        const randomDx = Math.cos(randomAngle)
        const randomDy = Math.sin(randomAngle)
        
        // Crear proyectil extra (más grande y más lento)
        const extraProjectile: Projectile = {
          x: boss.x + boss.size / 2,
          y: boss.y + boss.size / 2,
          size: 12, // Más grande
          speed: 2, // Más lento
          dx: randomDx,
          dy: randomDy
        }
        
        projectiles.current.push(extraProjectile)
      }
    }
  }

  const increaseBossDifficulty = () => {
    bossExtraShots.current += 1
  }

  const updateProjectiles = () => {
    projectiles.current = projectiles.current.filter(projectile => {
      // Mover proyectil
      projectile.x += projectile.dx * projectile.speed
      projectile.y += projectile.dy * projectile.speed
      
      // Remover proyectiles que salieron de la pantalla
      return !(projectile.x < -50 || projectile.x > canvasWidth + 50 || 
               projectile.y < -50 || projectile.y > canvasHeight + 50)
    })
  }

  return {
    enemies,
    projectiles,
    spawnEnemy,
    increaseDifficulty,
    resetEnemies,
    spawnIntervalTime,
    enemyBaseSpeed,
    evacuateEnemies,
    spawnBoss,
    bossSpawned,
    bossShoot,
    updateProjectiles,
    stopSpawning,
    increaseBossDifficulty,
  }
} 