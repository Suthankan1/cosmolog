import type { SkyDirection, SkyPosition } from './skyMath';

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface ViewDirection {
  right: Vector3;
  up: Vector3;
  forward: Vector3;
}

export interface Point { x: number; y: number }
export interface ChartSize { width: number; height: number }

export const radians = Math.PI / 180;
export const horizontalFieldOfView = 65;
export const wrapDegrees = (value: number) => ((value % 360) + 360) % 360;
export const clampAltitude = (value: number) => Math.max(0, Math.min(90, value));

export function dot(a: Vector3, b: Vector3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

export function cross(a: Vector3, b: Vector3): Vector3 {
  return { x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x };
}

// The chart uses local East, North, Up axes. Bearings increase clockwise from north.
function skyVector({ azimuth, altitude }: SkyDirection): Vector3 {
  const bearing = azimuth * radians;
  const elevation = altitude * radians;
  return {
    x: Math.sin(bearing) * Math.cos(elevation),
    y: Math.cos(bearing) * Math.cos(elevation),
    z: Math.sin(elevation),
  };
}

export function viewFromAngles(direction: SkyDirection): ViewDirection {
  const bearing = direction.azimuth * radians;
  const forward = skyVector(direction);
  const right = { x: Math.cos(bearing), y: -Math.sin(bearing), z: 0 };
  return { forward, right, up: cross(right, forward) };
}

function focalLength(width: number): number {
  return width / (2 * Math.tan(horizontalFieldOfView * radians / 2));
}

export function project(direction: SkyDirection, view: ViewDirection, size: ChartSize): Point | null {
  const target = skyVector(direction);
  const depth = dot(target, view.forward);
  if (depth <= 0) return null;
  const scale = focalLength(size.width) / depth;
  const x = size.width / 2 + scale * dot(target, view.right);
  const y = size.height / 2 - scale * dot(target, view.up);
  return x >= 0 && x <= size.width && y >= 0 && y <= size.height ? { x, y } : null;
}

export function projectHorizon(view: ViewDirection, { width, height }: ChartSize): Point[] {
  const focal = focalLength(width);
  const corners: Point[] = [{ x: 0, y: 0 }, { x: width, y: 0 }, { x: width, y: height }, { x: 0, y: height }];
  // Ray elevation is zero along the horizon. Intersect it with the viewport edges.
  const vertical = ({ x, y }: Point) => view.forward.z * focal + (x - width / 2) * view.right.z
    - (y - height / 2) * view.up.z;
  const ends: Point[] = [];
  corners.forEach((start, index) => {
    const end = corners[(index + 1) % corners.length];
    const a = vertical(start);
    const b = vertical(end);
    if (a === 0) ends.push(start);
    if (a * b < 0) {
      const fraction = a / (a - b);
      ends.push({ x: start.x + (end.x - start.x) * fraction, y: start.y + (end.y - start.y) * fraction });
    }
  });
  return ends;
}

export type ChartMarker = Point & Pick<SkyPosition, 'id'>;

export function closestMarker(markers: readonly ChartMarker[], tap: Point, targetSize: number): ChartMarker | undefined {
  const radius = targetSize / 2;
  let closest: ChartMarker | undefined;
  let minDistance = Infinity;
  for (const marker of markers) {
    const dx = marker.x - tap.x;
    const dy = marker.y - tap.y;
    if (Math.abs(dx) > radius || Math.abs(dy) > radius) continue;
    const distance = dx * dx + dy * dy;
    if (distance < minDistance) {
      minDistance = distance;
      closest = marker;
    }
  }
  return closest;
}
