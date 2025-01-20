import { Avatar, Button, Flex, Text, TextArea } from "@gravity-ui/uikit"
import block from 'bem-cn-lite';
import './ChatWidget.scss';

const b = block('chat-widget');

export const ChatWidget = () => {
    return (
        <Flex className={b()} direction="column">
            <Flex className={b('chat-widget-header')} alignItems="center" gap={3}>
                <Avatar text="Artifical intelligent" size="m"/>
                <Text variant="header-1" color="secondary">Chat with AI</Text>
                <div className={b('ai-status')}></div>
            </Flex>
            <Flex className={b('message-list')}>234</Flex>
            <Flex className={b('message-footer')}>
                <TextArea maxRows={10} className={b('text-area')}/>
                <Button pin="round-round" size="m" view="flat-success"> 1</Button>
            </Flex>
        </Flex>
    )
}