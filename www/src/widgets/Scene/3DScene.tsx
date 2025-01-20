import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ObjectData } from './types';
import { createObjects } from './utils';

export const ThreeDScene = ({ sceneData }: {sceneData: ObjectData[]}) => {
    const mountRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!mountRef.current) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        const renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);

        mountRef.current.appendChild(renderer.domElement);

        scene.background = new THREE.Color(0xffffff);

        // createRoom(scene, 4, 4, 2.5);
        createObjects(scene, sceneData);
        // createCubes(scene, sceneData);

        // Добавляем оси координат
        const axesHelper = new THREE.AxesHelper(5); // Размер осей
        scene.add(axesHelper);
        scene.rotation.x = -Math.PI / 2;


        const gridHelper = new THREE.GridHelper();
        gridHelper.rotation.x = Math.PI / 2;
        scene.add(gridHelper);

        const controls = new OrbitControls(camera, renderer.domElement);
        camera.position.set(5, 5, 5); // Позиция камеры на 90 градусов от начальных координат (5, 5, 5)
        camera.lookAt(new THREE.Vector3(0, 0, 0)); // Устанавливаем направление камеры на центр сцены


        controls.update();

        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };

        window.addEventListener('resize', handleResize);

        const animate = () => {
            requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        };

        animate();

        return () => {
            window.removeEventListener('resize', handleResize);
            if (mountRef.current) {
                mountRef.current.removeChild(renderer.domElement);
            }
            renderer.dispose();
        };
    }, [sceneData]);

    return <div ref={mountRef} />;
}