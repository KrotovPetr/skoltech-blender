// import React, { useState } from 'react';
// import './styles/App.scss';
// import { SceneWidget } from '../widgets';
// import SceneOld from '../entities/Scene/SceneOld/SceneOld';
// import { Flex } from '@gravity-ui/uikit';
// import SceneOldPlain from '../entities/Scene/SceneOld/SceneOldPlain';

// const App: React.FC = () => {
//   const [is3D, set3D] = useState<boolean>(false);

//   return (
//     <Flex style={{ width: '100vw', height: '100vh' }}>
//       <SceneWidget is3D={is3D} changeDMode={() => { set3D(o => !o) }}>
//         {is3D ? <SceneOld key="3d" /> : <SceneOldPlain key="2d" />}
//       </SceneWidget>
//     </Flex>
//   );
// };

// export default App;