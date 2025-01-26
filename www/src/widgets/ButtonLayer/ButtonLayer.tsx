import { Flex } from "@gravity-ui/uikit"
import block from "bem-cn-lite";
import './ButtonLayer.scss';
import { ChatButton } from "../../entities/Button";
import { MonacoButton } from "../../entities/Button/MonacoButton";
import { ChatWidget } from "../ChatWidget";
import { ReactElement } from "react";

const b = block('button-layer');

interface ButtonLayerProps {
    isChatOpen: boolean;
    isMonacoOpen: boolean;
    onChatStateChange: () => void;
    onMonacoStateChange: () => void;
    messagesList: {id: string, text: string, isUser: boolean}[];
    addMessage: (arg1: {id: string, text: string, isUser: boolean}) => void;
    children: ReactElement;
}

export const ButtonLayer = ({ isChatOpen, isMonacoOpen, onChatStateChange, onMonacoStateChange, addMessage, messagesList, children }: ButtonLayerProps) => {

    return (
        <Flex className={b()}>
            {!isChatOpen && <ChatButton onClick={(e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => { e.stopPropagation(); onChatStateChange(); }} />}
            {!isMonacoOpen && <MonacoButton onClick={(e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => { e.stopPropagation(); onMonacoStateChange() }} />}
            {isChatOpen && <ChatWidget onCloseChat={onChatStateChange} addMessage={addMessage} messagesList={messagesList}/>}
            {children}
        </Flex>
    )
}