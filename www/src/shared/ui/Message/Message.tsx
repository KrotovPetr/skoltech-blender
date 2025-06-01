import { Text } from "@gravity-ui/uikit"
import block from "bem-cn-lite";
import { MessageDirection } from "../../types";
import './Message.scss';

interface CommentProps {
    direction: MessageDirection;
    text: string;
    onLinkClick?: (url: string) => void;
}


const b = block('comment');

export const Message = ({ direction, text, onLinkClick }: CommentProps) => {

    const handleLinkClick = (e: React.MouseEvent, url: string) => {
        e.preventDefault();
        if (onLinkClick) {
            onLinkClick(url);
        }
    };

    const renderMessageText = () => {
        const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
        const parts = text.split(linkRegex);

        if (parts.length === 1) {
            return text;
        }

        const result = [];
        for (let i = 0; i < parts.length; i += 3) {
            if (parts[i]) result.push(parts[i]);
            if (parts[i + 1] && parts[i + 2]) {
                result.push(
                    <a
                        key={i}
                        href={parts[i + 2]}
                        onClick={(e) => handleLinkClick(e, parts[i + 2])}
                        style={{ color: 'white', textDecoration: 'underline', cursor: 'pointer' }}
                    >
                        {parts[i + 1]}
                    </a>
                );
            }
        }

        return result;
    };

    return (
        <div className={b({ direction })}>
            {direction === 'robot' && (
                <div className={b('tail')} />
            )}
            <Text variant="body-2">{renderMessageText()}</Text>
            {direction === 'user' && (
                <div className={b('tail')} />
            )}
        </div>
    )
}
