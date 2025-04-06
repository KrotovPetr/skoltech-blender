import { type Message } from "../../shared/types";
import block from "bem-cn-lite";
import './MessageList.scss';
import { MessageWithAvatar } from "../../entities/MessageWithAvatar";
import { Flex } from "@gravity-ui/uikit";

const b = block('message-list');

interface MessageListProps {
    messages: Message[]
}

export const MessageList = ({ messages }: MessageListProps) => {
    return (
        <div className={b()}>
            <Flex direction="column" gap={1}>
                {messages.map(({ direction, text }: Message, index: number) => <MessageWithAvatar direction={direction} text={text} key={index} />)}
            </Flex>
        </div>
    )
}