import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { useDrop } from "react-dnd";
import { DraggableObject } from "./DraggableObject";

interface SizeInMeters {
    length: number;
    width: number;
    height: number;
}

interface Position {
    x: number;
    y: number;
    z: number;
}

interface InputObject {
    new_object_id: string;
    size_in_meters: SizeInMeters;
    position: Position;
    rotation_z: number;
    style: string;
    material: string;
    color: string;
}

interface SVGObjectCoordinates {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface PlainSVGObjectData {
    id: string;
    label: string;
    coordinates: SVGObjectCoordinates;
    style: string;
    material: string;
    color: string;
}

interface PlainSVGObjectDataWithRotation extends PlainSVGObjectData {
    rotation: number;
    furnitureType: string;
}

export interface RoomLayoutProps {
    initialObjects: InputObject[];
    updateJson: (value: string) => void;
    modelId: number;
}

export interface RoomLayoutRef {
    loadSceneFromData: (data: InputObject[]) => void;
}

interface ColorsDisctionary {
    [key: string]: string;
}

const METERS_TO_PIXELS = 100;
const LABEL_SPACE = 20;


const ROOM_WIDTH_1 = 8.13 * METERS_TO_PIXELS; 
const ROOM_HEIGHT_1 = 10.96 * METERS_TO_PIXELS;
const ROOM_WIDTH_2 = 9.13 * METERS_TO_PIXELS; 
const ROOM_HEIGHT_2 = 9.86 * METERS_TO_PIXELS;

export const colors: ColorsDisctionary = {
    "TV stand": "#FF0000",
    "bar counter": "#0000FF",
    "bench": "#FFFF00",
    "bookshelf": "#FFBFBF",
    "cabinet": "#00FF00",
    "chair": "#FFA500",
    "chair-bed": "#40E0D0",
    "coffee table": "#272643",
    "desk": "#FFD9BF",
    "dining table": "#8B00FF",
    "fireplace": "#FF9400",
    "floor lamp": "#5500FF",
    "floor plant": "#29922C",
    "floor vase": "#FF6347",
    "kitchen island": "#ADFF2F",
    "modular kitchen": "#FF7F50",
    "ottoman": "#AFCC43",
    "rocking chair": "#FF8C00",
    "rug": "#BAE8E8",
    "shelves": "#C71585",
    "side table": "#00BFFF",
    "sideboard": "#DA70D6",
    "sofa": "#FF00FF",
    "stool": "#DC143C",
    "wardrobe": "#552743",
    "armchair": "#4A2714",
    "window": "#000000",
};

const getFurnitureTypeFromId = (id: string): string => {
    return id.split('_')[0];
};

const normalizeForColorDictionary = (type: string): string => {
    const normalizeMap: { [key: string]: string } = {
        "tv": "TV stand",
        "barcounter": "bar counter",
        "bench": "bench",
        "bookshelf": "bookshelf",
        "cabinet": "cabinet",
        "chair": "chair",
        "chairbed": "chair-bed",
        "coffeetable": "coffee table",
        "desk": "desk",
        "diningtable": "dining table",
        "fireplace": "fireplace",
        "floorlamp": "floor lamp",
        "floorplant": "floor plant",
        "floorvase": "floor vase",
        "kitchenisland": "kitchen island",
        "modularkitchen": "modular kitchen",
        "ottoman": "ottoman",
        "rockingchair": "rocking chair",
        "rug": "rug",
        "shelves": "shelves",
        "sidetable": "side table",
        "sideboard": "sideboard",
        "sofa": "sofa",
        "stool": "stool",
        "wardrobe": "wardrobe",
        "armchair": "armchair",
        "window": "window"
    };

    return normalizeMap[type.toLowerCase()] || type;
};

const convertToSVGObject = (inputObject: InputObject): PlainSVGObjectDataWithRotation => {
    const furnitureType = getFurnitureTypeFromId(inputObject.new_object_id);
    const normalizedType = normalizeForColorDictionary(furnitureType);

    return {
        id: inputObject.new_object_id,
        label: normalizedType,
        coordinates: {
            x: inputObject.position.x * METERS_TO_PIXELS,
            y: inputObject.position.y * METERS_TO_PIXELS,
            width: inputObject.size_in_meters.length * METERS_TO_PIXELS,
            height: inputObject.size_in_meters.width * METERS_TO_PIXELS
        },
        rotation: inputObject.rotation_z,
        style: inputObject.style,
        material: inputObject.material,
        color: colors[normalizedType] || inputObject.color,
        furnitureType: normalizedType
    };
};

const convertToJSON = (svgObject: PlainSVGObjectDataWithRotation): InputObject => {
    return {
        new_object_id: svgObject.id,
        size_in_meters: {
            length: svgObject.coordinates.width / METERS_TO_PIXELS,
            width: svgObject.coordinates.height / METERS_TO_PIXELS,
            height: 0.98 
        },
        position: {
            x: svgObject.coordinates.x / METERS_TO_PIXELS,
            y: svgObject.coordinates.y / METERS_TO_PIXELS,
            z: 0
        },
        rotation_z: svgObject.rotation,
        style: svgObject.style,
        material: svgObject.material,
        color: svgObject.color
    };
};

export const RoomLayout = forwardRef<RoomLayoutRef, RoomLayoutProps>(({ initialObjects, updateJson, modelId }, ref) => {
    const roomDimensions = modelId === 1 ? [
        9.3,
        10.96,
        2.5
    ] : [
        9.13,
        9.86,
        2.5
    ]
    const [viewBox] = useState({
        minX: 0,
        minY: 0,
        width: modelId === 1 ? ROOM_WIDTH_1 : ROOM_WIDTH_2,
        height: modelId === 1 ? ROOM_HEIGHT_1 : ROOM_HEIGHT_2
    });

    const SCALED_WIDTH = viewBox.width;
    const SCALED_HEIGHT = viewBox.height;
    const SVG_WIDTH = SCALED_WIDTH + LABEL_SPACE * 2;
    const SVG_HEIGHT = SCALED_HEIGHT + LABEL_SPACE * 2;

    const [objects, setObjects] = useState<PlainSVGObjectDataWithRotation[]>(
        initialObjects.map(convertToSVGObject)
    );
    const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);

    const nextIdRef = useRef(initialObjects.length);
    const svgRef = useRef<SVGSVGElement>(null);
    const roomSvgRef = useRef<SVGSVGElement>(null);

    const bounds = {
        minX: 0,
        maxX: modelId === 1 ? ROOM_WIDTH_1 : ROOM_WIDTH_2,
        minY: 0,
        maxY: modelId === 1 ? ROOM_HEIGHT_1 : ROOM_HEIGHT_2
    };

    useImperativeHandle(ref, () => ({
        loadSceneFromData: (data: InputObject[]) => {
            const convertedObjects = data.map(convertToSVGObject);
            setObjects(convertedObjects);
            setSelectedObjectId(null);
            nextIdRef.current = data.length;
        }
    }));

    useEffect(() => {
        const convertedObjects = initialObjects.map(convertToSVGObject);
        setObjects(convertedObjects);
    }, [initialObjects]);

    const getMouseSVGCoordinates = (clientX: number, clientY: number) => {
        if (!roomSvgRef.current) return { x: 0, y: 0 };

        const svgRect = roomSvgRef.current.getBoundingClientRect();
        const point = roomSvgRef.current.createSVGPoint();
        point.x = clientX - svgRect.left;
        point.y = clientY - svgRect.top;

        const ctm = roomSvgRef.current.getScreenCTM();
        if (!ctm) return { x: 0, y: 0 };

        return point.matrixTransform(ctm.inverse());
    };

    const isInsideRoom = (
        x: number,
        y: number,
        width: number,
        height: number,
        rotation: number
    ): boolean => {
        const halfWidth = width / 2;
        const halfHeight = height / 2;

        const corners = [
            { x: -halfWidth, y: -halfHeight },
            { x: halfWidth, y: -halfHeight },
            { x: halfWidth, y: halfHeight },
            { x: -halfWidth, y: halfHeight }
        ];

        const radians = (rotation * Math.PI) / 180;
        const cosTheta = Math.cos(radians);
        const sinTheta = Math.sin(radians);

        for (const corner of corners) {
            const rotatedX = corner.x * cosTheta - corner.y * sinTheta;
            const rotatedY = corner.x * sinTheta + corner.y * cosTheta;

            const absoluteX = x + rotatedX;
            const absoluteY = y + rotatedY;

            if (
                absoluteX < bounds.minX ||
                absoluteX > bounds.maxX ||
                absoluteY < bounds.minY ||
                absoluteY > bounds.maxY
            ) {
                return false;
            }
        }

        return true;
    };

    const moveObject = (id: string, x: number, y: number) => {
        const obj = objects.find(o => o.id === id);
        if (!obj) return;

        if (isInsideRoom(x, y, obj.coordinates.width, obj.coordinates.height, obj.rotation)) {
            setObjects(prevObjects =>
                prevObjects.map(obj =>
                    obj.id === id
                        ? {
                            ...obj,
                            coordinates: {
                                ...obj.coordinates,
                                x,
                                y
                            }
                        }
                        : obj
                )
            );
        }
    };

    const updateObject = (id: string, updates: Partial<PlainSVGObjectDataWithRotation>) => {
        const obj = objects.find(o => o.id === id);
        if (!obj) return;

        const updatedObject = { ...obj, ...updates };

        if (updates.coordinates || updates.rotation !== undefined) {
            const newCoords = updates.coordinates || obj.coordinates;
            const newRotation = updates.rotation !== undefined ? updates.rotation : obj.rotation;

            if (isInsideRoom(
                newCoords.x,
                newCoords.y,
                newCoords.width,
                newCoords.height,
                newRotation
            )) {
                setObjects(prevObjects =>
                    prevObjects.map(o => o.id === id ? updatedObject : o)
                );
            }
        } else {
            setObjects(prevObjects =>
                prevObjects.map(o => o.id === id ? updatedObject : o)
            );
        }
    };

    const handleEndAction = (id: string) => {
        const updatedObjects = objects.map(obj => convertToJSON(obj));
        updateJson(JSON.stringify([{
            "room_dimensions": roomDimensions
        }, ...updatedObjects], null, 2));
    };

    const handleSvgClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            setSelectedObjectId(null);
        }
    };

    const [, drop] = useDrop(() => ({
        accept: "object",
        drop: (item: { label: string, style: string, material: string, color: string }, monitor) => {
            if (monitor.didDrop()) {
                return; 
            }

            const dropOffset = monitor.getClientOffset();
            if (!dropOffset || !roomSvgRef.current) return;

            const { x, y } = getMouseSVGCoordinates(dropOffset.x, dropOffset.y);
            const normalizedLabel = item.label.toLowerCase().replace(/\s+/g, '_');
            const newId = `${normalizedLabel}_${nextIdRef.current}`;
            nextIdRef.current += 1;

            let defaultWidth = 1.0 * METERS_TO_PIXELS;
            let defaultHeight = 0.5 * METERS_TO_PIXELS;

            const normalizedType = normalizeForColorDictionary(item.label);
            if (normalizedType === "sofa") {
                defaultWidth = 2.0 * METERS_TO_PIXELS;
                defaultHeight = 0.8 * METERS_TO_PIXELS;
            } else if (normalizedType === "armchair") {
                defaultWidth = 0.9 * METERS_TO_PIXELS;
                defaultHeight = 0.9 * METERS_TO_PIXELS;
            } else if (normalizedType === "coffee table") {
                defaultWidth = 1.2 * METERS_TO_PIXELS;
                defaultHeight = 0.7 * METERS_TO_PIXELS;
            }

            if (isInsideRoom(x, y, defaultWidth, defaultHeight, 0)) {
                const newObj: PlainSVGObjectDataWithRotation = {
                    id: newId,
                    label: item.label,
                    coordinates: {
                        x,
                        y,
                        width: defaultWidth,
                        height: defaultHeight
                    },
                    rotation: 0,
                    style: item.style || "Modern",
                    material: item.material || "wood",
                    color: colors[normalizedType] || item.color || "#CCCCCC",
                    furnitureType: normalizedType
                };

                setObjects(prevObjects => {
                    const newObjects = [...prevObjects, newObj];

                    const jsonObjects = newObjects.map(obj => convertToJSON(obj));

                    updateJson(JSON.stringify([{
                        "room_dimensions": roomDimensions
                    }, ...jsonObjects], null, 2));

                    return newObjects;
                });

                setSelectedObjectId(newId);
            }
        },
        canDrop: (item, monitor) => {
            const dropOffset = monitor.getClientOffset();
            if (!dropOffset || !roomSvgRef.current) return false;

            const { x, y } = getMouseSVGCoordinates(dropOffset.x, dropOffset.y);

            return x >= bounds.minX && x <= bounds.maxX &&
                y >= bounds.minY && y <= bounds.maxY;
        }
    }), [objects, isInsideRoom, getMouseSVGCoordinates]);


    useEffect(() => {
        if (roomSvgRef.current) {
            drop(roomSvgRef.current);
        }
    }, [drop]);

    useEffect(() => {
        const updatedObjects = objects.map(obj => convertToJSON(obj));
        updateJson(JSON.stringify([{
            "room_dimensions": roomDimensions
        }, ...updatedObjects], null, 2));
    }, [objects, updateJson]);

    return (
        <div>
            <svg
                ref={svgRef}
                width={SVG_WIDTH}
                height={SVG_HEIGHT}
                viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
                style={{ border: "1px solid black" }}
            >
                <defs>
                    <clipPath id="room-clip">
                        <rect
                            x={viewBox.minX}
                            y={viewBox.minY}
                            width={SCALED_WIDTH}
                            height={SCALED_HEIGHT}
                        />
                    </clipPath>
                </defs>

                <text
                    x={LABEL_SPACE + SCALED_WIDTH / 2}
                    y={LABEL_SPACE / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="black"
                    fontSize="16"
                    fontWeight="bold"
                >
                    Верхняя стена
                </text>
                <text
                    x={LABEL_SPACE + SCALED_WIDTH / 2}
                    y={LABEL_SPACE + SCALED_HEIGHT + LABEL_SPACE / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="black"
                    fontSize="16"
                    fontWeight="bold"
                >
                    Нижняя стена
                </text>
                <text
                    x={LABEL_SPACE / 2}
                    y={LABEL_SPACE + SCALED_HEIGHT / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="black"
                    fontSize="16"
                    fontWeight="bold"
                    transform={`rotate(-90, ${LABEL_SPACE / 2}, ${LABEL_SPACE + SCALED_HEIGHT / 2})`}
                >
                    Левая стена
                </text>
                <text
                    x={LABEL_SPACE + SCALED_WIDTH + LABEL_SPACE / 2}
                    y={LABEL_SPACE + SCALED_HEIGHT / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="black"
                    fontSize="16"
                    fontWeight="bold"
                    transform={`rotate(90, ${LABEL_SPACE + SCALED_WIDTH + LABEL_SPACE / 2}, ${LABEL_SPACE + SCALED_HEIGHT / 2})`}
                >
                    Правая стена
                </text>
                <svg
                    ref={roomSvgRef}
                    x={LABEL_SPACE}
                    y={LABEL_SPACE}
                    width={SCALED_WIDTH}
                    height={SCALED_HEIGHT}
                    viewBox={`${viewBox.minX} ${viewBox.minY} ${SCALED_WIDTH} ${SCALED_HEIGHT}`}
                    preserveAspectRatio="xMidYMid meet"
                    onClick={handleSvgClick}
                    style={{ clipPath: "url(#room-clip)", pointerEvents: "all" }}
                >
                    <rect
                        x={0}
                        y={0}
                        width={modelId === 1 ? ROOM_WIDTH_1 : ROOM_WIDTH_2}
                        height={modelId === 1 ? ROOM_HEIGHT_1 : ROOM_HEIGHT_2}
                        fill="white"
                        pointerEvents="all"
                    />
                    <rect
                        x={0}
                        y={0}
                        width={modelId === 1 ? ROOM_WIDTH_1 : ROOM_WIDTH_2}
                        height={modelId === 1 ? ROOM_HEIGHT_1 : ROOM_HEIGHT_2}
                        fill="none"
                        stroke="black"
                        strokeWidth={4}
                        pointerEvents="none" 
                    />

                    {objects.map((obj, index) => (
                        <DraggableObject
                            key={obj.id}
                            obj={obj}
                            index={index}
                            roomWidth={modelId === 1 ? ROOM_WIDTH_1 : ROOM_WIDTH_2}
                            roomHeight={modelId === 1 ? ROOM_HEIGHT_1 : ROOM_HEIGHT_2}
                            bounds={bounds}
                            onMove={moveObject}
                            onUpdate={updateObject}
                            onSelect={(id) => setSelectedObjectId(id)}
                            onDeselect={() => setSelectedObjectId(null)}
                            onEndAction={handleEndAction}
                            isSelected={selectedObjectId === obj.id}
                            getMouseSVGCoordinates={getMouseSVGCoordinates}
                            isInsideRoom={isInsideRoom}
                        />
                    ))}
                </svg>

                <rect
                    x={LABEL_SPACE}
                    y={LABEL_SPACE}
                    width={SCALED_WIDTH}
                    height={SCALED_HEIGHT}
                    fill="none"
                    stroke="#888"
                    strokeWidth={1}
                    pointerEvents="none"
                />
            </svg>
        </div>
    );
});

RoomLayout.displayName = 'RoomLayout';
