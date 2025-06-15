
import React from 'react';
import './Appnew.scss';
import { Flex } from '@gravity-ui/uikit';
import block from "bem-cn-lite";

const b = block('app');

const App: React.FC = () => {
    return (

        <Flex className={b()} gap={2}>

        </Flex>


    );
};

export default App;