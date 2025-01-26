import React, { useEffect, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { jsonObj } from '../../shared/utils/json';
import block from 'bem-cn-lite';
import { Helpers, Room } from '../../entities';

const b = block('scene');

interface CubeProps {
    position: [number, number, number];
    color: string;
}

const Cube: React.FC<CubeProps> = React.memo(({ position, color }) => (
    <mesh position={position}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={color} />
    </mesh>
));

function rescaleObject(obj: THREE.Object3D, targetSize: { length: number; width: number; height: number }) {
    const bbox = new THREE.Box3().setFromObject(obj);
    const size = bbox.getSize(new THREE.Vector3());

    const scale = new THREE.Vector3(
        targetSize.length / size.x,
        targetSize.width / size.y,
        targetSize.height / size.z
    );

    obj.scale.copy(scale);
}

function degToRad(deg: number): number {
    return (deg * Math.PI) / 180;
}

interface Rotation {
    x_angle?: number;
    y_angle?: number;
    z_angle?: number;
}

interface ModelProps {
    modelPath: string;
    position: [number, number, number];
    rotation: Rotation;
    size_in_meters: { length: number; width: number; height: number };
}
const Model: React.FC<ModelProps> = React.memo(({ modelPath, position, rotation, size_in_meters }) => {
    const { scene } = useGLTF(modelPath) as { scene: THREE.Object3D };

    useEffect(() => {
        rescaleObject(scene, size_in_meters);

        // Обновляем позицию и ротацию только при изменении соответствующих параметров
        scene.position.set(...position);
        scene.rotation.set(
            degToRad(rotation.x_angle ?? 0),
            degToRad(rotation.y_angle ?? 0),
            degToRad(rotation.z_angle ?? 0)
        );
    }, [scene, position, rotation, size_in_meters]);

    // Предотвращение лишнего рендера
    return <primitive object={scene} />;
}, (prevProps, nextProps) => 
  prevProps.modelPath === nextProps.modelPath &&
  prevProps.position.every((val, index) => val === nextProps.position[index]) &&
  prevProps.rotation.x_angle === nextProps.rotation.x_angle &&
  prevProps.rotation.y_angle === nextProps.rotation.y_angle &&
  prevProps.rotation.z_angle === nextProps.rotation.z_angle &&
  prevProps.size_in_meters.length === nextProps.size_in_meters.length &&
  prevProps.size_in_meters.width === nextProps.size_in_meters.width &&
  prevProps.size_in_meters.height === nextProps.size_in_meters.height
);

const Scene: React.FC<SceneProps> = () => {
    const glRef = useRef<THREE.WebGLRenderer | null>(null);

    return (
        <Canvas
            camera={{ position: [5, 5, 5], up: [0, 0, 1] }}
            className={b()}
            gl={{ antialias: true }}
            shadows
            onCreated={({ gl }) => {
                gl.setClearColor(new THREE.Color('#a8a8a8'));
                glRef.current = gl;
            }}
        >
            <Environment preset="city" background backgroundRotation={[THREE.MathUtils.degToRad(90), 0, 0]} />
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 10]} intensity={1} castShadow />
            <hemisphereLight intensity={0.35} groundColor={new THREE.Color('#888')} />

            <OrbitControls />
            <Helpers />
            <Room roomSize={[5, 5, 2.5]} />

            {jsonObj.map(obj => (
                <Model
                    key={obj.new_object_id}
                    modelPath={`/assets/${obj.new_object_id}.glb`}
                    position={[obj.position.x, obj.position.y, obj.position.z]}
                    rotation={obj.rotation}
                    size_in_meters={obj.size_in_meters}
                />
            ))}
        </Canvas>
    );
};

export default Scene;