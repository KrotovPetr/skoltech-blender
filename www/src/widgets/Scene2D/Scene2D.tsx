import { RoomLayout, Sidebar } from '../../features/Scene2D';
import { data } from './utils';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Flex } from '@gravity-ui/uikit';
import block from "bem-cn-lite";
import './Scene2D.scss'
import { useState, useRef, useCallback } from 'react';

const b = block('scene-2d')

export const Scene2D = () => {
    const [sceneJSON, setSceneJSON] = useState<string>("");
    const roomLayoutRef = useRef<any>(null);

    // Обновление JSON при изменениях в сцене
    const updateJson = useCallback((value: string) => {
        setSceneJSON(value);
    }, []);

    // Обработчик загрузки сцены из JSON
    const handleUpdateFromJSON = useCallback((jsonData: any) => {
        if (roomLayoutRef.current && roomLayoutRef.current.loadSceneFromData) {
            console.log(1223, jsonData)
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

    console.log(sceneJSON)

    return (
        <DndProvider backend={HTML5Backend}>
            <Flex className={b()} justifyContent="space-between">
                <RoomLayout
                    ref={roomLayoutRef}
                    initialObjects={data}
                    updateJson={updateJson}
                />
                <Sidebar
                    onLoadScene={handleLoadScene}
                    onGenerateScene={handleGenerateScene}
                    onUpdateFromJSON={handleUpdateFromJSON}
                    sceneJSON={sceneJSON}
                />
            </Flex>
        </DndProvider>
    )
}
