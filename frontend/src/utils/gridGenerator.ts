export interface HexCell {
  q: number
  r: number
  s: number
  x: number
  z: number
  elevation: number
  type: 'terrain' | 'resource' | 'anomaly' | 'conduit' | 'empty'
  resourceId?: string
  anomalyId?: string
}

export function hexToWorld(q: number, r: number, size = 1.8): { x: number; z: number } {
  const x = size * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r)
  const z = size * (1.5 * r)
  return { x, z }
}

export function generateHexGrid(radius = 4): HexCell[] {
  const cells: HexCell[] = []
  for (let q = -radius; q <= radius; q++) {
    const r1 = Math.max(-radius, -q - radius)
    const r2 = Math.min(radius, -q + radius)
    for (let r = r1; r <= r2; r++) {
      const s = -q - r
      const { x, z } = hexToWorld(q, r)
      const distFromCenter = Math.sqrt(q * q + r * r + s * s) / 2
      const elevation = Math.random() * 0.15 + distFromCenter * 0.02
      cells.push({ q, r, s, x, z, elevation, type: 'terrain' })
    }
  }
  return cells
}

export function getNeighbors(q: number, r: number, cells: HexCell[]): HexCell[] {
  const dirs = [[1,-1,0],[-1,1,0],[1,0,-1],[-1,0,1],[0,1,-1],[0,-1,1]]
  return dirs
    .map(([dq, dr]) => cells.find(c => c.q === q + dq && c.r === r + dr))
    .filter(Boolean) as HexCell[]
}

export function hexDistance(a: HexCell, b: HexCell): number {
  return (Math.abs(a.q - b.q) + Math.abs(a.r - b.r) + Math.abs(a.s - b.s)) / 2
}
