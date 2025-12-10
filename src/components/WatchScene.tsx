'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  ContactShadows,
  Environment,
  Html,
  Line as DreiLine,
  OrbitControls,
  PerspectiveCamera,
} from '@react-three/drei';
import { Suspense, useMemo, useRef, type ReactElement } from 'react';
import * as THREE from 'three';
import clsx from 'clsx';
import type { Line2 } from 'three-stdlib';
import {
  WatchLayer,
  WatchView,
  getPartInfo,
  useWatchStore,
} from '../state/useWatchStore';

const neutralHeight: Record<WatchLayer, number> = {
  mainPlate: -0.08,
  barrel: -0.02,
  gearTrain: 0.04,
  escapement: 0.12,
  balance: 0.2,
  bridges: 0.28,
  hands: 0.38,
};

const explodedHeight: Record<WatchLayer, number> = {
  mainPlate: -0.5,
  barrel: -0.25,
  gearTrain: 0.12,
  escapement: 0.38,
  balance: 0.62,
  bridges: 0.86,
  hands: 1.12,
};

const layerHeight = (layer: WatchLayer, explode: number) =>
  THREE.MathUtils.lerp(neutralHeight[layer], explodedHeight[layer], explode);

interface WatchSceneProps {
  className?: string;
}

export function WatchScene({ className }: WatchSceneProps) {
  return (
    <div className={clsx('relative h-full w-full', className)}>
      <Canvas
        shadows
        camera={{ position: [6, 6, 6], fov: 40, near: 0.1, far: 50 }}
      >
        <Suspense fallback={null}>
          <SceneContent />
        </Suspense>
      </Canvas>
    </div>
  );
}

function SceneContent() {
  const { layers, explode, view } = useWatchStore((state) => ({
    layers: state.layers,
    explode: state.explode,
    view: state.view,
  }));

  return (
    <>
      <color attach="background" args={['#0b0f19']} />
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={1.5}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <spotLight position={[-6, 4, 2]} angle={0.5} intensity={0.7} />
      <CameraRig view={view} />
      <WatchBase explode={explode} />
      {layers.mainPlate && <MainPlate explode={explode} />}
      {layers.barrel && <BarrelAssembly explode={explode} />}
      {layers.gearTrain && <GearTrain explode={explode} />}
      {layers.escapement && <Escapement explode={explode} />}
      {layers.balance && <BalanceAssembly explode={explode} />}
      {layers.bridges && <BridgeAssembly explode={explode} />}
      {layers.hands && <HandStack explode={explode} />}
      <Environment preset="studio" />
      <ContactShadows
        position={[0, -0.8, 0]}
        opacity={0.35}
        blur={1.2}
        far={6}
      />
      <OrbitControls
        enablePan
        enableDamping
        dampingFactor={0.1}
        minDistance={2.5}
        maxDistance={12}
        maxPolarAngle={Math.PI * 0.95}
        target={[0, layerHeight('gearTrain', explode), 0]}
      />
    </>
  );
}

function CameraRig({ view }: { view: WatchView }) {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const targetPositions: Record<WatchView, THREE.Vector3> = {
    iso: new THREE.Vector3(6, 5.5, 6),
    top: new THREE.Vector3(0, 9, 0.001),
    side: new THREE.Vector3(8, 2, 0),
    exploded: new THREE.Vector3(4.5, 7, 0),
  };
  const targetLookAt: Record<WatchView, THREE.Vector3> = {
    iso: new THREE.Vector3(0, 0.25, 0),
    top: new THREE.Vector3(0, 0, 0),
    side: new THREE.Vector3(0, 0.25, 0),
    exploded: new THREE.Vector3(0, 0.45, 0),
  };

  useFrame((_state, delta) => {
    const current = camera.position.clone();
    const desired = targetPositions[view];
    current.lerp(desired, 1 - Math.pow(0.0001, delta));
    camera.position.copy(current);
    const lookAt = targetLookAt[view];
    const direction = new THREE.Vector3().copy(lookAt);
    camera.lookAt(direction);
    camera.updateProjectionMatrix();
    if (groupRef.current && cameraRef.current) {
      cameraRef.current.position.copy(camera.position);
      cameraRef.current.quaternion.copy(camera.quaternion);
    }
  });

  return (
    <group ref={groupRef}>
      <PerspectiveCamera ref={cameraRef} makeDefault={false} />
    </group>
  );
}

function WatchBase({ explode }: { explode: number }) {
  return (
    <group position={[0, layerHeight('mainPlate', explode) - 0.32, 0]}>
      <mesh receiveShadow>
        <cylinderGeometry args={[3.6, 3.6, 0.1, 64]} />
        <meshStandardMaterial
          color="#1a2536"
          roughness={0.45}
          metalness={0.3}
        />
      </mesh>
      <mesh position={[0, -0.4, 0]} receiveShadow rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.5, 3.2, 64]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
    </group>
  );
}

interface WatchMeshProps {
  id: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  children: React.ReactNode;
  hoverEmissive?: number;
}

function WatchMesh({
  id,
  position,
  rotation,
  children,
}: WatchMeshProps): ReactElement {
  const { selectedPart, selectPart } = useWatchStore((state) => ({
    selectedPart: state.selectedPart,
    selectPart: state.selectPart,
  }));

  return (
    <group
      position={position}
      rotation={rotation}
      onClick={(event) => {
        event.stopPropagation();
        selectPart(id === selectedPart ? undefined : id);
      }}
      onPointerOver={(event) => {
        event.stopPropagation();
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={(event) => {
        event.stopPropagation();
        document.body.style.cursor = 'default';
      }}
    >
      {children}
      {selectedPart === id ? <Annotation id={id} /> : null}
    </group>
  );
}

function Annotation({ id }: { id: string }) {
  const part = getPartInfo(id);
  if (!part) return null;
  return (
    <Html distanceFactor={20} position={[0, 0.35, 0]} transform>
      <div className="rounded-md border border-slate-600/60 bg-slate-900/90 px-3 py-2 text-xs font-medium text-slate-200 shadow-lg backdrop-blur">
        <div>{part.title}</div>
      </div>
    </Html>
  );
}

interface GearProps {
  id: string;
  teeth: number;
  module: number;
  thickness: number;
  color: string;
  position: [number, number, number];
  explodeLayer: WatchLayer;
  speedFactor: number;
  direction?: 1 | -1;
  boreRadius?: number;
}

function Gear({
  id,
  teeth,
  module,
  thickness,
  color,
  position,
  explodeLayer,
  speedFactor,
  direction = 1,
  boreRadius,
}: GearProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { speed, selectedPart, explode } = useWatchStore((state) => ({
    speed: state.speed,
    selectedPart: state.selectedPart,
    explode: state.explode,
  }));

  const geometry = useMemo(
    () => createGearGeometry(teeth, module, thickness, boreRadius),
    [teeth, module, thickness, boreRadius]
  );

  useFrame((_state, delta) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.z += direction * speedFactor * speed * delta;
  });

  return (
    <WatchMesh
      id={id}
      position={[
        position[0],
        layerHeight(explodeLayer, explode),
        position[2],
      ]}
    >
      <mesh ref={meshRef} castShadow geometry={geometry}>
        <meshStandardMaterial
          color={selectedPart === id ? '#fbbf24' : color}
          roughness={0.32}
          metalness={0.68}
        />
      </mesh>
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[module * teeth * 0.03, module * teeth * 0.03, thickness * 1.4, 32]} />
        <meshStandardMaterial color="#0f172a" metalness={0.1} roughness={0.7} />
      </mesh>
    </WatchMesh>
  );
}

function createGearGeometry(
  teeth: number,
  module: number,
  thickness: number,
  boreRadius?: number
) {
  const shape = new THREE.Shape();
  const pitchRadius = (module * teeth) / 2;
  const addendum = module * 0.95;
  const dedendum = module * 1.1;
  const rootRadius = pitchRadius - dedendum;
  const tipRadius = pitchRadius + addendum;
  const toothAngle = (Math.PI * 2) / teeth;
  const flankFactor = 0.36;

  const polar = (radius: number, angle: number) =>
    new THREE.Vector2(
      radius * Math.cos(angle),
      radius * Math.sin(angle)
    );

  for (let i = 0; i < teeth; i += 1) {
    const baseAngle = i * toothAngle;
    const p1 = polar(rootRadius, baseAngle - toothAngle * flankFactor);
    const p2 = polar(pitchRadius - module * 0.2, baseAngle - toothAngle * 0.12);
    const p3 = polar(tipRadius, baseAngle);
    const p4 = polar(pitchRadius - module * 0.2, baseAngle + toothAngle * 0.12);
    const p5 = polar(rootRadius, baseAngle + toothAngle * flankFactor);
    if (i === 0) shape.moveTo(p1.x, p1.y);
    shape.lineTo(p1.x, p1.y);
    shape.lineTo(p2.x, p2.y);
    shape.lineTo(p3.x, p3.y);
    shape.lineTo(p4.x, p4.y);
    shape.lineTo(p5.x, p5.y);
  }
  shape.autoClose = true;

  const hole = new THREE.Path();
  const inner = boreRadius ?? module * Math.max(1.8, teeth * 0.1);
  const holeSegments = 64;
  for (let i = 0; i < holeSegments; i += 1) {
    const angle = (i / holeSegments) * Math.PI * 2;
    const point = new THREE.Vector2(
      inner * Math.cos(angle),
      inner * Math.sin(angle)
    );
    if (i === 0) hole.moveTo(point.x, point.y);
    hole.lineTo(point.x, point.y);
  }
  shape.holes.push(hole);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    steps: 1,
    depth: thickness,
    bevelEnabled: false,
  });
  geometry.center();
  geometry.rotateX(Math.PI / 2);
  geometry.computeVertexNormals();
  return geometry;
}

function MainPlate({ explode }: { explode: number }) {
  const height = layerHeight('mainPlate', explode);
  return (
    <WatchMesh id="mainPlate" position={[0, height, 0]}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[3.2, 3.2, 0.12, 80]} />
        <meshStandardMaterial
          color="#d4d7dd"
          metalness={0.55}
          roughness={0.35}
        />
      </mesh>
      <mesh castShadow position={[1.2, 0, -0.8]}>
        <cylinderGeometry args={[0.3, 0.3, 0.18, 32]} />
        <meshStandardMaterial color="#b1b7bf" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh castShadow position={[-1.4, 0, 0.7]}>
        <cylinderGeometry args={[0.24, 0.24, 0.16, 32]} />
        <meshStandardMaterial color="#b1b7bf" metalness={0.6} roughness={0.3} />
      </mesh>
    </WatchMesh>
  );
}

function BarrelAssembly({ explode }: { explode: number }) {
  const height = layerHeight('barrel', explode);
  const drumRef = useRef<THREE.Group>(null);
  const { speed, selectedPart } = useWatchStore((state) => ({
    speed: state.speed,
    selectedPart: state.selectedPart,
  }));

  useFrame((_state, delta) => {
    if (!drumRef.current) return;
    drumRef.current.rotation.z += 0.4 * speed * delta;
  });

  return (
    <group position={[-1.7, height, 0]}>
      <WatchMesh id="barrel">
        <group ref={drumRef}>
          <mesh castShadow>
            <cylinderGeometry args={[0.95, 0.95, 0.3, 48]} />
            <meshStandardMaterial
              color={selectedPart === 'barrel' ? '#fbbf24' : '#c7a35e'}
              roughness={0.28}
              metalness={0.8}
            />
          </mesh>
          <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.6, 0.92, 64, 1]} />
            <meshStandardMaterial
              color="#f6d198"
              roughness={0.22}
              metalness={0.85}
            />
          </mesh>
          <mesh
            castShadow
            position={[0, 0.16, 0]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <ringGeometry args={[0.1, 0.4, 48]} />
            <meshStandardMaterial color="#111827" roughness={0.7} />
          </mesh>
        </group>
      </WatchMesh>
      <mesh
        position={[0, height - layerHeight('mainPlate', explode), 0]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <cylinderGeometry args={[0.12, 0.12, height - layerHeight('mainPlate', explode), 16]} />
        <meshStandardMaterial color="#9ca3af" roughness={0.5} metalness={0.2} />
      </mesh>
    </group>
  );
}

function GearTrain({ explode }: { explode: number }) {
  const height = layerHeight('gearTrain', explode);
  return (
    <group>
      <Gear
        id="thirdWheel"
        teeth={56}
        module={0.14}
        thickness={0.12}
        color="#d7dfe8"
        position={[-0.3, height, -0.2]}
        explodeLayer="gearTrain"
        speedFactor={-1.4}
      />
      <Gear
        id="fourthWheel"
        teeth={48}
        module={0.12}
        thickness={0.1}
        color="#c2d1dd"
        position={[0.85, height, 0.35]}
        explodeLayer="gearTrain"
        speedFactor={2.2}
      />
      <Gear
        id="escapeWheel"
        teeth={15}
        module={0.1}
        thickness={0.08}
        color="#f0b457"
        position={[1.8, height, 0]}
        explodeLayer="gearTrain"
        speedFactor={6}
        direction={-1}
        boreRadius={0.08}
      />
    </group>
  );
}

function Escapement({ explode }: { explode: number }) {
  const height = layerHeight('escapement', explode);
  const escapeRef = useRef<THREE.Mesh>(null);
  const forkRef = useRef<THREE.Group>(null);
  const jewelRef = useRef<THREE.Mesh>(null);
  const { speed, selectedPart } = useWatchStore((state) => ({
    speed: state.speed,
    selectedPart: state.selectedPart,
  }));

  useFrame((_state, delta) => {
    if (escapeRef.current) {
      escapeRef.current.rotation.z += 6 * speed * delta;
    }
    if (forkRef.current && jewelRef.current) {
      const time = performance.now() / 1000;
      const oscillation = Math.sin(time * 6 * speed) * 0.35;
      forkRef.current.rotation.z = oscillation;
      jewelRef.current.rotation.z = oscillation * 0.3;
    }
  });

  return (
    <group position={[1.8, height, 0]}>
      <WatchMesh id="escapeWheel">
        <mesh
          ref={escapeRef}
          castShadow
          geometry={createSpikyWheel(15, 0.65, 0.08)}
        >
          <meshStandardMaterial
            color={selectedPart === 'escapeWheel' ? '#fbbf24' : '#f4b45d'}
            roughness={0.28}
            metalness={0.78}
          />
        </mesh>
      </WatchMesh>
      <WatchMesh id="palletFork">
        <group ref={forkRef} position={[0.72, 0, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.9, 0.08, 0.04]} />
            <meshStandardMaterial
              color={selectedPart === 'palletFork' ? '#fbbf24' : '#cbd5f5'}
              roughness={0.4}
              metalness={0.35}
            />
          </mesh>
          <mesh
            ref={jewelRef}
            castShadow
            position={[0.38, 0.08, 0]}
            rotation={[0, 0, Math.PI / 2]}
          >
            <cylinderGeometry args={[0.03, 0.03, 0.08, 24]} />
            <meshStandardMaterial color="#f87171" roughness={0.1} />
          </mesh>
        </group>
      </WatchMesh>
    </group>
  );
}

function createSpikyWheel(
  teeth: number,
  radius: number,
  thickness: number
) {
  const shape = new THREE.Shape();
  const toothAngle = (Math.PI * 2) / teeth;
  const innerRadius = radius * 0.45;
  for (let i = 0; i < teeth; i += 1) {
    const angle = i * toothAngle;
    const p1 = polar(innerRadius, angle - toothAngle * 0.15);
    const p2 = polar(radius, angle);
    const p3 = polar(innerRadius, angle + toothAngle * 0.15);
    if (i === 0) shape.moveTo(p1.x, p1.y);
    shape.lineTo(p1.x, p1.y);
    shape.lineTo(p2.x, p2.y);
    shape.lineTo(p3.x, p3.y);
  }
  shape.autoClose = true;
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    steps: 1,
    bevelEnabled: false,
  });
  geometry.center();
  geometry.rotateX(Math.PI / 2);
  geometry.computeVertexNormals();
  return geometry;
}

function polar(radius: number, angle: number) {
  return new THREE.Vector2(
    radius * Math.cos(angle),
    radius * Math.sin(angle)
  );
}

function BalanceAssembly({ explode }: { explode: number }) {
  const height = layerHeight('balance', explode);
  const balanceRef = useRef<THREE.Group>(null);
  const springRef = useRef<Line2>(null);
  const hairspring = useMemo(() => generateHairspringPoints(), []);
  const { speed, selectedPart } = useWatchStore((state) => ({
    speed: state.speed,
    selectedPart: state.selectedPart,
  }));

  useFrame(() => {
    if (!balanceRef.current || !springRef.current) return;
    const time = performance.now() / 1000;
    const angle = Math.sin(time * 2 * Math.PI * 3 * speed) * 0.45;
    balanceRef.current.rotation.y = angle;
    springRef.current.rotation.y = angle * 0.1;
  });

  return (
    <group position={[-1.4, height, 1.1]}>
      <WatchMesh id="balance">
        <group ref={balanceRef}>
          <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.7, 0.05, 24, 120]} />
            <meshStandardMaterial
              color={selectedPart === 'balance' ? '#fbbf24' : '#eabf67'}
              metalness={0.85}
              roughness={0.25}
            />
          </mesh>
          <mesh castShadow>
            <cylinderGeometry args={[0.07, 0.07, 0.52, 32]} />
            <meshStandardMaterial color="#0f172a" roughness={0.4} />
          </mesh>
          <mesh castShadow position={[0, 0.24, 0]}>
            <boxGeometry args={[0.22, 0.02, 0.22]} />
            <meshStandardMaterial color="#cbd5f5" roughness={0.45} />
          </mesh>
          <mesh castShadow position={[0, -0.24, 0]}>
            <boxGeometry args={[0.22, 0.02, 0.22]} />
            <meshStandardMaterial color="#cbd5f5" roughness={0.45} />
          </mesh>
        </group>
      </WatchMesh>
      <DreiLine
        ref={springRef}
        points={hairspring}
        color="#94a3b8"
        lineWidth={1.2}
        dashed={false}
      />
    </group>
  );
}

function generateHairspringPoints() {
  const turns = 6;
  const steps = 180;
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const angle = t * Math.PI * 2 * turns;
    const radius = 0.08 + t * 0.42;
    const x = radius * Math.cos(angle);
    const z = radius * Math.sin(angle);
    points.push(new THREE.Vector3(x, 0, z));
  }
  return points;
}

function BridgeAssembly({ explode }: { explode: number }) {
  const height = layerHeight('bridges', explode);
  const { selectedPart } = useWatchStore((state) => ({
    selectedPart: state.selectedPart,
  }));
  const color =
    selectedPart === 'bridges' ? '#fbbf24' : '#a9b7c7';
  return (
    <WatchMesh id="bridges" position={[0, height, 0]}>
      <mesh castShadow>
        <boxGeometry args={[2.8, 0.08, 1.4]} />
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.6} />
      </mesh>
      <mesh castShadow position={[1.2, 0, 0.4]}>
        <boxGeometry args={[1.4, 0.08, 0.8]} />
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.6} />
      </mesh>
      <mesh castShadow position={[-1.3, 0, 1.2]}>
        <boxGeometry args={[1.8, 0.08, 0.8]} />
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.6} />
      </mesh>
    </WatchMesh>
  );
}

function HandStack({ explode }: { explode: number }) {
  const height = layerHeight('hands', explode);
  const minuteRef = useRef<THREE.Group>(null);
  const hourRef = useRef<THREE.Group>(null);
  const secondsRef = useRef<THREE.Group>(null);
  const { speed, selectedPart } = useWatchStore((state) => ({
    speed: state.speed,
    selectedPart: state.selectedPart,
  }));

  useFrame((_state, delta) => {
    if (minuteRef.current) minuteRef.current.rotation.z -= 0.3 * speed * delta;
    if (hourRef.current) hourRef.current.rotation.z -= 0.05 * speed * delta;
    if (secondsRef.current) secondsRef.current.rotation.z -= 6.5 * speed * delta;
  });

  return (
    <WatchMesh id="hands" position={[0, height, 0]}>
      <group ref={hourRef}>
        <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
          <boxGeometry args={[0.6, 0.06, 0.02]} />
          <meshStandardMaterial
            color={selectedPart === 'hands' ? '#fbbf24' : '#f5f5f4'}
            roughness={0.25}
          />
        </mesh>
      </group>
      <group ref={minuteRef}>
        <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
          <boxGeometry args={[0.9, 0.04, 0.015]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.25} />
        </mesh>
      </group>
      <group ref={secondsRef}>
        <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
          <boxGeometry args={[1.1, 0.02, 0.01]} />
          <meshStandardMaterial color="#f97316" roughness={0.2} />
        </mesh>
        <mesh position={[0.52, 0, 0]}>
          <sphereGeometry args={[0.04, 12, 12]} />
          <meshStandardMaterial color="#f97316" />
        </mesh>
      </group>
      <mesh>
        <cylinderGeometry args={[0.08, 0.08, 0.2, 32]} />
        <meshStandardMaterial color="#0f172a" roughness={0.6} />
      </mesh>
    </WatchMesh>
  );
}
