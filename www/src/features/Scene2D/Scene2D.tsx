import React, { useState, useRef, useEffect } from "react";
import { useDrop } from "react-dnd";

// Интерфейсы для входных данных
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
}

interface ColorsDisctionary {
    [key: string]: string;
}

// Константы
const METERS_TO_PIXELS = 100;
const LABEL_SPACE = 20;

// Определение размеров комнаты
const ROOM_WIDTH = 8.3 * METERS_TO_PIXELS; // в пикселях
const ROOM_HEIGHT = 10.96 * METERS_TO_PIXELS; // в пикселях

// Словарь цветов
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

// Вспомогательные функции
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
            height: 0.98 // дефолтная высота
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

// Компонент кнопки закрытия
const CloseButton: React.FC<{
    x: number;
    y: number;
    onClick: () => void;
}> = ({ x, y, onClick }) => {
    return (
        <g
            transform={`translate(${x}, ${y})`}
            onClick={(e) => {
                e.stopPropagation();
                onClick();
            }}
            style={{ cursor: 'pointer' }}
        >
            <circle
                cx={0}
                cy={0}
                r={12}
                fill="#FF5555"
                stroke="#FFFFFF"
                strokeWidth={2}
            />
            <line
                x1={-6}
                y1={-6}
                x2={6}
                y2={6}
                stroke="#FFFFFF"
                strokeWidth={2}
                strokeLinecap="round"
            />
            <line
                x1={-6}
                y1={6}
                x2={6}
                y2={-6}
                stroke="#FFFFFF"
                strokeWidth={2}
                strokeLinecap="round"
            />
        </g>
    );
};

export const RoomLayout: React.FC<RoomLayoutProps> = ({ initialObjects, updateJson }) => {
    // Инициализация viewBox
    const [viewBox] = useState({
        minX: 0,
        minY: 0,
        width: ROOM_WIDTH,
        height: ROOM_HEIGHT
    });

    // Размеры и состояния
    const SCALED_WIDTH = viewBox.width;
    const SCALED_HEIGHT = viewBox.height;
    const SVG_WIDTH = SCALED_WIDTH + LABEL_SPACE * 2;
    const SVG_HEIGHT = SCALED_HEIGHT + LABEL_SPACE * 2;

    const [objects, setObjects] = useState<PlainSVGObjectDataWithRotation[]>(
        initialObjects.map(convertToSVGObject)
    );
    const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);

    // Refs
    const nextIdRef = useRef(initialObjects.length);
    const svgRef = useRef<SVGSVGElement>(null);
    const roomSvgRef = useRef<SVGSVGElement>(null);

    // Границы комнаты
    const bounds = {
        minX: 0,
        maxX: ROOM_WIDTH,
        minY: 0,
        maxY: ROOM_HEIGHT
    };

    // Преобразование координат
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

    // Функция для проверки, находится ли объект полностью внутри комнаты
    const isInsideRoom = (
        x: number,
        y: number,
        width: number,
        height: number,
        rotation: number
    ): boolean => {
        // Для объектов с вращением, проверим все четыре угла
        const halfWidth = width / 2;
        const halfHeight = height / 2;

        // Углы прямоугольника до вращения (относительно центра)
        const corners = [
            { x: -halfWidth, y: -halfHeight },
            { x: halfWidth, y: -halfHeight },
            { x: halfWidth, y: halfHeight },
            { x: -halfWidth, y: halfHeight }
        ];

        // Вращение в радианах
        const radians = (rotation * Math.PI) / 180;
        const cosTheta = Math.cos(radians);
        const sinTheta = Math.sin(radians);

        // Проверяем, что все углы находятся внутри комнаты
        for (const corner of corners) {
            // Применяем вращение к углу
            const rotatedX = corner.x * cosTheta - corner.y * sinTheta;
            const rotatedY = corner.x * sinTheta + corner.y * cosTheta;

            // Абсолютные координаты угла
            const absoluteX = x + rotatedX;
            const absoluteY = y + rotatedY;

            // Проверяем, что угол внутри комнаты
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

    // Обработчики объектов
    const moveObject = (id: string, x: number, y: number) => {
        const obj = objects.find(o => o.id === id);
        if (!obj) return;

        // Проверяем, будет ли новое положение внутри комнаты
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

        // Создаем обновленный объект
        const updatedObject = { ...obj, ...updates };

        // Если есть изменения в координатах или размерах
        if (updates.coordinates || updates.rotation !== undefined) {
            const newCoords = updates.coordinates || obj.coordinates;
            const newRotation = updates.rotation !== undefined ? updates.rotation : obj.rotation;

            // Проверяем, будет ли новое положение внутри комнаты
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
            // Если изменения не касаются положения или размеров
            setObjects(prevObjects =>
                prevObjects.map(o => o.id === id ? updatedObject : o)
            );
        }
    };

    const handleEndAction = (id: string) => {
        const updatedObjects = objects.map(obj => convertToJSON(obj));
        updateJson(JSON.stringify(updatedObjects, null, 2));
    };

    const handleSvgClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            setSelectedObjectId(null);
        }
    };

    // Настройка Drop
    const [, drop] = useDrop(() => ({
        accept: "object",
        drop: (item: { label: string, style: string, material: string, color: string }, monitor) => {
            const dropOffset = monitor.getClientOffset();
            if (!dropOffset || !roomSvgRef.current) return;

            const { x, y } = getMouseSVGCoordinates(dropOffset.x, dropOffset.y);
            const newId = `${item.label}-${nextIdRef.current}`;
            nextIdRef.current += 1;

            // Размеры по умолчанию
            const defaultWidth = 1.0 * METERS_TO_PIXELS;
            const defaultHeight = 0.5 * METERS_TO_PIXELS;

            // Проверяем, будет ли новый объект внутри комнаты
            if (isInsideRoom(x, y, defaultWidth, defaultHeight, 0)) {
                // Создаем новый объект
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
                    style: item.style,
                    material: item.material,
                    color: colors[normalizeForColorDictionary(item.label)] || item.color,
                    furnitureType: normalizeForColorDictionary(item.label)
                };

                setObjects(prev => [...prev, newObj]);
                setSelectedObjectId(newId);

                const updatedObjects = [...objects, newObj].map(obj => convertToJSON(obj));
                updateJson(JSON.stringify(updatedObjects, null, 2));
            }
        },
    }), [objects]);

    // Эффекты
    useEffect(() => {
        if (roomSvgRef.current) {
            drop(roomSvgRef.current);
        }
    }, [drop]);

    useEffect(() => {
        const updatedObjects = objects.map(obj => convertToJSON(obj));
        updateJson(JSON.stringify(updatedObjects, null, 2));
    }, [objects]);

    // Рендер
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

                {/* Подписи стен */}
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
                {/* Внутренний SVG */}
                <svg
                    ref={roomSvgRef}
                    x={LABEL_SPACE}
                    y={LABEL_SPACE}
                    width={SCALED_WIDTH}
                    height={SCALED_HEIGHT}
                    viewBox={`${viewBox.minX} ${viewBox.minY} ${SCALED_WIDTH} ${SCALED_HEIGHT}`}
                    preserveAspectRatio="xMidYMid meet"
                    onClick={handleSvgClick}
                    style={{ clipPath: "url(#room-clip)" }}
                >
                    {/* Фон и рамка комнаты */}
                    <rect
                        x={0}
                        y={0}
                        width={ROOM_WIDTH}
                        height={ROOM_HEIGHT}
                        fill="white"
                    />
                    <rect
                        x={0}
                        y={0}
                        width={ROOM_WIDTH}
                        height={ROOM_HEIGHT}
                        fill="none"
                        stroke="black"
                        strokeWidth={4}
                    />

                    {/* Объекты */}
                    {objects.map((obj, index) => (
                        <DraggableObject
                            key={obj.id}
                            obj={obj}
                            index={index}
                            roomHeight={ROOM_HEIGHT}
                            roomWidth={ROOM_WIDTH}
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

                {/* Рамка вокруг внутреннего SVG */}
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
};

// Компонент DraggableObject
const DraggableObject: React.FC<{
    obj: PlainSVGObjectDataWithRotation;
    index: number;
    roomHeight: number;
    roomWidth: number;
    bounds: { minX: number; maxX: number; minY: number; maxY: number };
    onMove: (id: string, x: number, y: number) => void;
    onUpdate: (id: string, updates: Partial<PlainSVGObjectDataWithRotation>) => void;
    onSelect: (id: string) => void;
    onDeselect: () => void;
    onEndAction: (id: string) => void;
    isSelected: boolean;
    getMouseSVGCoordinates: (clientX: number, clientY: number) => { x: number; y: number };
    isInsideRoom: (x: number, y: number, width: number, height: number, rotation: number) => boolean;
}> = ({
    obj,
    bounds,
    onMove,
    onUpdate,
    onSelect,
    onDeselect,
    onEndAction,
    isSelected,
    getMouseSVGCoordinates,
    isInsideRoom
}) => {
        const ref = useRef<SVGGElement>(null);

        // Перемещение объекта
        const handleMouseDown = (e: React.MouseEvent) => {
            if (e.button !== 0) return;
            e.stopPropagation();

            const startCoords = { ...obj.coordinates };
            const { x: startX, y: startY } = getMouseSVGCoordinates(e.clientX, e.clientY);
            const offsetX = startX - obj.coordinates.x;
            const offsetY = startY - obj.coordinates.y;

            const handleMouseMove = (moveEvent: MouseEvent) => {
                const { x: currentX, y: currentY } = getMouseSVGCoordinates(moveEvent.clientX, moveEvent.clientY);

                let newX = currentX - offsetX;
                let newY = currentY - offsetY;

                // Проверяем, находится ли объект полностью внутри комнаты
                if (isInsideRoom(newX, newY, obj.coordinates.width, obj.coordinates.height, obj.rotation)) {
                    onMove(obj.id, newX, newY);
                }
            };

            const handleMouseUp = () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
                onEndAction(obj.id);
            };

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            onSelect(obj.id);
        };

        // Изменение размера
        const handleResize = (e: MouseEvent, corner: string, initialData: {
            width: number;
            height: number;
            x: number;
            y: number;
            mouseX: number;
            mouseY: number;
            rotation: number;
        }) => {
            const { x: currentX, y: currentY } = getMouseSVGCoordinates(e.clientX, e.clientY);

            const dx = currentX - initialData.mouseX;
            const dy = currentY - initialData.mouseY;

            let newWidth = initialData.width;
            let newHeight = initialData.height;
            let newX = initialData.x;
            let newY = initialData.y;

            const minSize = 20; // Минимальный размер в пикселях

            switch (corner) {
                case 'topLeft':
                    newWidth = Math.max(minSize, initialData.width - dx);
                    newHeight = Math.max(minSize, initialData.height - dy);
                    newX = initialData.x - (dx / 2);
                    newY = initialData.y - (dy / 2);
                    break;
                case 'topRight':
                    newWidth = Math.max(minSize, initialData.width + dx);
                    newHeight = Math.max(minSize, initialData.height - dy);
                    newX = initialData.x + (dx / 2);
                    newY = initialData.y - (dy / 2);
                    break;
                case 'bottomLeft':
                    newWidth = Math.max(minSize, initialData.width - dx);
                    newHeight = Math.max(minSize, initialData.height + dy);
                    newX = initialData.x - (dx / 2);
                    newY = initialData.y + (dy / 2);
                    break;
                case 'bottomRight':
                    newWidth = Math.max(minSize, initialData.width + dx);
                    newHeight = Math.max(minSize, initialData.height + dy);
                    newX = initialData.x + (dx / 2);
                    newY = initialData.y + (dy / 2);
                    break;
            }

            // Проверяем, находится ли объект после изменения размера внутри комнаты
            if (isInsideRoom(newX, newY, newWidth, newHeight, initialData.rotation)) {
                onUpdate(obj.id, {
                    coordinates: {
                        width: newWidth,
                        height: newHeight,
                        x: newX,
                        y: newY
                    }
                });
            }
        };

        // Вращение
        const handleRotate = (e: MouseEvent, initialData: {
            rotation: number;
            centerX: number;
            centerY: number;
            startAngle: number;
            width: number;
            height: number;
        }) => {
            const { x: currentX, y: currentY } = getMouseSVGCoordinates(e.clientX, e.clientY);

            const currentAngle = Math.atan2(
                currentY - initialData.centerY,
                currentX - initialData.centerX
            ) * (180 / Math.PI);

            let newRotation = initialData.rotation + (currentAngle - initialData.startAngle);
            newRotation = ((newRotation % 360) + 360) % 360;

            // Проверяем, находится ли объект после вращения внутри комнаты
            if (isInsideRoom(
                initialData.centerX,
                initialData.centerY,
                initialData.width,
                initialData.height,
                newRotation
            )) {
                onUpdate(obj.id, { rotation: newRotation });
            }
        };

        const x = obj.coordinates.x - obj.coordinates.width / 2;
        const y = obj.coordinates.y - obj.coordinates.height / 2;
        const centerX = obj.coordinates.x;
        const centerY = obj.coordinates.y;

        return (
            <g
                ref={ref}
                transform={`rotate(${-obj.rotation} ${centerX} ${centerY})`}
                style={{ cursor: 'move' }}
                onMouseDown={handleMouseDown}
                onClick={(e) => {
                    e.stopPropagation();
                    onSelect(obj.id);
                }}
            >
                <rect
                    x={x}
                    y={y}
                    width={obj.coordinates.width}
                    height={obj.coordinates.height}
                    fill={obj.color}
                    fillOpacity={0.3}
                    stroke={isSelected ? "#00FF00" : obj.color}
                    strokeWidth={isSelected ? 3 : 2}
                    strokeDasharray={isSelected ? "5,5" : "none"}
                />
                <text
                    x={centerX}
                    y={centerY}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="black"
                    fontSize="12"
                    pointerEvents="none"
                >
                    {obj.furnitureType}
                </text>

                {isSelected && (
                    <>
                        <CloseButton
                            x={x + obj.coordinates.width + 20}
                            y={y - 20}
                            onClick={(e) => {
                                onDeselect();
                            }}
                        />

                        {/* Углы для изменения размера */}
                        {['topLeft', 'topRight', 'bottomLeft', 'bottomRight'].map((corner) => {
                            const cornerX = corner.includes('Right') ? x + obj.coordinates.width : x;
                            const cornerY = corner.includes('Bottom') ? y + obj.coordinates.height : y;
                            const cursor = corner === 'topLeft' || corner === 'bottomRight' ? 'nwse-resize' : 'nesw-resize';

                            return (
                                <circle
                                    key={corner}
                                    cx={cornerX}
                                    cy={cornerY}
                                    r={6}
                                    fill="white"
                                    stroke="#00FF00"
                                    strokeWidth={2}
                                    cursor={cursor}
                                    onMouseDown={(e) => {
                                        e.stopPropagation();
                                        const initialData = {
                                            width: obj.coordinates.width,
                                            height: obj.coordinates.height,
                                            x: obj.coordinates.x,
                                            y: obj.coordinates.y,
                                            mouseX: getMouseSVGCoordinates(e.clientX, e.clientY).x,
                                            mouseY: getMouseSVGCoordinates(e.clientX, e.clientY).y,
                                            rotation: obj.rotation
                                        };

                                        const handleMouseMove = (moveEvent: MouseEvent) => {
                                            handleResize(moveEvent, corner, initialData);
                                        };

                                        const handleMouseUp = () => {
                                            document.removeEventListener('mousemove', handleMouseMove);
                                            document.removeEventListener('mouseup', handleMouseUp);
                                            onEndAction(obj.id);
                                        };

                                        document.addEventListener('mousemove', handleMouseMove);
                                        document.addEventListener('mouseup', handleMouseUp);
                                    }}
                                />
                            );
                        })}

                        {/* Контрол вращения */}
                        <line
                            x1={centerX}
                            y1={y - 20}
                            x2={centerX}
                            y2={y}
                            stroke="#00FF00"
                            strokeWidth={2}
                            pointerEvents="none"
                        />
                        <circle
                            cx={centerX}
                            cy={y - 20}
                            r={8}
                            fill="white"
                            stroke="#00FF00"
                            strokeWidth={2}
                            cursor="grab"
                            onMouseDown={(e) => {
                                e.stopPropagation();
                                const startAngle = Math.atan2(
                                    getMouseSVGCoordinates(e.clientX, e.clientY).y - centerY,
                                    getMouseSVGCoordinates(e.clientX, e.clientY).x - centerX
                                ) * (180 / Math.PI);

                                const initialData = {
                                    rotation: obj.rotation,
                                    centerX,
                                    centerY,
                                    startAngle,
                                    width: obj.coordinates.width,
                                    height: obj.coordinates.height
                                };

                                const handleMouseMove = (moveEvent: MouseEvent) => {
                                    handleRotate(moveEvent, initialData);
                                };

                                const handleMouseUp = () => {
                                    document.removeEventListener('mousemove', handleMouseMove);
                                    document.removeEventListener('mouseup', handleMouseUp);
                                    onEndAction(obj.id);
                                };

                                document.addEventListener('mousemove', handleMouseMove);
                                document.addEventListener('mouseup', handleMouseUp);
                            }}
                        />
                    </>
                )}
            </g>
        );
    };

