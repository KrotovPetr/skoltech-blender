import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { ObjectData } from "../types";
import * as THREE from 'three';

const rescaleObject = (obj: THREE.Object3D, targetSize: { length: number; width: number; height: number }) => {
    const bbox = new THREE.Box3().setFromObject(obj);
    const size = bbox.getSize(new THREE.Vector3());

    const scale = new THREE.Vector3(
        targetSize.length / size.x,
        targetSize.width / size.y,
        targetSize.height / size.z
    );

    obj.scale.copy(scale);
};

export const createObjects = (scene: THREE.Scene, sceneData: ObjectData[]) => {
    const gltfLoader = new GLTFLoader();

    const createObject = (
        scene: THREE.Scene,
        objData: ObjectData,
        gltfLoader: GLTFLoader
    ) => {
        gltfLoader.load(`/assets/${objData.new_object_id}.glb`, (gltf) => {
            const model = gltf.scene;

            // Центрирование модели вокруг собственного центра
            const bbox = new THREE.Box3().setFromObject(model);
            const center = bbox.getCenter(new THREE.Vector3());
            model.position.sub(center);  // Перемещение модели к началу координат

            // Установка позиции модели
            model.position.add(new THREE.Vector3(
                objData.position.x,
                objData.position.y,
                objData.position.z
            ));

            model.rotation.z = THREE.MathUtils.degToRad(objData.rotation.z_angle) + Math.PI;

            // Масштабируем объект
            rescaleObject(model, objData.size_in_meters);

            scene.add(model);
        });
    };

    sceneData.forEach((objData) => createObject(scene, objData, gltfLoader));
}