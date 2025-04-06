import { Flex } from "@gravity-ui/uikit";
import block from "bem-cn-lite";
import './Chat.scss';
import { ChatInput, MessageList } from "../../features";
import { useCallback, useState } from "react";
import { Message } from "../../shared/types";
import { DESCRIPTION_ROBOT_MESSAGE, getMessageList, HEIGHT_ROBOT_MESSAGE, LENGTH_ROBOT_MESSAGE, WIDTH_ROBOT_MESSAGE } from "./utils";
import { useNavigate } from "react-router-dom";

const b = block('chat');

export const Chat = () => {
    const [messages, setMessages] = useState<Message[]>(() => getMessageList());
    const navigate = useNavigate();

    const addNewMessage = useCallback((message: Message) => {
        setMessages((prevMessages) => [...prevMessages, message]);

        const storedObject = JSON.parse(localStorage.getItem('design') || '{}');
        let updatedObject = { ...storedObject };

        if (message.direction === 'user' && message.text) {
            let newRobotMessage = null;

            if (!updatedObject.username) {
                updatedObject.username = message.text;
                newRobotMessage = WIDTH_ROBOT_MESSAGE;
            } else if (!updatedObject.width) {
                updatedObject.width = message.text;
                newRobotMessage = LENGTH_ROBOT_MESSAGE;
            } else if (!updatedObject.length) {
                updatedObject.length = message.text;
                newRobotMessage = HEIGHT_ROBOT_MESSAGE;
            } else if (!updatedObject.height) {
                updatedObject.height = message.text;
                newRobotMessage = DESCRIPTION_ROBOT_MESSAGE;
            } else if (!updatedObject.description) {
                updatedObject.description = message.text;
                
                setTimeout(() => {
                    navigate('/model');
                }, 1000);
            }

            localStorage.setItem('design', JSON.stringify(updatedObject));

            if (newRobotMessage) {
                setTimeout(() => {
                    setMessages((prevMessages) => [...prevMessages, newRobotMessage]);
                }, 1000);
            }
        }
    }, []);

    return (
        <Flex className={b()} direction="column" gap={2}>
            <MessageList messages={messages} />
            <ChatInput addNewMessage={addNewMessage} />
        </Flex>
    );
}
