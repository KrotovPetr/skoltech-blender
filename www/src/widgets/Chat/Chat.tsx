import { Flex, Loader, Text } from "@gravity-ui/uikit";
import block from "bem-cn-lite";
import './Chat.scss';
import { ChatInput, MessageList } from "../../features";
import { useCallback, useEffect, useState, useRef } from "react";
import { Message } from "../../shared/types";
import { useNavigate } from "react-router-dom";
import { createRobotMessageWithLink, getMessageList } from "./utils";

const b = block('chat');

const CHAT_STORAGE_KEY = 'chat_messages';
const CHAT_EXPIRY_KEY = 'chat_messages_expiry';
const CHAT_EXPIRY_TIME = 2 * 60 * 60 * 1000;
export const SCENE_GENERATED_EVENT = 'scene-generated';

export const Chat = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [messageCounter, setMessageCounter] = useState(0);
    const navigate = useNavigate();
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const saveMessagesToStorage = useCallback((messages: Message[]) => {
        sessionStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
        sessionStorage.setItem(CHAT_EXPIRY_KEY, (Date.now() + CHAT_EXPIRY_TIME).toString());
    }, []);

    const getMessagesFromStorage = useCallback((): Message[] | null => {
        const storedMessages = sessionStorage.getItem(CHAT_STORAGE_KEY);
        const expiryTime = sessionStorage.getItem(CHAT_EXPIRY_KEY);

        if (!storedMessages || !expiryTime) {
            return null;
        }

        if (Date.now() > parseInt(expiryTime)) {
            sessionStorage.removeItem(CHAT_STORAGE_KEY);
            sessionStorage.removeItem(CHAT_EXPIRY_KEY);
            return null;
        }

        try {
            return JSON.parse(storedMessages);
        } catch {
            return null;
        }
    }, []);

    const handleLinkClick = useCallback((url: string) => {
        navigate(url);
    }, [navigate]);

    useEffect(() => {
        const storedMessages = getMessagesFromStorage();

        if (storedMessages && storedMessages.length > 0) {
            setMessages(storedMessages);
            const userMessagesCount = storedMessages.filter(m => m.direction === 'user').length;
            setMessageCounter(userMessagesCount);
        } else {
            const initialMessages = getMessageList();
            setMessages(initialMessages);
            saveMessagesToStorage(initialMessages);
            const userMessagesCount = initialMessages.filter(m => m.direction === 'user').length;
            setMessageCounter(userMessagesCount);
        }
    }, [getMessagesFromStorage, saveMessagesToStorage]);

    const addNewMessage = useCallback((message: Message) => {
        setMessages((prevMessages) => {
            const updatedMessages = [...prevMessages, message];
            saveMessagesToStorage(updatedMessages);
            return updatedMessages;
        });

        const storedObject = JSON.parse(localStorage.getItem('design') || '{}');
        let updatedObject = { ...storedObject };

        if (message.direction === 'user' && message.text) {
            updatedObject.description = message.text;
            localStorage.setItem('design', JSON.stringify(updatedObject));

            setIsLoading(true);

            const newMessageCount = messageCounter + 1;
            setMessageCounter(newMessageCount);

            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            const modelId = newMessageCount === 1 ? 1 : 2;

            timeoutRef.current = setTimeout(() => {
                const robotMessage = createRobotMessageWithLink(modelId);

                setMessages((prevMessages) => {
                    const updatedMessages = [...prevMessages, robotMessage];
                    saveMessagesToStorage(updatedMessages);
                    return updatedMessages;
                });
                setIsLoading(false);

                window.dispatchEvent(new Event(SCENE_GENERATED_EVENT));

                setTimeout(() => {
                    navigate(`/2d?modelId=${modelId}`);
                }, 500);  
            }, 7000);
        }
    }, [navigate, saveMessagesToStorage, messageCounter]);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return (
        <Flex className={b()} direction="column">
            <MessageList messages={messages} onLinkClick={handleLinkClick} />
            {isLoading && (
                <Flex gap={2} alignItems="center" className={b('loader')}>
                    <Text variant="caption-2">Генерируем</Text>
                    <Loader size="s" />
                </Flex>
            )}
            <ChatInput addNewMessage={addNewMessage} />
        </Flex>
    );
}
