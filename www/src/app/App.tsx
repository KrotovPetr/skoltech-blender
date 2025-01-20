import React, { Fragment, useState } from 'react';
import { Demo } from '../pages';
import { Flex } from '@gravity-ui/uikit';
import { Header } from '../widgets';
import './styles/App.scss';
import { AsideHeader, Footer } from '@gravity-ui/navigation';
import block from 'bem-cn-lite';

const b = block('app');

const App: React.FC = () => {
  const [isAsideCompact, setAsideCompact] = useState(false);
  return (
    <Flex >
      <Flex direction="column" className={b()}>
        {/* <AsideHeader compact={isAsideCompact} className={b('aside-header')} /> */}
        <Header />
        <Demo />
        <Footer copyright={'3DModeling Corp'} />
      </Flex>
    </Flex>
  );
};

export default App;