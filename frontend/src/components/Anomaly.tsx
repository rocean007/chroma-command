import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface AnomalyProps {
  position: [number, number, number]
  id: string
  neutralized?: boolean
  health?: number
}

export default function Anomaly({ position, id, neutralized, health = 100 }: AnomalyProps) {
  const groupRef = useRef<THREE.Group>(null!)
  const coreRef = useRef<THREE.Mesh>(null!)
  const shellRef = useRef<THREE.Mesh>(null!)
  const seed = useMemo(() => parseFloat(id.replace(/\D/g, '') || '0') * 0.7 + Math.random(), [id])

  useFrame((state) => {
    if (!groupRef.current || neutralized) return
    const t = state.clock.elapsedTime

    // Erratic hovering motion
    groupRef.current.position.y = position[1] + Math.sin(t * 1.2 + seed) * 0.1 + Math.cos(t * 0.7 + seed) * 0.06
    groupRef.current.position.x = position[0] + Math.sin(t * 0.4 + seed) * 0.08
    groupRef.current.position.z = position[2] + Math.cos(t * 0.5 + seed) * 0.08

    if (coreRef.current) {
      coreRef.current.rotation.x += 0.018
      coreRef.current.rotation.z += 0.012
    }
    if (shellRef.current) {
      shellRef.current.rotation.y += 0.008
      shellRef.current.rotation.x -= 0.005
      const mat = shellRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 0.3 + Math.sin(t * 3 + seed) * 0.2
    }
  })

  if (neutralized) return null

  const healthPct = health / 100
  const coreColor = new THREE.Color('#BA181B').lerp(new THREE.Color('#FFB703'), 1 - healthPct)

  return (
    <group ref={groupRef} position={position}>
      {/* Outer rotating shell */}
      <mesh ref={shellRef} castShadow>
        <icosahedronGeometry args={[0.42, 0]} />
        <meshStandardMaterial
          color="#7a1010"
          emissive="#BA181B"
          emissiveIntensity={0.4}
          roughness={0.3}
          metalness={0.6}
          wireframe={false}
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* Inner core */}
      <mesh ref={coreRef} castShadow>
        <icosahedronGeometry args={[0.22, 1]} />
        <meshStandardMaterial
          color={coreColor}
          emissive={coreColor}
          emissiveIntensity={1.2}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>

      {/* Orbiting particles */}
      {[0, 1, 2, 3].map(i => {
        const angle = (i / 4) * Math.PI * 2 + seed
        return (
          <mesh key={i} position={[Math.cos(angle) * 0.6, Math.sin(angle * 0.5) * 0.2, Math.sin(angle) * 0.6]}>
            <sphereGeometry args={[0.04, 4, 4]} />
            <meshStandardMaterial color="#BA181B" emissive="#ff2222" emissiveIntensity={2} />
          </mesh>
        )
      })}

      {/* Danger glow */}
      <mesh>
        <sphereGeometry args={[0.7, 8, 8]} />
        <meshStandardMaterial
          color="#BA181B"
          emissive="#BA181B"
          emissiveIntensity={0.2}
          transparent
          opacity={0.06}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Ground shadow ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -position[1] + 0.12, 0]}>
        <ringGeometry args={[0.25, 0.55, 8]} />
        <meshStandardMaterial color="#BA181B" transparent opacity={0.15} />
      </mesh>
    </group>
  )
}
