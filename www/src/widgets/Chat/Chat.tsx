import { Flex } from "@gravity-ui/uikit"
import block from "bem-cn-lite";
import './Chat.scss';
import { ChatInput, MessageList } from "../../features";
import { useCallback, useState } from "react";
import { Message } from "../../shared/types";

const b = block('chat');

export const Chat = () => {
    const [messages, setMessages] = useState<Message[]>([{ direction: "robot", text: "Привет, давай познакомимся, введи, пожалуйста, свой логин, чтобы я мог тебя запомнить" }]);

    const addNewMessage = useCallback((message: Message) => {
        const newValue = [...messages, message];
        setMessages(newValue)
    }, [messages]);

    return (
        <Flex className={b()} direction="column" gap={2}>
            <MessageList messages={messages} />
            <ChatInput addNewMessage={addNewMessage} />
        </Flex>
    )
}