import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface ConduitProps {
  position: [number, number, number]
  id: string
  owner: 1 | 2
  damaged?: boolean
}

export default function Conduit({ position, id, owner, damaged }: ConduitProps) {
  const groupRef = useRef<THREE.Group>(null!)
  const beamRef = useRef<THREE.Mesh>(null!)
  const ringRef = useRef<THREE.Mesh>(null!)
  const seed = useMemo(() => Math.random() * Math.PI, [id])
  const color = owner === 1 ? '#D4AF37' : '#9C7A4D'
  const emissive = owner === 1 ? '#FFB703' : '#D4AF37'

  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.elapsedTime
    if (beamRef.current) {
      beamRef.current.rotation.y = t * 0.5 + seed
      const mat = beamRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = damaged ? 0.1 + Math.sin(t * 8) * 0.3 : 0.4 + Math.sin(t * 1.5 + seed) * 0.2
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.3 + seed
      ringRef.current.scale.setScalar(1 + Math.sin(t * 2 + seed) * 0.04)
    }
  })

  return (
    <group ref={groupRef} position={position}>
      {/* Base platform */}
      <mesh receiveShadow castShadow position={[0, -0.25, 0]}>
        <cylinderGeometry args={[0.32, 0.38, 0.12, 6]} />
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.8} />
      </mesh>

      {/* Main tower */}
      <mesh castShadow>
        <cylinderGeometry args={[0.1, 0.2, 0.9, 6]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.9} emissive={emissive} emissiveIntensity={0.1} />
      </mesh>

      {/* Energy beam top */}
      <mesh ref={beamRef} position={[0, 0.55, 0]} castShadow>
        <octahedronGeometry args={[0.18, 0]} />
        <meshStandardMaterial
          color={damaged ? '#A41623' : color}
          emissive={damaged ? '#A41623' : emissive}
          emissiveIntensity={0.5}
          roughness={0.1}
          metalness={1}
        />
      </mesh>

      {/* Orbiting ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[0.3, 0.02, 8, 32]} />
        <meshStandardMaterial color={emissive} emissive={emissive} emissiveIntensity={0.8} transparent opacity={0.7} />
      </mesh>

      {/* Vertical energy line */}
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 1.2, 4]} />
        <meshStandardMaterial color={emissive} emissive={emissive} emissiveIntensity={1} transparent opacity={0.4} />
      </mesh>

      {/* Ground ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.3, 0]}>
        <ringGeometry args={[0.35, 0.5, 6]} />
        <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.5} transparent opacity={0.3} />
      </mesh>
    </group>
  )
}
