import { Flex } from "@gravity-ui/uikit"
import { useEffect, useState } from "react"
import { ChatWidget } from "../../widgets"
import Scene from "../../widgets/Scene/Scene";
import block from 'bem-cn-lite';
import './Demo.scss';
import { ChatButton } from "../../entities/Button";
import { AsideMenu } from "../../entities/AsideMenu/Aside";
import { MonacoEditor } from "../../widgets/MonacoEditor";
import { MonacoButton } from "../../entities/Button/MonacoButton";

const b = block('demo-page');

export const Demo = () => {

    const [isChatOpen, setChatOpen] = useState(false);
    const [isMonacoOpen, setMonacoOpen] = useState(false);

    useEffect(() => {
        const handleMouseEvent = (event: any) => {
            if (isChatOpen) {
                event.preventDefault();
                return; // Игнорируем событие
            }
            // Ваша логика для обработки события
        };

        // Добавляем слушатель событий
        window.addEventListener('click', handleMouseEvent);

        // Удаляем слушатель при размонтировании компонента
        return () => {
            window.removeEventListener('click', handleMouseEvent);
        };
    }, [isChatOpen]);


    return (
        <Flex className={b()}>
            <AsideMenu
                isOpen={isMonacoOpen}
                content={<MonacoEditor />}
                onClose={() => { setMonacoOpen(false) }}
            >
                <Flex className={b('scene-container')}>
                    <Scene />
                    {!isChatOpen && <ChatButton onClick={(e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => { e.stopPropagation(); setChatOpen((o) => !o) }} />}
                    {!isMonacoOpen && <MonacoButton onClick={(e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => { e.stopPropagation(); setMonacoOpen((o) => !o) }} />}
                    {isChatOpen && <ChatWidget onCloseChat={() => { setChatOpen(false) }} />}
                </Flex>
            </AsideMenu>

        </Flex>
    )
}