import React, { useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
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

function rescaleObject(
    obj: THREE.Object3D,
    targetSize: { length: number; width: number; height: number }
) {
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
    z_angle: number;
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

        const [x, y, z] = position;
        scene.position.set(x, y, z);

        const xAngle = degToRad(rotation.x_angle ?? 0);
        const yAngle = degToRad(rotation.y_angle ?? 0);
        const zAngle = degToRad(rotation.z_angle ?? 0);
        scene.rotation.set(xAngle, yAngle, zAngle);

    }, [scene, position, rotation, size_in_meters]);

    return <primitive object={scene} />;
});

interface SceneProps {
    roomSize: number[];
}

const Scene: React.FC<SceneProps> = React.memo(({ roomSize }) => {
    const glRef = useRef<THREE.WebGLRenderer | null>(null);

    return (
        <Canvas
            camera={{ position: [5, 5, 5], up: [0, 0, 1] }}
            className={b()}
            gl={{ antialias: true }}
            onCreated={({ gl }) => {
                gl.setClearColor(new THREE.Color('#a8a8a8'));
                glRef.current = gl;
            }}
        >
            <directionalLight position={[10, 10, 10]} intensity={0.5} />
            <hemisphereLight intensity={0.35} />
            <OrbitControls />
            <Helpers />
            {roomSize && <Room roomSize={roomSize}/>}

            <Cube position={[1, 0, 0]} color="red" />
            <Cube position={[0, 1, 0]} color="green" />
            <Cube position={[0, 0, 1]} color="blue" />

            {jsonObj.map((obj) => (
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
});

export default Scene;