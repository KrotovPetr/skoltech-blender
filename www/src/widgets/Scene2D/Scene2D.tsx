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

    const modelId = useMemo(() => {
        const id = searchParams.get('modelId');
        return id ? parseInt(id) : 1;
    }, [searchParams]);

    const initialData = useMemo(() => {
        return modelId === 1 ? data : data2;
    }, [modelId]);

    const updateJson = useCallback((value: string) => {
        setSceneJSON(value);
    }, []);

    const handleUpdateFromJSON = useCallback((jsonData: any) => {
        if (roomLayoutRef.current && roomLayoutRef.current.loadSceneFromData) {
            roomLayoutRef.current.loadSceneFromData(jsonData);
        }
    }, []);

    const handleLoadScene = useCallback((sceneData: any) => {
        if (roomLayoutRef.current && roomLayoutRef.current.loadSceneFromData) {
            roomLayoutRef.current.loadSceneFromData(sceneData);
        }
    }, []);

    const handleGenerateScene = useCallback((prompt: string) => {
        console.log("Генерация сцены по промпту:", prompt);
    }, []);

    const toggleSidebar = useCallback(() => {
        setIsSidebarOpen(prev => !prev);
    }, []);

    const handleZoomIn = useCallback(() => {
        setScale(prev => Math.min(prev + 0.1, 2));
    }, []);

    const handleZoomOut = useCallback(() => {
        setScale(prev => Math.max(prev - 0.1, 0.5));
    }, []);

    const handleResetZoom = useCallback(() => {
        setScale(1);
    }, []);

    useEffect(() => {
        const calculateScale = () => {
            if (!layoutContainerRef.current) return;

            const containerWidth = layoutContainerRef.current.clientWidth;
            const containerHeight = layoutContainerRef.current.clientHeight;

            const roomWidthPx = modelId === 1 ? 8.3 : 9.13 * 100 + 40; 
            const roomHeightPx = modelId === 1 ? 10.96 : 9.86 * 100 + 40; 


            const widthScale = containerWidth / roomWidthPx;
            const heightScale = containerHeight / roomHeightPx;

            const optimalScale = Math.min(widthScale, heightScale, 1); 

            setScale(optimalScale);
        };

        const timeoutId = setTimeout(calculateScale, 300);

        window.addEventListener('resize', calculateScale);

        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener('resize', calculateScale);
        };
    }, [isSidebarOpen]); 

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
