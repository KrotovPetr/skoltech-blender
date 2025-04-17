import block from 'bem-cn-lite';
import { Flex, Text, Loader, Button } from '@gravity-ui/uikit';
import { AsideHeader } from '@gravity-ui/navigation';
import { useState, useEffect } from 'react';
import { Cube, Cubes3, EyesLookRight } from '@gravity-ui/icons';
import { Scene2D } from '../../widgets/Scene2D/Scene2D';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import './Model.scss';

const b = block('model');

// Компонент 3D сцены с собственной логикой загрузки
const Scene3DContainer = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [Scene3D, setScene3D] = useState<React.ComponentType | null>(null);

    // Загрузка 3D компонента при монтировании
    useEffect(() => {
        let isMounted = true;

        const loadScene3D = async () => {
            try {
                // Динамический импорт компонента
                const module = await import('../../widgets/Scene3D/deprecated-version-1/SceneOld');

                // Если компонент всё ещё смонтирован, обновляем состояние
                if (isMounted) {
                    setScene3D(() => module.Scene);
                    setIsLoading(false);
                }
            } catch (error) {
                console.error('Failed to load 3D scene:', error);
                if (isMounted) {
                    setHasError(true);
                    setIsLoading(false);
                }
            }
        };

        loadScene3D();

        // Обработчик потери контекста WebGL
        const handleContextLost = (event: any) => {
            event.preventDefault();
            console.warn('WebGL context lost. Attempting to recover...');
            if (isMounted) {
                setHasError(true);
            }
        };

        window.addEventListener('webglcontextlost', handleContextLost, false);

        // Функция очистки при размонтировании
        return () => {
            isMounted = false;
            window.removeEventListener('webglcontextlost', handleContextLost);
        };
    }, []);

    // Функция повторной попытки загрузки при ошибке
    const handleRetry = () => {
        setIsLoading(true);
        setHasError(false);

        import('../../widgets/Scene3D/deprecated-version-1/SceneOld')
            .then(module => {
                setScene3D(() => module.Scene);
                setIsLoading(false);
            })
            .catch(error => {
                console.error('Failed to reload 3D scene:', error);
                setHasError(true);
                setIsLoading(false);
            });
    };

    // Состояние загрузки
    if (isLoading) {
        return (
            <Flex direction="column" alignItems="center" justifyContent="center" className={b('loader-container')}>
                <Loader size="l" />
                <Text variant="display-1" className={b('loader-text')}>
                    Загружаем 3D редактор...
                </Text>
                <Text variant="body-1" color="secondary" className={b('loader-subtext')}>
                    Это может занять несколько секунд
                </Text>
            </Flex>
        );
    }

    // Состояние ошибки
    if (hasError || !Scene3D) {
        return (
            <Flex direction="column" alignItems="center" justifyContent="center" className={b('error-container')}>
                <Text variant="display-1" className={b('error-text')}>
                    Ошибка при загрузке 3D сцены
                </Text>
                <Text variant="body-1" color="secondary" className={b('error-subtext')}>
                    Не удалось загрузить 3D редактор или произошла ошибка WebGL контекста
                </Text>
                <Button
                    view="action"
                    onClick={handleRetry}
                    className={b('retry-button')}
                    size="l"
                >Попробовать снова
                </Button>
            </Flex>
        );
    }

    // Рендерим 3D сцену
    return <Scene3D />;
};

// Приветственная страница для раздела Model
const ModelIndex = () => {
    return (
        <div className={b('welcome')}>
            <h1>Создание модели</h1>
            <p>Выберите режим работы в меню слева</p>
        </div>
    );
};

export const Model = () => {
    const [compact, setCompact] = useState<boolean>(false);
    const navigate = useNavigate();
    const location = useLocation();

    const onClose = () => {
        setCompact(true);
    };

    // Определяем активный элемент меню на основе текущего пути
    const getActiveItem = () => {
        if (location.pathname.includes('/2d')) return '2d-model';
        if (location.pathname.includes('/3d')) return '3d-model';
        return undefined;
    };

    return (
        <Flex className={b()}>
            <AsideHeader
                compact={compact}
                onChangeCompact={() => { setCompact((o) => !o) }}
                onClosePanel={onClose}
                onAllPagesClick={() => navigate('/model')}
                headerDecoration={true}
                className={b('aside', { open: !compact })}
                logo={{
                    icon: EyesLookRight,
                    text: 'Plain Design'
                }}
                menuItems={[
                    {
                        id: "3d-model",
                        title: <Text>3D-scene</Text>,
                        icon: Cube,
                        onItemClick: () => navigate('/model/3d')

                    },
                    {
                        id: "2d-model",
                        title: <Text>2D-layout</Text>,
                        icon: Cubes3,
                        onItemClick: () => navigate('/model/2d')
                    },
                ]}
            />

            <Flex className={b('model-content')}>
                <Routes>
                    <Route index element={<ModelIndex />} />
                    <Route path="/2d" element={<Scene2D />} />
                    <Route path="/3d" element={<Scene3DContainer />} />
                    {/* Редирект при неизвестном маршруте */}
                    <Route path="*" element={<Navigate to="/model/2d" replace />} />
                </Routes>
            </Flex>
        </Flex>
    );
};
