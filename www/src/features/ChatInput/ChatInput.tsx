import { LogoTelegram } from "@gravity-ui/icons"
import { Button, Flex, Icon, TextArea } from "@gravity-ui/uikit"
import block from "bem-cn-lite";
import { Message } from "../../shared/types";
import { useState } from "react";

const b = block('chat-input');

interface ChatInputProps {
    addNewMessage: (message: Message) => void;
}

export const ChatInput = ({ addNewMessage }: ChatInputProps) => {
    const [value, setValue] = useState<string>('');

    const onClick = () => {
        addNewMessage({direction: 'user', text: value})
        setValue("");
    }

    return (
        <Flex gap={2} className={b()}>
            <TextArea minRows={3} maxRows={5} placeholder="Напишите роботу-помощнику" size="l" onChange={(e) => {e.stopPropagation(); setValue(e.target.value)}}/>
            <Button size="l" className={b('button')} pin="circle-circle" onClick={onClick}><Icon data={LogoTelegram} size={16} /></Button>
        </Flex>
    )
}