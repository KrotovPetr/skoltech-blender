import React, { useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import {OrbitControls, useGLTF} from '@react-three/drei';
import * as THREE from 'three';
import { Helpers } from '../../entities';
import { TGLBModels, TRotation } from '../../shared/utils/json';
import { Cubes } from '../../entities/Cubes';
import { SceneLights } from '../../entities/SceneLights/SceneLights';

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


interface ModelProps {
    modelPath: string;
    position: [number, number, number];
    rotation: TRotation;
    size_in_meters: { length: number; width: number; height: number };
}

const Model: React.FC<ModelProps> = ({ modelPath, position, rotation, size_in_meters }) => {
    const { scene } = useGLTF(modelPath) as { scene: THREE.Object3D };

    useEffect(() => {
        rescaleObject(scene, size_in_meters);

        scene.position.set(...position);
        scene.rotation.set(
            degToRad(rotation.x_angle ?? 0),
            degToRad(rotation.y_angle ?? 0),
            degToRad(rotation.z_angle ?? 0 + Math.PI)
        );
    }, [scene, position, rotation, size_in_meters]);

    return <primitive object={scene} />;
};

const Scene: React.FC = () => {
    return (
        <Canvas
            camera={{ position: [5, 5, 5], up: [0, 0, 1] }}
        >
            <OrbitControls />
            <Helpers/>
            <Cubes/>
            <SceneLights/>

            {TGLBModels.map(obj => (
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