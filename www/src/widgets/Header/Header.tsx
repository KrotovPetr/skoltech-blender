import './Header.scss';
import block from 'bem-cn-lite';
import {Text} from '@gravity-ui/uikit';

const b = block('header');

export const Header = () => {
    return (
        <header className={b()}>
            <Text color='light-primary' variant='header-1'>3DModeling Corp</Text>
        </header>
    )
}