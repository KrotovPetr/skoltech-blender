import { RoomLayout, Sidebar } from '../../features/Scene2D';
import { data } from './utils';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Flex } from '@gravity-ui/uikit';
import block from "bem-cn-lite";
import './Scene2D.scss'
import { useState } from 'react';


const b = block('scene-2d')

export const Scene2D = () => {
    const [sceneJSON, setSceneJSON] = useState<string>("");

    const updateJson = (value: string) => {
        setSceneJSON(value)
    }

    return (
        <DndProvider backend={HTML5Backend}>
            <Flex className={b()} justifyContent="space-between">
                <RoomLayout initialObjects={data.annotations} updateJson={updateJson} />
                <Sidebar
                    onLoadScene={function (sceneData: any): void {
                        throw new Error('Function not implemented.');
                    }} onGenerateScene={function (prompt: string): void {
                        throw new Error('Function not implemented.');
                    }} onUpdateFromJSON={function (jsonData: any): void {
                        throw new Error('Function not implemented.');
                    }} sceneJSON={sceneJSON} />
            </Flex>
        </DndProvider>
    )
}