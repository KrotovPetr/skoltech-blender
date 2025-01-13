import * as THREE from 'three';

export const createRoom = (scene: THREE.Scene, width: number, depth: number, height: number) => {
    // Создание пола
    const floorGeometry = new THREE.PlaneGeometry(width, depth);
    const floorMaterial = new THREE.MeshBasicMaterial({ color: 0xaaaaaa, side: THREE.DoubleSide });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    const createWall = (w: number, h: number, position: { x: number; y: number; z: number }, rotationY = 0) => {
        const wallGeometry = new THREE.BoxGeometry(w, h, 0.1); // Толщина стены = 0.1
        const wallMaterial = new THREE.MeshBasicMaterial({ color: 0xcccccc });
        const wall = new THREE.Mesh(wallGeometry, wallMaterial);
        wall.position.set(position.x, position.y, position.z);
        wall.rotation.y = rotationY;
        return wall;
    };

    const halfWidth = width / 2;
    const halfDepth = depth / 2;
    const halfHeight = height / 2;

    const walls = [
        createWall(width, height, { x: 0, y: halfHeight, z: -halfDepth }), // Задняя стена
        createWall(width, height, { x: 0, y: halfHeight, z: halfDepth }),  // Передняя стена
        createWall(depth, height, { x: -halfWidth, y: halfHeight, z: 0 }, Math.PI / 2), // Левая стена, повернута
        createWall(depth, height, { x: halfWidth, y: halfHeight, z: 0 }, Math.PI / 2)   // Правая стена, повернута
    ];

    walls.forEach(wall => scene.add(wall));
};