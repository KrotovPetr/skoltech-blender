import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { jsonObj } from '../../shared/utils/json';
import block from 'bem-cn-lite';
import './Scene.scss';

const b = block('scene')

const ROOM_DEPTH = 4.0;
const ROOM_HEIGHT = 2.5;
const ROOM_WIDTH = 4.0;

interface CubeProps {
    position: [number, number, number];
    rotation: [number, number, number];
    size: [number, number, number];
    color: string;
}

const Cube: React.FC<CubeProps> = ({ position, rotation, size, color }) => {
    return (
        <mesh position={position} rotation={rotation}>
            <boxGeometry args={size} />
            <meshStandardMaterial color={color} />
            <lineSegments>
                <edgesGeometry args={[new THREE.BoxGeometry(...size)]} />
                <lineBasicMaterial color={0x00ff00} />
            </lineSegments>
            <axesHelper args={[2]} />
        </mesh>
    );
};

interface GLTFModelProps {
    modelPath: string;
    position: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
}

const GLTFModel: React.FC<GLTFModelProps> = ({ modelPath, position, rotation, scale }) => {
    const { scene } = useGLTF(modelPath);
    scene.scale.set(scale[0], scale[1], scale[2]);

    return (
        <primitive
            object={scene}
            position={position}
            rotation={rotation}
        >
            <axesHelper args={[2]} />
        </primitive>
    );
};

const Scene: React.FC = () => {
    // Function to calculate scale based on room dimensions
    const calculateScale = (objectSize: { length: number; width: number; height: number }) => {
        return [
            objectSize.length / ROOM_WIDTH,
            objectSize.width / ROOM_DEPTH,
            objectSize.height / ROOM_HEIGHT
        ];
    };

    return (
        <Canvas
            className={b()}
            camera={{
                position: [5, 5, 5],
                up: [0, 0, 1]   // Установка Z как вверх
            }}
        >
            <directionalLight position={[10, 10, 10]} intensity={0.5} />
            <hemisphereLight intensity={0.35} />
            <OrbitControls />
            <axesHelper args={[5]} />

            {jsonObj.map((obj) => {
                const scaleFactors = calculateScale(obj.size_in_meters);

                // Apply scaled size for GLTF objects
                const gltfScale = [
                    obj.size_in_meters.length * scaleFactors[0],
                    obj.size_in_meters.width * scaleFactors[1],
                    obj.size_in_meters.height * scaleFactors[2]
                ];

                return (
                    <React.Fragment key={obj.new_object_id}>
                        {/* <Cube
                            position={[obj.position.x, obj.position.y, obj.position.z]}
                            size={gltfScale}
                            rotation={[
                                ((obj.rotation.x_angle ?? 0) / 180) * Math.PI,
                                ((obj.rotation.y_angle ?? 0) / 180) * Math.PI,
                                (obj.rotation.z_angle / 180) * Math.PI + Math.PI
                            ]}
                            color="orange"


                        /> */}
                        <GLTFModel
                            modelPath={`/assets/${obj.new_object_id}.glb`}
                            position={[obj.position.x, obj.position.y, obj.position.z]}
                            scale={scaleFactors}   // Apply the scale factors to the GLTF model
                            rotation={[
                                ((obj.rotation.x_angle ?? 0) / 180) * Math.PI,
                                ((obj.rotation.y_angle ?? 0) / 180) * Math.PI,
                                0
                            ]}
                        />
                    </React.Fragment>
                );
            })}
        </Canvas>
    );
};

export default Scene;