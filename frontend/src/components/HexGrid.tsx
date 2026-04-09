import { useRef, useMemo, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { generateHexGrid, HexCell } from '../utils/gridGenerator'
import * as THREE from 'three'

interface HexTileProps {
  cell: HexCell
  onClick: (cell: HexCell) => void
  highlighted: boolean
  flashColor?: string
}

function HexTile({ cell, onClick, highlighted, flashColor }: HexTileProps) {
  const meshRef = useRef<THREE.Mesh>(null!)
  const [hovered, setHovered] = useState(false)

  const baseColor = useMemo(() => {
    const dist = Math.sqrt(cell.q * cell.q + cell.r * cell.r)
    if (dist < 1) return new THREE.Color('#524e48')
    if (dist < 2.5) return new THREE.Color('#4a4540')
    return new THREE.Color('#3E3B37')
  }, [cell])

  useFrame((_, delta) => {
    if (!meshRef.current) return
    const mat = meshRef.current.material as THREE.MeshStandardMaterial
    const target = flashColor
      ? new THREE.Color(flashColor)
      : hovered
      ? new THREE.Color('#6a5f52')
      : highlighted
      ? new THREE.Color('#8B3A2B').lerp(baseColor, 0.4)
      : baseColor
    mat.color.lerp(target, delta * 6)
    mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity, hovered ? 0.15 : 0, delta * 8)
  })

  return (
    <mesh
      ref={meshRef}
      position={[cell.x, cell.elevation, cell.z]}
      rotation={[0, Math.PI / 6, 0]}
      receiveShadow
      castShadow
      onClick={(e) => { e.stopPropagation(); onClick(cell) }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <cylinderGeometry args={[0.88, 0.88, 0.2, 6]} />
      <meshStandardMaterial
        color={baseColor}
        emissive={new THREE.Color('#E85D04')}
        emissiveIntensity={0}
        roughness={0.85}
        metalness={0.1}
      />
    </mesh>
  )
}

export default function HexGrid() {
  const cells = useMemo(() => generateHexGrid(4), [])
  const [flashedCells, setFlashedCells] = useState<Record<string, string>>({})

  const flashCell = (key: string, color: string) => {
    setFlashedCells(p => ({ ...p, [key]: color }))
    setTimeout(() => setFlashedCells(p => { const n = { ...p }; delete n[key]; return n }), 600)
  }

  const handleCellClick = (cell: HexCell) => {
    const key = `${cell.q},${cell.r}`
    flashCell(key, '#E85D04')
  }

  return (
    <>
      {cells.map(cell => {
        const key = `${cell.q},${cell.r}`
        return (
          <HexTile
            key={key}
            cell={cell}
            onClick={handleCellClick}
            highlighted={false}
            flashColor={flashedCells[key]}
          />
        )
      })}
    </>
  )
}
