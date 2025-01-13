import * as THREE from 'three';
import { ObjectData } from "../types";

const getRandomColor = (): number => {
    return Math.floor(Math.random() * 16777215); // 16777215 = 0xFFFFFF
}


// Функция для создания и добавления кубов в сцену
export const createCubes = (scene: THREE.Scene, sceneData: ObjectData[]) => {
    sceneData.forEach(objData => {
        // Создание геометрии куба
        const geometry = new THREE.BoxGeometry(
            objData.size_in_meters.length,
            objData.size_in_meters.width,
            objData.size_in_meters.height
        );

        // Создание материала с случайным цветом
        const material = new THREE.MeshBasicMaterial({ color: getRandomColor() });

        // Создание меша для куба
        const cube = new THREE.Mesh(geometry, material);


        // Установка позиции и вращения куба
        cube.position.set(
            objData.position.x,
            objData.position.y,
            objData.position.z
        );
        cube.rotation.z = THREE.MathUtils.degToRad(objData.rotation.z_angle) + Math.PI;

        // Добавление куба в сцену
        scene.add(cube);
    });

    console.log("Все кубы созданы и добавлены в сцену");
}