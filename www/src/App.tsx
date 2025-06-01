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
const MIN_MESSAGES_COUNT = 3;

export const App = () => {
  const toaster = new Toaster();

  const [compact, setCompact] = useState<boolean>(false);
  const [hasGeneratedScene, setHasGeneratedScene] = useState<boolean>(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Функция проверки наличия сгенерированных сцен
  const checkGeneratedScenes = useCallback(() => {
    // Проверяем localStorage на наличие данных о дизайне
    const designData = localStorage.getItem('design');
    const chatMessages = sessionStorage.getItem('chat_messages');

    // Проверяем количество сообщений в чате
    if (chatMessages) {
      try {
        const messages = JSON.parse(chatMessages);

        // Проверяем общее количество сообщений
        if (messages.length < MIN_MESSAGES_COUNT) {
          setHasGeneratedScene(false);
          return;
        }

        // Дополнительно проверяем наличие сообщений от робота с ссылками
        const hasRobotMessageWithLink = messages.some((msg: any) =>
          msg.direction === 'robot' &&
          (msg.text.includes('[Перейти к модели') || msg.modelId)
        );

        if (hasRobotMessageWithLink) {
          setHasGeneratedScene(true);
          return;
        }
      } catch (e) {
        console.error('Error parsing chat messages:', e);
      }
    }

    // Также проверяем design data
    if (designData) {
      try {
        const design = JSON.parse(designData);
        // Проверяем, есть ли описание (то есть была ли генерация)
        if (design.description || design.username || design.modelOne || design.modelTwo) {
          // Но все равно нужно проверить количество сообщений
          if (chatMessages) {
            try {
              const messages = JSON.parse(chatMessages);
              if (messages.length >= MIN_MESSAGES_COUNT) {
                setHasGeneratedScene(true);
              }
            } catch (e) {
              console.error('Error parsing chat messages:', e);
            }
          }
        }
      } catch (e) {
        console.error('Error parsing design data:', e);
      }
    }
  }, []);

  // Проверяем наличие сгенерированных сцен при загрузке
  useEffect(() => {
    checkGeneratedScenes();

    // Обработчик изменений в storage
    const handleStorageChange = (e: StorageEvent) => {
      // Проверяем, что изменение произошло в нужных ключах
      if (e.key === 'design' || e.key === 'chat_messages') {
        checkGeneratedScenes();
      }
    };

    // Обработчик события генерации сцены
    const handleSceneGenerated = () => {
      // При получении события также проверяем количество сообщений
      checkGeneratedScenes();
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

    // Очищаем интервал, когда сцена сгенерирована
    if (hasGeneratedScene) {
      clearInterval(interval);
    }

    return () => clearInterval(interval);
  }, [hasGeneratedScene, checkGeneratedScenes]);

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

  // Добавляем пункты меню для сцен только если была генерация и достаточно сообщений
  const menuItems = hasGeneratedScene ? [
    ...baseMenuItems,
    // {
    //   id: "3d-model",
    //   title: <Text>3D-scene</Text>,
    //   icon: Cube,
    //   onItemClick: () => navigate('/3d'),
    //   active: getActiveItem() === '3d-model'
    // },
    // {
    //   id: "2d-model",
    //   title: <Text>2D-layout</Text>,
    //   icon: Cubes3,
    //   onItemClick: () => navigate('/2d'),
    //   active: getActiveItem() === '2d-model'
    // }
  ] : baseMenuItems;

  return (
    <div className='content'>
      <ToasterProvider toaster={toaster}>
        <AsideHeader
          compact={compact}
          onChangeCompact={() => { setCompact((o) => !o) }}
          onClosePanel={onClose}
          onAllPagesClick={() => navigate('/model')}
          headerDecoration={true}
          logo={{
            icon: EyesLookRight,
            text: 'Plain Design'
          }}
          menuItems={menuItems}
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
