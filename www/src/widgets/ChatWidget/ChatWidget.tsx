import { Avatar, Button, Card, Flex, Icon, Text, TextArea } from "@gravity-ui/uikit"
import block from 'bem-cn-lite';
import './ChatWidget.scss';
import { Xmark } from "@gravity-ui/icons";

const b = block('chat-widget');

interface ChatWidgetProps {
    onCloseChat: () => void
}

export const ChatWidget = ({ onCloseChat }: ChatWidgetProps) => {
    return (
        <Card className={b()}>
            <Flex className={b('chat-comtainer')} direction="column">
                <Flex className={b('chat-widget-header')} alignItems="center" gap={3}>
                    <Avatar text="Artifical intelligent" size="m" />
                    <Text variant="header-1" color="secondary">Chat with AI</Text>
                    <div className={b('ai-status')}></div>
                    <Flex onClick={() => { onCloseChat() }} className={b('close')}><Icon data={Xmark} size={16} /></Flex>
                </Flex>
                <Flex className={b('message-list')}>234</Flex>
                <Flex className={b('message-footer')}>
                    <TextArea maxRows={10} className={b('text-area')} />
                    <Button pin="round-round" size="m" view="flat-success"> 1</Button>
                </Flex>
            </Flex>
        </Card>

    )
}