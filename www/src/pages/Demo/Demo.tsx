import { Flex } from "@gravity-ui/uikit"
import { useEffect, useState } from "react"
import Scene from "../../widgets/Scene/Scene";
import block from 'bem-cn-lite';
import './Demo.scss';
import { AsideMenu } from "../../entities/AsideMenu/Aside";
import { MonacoEditor } from "../../widgets/MonacoEditor";
import { ButtonLayer } from "../../widgets/ButtonLayer";

const b = block('demo-page');

export const Demo = () => {

    const [isChatOpen, setChatOpen] = useState(false);
    const [isMonacoOpen, setMonacoOpen] = useState(false);

    useEffect(() => {
        const handleMouseEvent = (event: any) => {
            if (isChatOpen) {
                event.preventDefault();
                return;
            }
        };

        window.addEventListener('click', handleMouseEvent);

        return () => {
            window.removeEventListener('click', handleMouseEvent);
        };
    }, [isChatOpen]);

    const [xRoom, setXRoomValue] = useState(0);
    const [yRoom, setYRoomValue] = useState(0);
    const [zRoom, setZRoomValue] = useState(0);


    const changeXValue = (text: string) => {
        setXRoomValue(Number(text))
    }

    const changeYValue = (text: string) => {
        setYRoomValue(Number(text))
    }

    const changeZValue = (text: string) => {
        setZRoomValue(Number(text))
    }
    return (
        <Flex className={b()}>
            <AsideMenu
                isOpen={isMonacoOpen}
                content={<MonacoEditor />}
                onClose={() => { setMonacoOpen(false) }}
            >
                <ButtonLayer
                    isChatOpen={isChatOpen}
                    isMonacoOpen={isMonacoOpen} 
                    onChatStateChange={() => { setChatOpen((o) => !o) }}
                    onMonacoStateChange={() => { setMonacoOpen((o) => !o) }}
                    changeXValue={changeXValue}
                    changeYValue={changeYValue}
                    changeZValue={changeZValue}
                    >
                    <Scene roomSize={[xRoom, yRoom, zRoom]}/>
                </ButtonLayer>
            </AsideMenu>

        </Flex>
    )
}