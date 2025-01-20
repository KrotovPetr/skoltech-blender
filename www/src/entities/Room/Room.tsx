const ROOM_DEPTH = 4.0;
const ROOM_HEIGHT = 2.5;
const ROOM_WIDTH = 4.0;

export const Room = () => (
    <mesh position={[ROOM_WIDTH / 2, ROOM_DEPTH / 2, ROOM_HEIGHT / 2]}>
        <boxGeometry args={[ROOM_WIDTH, ROOM_DEPTH, ROOM_HEIGHT]} />
        <meshStandardMaterial
            color="lightgray"
            side={THREE.DoubleSide}
            opacity={0.2}
            transparent
        />
    </mesh>
);