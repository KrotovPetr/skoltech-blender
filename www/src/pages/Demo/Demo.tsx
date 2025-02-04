import { Flex } from "@gravity-ui/uikit"
import Scene from "../../widgets/Scene/Scene";
import block from 'bem-cn-lite';
import './Demo.scss';

const b = block('demo-page');

export const Demo = () => {

    return (
        <Flex className={b()}>
            <Scene />
        </Flex>
    )
}