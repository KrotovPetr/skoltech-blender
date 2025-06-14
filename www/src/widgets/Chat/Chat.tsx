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
const CHAT_EXPIRY_TIME = 2 * 60 * 60 * 1000; // 2 часа в миллисекундах
export const SCENE_GENERATED_EVENT = 'scene-generated';

export const Chat = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [messageCounter, setMessageCounter] = useState(0);
    const navigate = useNavigate();
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Функция для сохранения сообщений в sessionStorage
    const saveMessagesToStorage = useCallback((messages: Message[]) => {
        sessionStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
        sessionStorage.setItem(CHAT_EXPIRY_KEY, (Date.now() + CHAT_EXPIRY_TIME).toString());
    }, []);

    // Функция для получения сообщений из sessionStorage
    const getMessagesFromStorage = useCallback((): Message[] | null => {
        const storedMessages = sessionStorage.getItem(CHAT_STORAGE_KEY);
        const expiryTime = sessionStorage.getItem(CHAT_EXPIRY_KEY);

        if (!storedMessages || !expiryTime) {
            return null;
        }

        // Проверяем, не истек ли срок хранения
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

    // Функция обработки клика по ссылке
    const handleLinkClick = useCallback((url: string) => {
        navigate(url);
    }, [navigate]);

    // Инициализация сообщений при загрузке компонента
    useEffect(() => {
        const storedMessages = getMessagesFromStorage();

        if (storedMessages && storedMessages.length > 0) {
            setMessages(storedMessages);
            // Подсчитываем количество сообщений пользователя для определения modelId
            const userMessagesCount = storedMessages.filter(m => m.direction === 'user').length;
            setMessageCounter(userMessagesCount);
        } else {
            const initialMessages = getMessageList();
            setMessages(initialMessages);
            saveMessagesToStorage(initialMessages);
            // Подсчитываем начальные сообщения пользователя
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

            // Увеличиваем счетчик сообщений пользователя
            const newMessageCount = messageCounter + 1;
            setMessageCounter(newMessageCount);

            // Очищаем предыдущий таймаут, если он есть
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            // Определяем modelId: если это первое сообщение - модель 1, иначе модель 2
            const modelId = newMessageCount === 1 ? 1 : 2;

            timeoutRef.current = setTimeout(() => {
                const robotMessage = createRobotMessageWithLink(modelId);

                setMessages((prevMessages) => {
                    const updatedMessages = [...prevMessages, robotMessage];
                    saveMessagesToStorage(updatedMessages);
                    return updatedMessages;
                });
                setIsLoading(false);

                // Отправляем событие о генерации сцены
                window.dispatchEvent(new Event(SCENE_GENERATED_EVENT));

                // Автоматический редирект на 2D сцену после генерации
                setTimeout(() => {
                    navigate(`/2d?modelId=${modelId}`);
                }, 500); // Небольшая задержка, чтобы пользователь успел увидеть сообщение
            }, 10000);
        }
    }, [navigate, saveMessagesToStorage, messageCounter]);

    // Очистка таймаута при размонтировании компонента
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
