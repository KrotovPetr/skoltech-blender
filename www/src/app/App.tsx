import React from 'react';
import { Demo } from '../pages';
import { Flex } from '@gravity-ui/uikit';
import { Header } from '../widgets';
import './styles/App.scss';
import block from 'bem-cn-lite';

const b = block('app');

const App: React.FC = () => {
  return (
    <Flex >
      <Flex direction="column" className={b()}>
        <Header />
        <Demo />
      </Flex>
    </Flex>
  );
};

export default App;