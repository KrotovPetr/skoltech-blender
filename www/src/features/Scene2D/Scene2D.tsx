import React, { useState, useRef, useEffect } from "react";
import { useDrop } from "react-dnd";
import { Furniture, PlainSVGObjectData } from "./types";
import { colors } from "./utils";

export interface RoomLayoutProps {
    initialObjects: PlainSVGObjectData[];
    updateJson: (value: string) => void;
}

interface PlainSVGObjectDataWithRotation extends PlainSVGObjectData {
    rotation?: number;
    id?: string;
}

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
// Функция расчета ViewBox на основе объектов
const calculateViewBox = (objects: PlainSVGObjectDataWithRotation[]) => {
    if (objects.length === 0) {
        return {
            minX: 0,
            minY: 0,
            width: 1024,
            height: 1024
        };
    }

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    objects.forEach(obj => {
        const halfWidth = obj.coordinates.width / 2;
        const halfHeight = obj.coordinates.height / 2;

        minX = Math.min(minX, obj.coordinates.x - halfWidth);
        maxX = Math.max(maxX, obj.coordinates.x + halfWidth);
        minY = Math.min(minY, obj.coordinates.y - halfHeight);
        maxY = Math.max(maxY, obj.coordinates.y + halfHeight);
    });

    return {
        minX: Math.max(0, minX),
        minY: Math.max(0, minY),
        width: Math.min(1024, maxX) - Math.max(0, minX),
        height: Math.min(1024, maxY) - Math.max(0, minY)
    };
};

export const RoomLayout: React.FC<RoomLayoutProps> = ({ initialObjects, updateJson }) => {
    const BASE_ROOM_WIDTH = 1024;
    const BASE_ROOM_HEIGHT = 1024;
    const LABEL_SPACE = 20;

    // Фиксируем начальный viewBox
    const [initialViewBox] = useState(() => {
        if (initialObjects.length === 0) {
            return {
                minX: 0,
                minY: 0,
                width: BASE_ROOM_WIDTH,
                height: BASE_ROOM_HEIGHT
            };
        }

        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;

        initialObjects.forEach(obj => {
            const halfWidth = obj.coordinates.width / 2;
            const halfHeight = obj.coordinates.height / 2;

            minX = Math.min(minX, obj.coordinates.x - halfWidth);
            maxX = Math.max(maxX, obj.coordinates.x + halfWidth);
            minY = Math.min(minY, obj.coordinates.y - halfHeight);
            maxY = Math.max(maxY, obj.coordinates.y + halfHeight);
        });

        return {
            minX: Math.max(0, minX),
            minY: Math.max(0, minY),
            width: Math.min(BASE_ROOM_WIDTH, maxX) - Math.max(0, minX),
            height: Math.min(BASE_ROOM_HEIGHT, maxY) - Math.max(0, minY)
        };
    });

    // Используем фиксированные размеры из начального viewBox
    const SCALED_WIDTH = initialViewBox.width;
    const SCALED_HEIGHT = initialViewBox.height;
    const SVG_WIDTH = SCALED_WIDTH + LABEL_SPACE * 2;
    const SVG_HEIGHT = SCALED_HEIGHT + LABEL_SPACE * 2;

    // Состояния
    const [objects, setObjects] = useState<PlainSVGObjectDataWithRotation[]>(
        initialObjects.map((obj, index) => ({
            ...obj,
            id: `${obj.label}-${index}`,
            rotation: 0
        }))
    );
    const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);

    // Refs
    const nextIdRef = useRef(initialObjects.length);
    const svgRef = useRef<SVGSVGElement>(null);
    const roomSvgRef = useRef<SVGSVGElement>(null);

    // Вычисление размеров на основе объектов
    // const viewBox = calculateViewBox(objects);

    // Границы для объектов
    const bounds = {
        minX: 0,
        maxX: BASE_ROOM_WIDTH,
        minY: 0,
        maxY: BASE_ROOM_HEIGHT
    };
    // Функция для преобразования координат
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

    // Обработчик перемещения объекта
    const moveObject = (id: string, x: number, y: number) => {
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
    };

    // Обработчик обновления объекта
    const updateObject = (id: string, updates: Partial<PlainSVGObjectDataWithRotation>) => {
        setObjects(prevObjects =>
            prevObjects.map(obj =>
                obj.id === id
                    ? { ...obj, ...updates }
                    : obj
            )
        );
    };

    // Обработчик завершения действия
    const handleEndAction = (id: string) => {
        updateSceneJSON(objects, bounds);
    };

    // Обработчик клика по SVG
    const handleSvgClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            setSelectedObjectId(null);
        }
    };

    // Обновление JSON
    const updateSceneJSON = (objList: PlainSVGObjectDataWithRotation[], currentBounds: typeof bounds) => {
        const sceneData = {
            roomDimensions: {
                width: BASE_ROOM_WIDTH,
                height: BASE_ROOM_HEIGHT
            },
            visibleArea: {
                minX: initialViewBox.minX,
                maxX: initialViewBox.minX + initialViewBox.width,
                minY: initialViewBox.minY,
                maxY: initialViewBox.minY + initialViewBox.height,
                width: initialViewBox.width,
                height: initialViewBox.height
            },
            objects: objList.map(obj => ({
                id: obj.id,
                label: obj.label,
                coordinates: {
                    x: Math.round(obj.coordinates.x * 100) / 100,
                    y: Math.round(obj.coordinates.y * 100) / 100,
                    width: Math.round(obj.coordinates.width * 100) / 100,
                    height: Math.round(obj.coordinates.height * 100) / 100
                },
                rotation: Math.round((obj.rotation || 0) * 100) / 100
            })),
            selectedObjectId
        };

        updateJson(JSON.stringify(sceneData, null, 2));
    };

    // Настройка Drop
    const [, drop] = useDrop(() => ({
        accept: "object",
        drop: (item: { label: Furniture }, monitor) => {
            const dropOffset = monitor.getClientOffset();
            if (!dropOffset || !roomSvgRef.current) return;

            const { x, y } = getMouseSVGCoordinates(dropOffset.x, dropOffset.y);
            const newId = `${item.label}-${nextIdRef.current}`;
            nextIdRef.current += 1;

            const newObj: PlainSVGObjectDataWithRotation = {
                label: item.label,
                coordinates: { x, y, width: 100, height: 50 },
                rotation: 0,
                id: newId
            };

            setObjects(prev => [...prev, newObj]);
            setSelectedObjectId(newId);
            updateSceneJSON([...objects, newObj], bounds);
        },
    }), [objects, bounds]);

    // Эффекты
    useEffect(() => {
        if (roomSvgRef.current) {
            drop(roomSvgRef.current);
        }
    }, [drop]);

    useEffect(() => {
        updateSceneJSON(objects, bounds);
    }, [objects]);
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
                            x={initialViewBox.minX}
                            y={initialViewBox.minY}
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
                    viewBox={`${initialViewBox.minX} ${initialViewBox.minY} ${SCALED_WIDTH} ${SCALED_HEIGHT}`}
                    preserveAspectRatio="xMidYMid meet"
                    onClick={handleSvgClick}
                    style={{ clipPath: "url(#room-clip)" }}
                >
                    {/* Фон и рамка комнаты */}
                    <rect
                        x={0}
                        y={0}
                        width={BASE_ROOM_WIDTH}
                        height={BASE_ROOM_HEIGHT}
                        fill="white"
                    />
                    <rect
                        x={0}
                        y={0}
                        width={BASE_ROOM_WIDTH}
                        height={BASE_ROOM_HEIGHT}
                        fill="none"
                        stroke="black"
                        strokeWidth={4}
                    />

                    {/* Объекты */}
                    {objects.map((obj, index) => (
                        <DraggableObject
                            key={obj.id || `${obj.label}-${index}`}
                            obj={obj}
                            index={index}
                            roomHeight={BASE_ROOM_HEIGHT}
                            roomWidth={BASE_ROOM_WIDTH}
                            bounds={bounds}
                            onMove={moveObject}
                            onUpdate={updateObject}
                            onSelect={(id) => setSelectedObjectId(id)}
                            onDeselect={() => setSelectedObjectId(null)}
                            onEndAction={handleEndAction}
                            isSelected={selectedObjectId === obj.id}
                            getMouseSVGCoordinates={getMouseSVGCoordinates}
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
}> = ({
    obj,
    index,
    bounds,
    onMove,
    onUpdate,
    onSelect,
    onDeselect,
    onEndAction,
    isSelected,
    getMouseSVGCoordinates
}) => {
        const objId = obj.id || `${obj.label}-${index}`;
        const rotation = obj.rotation || 0;
        const ref = useRef<SVGGElement>(null);
        // Перемещение объекта
        const handleMouseDown = (e: React.MouseEvent) => {
            if (e.button !== 0) return;
            e.stopPropagation();

            const { x: startX, y: startY } = getMouseSVGCoordinates(e.clientX, e.clientY);
            const offsetX = startX - obj.coordinates.x;
            const offsetY = startY - obj.coordinates.y;

            const handleMouseMove = (moveEvent: MouseEvent) => {
                const { x: currentX, y: currentY } = getMouseSVGCoordinates(moveEvent.clientX, moveEvent.clientY);

                let newX = currentX - offsetX;
                let newY = currentY - offsetY;

                // Ограничение движения
                const halfWidth = obj.coordinates.width / 2;
                const halfHeight = obj.coordinates.height / 2;

                newX = Math.max(bounds.minX + halfWidth, Math.min(bounds.maxX - halfWidth, newX));
                newY = Math.max(bounds.minY + halfHeight, Math.min(bounds.maxY - halfHeight, newY));

                onMove(objId, newX, newY);
            };

            const handleMouseUp = () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
                onEndAction(objId);
            };

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            onSelect(objId);
        };

        const handleResize = (dx: number, dy: number, corner: string) => {
            const minSize = 20; // Минимальный размер объекта

            let newWidth = obj.coordinates.width;
            let newHeight = obj.coordinates.height;
            let newX = obj.coordinates.x;
            let newY = obj.coordinates.y;

            // Рассчитываем новые размеры и позицию в зависимости от угла
            switch (corner) {
                case 'topLeft':
                    newWidth = Math.max(minSize, obj.coordinates.width - dx);
                    newHeight = Math.max(minSize, obj.coordinates.height - dy);
                    newX = obj.coordinates.x - (newWidth - obj.coordinates.width) / 2;
                    newY = obj.coordinates.y - (newHeight - obj.coordinates.height) / 2;
                    break;
                case 'topRight':
                    newWidth = Math.max(minSize, obj.coordinates.width + dx);
                    newHeight = Math.max(minSize, obj.coordinates.height - dy);
                    newX = obj.coordinates.x + (newWidth - obj.coordinates.width) / 2;
                    newY = obj.coordinates.y - (newHeight - obj.coordinates.height) / 2;
                    break;
                case 'bottomLeft':
                    newWidth = Math.max(minSize, obj.coordinates.width - dx);
                    newHeight = Math.max(minSize, obj.coordinates.height + dy);
                    newX = obj.coordinates.x - (newWidth - obj.coordinates.width) / 2;
                    newY = obj.coordinates.y + (newHeight - obj.coordinates.height) / 2;
                    break;
                case 'bottomRight':
                    newWidth = Math.max(minSize, obj.coordinates.width + dx);
                    newHeight = Math.max(minSize, obj.coordinates.height + dy);
                    newX = obj.coordinates.x + (newWidth - obj.coordinates.width) / 2;
                    newY = obj.coordinates.y + (newHeight - obj.coordinates.height) / 2;
                    break;
            }

            // Проверяем границы
            const halfWidth = newWidth / 2;
            const halfHeight = newHeight / 2;

            // Ограничиваем позицию объекта границами комнаты
            newX = Math.max(bounds.minX + halfWidth, Math.min(bounds.maxX - halfWidth, newX));
            newY = Math.max(bounds.minY + halfHeight, Math.min(bounds.maxY - halfHeight, newY));

            onUpdate(objId, {
                coordinates: {
                    width: newWidth,
                    height: newHeight,
                    x: newX,
                    y: newY
                }
            });
        };

        const handleRotate = (e: MouseEvent, startAngle: number, centerX: number, centerY: number) => {
            const { x: currentX, y: currentY } = getMouseSVGCoordinates(e.clientX, e.clientY);
            const currentAngle = Math.atan2(currentY - centerY, currentX - centerX) * (180 / Math.PI);
            let newRotation = rotation + (currentAngle - startAngle);

            // Нормализуем угол в диапазоне [0, 360)
            newRotation = ((newRotation % 360) + 360) % 360;

            onUpdate(objId, { rotation: newRotation });
        };

        const x = obj.coordinates.x - obj.coordinates.width / 2;
        const y = obj.coordinates.y - obj.coordinates.height / 2;
        const centerX = obj.coordinates.x;
        const centerY = obj.coordinates.y;

        return (
            <g
                ref={ref}
                transform={`rotate(${-rotation} ${centerX} ${centerY})`}
                style={{ cursor: 'move' }}
                onMouseDown={handleMouseDown}
                onClick={(e) => {
                    e.stopPropagation();
                    onSelect(objId);
                }}
            >
                <rect
                    x={x}
                    y={y}
                    width={obj.coordinates.width}
                    height={obj.coordinates.height}
                    fill={colors[obj.label]}
                    fillOpacity={0.3}
                    stroke={isSelected ? "#00FF00" : colors[obj.label]}
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
                    {obj.label}
                </text>

                {isSelected && (
                    <>
                        <CloseButton
                            x={x + obj.coordinates.width + 20}
                            y={y - 20}
                            onClick={onDeselect}
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
                                        const handleMouseMove = (moveEvent: MouseEvent) => {
                                            const { x: currentX, y: currentY } = getMouseSVGCoordinates(
                                                moveEvent.clientX,
                                                moveEvent.clientY
                                            );
                                            const dx = currentX - obj.coordinates.x;
                                            const dy = currentY - obj.coordinates.y;
                                            handleResize(dx * 2, dy * 2, corner);
                                        };

                                        const handleMouseUp = () => {
                                            document.removeEventListener('mousemove', handleMouseMove);
                                            document.removeEventListener('mouseup', handleMouseUp);
                                            onEndAction(objId);
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
                                const { x: startX, y: startY } = getMouseSVGCoordinates(e.clientX, e.clientY);
                                const startAngle = Math.atan2(startY - centerY, startX - centerX) * (180 / Math.PI);

                                const handleMouseMove = (moveEvent: MouseEvent) => {
                                    const { x: currentX, y: currentY } = getMouseSVGCoordinates(
                                        moveEvent.clientX,
                                        moveEvent.clientY
                                    );
                                    const currentAngle = Math.atan2(currentY - centerY, currentX - centerX) * (180 / Math.PI);
                                    handleRotate(startAngle, currentAngle);
                                };

                                const handleMouseUp = () => {
                                    document.removeEventListener('mousemove', handleMouseMove);
                                    document.removeEventListener('mouseup', handleMouseUp);
                                    onEndAction(objId);
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

