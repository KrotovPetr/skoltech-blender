// GLBViewer.tsx

import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import { jsonObj } from '../../shared/utils/json';

type ObjectData = {
    new_object_id: string;
    position: { x: number; y: number; z: number };
    rotation?: { x_angle?: number; y_angle?: number; z_angle?: number };
};

type ModelProps = {
    objectData: ObjectData;
};

const Model: React.FC<ModelProps> = ({ objectData }) => {
    const { position, rotation, new_object_id } = objectData;

    // Загружаем модель
    const { scene } = useGLTF(`/assets/${new_object_id}.glb`);

    // Use rotation angles or default to 0
    const rotationArray = [
        (rotation?.x_angle || 0) * (Math.PI / 180),
        (rotation?.y_angle || 0) * (Math.PI / 180),
        (rotation?.z_angle || 0) * (Math.PI / 180),
    ];

    return <primitive object={scene} position={[position.x, position.y, position.z]} rotation={rotationArray} />;
};


const GLBViewer = () => {
    return (
        <Canvas>
            <ambientLight intensity={0.5} />
            <directionalLight position={[5, 10, 7.5]} intensity={1} />
            <OrbitControls />

            {jsonObj.map((objectData) => (
                <Model key={objectData.new_object_id} objectData={objectData} />
            ))}
        </Canvas>
    );
};

export default GLBViewer;