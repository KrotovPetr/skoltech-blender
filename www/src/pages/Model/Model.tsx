import block from 'bem-cn-lite';
import { Flex, Text, Loader, Button } from '@gravity-ui/uikit';
import { useState, useEffect} from 'react';
import './Model.scss';

const b = block('model');

export const Scene3DContainer = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [Scene3D, setScene3D] = useState<React.ComponentType | null>(null);

    useEffect(() => {
        let isMounted = true;

        const loadScene3D = async () => {
            try {
                const module = await import('../../widgets/Scene3D/deprecated-version-1/SceneOld');

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

        const handleContextLost = (event: any) => {
            event.preventDefault();
            console.warn('WebGL context lost. Attempting to recover...');
            if (isMounted) {
                setHasError(true);
            }
        };

        window.addEventListener('webglcontextlost', handleContextLost, false);

        return () => {
            isMounted = false;
            window.removeEventListener('webglcontextlost', handleContextLost);
        };
    }, []);

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

    return <Scene3D />;
};
