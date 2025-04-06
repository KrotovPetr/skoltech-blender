import { LogoTelegram } from "@gravity-ui/icons";
import { Button, Flex, Icon, TextArea } from "@gravity-ui/uikit";
import block from "bem-cn-lite";
import { Message } from "../../shared/types";
import { useState } from "react";

const b = block('chat-input');

interface ChatInputProps {
    addNewMessage: (message: Message) => void;
}

export const ChatInput = ({ addNewMessage }: ChatInputProps) => {
    const [value, setValue] = useState<string>('');

    const sendMessage = () => {
        if (value.trim()) {
            addNewMessage({ direction: 'user', text: value.trim() });
            setValue('');
        }
    };

    // Обработчик нажатия клавиши
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); // исключить разрыв строки в TextArea
            sendMessage();
        }
    };

    return (
        <Flex gap={2} className={b()}>
            <TextArea
                minRows={3}
                maxRows={5}
                placeholder="Напишите роботу-помощнику"
                size="l"
                value={value}
                onChange={(e) => { setValue(e.target.value); }}
                onKeyDown={handleKeyDown} // добавляем обработчик нажатия клавиши
            />
            <Button size="l" className={b('button')} pin="circle-circle" onClick={sendMessage}>
                <Icon data={LogoTelegram} size={16} />
            </Button>
        </Flex>
    );
}
