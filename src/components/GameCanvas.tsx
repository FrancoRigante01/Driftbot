import { useEffect, useRef, useState } from 'react'
import StartMenu from './StartMenu'
import { usePlayerControls } from '../hooks/usePlayerControls'
import { useEnemies } from '../hooks/useEnemies'
import { drawPlayer } from '../drawers/PlayerDrawer'
import { drawEnemy } from '../drawers/EnemyDrawer'

const CANVAS_WIDTH = 1000
const CANVAS_HEIGHT = 750

const GameCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isGameOver, setIsGameOver] = useState(false)
  const [restartTrigger, setRestartTrigger] = useState(0)
  const [time, setTime] = useState(0)
  const [isStarted, setIsStarted] = useState(false)
  const powerUp = useRef({ x: 0, y: 0, active: false, type: 'speed' as 'speed' | 'invulnerability' | 'freeze' })
  const playerSpeed = useRef(2)
  const powerUpSize = 10 // igual al jugador
  const basePlayerSpeed = 2
  const powerUpSpeed = basePlayerSpeed * 2.5
  const isInvulnerable = useRef(false)
  const enemiesFrozenRef = useRef(false)

  const keys = usePlayerControls()
  const {
    enemies,
    projectiles,
    spawnEnemy,
    increaseDifficulty,
    resetEnemies,
    spawnIntervalTime,
    evacuateEnemies,
    spawnBoss,
    bossSpawned,
    bossShoot,
    updateProjectiles,
    stopSpawning,
    increaseBossDifficulty,
  } = useEnemies(CANVAS_WIDTH, CANVAS_HEIGHT)

  const player = useRef({ x: 300, y: 200, size: 20, speed: basePlayerSpeed })

  // Estado para mutear/desmutear efectos de sonido
  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(false);

  // Función para detener todos los audios
  const stopAllAudio = () => {
    if (powerupAudio.current) powerupAudio.current.pause();
    if (gameoverAudio.current) gameoverAudio.current.pause();
    if (uploadAudio.current) uploadAudio.current.pause();
    if (startAudio.current) startAudio.current.pause();
    if (buttonAudio.current) buttonAudio.current.pause();
    if (musicAudio.current) musicAudio.current.pause();
  };

  // Función para reproducir música de fondo
  const playBackgroundMusic = () => {
    if (musicAudio.current && !mutedRef.current) {
      musicAudio.current.currentTime = 0;
      musicAudio.current.loop = true;
      musicAudio.current.volume = 0.3; // Volumen más bajo para música de fondo
      musicAudio.current.play();
    }
  };

  // Detener audios cuando se mutea
  useEffect(() => {
    mutedRef.current = muted;
    if (muted) {
      stopAllAudio();
    } else {
      // Si se desmutea y el juego está activo, reanudar la música
      if (isStarted && !isGameOver) {
        playBackgroundMusic();
      }
    }
  }, [muted]);

  // Función para reproducir sonido de botón
  const playButtonSound = () => {
    if (buttonAudio.current && !mutedRef.current) {
      buttonAudio.current.currentTime = 0;
      buttonAudio.current.play();
    }
  };

  // Función para spawnear el power-up en una posición aleatoria
  const spawnPowerUp = () => {
    const margin = 30
    // Elegir aleatoriamente entre los tres tipos
    const rand = Math.random()
    let powerUpType: 'speed' | 'invulnerability' | 'freeze'
    if (rand < 1/3) powerUpType = 'speed'
    else if (rand < 2/3) powerUpType = 'invulnerability'
    else powerUpType = 'freeze'
    powerUp.current = {
      x: Math.random() * (CANVAS_WIDTH - margin * 2) + margin,
      y: Math.random() * (CANVAS_HEIGHT - margin * 2) + margin,
      active: true,
      type: powerUpType,
    }
  }

  useEffect(() => {
    if (!isStarted) return

    let powerUpInterval: ReturnType<typeof setInterval>
    let firstTimeout: ReturnType<typeof setTimeout>

    // El primer power-up aparece a los 10 segundos
    firstTimeout = setTimeout(() => {
      spawnPowerUp()
      powerUpInterval = setInterval(() => {
        spawnPowerUp()
      }, 10000)
    }, 10000)

    return () => {
      clearTimeout(firstTimeout)
      clearInterval(powerUpInterval)
    }
  }, [isStarted, restartTrigger])

  useEffect(() => {
    if (!isStarted) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationId: number
    let enemyInterval: ReturnType<typeof setInterval>
    let difficultyInterval: ReturnType<typeof setInterval>
    let timerInterval: ReturnType<typeof setInterval>
    let gameLoop: () => void
    let paused = false;

    const checkCollision = (
      aX: number,
      aY: number,
      aSize: number,
      bX: number,
      bY: number,
      bSize: number
    ) => {
      return (
        aX < bX + bSize &&
        aX + aSize > bX &&
        aY < bY + bSize &&
        aY + aSize > bY
      )
    }

    const startGame = () => {
      setIsGameOver(false)
      setTime(0)
      resetEnemies()
      spawnEnemy()

      clearInterval(enemyInterval)
      clearInterval(difficultyInterval)
      clearInterval(timerInterval)

      enemyInterval = setInterval(() => {
        // No spawnear enemigos si el boss ya apareció o se está evacuando
        if (!bossSpawned.current && !stopSpawning.current) {
          spawnEnemy()
        }
      }, spawnIntervalTime.current)

      difficultyInterval = setInterval(() => {
        increaseDifficulty()
        clearInterval(enemyInterval)
        enemyInterval = setInterval(() => {
          // No spawnear enemigos si el boss ya apareció o se está evacuando
          if (!bossSpawned.current && !stopSpawning.current) {
            spawnEnemy()
          }
        }, spawnIntervalTime.current)
      }, 20000)

      timerInterval = setInterval(() => {
        setTime((prev) => {
          const newTime = prev + 1

          // Verificar si llegamos a los 100 segundos y no se ha spawnado el boss
          if (newTime === 100 && !bossSpawned.current) {
            // Evacuar enemigos y spawnear boss
            evacuateEnemies()
            setTimeout(() => {
              spawnBoss()
            }, 2000) // Esperar 2 segundos para que los enemigos se vayan
          }

          // Aumentar dificultad del boss cada 20 segundos después de que aparezca
          if (bossSpawned.current && newTime > 100 && (newTime - 100) % 20 === 0) {
            increaseBossDifficulty()
          }

          return newTime
        })
      }, 1000)

      gameLoop = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        // Cambiar la condición de corte del gameLoop para permitir el evento final
        if (paused || isGameOver) {
          cancelAnimationFrame(animationId)
          clearInterval(enemyInterval)
          clearInterval(difficultyInterval)
          clearInterval(timerInterval)
          return
        }

        // Dibuja el power-up si está activo
        if (powerUp.current.active) {
          ctx.beginPath()
          ctx.arc(powerUp.current.x, powerUp.current.y, powerUpSize, 0, 2 * Math.PI)
          
          // Color diferente según el tipo de power-up
          if (powerUp.current.type === 'speed') {
            ctx.fillStyle = '#43e047' // Verde para velocidad
            ctx.shadowColor = '#43e047'
          } else if (powerUp.current.type === 'invulnerability') {
            ctx.fillStyle = '#ff9900' // Naranja para escudo
            ctx.shadowColor = '#ff9900'
          } else if (powerUp.current.type === 'freeze') {
            ctx.fillStyle = '#00e6ff' // Celeste para congelar
            ctx.shadowColor = '#00e6ff'
          }
          
          ctx.shadowBlur = 12
          ctx.fill()
          ctx.shadowBlur = 0
        }

        // Actualiza la velocidad del jugador
        player.current.speed = playerSpeed.current

        // Movimiento del jugador
        if (keys.current.w || keys.current.ArrowUp) player.current.y -= player.current.speed
        if (keys.current.s || keys.current.ArrowDown) player.current.y += player.current.speed
        if (keys.current.a || keys.current.ArrowLeft) player.current.x -= player.current.speed
        if (keys.current.d || keys.current.ArrowRight) player.current.x += player.current.speed

        player.current.x = Math.max(0, Math.min(player.current.x, canvas.width - player.current.size))
        player.current.y = Math.max(0, Math.min(player.current.y, canvas.height - player.current.size))

        // Detección de colisión con el power-up
        if (
          powerUp.current.active &&
          player.current.x < powerUp.current.x + powerUpSize &&
          player.current.x + player.current.size > powerUp.current.x - powerUpSize &&
          player.current.y < powerUp.current.y + powerUpSize &&
          player.current.y + player.current.size > powerUp.current.y - powerUpSize
        ) {
          powerUp.current.active = false
          
          if (powerUp.current.type === 'speed') {
            // Power-up de velocidad
            playerSpeed.current = powerUpSpeed
            setTimeout(() => {
              playerSpeed.current = basePlayerSpeed
            }, 3000)
          } else if (powerUp.current.type === 'invulnerability') {
            // Power-up de invulnerabilidad
            isInvulnerable.current = true
            setTimeout(() => {
              isInvulnerable.current = false
            }, 3000)
          } else if (powerUp.current.type === 'freeze') {
            // Power-up de congelar
            enemiesFrozenRef.current = true
            setTimeout(() => {
              enemiesFrozenRef.current = false
            }, 3000)
          }
          
          if (powerupAudio.current && !mutedRef.current) {
            powerupAudio.current.currentTime = 0;
            powerupAudio.current.play();
          }
        }

        // Dibuja al jugador
        drawPlayer(ctx, player.current.x, player.current.y, player.current.size, isInvulnerable.current)

        // Actualizar proyectiles
        updateProjectiles()

        // Hacer que el boss dispare
        if (bossSpawned.current) {
          bossShoot(player.current.x + player.current.size / 2, player.current.y + player.current.size / 2)
        }

        // Dibuja enemigos
        for (let enemy of enemies.current) {
          if (enemy.isEvacuating) {
            // Los enemigos se alejan de la pantalla
            const centerX = CANVAS_WIDTH / 2
            const centerY = CANVAS_HEIGHT / 2
            const dx = enemy.x - centerX
            const dy = enemy.y - centerY
            const dist = Math.sqrt(dx * dx + dy * dy)
            
            if (dist > 0) {
              const dirX = (dx / dist) * enemy.speed * 2 // Más rápido para evacuar
              const dirY = (dy / dist) * enemy.speed * 2
              enemy.x += dirX
              enemy.y += dirY
            }
            
            // Remover enemigos que se salieron de la pantalla
            if (enemy.x < -100 || enemy.x > CANVAS_WIDTH + 100 || 
                enemy.y < -100 || enemy.y > CANVAS_HEIGHT + 100) {
              enemies.current = enemies.current.filter(e => e !== enemy)
              continue
            }
          } else if (!enemiesFrozenRef.current) {
            if (enemy.isBoss) {
              // El boss persigue al jugador
              const dx = player.current.x - enemy.x
              const dy = player.current.y - enemy.y
              const dist = Math.sqrt(dx * dx + dy * dy)
              const dirX = (dx / dist) * enemy.speed
              const dirY = (dy / dist) * enemy.speed
              enemy.x += dirX
              enemy.y += dirY
            } else {
              // Enemigos normales persiguen al jugador
              const dx = player.current.x - enemy.x
              const dy = player.current.y - enemy.y
              const dist = Math.sqrt(dx * dx + dy * dy)
              const dirX = (dx / dist) * enemy.speed
              const dirY = (dy / dist) * enemy.speed
              enemy.x += dirX
              enemy.y += dirY
            }
          }
          drawEnemy(ctx, enemy)

          if (
            checkCollision(
              player.current.x,
              player.current.y,
              player.current.size,
              enemy.x,
              enemy.y,
              enemy.size
            ) && !isInvulnerable.current
          ) {
            cancelAnimationFrame(animationId)
            clearInterval(enemyInterval)
            clearInterval(difficultyInterval)
            clearInterval(timerInterval)
            if (gameoverAudio.current && !mutedRef.current) {
              gameoverAudio.current.currentTime = 0;
              gameoverAudio.current.play();
            }
            // Detener la música de fondo cuando el juego termina
            if (musicAudio.current) {
              musicAudio.current.pause();
            }
            setIsGameOver(true)
            return
          }
        }

        // Dibuja proyectiles
        for (let projectile of projectiles.current) {
          ctx.beginPath()
          ctx.arc(projectile.x, projectile.y, projectile.size, 0, 2 * Math.PI)
          
          // Color diferente según el tamaño del proyectil
          if (projectile.size > 10) {
            // Bola extra (más grande)
            ctx.fillStyle = '#ff6600' // Naranja
            ctx.shadowColor = '#ff6600'
            ctx.shadowBlur = 12
          } else {
            // Proyectil normal
            ctx.fillStyle = '#ff0000' // Rojo
            ctx.shadowColor = '#ff0000'
            ctx.shadowBlur = 8
          }
          
          ctx.fill()
          ctx.shadowBlur = 0
          
          // Verificar colisión con el jugador
          if (
            checkCollision(
              player.current.x,
              player.current.y,
              player.current.size,
              projectile.x - projectile.size,
              projectile.y - projectile.size,
              projectile.size * 2
            ) && !isInvulnerable.current
          ) {
            cancelAnimationFrame(animationId)
            clearInterval(enemyInterval)
            clearInterval(difficultyInterval)
            clearInterval(timerInterval)
            if (gameoverAudio.current && !mutedRef.current) {
              gameoverAudio.current.currentTime = 0;
              gameoverAudio.current.play();
            }
            // Detener la música de fondo cuando el juego termina
            if (musicAudio.current) {
              musicAudio.current.pause();
            }
            setIsGameOver(true)
            return
          }
        }

        animationId = requestAnimationFrame(gameLoop)
      }

      gameLoop()
    }

    // Pausar y reanudar juego al cambiar visibilidad
    const pauseGame = () => {
      paused = true;
      cancelAnimationFrame(animationId);
      clearInterval(enemyInterval);
      clearInterval(difficultyInterval);
      clearInterval(timerInterval);
    };
    const resumeGame = () => {
      if (!paused || isGameOver) return;
      paused = false;
      enemyInterval = setInterval(() => {
        // No spawnear enemigos si el boss ya apareció o se está evacuando
        if (!bossSpawned.current && !stopSpawning.current) {
          spawnEnemy()
        }
      }, spawnIntervalTime.current);
      difficultyInterval = setInterval(() => {
        increaseDifficulty();
        clearInterval(enemyInterval);
        enemyInterval = setInterval(() => {
          // No spawnear enemigos si el boss ya apareció o se está evacuando
          if (!bossSpawned.current && !stopSpawning.current) {
            spawnEnemy()
          }
        }, spawnIntervalTime.current);
      }, 20000);
      timerInterval = setInterval(() => {
        setTime((prev) => prev + 1);
      }, 1000);
      animationId = requestAnimationFrame(gameLoop);
    };
    const handleVisibility = () => {
      if (document.hidden) {
        pauseGame();
      } else {
        resumeGame();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    startGame()

    return () => {
      cancelAnimationFrame(animationId)
      clearInterval(enemyInterval)
      clearInterval(difficultyInterval)
      clearInterval(timerInterval)
      document.removeEventListener('visibilitychange', handleVisibility);
      playerSpeed.current = basePlayerSpeed
      player.current = { x: 300, y: 200, size: 20, speed: basePlayerSpeed }
      powerUp.current = { x: 0, y: 0, active: false, type: 'speed' }
      isInvulnerable.current = false
      enemiesFrozenRef.current = false
    }
  }, [isStarted, restartTrigger])

  // Color del cuadro de menú y ranking
  const MENU_BG_COLOR = '#1a2340';

  // Al inicio del componente GameCanvas:
  const powerupAudio = useRef<HTMLAudioElement | null>(null);
  const gameoverAudio = useRef<HTMLAudioElement | null>(null);
  const uploadAudio = useRef<HTMLAudioElement | null>(null);
  const startAudio = useRef<HTMLAudioElement | null>(null);
  const buttonAudio = useRef<HTMLAudioElement | null>(null);
  const musicAudio = useRef<HTMLAudioElement | null>(null);

  // Al iniciar partida
  const handleStart = () => {
    if (startAudio.current && !mutedRef.current) {
      startAudio.current.currentTime = 0;
      startAudio.current.play();
    }
    setIsStarted(true);
    // Reproducir música de fondo al iniciar
    setTimeout(() => {
      playBackgroundMusic();
    }, 1000); // Esperar 1 segundo para que termine el sonido de inicio
  };
  // Al reiniciar partida
  const handleRestart = () => {
  playButtonSound();
  setIsGameOver(false);
  setRestartTrigger((r) => r + 1);
    // Reproducir música de fondo al reiniciar, después de un pequeño retraso
    setTimeout(() => {
      playBackgroundMusic();
    }, 1000); // Esperar 1 segundo para que termine el sonido de botón
  };

  return (
    <div
      style={{
        textAlign: 'center',
        minHeight: '100vh',
        minWidth: '100vw',
        background: '#10182a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Botón de mute/desmute */}
      <button
        onClick={() => {
          const newMuted = !muted;
          setMuted(newMuted);
          if (newMuted) {
            stopAllAudio();
          }
        }}
        style={{
          position: 'fixed',
          top: 16,
          right: 16,
          zIndex: 100,
          background: 'rgba(30,30,30,0.7)',
          border: 'none',
          borderRadius: 24,
          width: 48,
          height: 48,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: '#fff',
          fontSize: 28,
          boxShadow: '0 2px 8px #000a',
        }}
        aria-label={muted ? 'Activar sonido' : 'Silenciar sonido'}
      >
        {muted ? '🔇' : '🔊'}
      </button>
      <audio ref={powerupAudio} src="/powerup.wav" preload="auto" />
      <audio ref={gameoverAudio} src="/gameover.wav" preload="auto" />
      <audio ref={uploadAudio} src="/upload.wav" preload="auto" />
      <audio ref={startAudio} src="/start.wav" preload="auto" />
      <audio ref={buttonAudio} src="/button.wav" preload="auto" />
      <audio ref={musicAudio} src="/music.mp3" preload="auto" />
      {!isStarted && (
        <StartMenu
          onStart={handleStart}
        />
      )}
      {isStarted && (
        <>
          <div style={{
            color: '#fff',
            fontSize: 36,
            fontWeight: 'bold',
            marginBottom: 16,
            textShadow: '0 2px 8px #000a',
            letterSpacing: 2,
          }}>
            Tiempo: {time}s
          </div>
          <div style={{ 
            position: 'relative', 
            display: 'inline-block', 
            overflow: 'hidden',
          }}>
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              style={{
                border: '5px solid #fff',
                background: '#10182a',
                boxSizing: 'border-box',
                maxWidth: 'calc(100vw - 32px)',
                maxHeight: '80vh',
                margin: 8,
                borderRadius: 12,
                display: 'block',
              }}
            />
            {/* Mostrar overlay de game over solo si no está el evento final */}
            {isGameOver && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(0,0,0,0.6)',
                  zIndex: 2,
                }}
              >
                <div
                  style={{
                    background: MENU_BG_COLOR,
                    borderRadius: 16,
                    padding: 32,
                    minWidth: 320,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    boxShadow: '0 4px 24px #000a',
                  }}
                >
                  <button
                    onClick={handleRestart}
                    style={{
                      margin: '8px 0',
                      padding: '10px 24px',
                      fontSize: 18,
                      borderRadius: 6,
                      background: '#43a047',
                      color: '#fff',
                      border: 'none',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                    }}
                  >
                    Reiniciar
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default GameCanvas
