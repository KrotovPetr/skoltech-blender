import { Flex, Loader, Text } from "@gravity-ui/uikit";
import block from "bem-cn-lite";
import './Chat.scss';
import { ChatInput, MessageList } from "../../features";
import { useCallback, useEffect, useState } from "react";
import { Message } from "../../shared/types";
import { getMessageList } from "./utils";
import { useNavigate } from "react-router-dom";

const b = block('chat');

export const Chat = () => {
    const [messages, setMessages] = useState<Message[]>(() => getMessageList());
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const addNewMessage = useCallback((message: Message) => {
        setMessages((prevMessages) => [...prevMessages, message]);

        const storedObject = JSON.parse(localStorage.getItem('design') || '{}');
        let updatedObject = { ...storedObject };

        if (message.direction === 'user' && message.text) {
            let newRobotMessage = null;

            updatedObject.description = message.text;
            setIsLoading(true);

            setTimeout(() => {
                navigate('/model/2d');
            }, 10000);

            localStorage.setItem('design', JSON.stringify(updatedObject));

            if (newRobotMessage) {
                setTimeout(() => {
                    setMessages((prevMessages) => [...prevMessages, newRobotMessage]);
                }, 1000);
            }
        }
    }, []);

    useEffect(() => {
        const storedObject = JSON.parse(localStorage.getItem('design') || '{}');
        let updatedObject = { ...storedObject };

        if (updatedObject.description) {
            navigate('/model/2d');
        }

    }, [])

    return (
        <Flex className={b()} direction="column" gap={4}>
            <MessageList messages={messages} />
            {isLoading && (
                <Flex gap={3} alignItems="center">
                    <Text variant="subheader-2">Генерируем</Text>
                    <Loader size="l" />
                </Flex>
            )}
            <ChatInput addNewMessage={addNewMessage} />
        </Flex>
    );
}
