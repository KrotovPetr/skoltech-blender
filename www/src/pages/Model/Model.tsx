import block from 'bem-cn-lite';
import { Flex, Text } from '@gravity-ui/uikit';
import { AsideHeader } from '@gravity-ui/navigation';
import { useState } from 'react';
import { Cube, Cubes3, EyesLookRight } from '@gravity-ui/icons';
import { Scene2D } from '../../widgets/Scene2D/Scene2D';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import './Model.scss';
import { Scene } from '../../widgets/Scene3D/deprecated-version-1/SceneOld';

const b = block('model');

// Заглушка для 3D моделирования (можно заменить на настоящий компонент)
const Scene3D = () => {
    return (
        <div>
            <h1>3D-моделирование</h1>
            <p>Здесь будет 3D редактор</p>
        </div>
    );
};

// Приветственная страница для раздела Model
const ModelIndex = () => {
    return (
        <div>
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
                    <Route path="/3d" element={<Scene />} />

                    Редирект при неизвестном маршруте
                    <Route path="*" element={<Navigate to="/model/2d" replace />} />
                </Routes>
            </Flex>
        </Flex>
    );
};
