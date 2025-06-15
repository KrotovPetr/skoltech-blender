import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { objectsInRoom } from '../utils';

interface SizeInMeters {
    length: number;
    width: number;
    height: number;
}

interface Placement {
    room_layout_elements: Array<{
        layout_element_id: string;
        preposition: string;
    }>;
    objects_in_room: Array<{
        object_id: string;
        preposition: string;
        is_adjacent: boolean;
    }>;
}

interface Cluster {
    constraint_area: {
        x_neg: number;
        x_pos: number;
        y_neg: number;
        y_pos: number;
    };
}

interface ObjectData {
    new_object_id: string;
    style: string;
    material: string;
    size_in_meters: SizeInMeters;
    is_on_the_floor: boolean;
    facing: string;
    placement: Placement;
    rotation: {
        z_angle: number;
    };
    cluster: Cluster;
    position: {
        x: number;
        y: number;
        z: number;
    };
}

interface Object3DProps {
    data: ObjectData;
    glbPath: string;
}

const Object3D: React.FC<Object3DProps> = ({ data, glbPath }) => {
    const gltf = useLoader(GLTFLoader, glbPath);
    const ref = useRef<THREE.Group>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        if (ref.current && gltf.scene.children.length > 0) {
            const mesh = gltf.scene.children[0];

            if (mesh && mesh.geometry && mesh.geometry.boundingBox) {
                ref.current.position.set(data.position.x, data.position.y, data.position.z);

                const zRotation = (data.rotation.z_angle / 180) * Math.PI;
                ref.current.rotation.set(0, 0, zRotation);

                const { length, width, height } = data.size_in_meters;
                const scaleX = length / mesh.geometry.boundingBox.max.x;
                const scaleY = width / mesh.geometry.boundingBox.max.y;
                const scaleZ = height / mesh.geometry.boundingBox.max.z;
                ref.current.scale.set(scaleX, scaleY, scaleZ);

                setIsLoaded(true);
            } else {
                console.error('Модель не содержит геометрии или boundingBox:', gltf);
            }
        }
    }, [data, gltf]);

    if (!isLoaded) {
        return null;
    }

    return <primitive object={gltf.scene} ref={ref} />;
};

const SceneBuilder: React.FC<{ objects: ObjectData[] }> = ({ objects }) => {
    return (
        <Canvas camera={{ position: [5, 5, 5], fov: 50 }}>
            <Grid
                position={[0, 0, 0]}
                args={[10, 10]} 
                cellSize={1} 
                cellColor="#cccccc" 
                sectionColor="#888888" 
                sectionSize={5} 
            />

            <axesHelper args={[5]} /> 

            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} />
            {objects.map((obj) => (
                <Object3D key={obj.new_object_id} data={obj} glbPath={`/assets/${obj.new_object_id}.glb`} />
            ))}
            <OrbitControls />
        </Canvas>
    );
};

const Scene: React.FC = () => {
    return (
        <div style={{ width: '100vw', height: '100vh' }}>
            <SceneBuilder objects={objectsInRoom} />
        </div>
    );
};

export default Scene;