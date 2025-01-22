import { Flex } from "@gravity-ui/uikit"
import block from "bem-cn-lite";
import './ButtonLayer.scss';
import { ChatButton } from "../../entities/Button";
import { MonacoButton } from "../../entities/Button/MonacoButton";
import { ChatWidget } from "../ChatWidget";
import { ReactElement } from "react";
import { RoomSizeButton } from "../../entities/Button/RoomSizeButton/RoomSizeButton";

const b = block('button-layer');

interface ButtonLayerProps {
    isChatOpen: boolean;
    isMonacoOpen: boolean;
    onChatStateChange: () => void;
    onMonacoStateChange: () => void;
    children: ReactElement;
    changeXValue: (text: string) => void
    changeYValue: (text: string) => void
    changeZValue: (text: string) => void
}

export const ButtonLayer = ({ isChatOpen, isMonacoOpen, onChatStateChange, onMonacoStateChange, children, changeXValue, changeYValue, changeZValue }: ButtonLayerProps) => {

    return (
        <Flex className={b()}>
            {!isChatOpen && <ChatButton onClick={(e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => { e.stopPropagation(); onChatStateChange(); }} />}
            {!isMonacoOpen && <MonacoButton onClick={(e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => { e.stopPropagation(); onMonacoStateChange() }} />}
            {isChatOpen && <ChatWidget onCloseChat={onChatStateChange} />}
            <RoomSizeButton changeXValue={changeXValue} changeYValue={changeYValue} changeZValue={changeZValue}/>
            {children}
        </Flex>
    )
}