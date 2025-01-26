import { Flex } from "@gravity-ui/uikit"
import { useEffect, useState } from "react"
import Scene from "../../widgets/Scene/Scene";
import block from 'bem-cn-lite';
import './Demo.scss';
import { AsideMenu } from "../../entities/AsideMenu/Aside";
import { MonacoEditor } from "../../widgets/MonacoEditor";
import { ButtonLayer } from "../../widgets/ButtonLayer";
import GLBViewer from "../../entities/GLBPreview/GLBPreview";

const b = block('demo-page');

export const Demo = () => {

    const [isChatOpen, setChatOpen] = useState(false);
    const [isMonacoOpen, setMonacoOpen] = useState(false);
    const messages = [
        {
            id: "1",
            text: "Для рендера своей модели, напишите текстовый промт. Сборка модели может занять небольшое время",
            isUser: false
        }
    ];
    const [messagesList, setMessagesList] = useState(messages);

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
                    messagesList={messagesList}
                    addMessage={(message) => { setMessagesList(o => [...o, message]) }}
                >
                    <Scene />
                </ButtonLayer>
            </AsideMenu>

        </Flex>
    )
}