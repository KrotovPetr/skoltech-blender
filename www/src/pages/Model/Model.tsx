import { Flex } from "@gravity-ui/uikit"
import './Model.scss';
import block from 'bem-cn-lite';
import { Hint } from "../../entities";

const b = block('model')

export const Model = ({ }) => {
    return (
        <Flex className={b()}>
            <Hint />

        </Flex>
    )
}