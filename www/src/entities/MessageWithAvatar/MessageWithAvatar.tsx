import { Avatar, Flex, Text } from "@gravity-ui/uikit";
import { MessageDirection } from "../../shared/types"
import { Message } from "../../shared";
import { FaceRobot } from '@gravity-ui/icons';
import block from 'bem-cn-lite';
import './MessageWithAvatar.scss';

const b = block('message-with-avatar')

interface MessageWithAvatarProps {
    direction: MessageDirection;
    text: string;
    onLinkClick?: (url: string) => void;

}
export const MessageWithAvatar = ({ direction, text, onLinkClick }: MessageWithAvatarProps) => {
    return (
        <Flex direction="column" gap={1} className={b()}>
            <Flex direction="row" gap={2} alignItems="center" className={b('message-header')}>
                <Avatar icon={FaceRobot} size="s" className={b('avatar', { robot: direction })} />
                <Text color="secondary">{direction === 'robot' ? 'Робот-помощник' : 'Вы'}</Text>
            </Flex>
            <Message direction={direction} text={text} onLinkClick={onLinkClick}/>
        </Flex>
    )
}