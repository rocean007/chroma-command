import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface ResourceNodeProps {
  position: [number, number, number]
  id: string
  harvested?: boolean
}

export default function ResourceNode({ position, id, harvested }: ResourceNodeProps) {
  const groupRef = useRef<THREE.Group>(null!)
  const meshRef = useRef<THREE.Mesh>(null!)
  const glowRef = useRef<THREE.Mesh>(null!)
  const seed = useMemo(() => Math.random() * Math.PI * 2, [id])

  useFrame((state) => {
    if (!groupRef.current || harvested) return
    const t = state.clock.elapsedTime
    groupRef.current.position.y = position[1] + Math.sin(t * 1.8 + seed) * 0.12
    groupRef.current.rotation.y = t * 0.6 + seed
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 0.4 + Math.sin(t * 2 + seed) * 0.2
      glowRef.current.scale.setScalar(1 + Math.sin(t * 2.5 + seed) * 0.05)
    }
  })

  if (harvested) return null

  return (
    <group ref={groupRef} position={position}>
      {/* Main crystal cluster */}
      <mesh ref={meshRef} castShadow>
        <octahedronGeometry args={[0.28, 0]} />
        <meshStandardMaterial
          color="#F48C06"
          emissive="#E85D04"
          emissiveIntensity={0.5}
          roughness={0.1}
          metalness={0.7}
          transparent
          opacity={0.95}
        />
      </mesh>

      {/* Smaller satellite crystals */}
      {[0, 1, 2].map(i => (
        <mesh key={i} position={[
          Math.sin((i / 3) * Math.PI * 2) * 0.22,
          Math.sin(i * 1.3) * 0.1,
          Math.cos((i / 3) * Math.PI * 2) * 0.22,
        ]} rotation={[Math.random(), Math.random(), Math.random()]} castShadow>
          <octahedronGeometry args={[0.1, 0]} />
          <meshStandardMaterial
            color="#FFB703"
            emissive="#F48C06"
            emissiveIntensity={0.6}
            roughness={0.1}
            metalness={0.8}
          />
        </mesh>
      ))}

      {/* Glow sphere */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.45, 8, 8]} />
        <meshStandardMaterial
          color="#F48C06"
          emissive="#FFB703"
          emissiveIntensity={0.3}
          transparent
          opacity={0.08}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Ground ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.58, 0]}>
        <ringGeometry args={[0.3, 0.45, 6]} />
        <meshStandardMaterial
          color="#F48C06"
          emissive="#E85D04"
          emissiveIntensity={0.8}
          transparent
          opacity={0.4}
        />
      </mesh>
    </group>
  )
}
