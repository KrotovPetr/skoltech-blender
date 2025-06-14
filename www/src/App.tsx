import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import './App.scss';
import block from 'bem-cn-lite';
import { Flex, Toaster, ToasterComponent, ToasterProvider, Text } from '@gravity-ui/uikit';
import { AsideHeader } from '@gravity-ui/navigation';
import { useCallback, useState, useEffect } from 'react';
import { Cube, Cubes3, EyesLookRight, Comment } from '@gravity-ui/icons';
import { Home, Scene3DContainer } from './pages';
import { Scene2D } from './widgets/Scene2D/Scene2D';

const b = block('app');
const SCENE_GENERATED_EVENT = 'scene-generated';

export const App = () => {
  const toaster = new Toaster();

  const [compact, setCompact] = useState<boolean>(false);
  const [hasGeneratedScene, setHasGeneratedScene] = useState<boolean>(false);
  const [latestModelId, setLatestModelId] = useState<number>(1);
  const [menuKey, setMenuKey] = useState<number>(0); // Добавляем счетчик для форсирования обновления
  const navigate = useNavigate();
  const location = useLocation();

  // Функция проверки наличия сгенерированных сцен
  const checkGeneratedScenes = useCallback(() => {
    const chatMessages = sessionStorage.getItem('chat_messages');

    if (chatMessages) {
      try {
        const messages = JSON.parse(chatMessages);

        // Проверяем наличие хотя бы одного сообщения робота с modelId
        const robotMessagesWithModel = messages.filter((msg: any) =>
          msg.direction === 'robot' && msg.modelId
        );

        if (robotMessagesWithModel.length > 0) {
          const lastRobotMessage = robotMessagesWithModel[robotMessagesWithModel.length - 1];

          // Проверяем, изменился ли modelId
          if (lastRobotMessage.modelId !== latestModelId) {
            setLatestModelId(lastRobotMessage.modelId);
            setMenuKey(prev => prev + 1); // Форсируем обновление меню
          }

          if (!hasGeneratedScene) {
            setHasGeneratedScene(true);
          }
        } else {
          setHasGeneratedScene(false);
        }
      } catch (e) {
        console.error('Error parsing chat messages:', e);
        setHasGeneratedScene(false);
      }
    } else {
      setHasGeneratedScene(false);
    }
  }, [latestModelId, hasGeneratedScene]);

  // Проверяем наличие сгенерированных сцен при загрузке
  useEffect(() => {
    checkGeneratedScenes();

    // Обработчик изменений в storage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'chat_messages') {
        checkGeneratedScenes();
      }
    };

    // Обработчик события генерации сцены
    const handleSceneGenerated = () => {
      setTimeout(() => {
        checkGeneratedScenes();
        setMenuKey(prev => prev + 1); // Форсируем обновление после генерации
      }, 100);
    };

    // Подписываемся на события
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener(SCENE_GENERATED_EVENT, handleSceneGenerated);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener(SCENE_GENERATED_EVENT, handleSceneGenerated);
    };
  }, [checkGeneratedScenes]);

  // Дополнительная проверка с интервалом для отслеживания изменений в той же вкладке
  useEffect(() => {
    const interval = setInterval(() => {
      checkGeneratedScenes();
    }, 1000);

    return () => clearInterval(interval);
  }, [checkGeneratedScenes]);

  const onClose = () => {
    setCompact(true);
  };

  // Определяем активный элемент меню на основе текущего пути
  const getActiveItem = useCallback(() => {
    if (location.pathname === '/' || location.pathname.includes('/chat')) return 'chat';
    if (location.pathname.includes('/2d')) return '2d-model';
    if (location.pathname.includes('/3d')) return '3d-model';
    return 'chat';
  }, [location.pathname]);

  // Формируем базовые пункты меню
  const baseMenuItems = [
    {
      id: "chat",
      title: <Text>Chat</Text>,
      icon: Comment,
      onItemClick: () => navigate('/'),
      active: getActiveItem() === 'chat'
    }
  ];

  // Формируем пункты меню в зависимости от состояния
  const getMenuItems = () => {
    if (!hasGeneratedScene) {
      return baseMenuItems;
    }

    return [
      ...baseMenuItems,
      {
        id: "3d-model",
        title: <Text>3D-scene</Text>,
        icon: Cube,
        onItemClick: () => {
          console.log('Navigating to 3D with modelId:', latestModelId);
          navigate(`/3d?modelId=${latestModelId}`);
        },
        active: getActiveItem() === '3d-model'
      },
      {
        id: "2d-model",
        title: <Text>2D-layout</Text>,
        icon: Cubes3,
        onItemClick: () => {
          console.log('Navigating to 2D with modelId:', latestModelId);
          navigate(`/2d?modelId=${latestModelId}`);
        },
        active: getActiveItem() === '2d-model'
      }
    ];
  };

  return (
    <div className='content'>
      <ToasterProvider toaster={toaster}>
        <AsideHeader
          key={`menu-${menuKey}-${latestModelId}`}
          compact={compact}
          onChangeCompact={() => { setCompact((o) => !o) }}
          onClosePanel={onClose}
          onAllPagesClick={() => navigate('/model')}
          headerDecoration={true}
          logo={{
            icon: EyesLookRight,
            text: 'Plain Design'
          }}
          menuItems={getMenuItems()}
        />

        <Flex className={b()} direction={"row"}>
          <Routes>
            <Route path="/" element={<Home />} />
            {hasGeneratedScene && (
              <>
                <Route path="/2d" element={<Scene2D />} />
                <Route path="/3d" element={<Scene3DContainer />} />
              </>
            )}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Flex>
        <ToasterComponent className="optional additional classes" hasPortal={true} />
      </ToasterProvider>
    </div>
  );
};
