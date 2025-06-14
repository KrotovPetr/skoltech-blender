import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useSearchParams } from 'react-router-dom';
import { Helpers, SceneLights } from './components';
import { TRotation } from './types';
import { rotationSettings, rotationSettings2, TGLBModels, TGLBModelsV2, TGLBModelsV3 } from './constants';

const ROTATION_OFFSET_VECTOR = new THREE.Vector3(Math.PI / 2, 0, 0);
const DEG_TO_RAD_FACTOR = Math.PI / 180.0;

// Массив всех доступных настроек
const ALL_SETTINGS = [
    {
        rotationSettings,
        TGLBModels,
        assetsPathPrefix: '/assets/old',
    },
    {
        rotationSettings: rotationSettings2,
        TGLBModels: TGLBModelsV2,
        assetsPathPrefix: '/assets/new',
        roomDimensions: {
            length: 8.3,
            width: 10.96,
            height: 2.5
        },
    },
    {
        rotationSettings: rotationSettings2,
        TGLBModels: TGLBModelsV3,
        assetsPathPrefix: '/assets/new',
        roomDimensions: {
            length: 9.13,
            width: 9.86,
            height: 2.5
        },
    },
];

interface ModelProps {
    modelPath: string;
    position: [number, number, number];
    rotation: TRotation;
    size_in_meters: { length: number; width: number; height: number };
}

function getSize(obj: THREE.Object3D) {
    return new THREE.Box3().setFromObject(obj).getSize(new THREE.Vector3());
}

function getCenter(obj: THREE.Object3D) {
    return new THREE.Box3().setFromObject(obj).getCenter(new THREE.Vector3())
        .sub(getSize(obj).multiply(new THREE.Vector3(0, 0, 0.5)));
}

const Model: React.FC<ModelProps> = ({ modelPath, position, rotation, size_in_meters }) => {
    const { scene } = useGLTF(modelPath);

    const positionVector = useMemo(
        () => new THREE.Vector3(...position),
        [position],
    );

    const rotationEuler = useMemo(() => new THREE.Euler().setFromVector3(
        new THREE.Vector3(rotation?.x_angle ?? 0, rotation?.y_angle ?? 0, rotation?.z_angle ?? 0)
            .multiplyScalar(DEG_TO_RAD_FACTOR)
            .add(ROTATION_OFFSET_VECTOR),
    ), [rotation]);

    const scaleVector = useMemo(() => (
        new THREE.Vector3(size_in_meters.length, size_in_meters.height, size_in_meters.width)
            .divide(getSize(scene))
    ), [scene, size_in_meters]);

    const model = useMemo(() => {
        const clonedScene = scene.clone();

        // Первым шагом должен быть скейл, т.к. scaleVector настроен на пропорции модели до ротации
        clonedScene.scale.copy(scaleVector);
        clonedScene.rotation.copy(rotationEuler);

        // точка позиционирования/вращения расположена не в центре модели.
        // Вычисляем смещение (разницу между точкой центра модели и точкой её позиционирования)
        // Вычисляться должно после скейла
        const scenePositionOffset = getCenter(clonedScene).sub(clonedScene.position);

        clonedScene.position.copy(positionVector.sub(scenePositionOffset));

        return clonedScene;
    }, [scene, positionVector, rotationEuler, scaleVector]);

    return <primitive object={model} />;
};


const Room: React.FC = () => {

    const [searchParams] = useSearchParams();

    // Получаем modelId из query параметров
    const modelId = useMemo(() => {
        const id = searchParams.get('modelId');
        console.log(id)
        return id ? parseInt(id) : 1;
    }, [searchParams]);

    // Выбираем настройки на основе modelId
    // Если modelId = 2, используем настройки с индексом 2 (третий элемент массива)
    // Иначе используем настройки с индексом 1 (второй элемент массива)
    const roomDimensions = useMemo(() => {
        if (modelId === 2) {
            return ALL_SETTINGS[2].roomDimensions; // Третий элемент массива (индекс 2)
        }
        return ALL_SETTINGS[1].roomDimensions; // Второй элемент массива (индекс 1)
    }, [modelId]);

    //@ts-ignore
    const { length, width, height } = roomDimensions;
    const wallColor = modelId === 1 ? "rgb(70, 90, 65)" : "#454d4d"; // Еще светлее
    const floorColor = "#696f6f"; // Еще светлее

    return (
        <>
            {/* Пол */}
            <mesh receiveShadow position={[length / 2, width / 2, 0]} rotation={[0, 0, -Math.PI]}>
                <planeGeometry args={[length, width]} />
                <meshStandardMaterial color={"lightgray"} />
            </mesh>

            {/* Потолок */}
            <mesh receiveShadow position={[length / 2, width / 2, height]} rotation={[0, 0, -Math.PI]}>
                <planeGeometry args={[length, width]} />
                <meshStandardMaterial color={floorColor} side={THREE.BackSide} />
            </mesh>

            {/* Стена слева */}
            <mesh receiveShadow position={[0, width / 2, height / 2]} rotation={[-Math.PI / 2, Math.PI / 2, 0]}>
                <planeGeometry args={[width, height]} />
                <meshStandardMaterial color={wallColor} side={THREE.DoubleSide} />
            </mesh>

            {/* Стена справа */}
            <mesh receiveShadow position={[length, width / 2, height / 2]} rotation={[-Math.PI / 2, Math.PI / 2, 0]}>
                <planeGeometry args={[width, height]} />
                <meshStandardMaterial color={wallColor} side={THREE.DoubleSide} />
            </mesh>

            {/* Стена сзади */}
            <mesh receiveShadow position={[length / 2, 0, height / 2]} rotation={[Math.PI / 2, 0, 0]}>
                <planeGeometry args={[length, height]} />
                <meshStandardMaterial color={wallColor} side={THREE.DoubleSide} />
            </mesh>

            {/* Стена спереди */}
            <mesh receiveShadow position={[length / 2, width, height / 2]} rotation={[Math.PI / 2, 0, 0]}>
                <planeGeometry args={[length, height]} />
                <meshStandardMaterial color={wallColor} side={THREE.DoubleSide} />
            </mesh>
        </>
    );
};

export const Scene: React.FC = () => {
    const [searchParams] = useSearchParams();

    // Получаем modelId из query параметров
    const modelId = useMemo(() => {
        const id = searchParams.get('modelId');
        console.log(id)
        return id ? parseInt(id) : 1;
    }, [searchParams]);

    // Выбираем настройки на основе modelId
    // Если modelId = 2, используем настройки с индексом 2 (третий элемент массива)
    // Иначе используем настройки с индексом 1 (второй элемент массива)
    const SETTINGS = useMemo(() => {
        if (modelId === 2) {
            return ALL_SETTINGS[2]; // Третий элемент массива (индекс 2)
        }
        return ALL_SETTINGS[1]; // Второй элемент массива (индекс 1)
    }, [modelId]);

    return (
        <Canvas
            shadows
            camera={{ position: [5, 5, 5], up: [0, 0, 1] }}
            style={{ width: "100%", height: "100vh" }}
        >
            <OrbitControls />
            <Helpers />
            <SceneLights />
            <Room />
            {SETTINGS.TGLBModels.map(obj => (
                <Model
                    key={obj.new_object_id}
                    modelPath={`${SETTINGS.assetsPathPrefix}/${obj.new_object_id}_processed.glb`}
                    position={[obj.position.x, obj.position.y, modelId === 2 ? (obj.new_object_id === 'window_1_1' || obj.new_object_id === 'window_2_1') ? obj.position.z : 0 : obj.position.z]}
                    rotation={SETTINGS.rotationSettings[obj.new_object_id]}
                    size_in_meters={obj.size_in_meters}
                />
            ))}
        </Canvas>
    );
};
