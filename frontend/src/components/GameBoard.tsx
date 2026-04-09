import { Suspense, useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Stars, Sparkles } from '@react-three/drei'
import * as THREE from 'three'
import HexGrid from './HexGrid'
import ResourceNode from './ResourceNode'
import Anomaly from './Anomaly'
import Conduit from './Conduit'
import { useGameStore } from '../store/gameStore'
import { useEnvironmentStore } from '../store/environmentStore'
import { hexToWorld } from '../utils/gridGenerator'

const CRYSTAL_POSITIONS: [number, number, number][] = [
  [0, 0.65, 0], [3.1, 0.65, -1.5], [-3.1, 0.65, 1.5],
  [1.5, 0.65, 2.7], [-1.5, 0.65, -2.7], [4.5, 0.65, 1.5],
]

const ANOMALY_POSITIONS: [number, number, number][] = [
  [0, 0.75, 3], [0, 0.75, -3], [3.5, 0.75, 3], [-3.5, 0.75, -3],
]

const CONDUIT_P1_POS: [number, number, number] = [-5.5, 0.5, -4]
const CONDUIT_P2_POS: [number, number, number] = [5.5, 0.5, 4]

function Lighting({ interference }: { interference: number }) {
  const fillRef = useRef<THREE.PointLight>(null!)
  const crisisRef = useRef<THREE.PointLight>(null!)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (fillRef.current) {
      fillRef.current.position.x = Math.sin(t * 0.3) * 7
      fillRef.current.position.z = Math.cos(t * 0.3) * 7
      fillRef.current.intensity = 0.6 + (interference / 100) * 0.8
    }
    if (crisisRef.current) {
      crisisRef.current.intensity = interference > 70
        ? (0.4 + Math.sin(t * 4) * 0.3)
        : 0
    }
  })

  return (
    <>
      <ambientLight intensity={0.45} color="#ffa060" />
      <directionalLight
        position={[10, 20, 10]}
        intensity={1.1}
        color="#ff8844"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.5}
        shadow-camera-far={60}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
      />
      <pointLight ref={fillRef} color="#E85D04" intensity={0.7} distance={30} position={[0, 8, 0]} />
      <pointLight ref={crisisRef} color="#BA181B" intensity={0} distance={40} position={[0, 12, 0]} />
      <pointLight color="#FFB703" intensity={0.3} distance={20} position={[0, 5, 0]} />
    </>
  )
}

function CameraRig() {
  const { camera } = useThree()

  useEffect(() => {
    camera.position.set(0, 18, 14)
    camera.lookAt(0, 0, 0)
  }, [])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    camera.position.x = Math.sin(t * 0.04) * 1.2
    camera.lookAt(0, 0, 0)
  })

  return null
}

function GroundPlane() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.25, 0]} receiveShadow>
      <planeGeometry args={[60, 60]} />
      <meshStandardMaterial color="#1a1815" roughness={1} metalness={0} />
    </mesh>
  )
}

function ParticleField({ interference }: { interference: number }) {
  const count = Math.floor(20 + (interference / 100) * 60)
  return (
    <Sparkles
      count={count}
      scale={[24, 8, 24]}
      size={0.8}
      speed={0.2}
      color="#E85D04"
      opacity={0.3 + (interference / 100) * 0.4}
    />
  )
}

export default function GameBoard() {
  const { player1, player2 } = useGameStore()
  const { interference, spawnedCrystals, spawnedAnomalies } = useEnvironmentStore()

  const extraCrystals = useMemo(() => {
    const extras: [number, number, number][] = []
    for (let i = 6; i < spawnedCrystals; i++) {
      const angle = (i / spawnedCrystals) * Math.PI * 2
      extras.push([Math.cos(angle) * 4, 0.65, Math.sin(angle) * 4])
    }
    return extras
  }, [spawnedCrystals])

  const extraAnomalies = useMemo(() => {
    const extras: [number, number, number][] = []
    for (let i = 4; i < spawnedAnomalies; i++) {
      const angle = (i / spawnedAnomalies) * Math.PI * 2
      extras.push([Math.cos(angle) * 5.5, 0.75, Math.sin(angle) * 5.5])
    }
    return extras
  }, [spawnedAnomalies])

  return (
    <div className="absolute inset-0 z-0">
      <Canvas
        shadows
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        dpr={[1, 2]}
        onCreated={({ gl }) => {
          gl.setClearColor(new THREE.Color('#2D2A26'))
        }}
      >
        <Suspense fallback={null}>
          <Lighting interference={interference} />
          <CameraRig />
          <GroundPlane />

          <Stars radius={80} depth={40} count={800} factor={3} saturation={0} fade speed={0.5} />
          <ParticleField interference={interference} />

          <HexGrid />

          {/* Resource crystals */}
          {CRYSTAL_POSITIONS.map((pos, i) => (
            <ResourceNode key={`crystal-${i}`} position={pos} id={`crystal-${i}`} />
          ))}
          {extraCrystals.map((pos, i) => (
            <ResourceNode key={`xcrystal-${i}`} position={pos} id={`xcrystal-${i}`} />
          ))}

          {/* Anomalies */}
          {ANOMALY_POSITIONS.map((pos, i) => (
            <Anomaly key={`anomaly-${i}`} position={pos} id={`anomaly-${i}`} />
          ))}
          {extraAnomalies.map((pos, i) => (
            <Anomaly key={`xanomaly-${i}`} position={pos} id={`xanomaly-${i}`} />
          ))}

          {/* Player conduits */}
          {player1.conduits > 0 && (
            <Conduit position={CONDUIT_P1_POS} id="p1-conduit-0" owner={1} />
          )}
          {player1.conduits > 1 && (
            <Conduit position={[-4, 0.5, 4]} id="p1-conduit-1" owner={1} />
          )}
          {player2.conduits > 0 && (
            <Conduit position={CONDUIT_P2_POS} id="p2-conduit-0" owner={2} />
          )}
          {player2.conduits > 1 && (
            <Conduit position={[4, 0.5, -4]} id="p2-conduit-1" owner={2} />
          )}

          <OrbitControls
            enablePan={false}
            minDistance={8}
            maxDistance={28}
            minPolarAngle={Math.PI / 8}
            maxPolarAngle={Math.PI / 2.8}
            enableDamping
            dampingFactor={0.08}
          />
        </Suspense>
      </Canvas>
    </div>
  )
}
