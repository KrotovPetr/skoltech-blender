import { RoomLayout, Sidebar } from '../../features/Scene2D';
import { data, data2 } from './utils';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Flex, Button } from '@gravity-ui/uikit';
import block from "bem-cn-lite";
import './Scene2D.scss'
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

const b = block('scene-2d')

export const Scene2D = () => {
    const [searchParams] = useSearchParams();
    const [sceneJSON, setSceneJSON] = useState<string>("");
    const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
    const [scale, setScale] = useState<number>(1);
    const roomLayoutRef = useRef<any>(null);
    const layoutContainerRef = useRef<HTMLDivElement>(null);

    // Получаем modelId из query параметров
    const modelId = useMemo(() => {
        const id = searchParams.get('modelId');
        return id ? parseInt(id) : 1;
    }, [searchParams]);

    // Выбираем данные на основе modelId
    const initialData = useMemo(() => {
        return modelId === 1 ? data : data2;
    }, [modelId]);

    // Обновление JSON при изменениях в сцене
    const updateJson = useCallback((value: string) => {
        setSceneJSON(value);
    }, []);

    // Обработчик загрузки сцены из JSON
    const handleUpdateFromJSON = useCallback((jsonData: any) => {
        if (roomLayoutRef.current && roomLayoutRef.current.loadSceneFromData) {
            roomLayoutRef.current.loadSceneFromData(jsonData);
        }
    }, []);

    // Обработчик загрузки готовой сцены
    const handleLoadScene = useCallback((sceneData: any) => {
        if (roomLayoutRef.current && roomLayoutRef.current.loadSceneFromData) {
            roomLayoutRef.current.loadSceneFromData(sceneData);
        }
    }, []);

    // Обработчик генерации сцены
    const handleGenerateScene = useCallback((prompt: string) => {
        // Здесь будет логика генерации сцены по промпту
        console.log("Генерация сцены по промпту:", prompt);
    }, []);

    // Переключатель состояния сайдбара
    const toggleSidebar = useCallback(() => {
        setIsSidebarOpen(prev => !prev);
    }, []);

    // Функция изменения масштаба
    const handleZoomIn = useCallback(() => {
        setScale(prev => Math.min(prev + 0.1, 2));
    }, []);

    const handleZoomOut = useCallback(() => {
        setScale(prev => Math.max(prev - 0.1, 0.5));
    }, []);

    const handleResetZoom = useCallback(() => {
        setScale(1);
    }, []);

    // Автоматическое масштабирование при изменении размера окна
    useEffect(() => {
        const calculateScale = () => {
            if (!layoutContainerRef.current) return;

            const containerWidth = layoutContainerRef.current.clientWidth;
            const containerHeight = layoutContainerRef.current.clientHeight;

            // Предполагаемые размеры сцены (8.3м × 10.96м в пикселях + отступы)
            const roomWidthPx = modelId === 1 ? 8.3 : 9.13 * 100 + 40; // Ширина комнаты в пикселях + отступы
            const roomHeightPx = modelId === 1 ? 10.96 : 9.86 * 100 + 40; // Высота комнаты в пикселях + отступы


            // Определение оптимального масштаба
            const widthScale = containerWidth / roomWidthPx;
            const heightScale = containerHeight / roomHeightPx;

            // Берем минимальный из двух масштабов, чтобы вся сцена поместилась
            const optimalScale = Math.min(widthScale, heightScale, 1); // Но не больше 1, чтобы не растягивать

            // Плавное изменение масштаба
            setScale(optimalScale);
        };

        // Добавляем задержку, чтобы дать время контейнеру изменить свои размеры после изменения состояния сайдбара
        const timeoutId = setTimeout(calculateScale, 300);

        // Также пересчитываем масштаб при изменении размера окна
        window.addEventListener('resize', calculateScale);

        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener('resize', calculateScale);
        };
    }, [isSidebarOpen]); // Пересчитываем при переключении сайдбара

    // Перезагружаем данные при изменении modelId
    useEffect(() => {
        if (roomLayoutRef.current && roomLayoutRef.current.loadSceneFromData) {
            roomLayoutRef.current.loadSceneFromData(initialData);
        }
    }, [modelId, initialData]);

    return (
        <DndProvider backend={HTML5Backend}>
            <Flex className={b()} justifyContent="space-between">
                <div ref={layoutContainerRef} className={b('layout-container')}>
                    <div className={b('room-wrapper')} style={{ transform: `scale(${scale})` }}>
                        <RoomLayout
                            ref={roomLayoutRef}
                            initialObjects={initialData}
                            updateJson={updateJson}
                            modelId={modelId}
                        />
                    </div>

                    <div className={b('zoom-controls')}>
                        <Button view="flat" onClick={handleZoomOut}>-</Button>
                        <Button view="flat" onClick={handleResetZoom}>{Math.round(scale * 100)}%</Button>
                        <Button view="flat" onClick={handleZoomIn}>+</Button>
                    </div>

                    <Button
                        className={b('toggle-sidebar')}
                        onClick={toggleSidebar}
                        view="action"
                    >
                        {isSidebarOpen ? '»' : '«'}
                    </Button>
                </div>

                <Sidebar
                    isOpen={isSidebarOpen}
                    onToggle={toggleSidebar}
                    onLoadScene={handleLoadScene}
                    onGenerateScene={handleGenerateScene}
                    onUpdateFromJSON={handleUpdateFromJSON}
                    sceneJSON={sceneJSON}
                />
            </Flex>
        </DndProvider>
    )
}
