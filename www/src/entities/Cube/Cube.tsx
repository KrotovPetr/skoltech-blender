export const Cube = ({ position, color }: { position: [number, number, number]; color: string }) => (
    <mesh position={position}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={color} />
    </mesh>
);