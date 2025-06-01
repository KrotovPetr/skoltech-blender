// shared/types.ts
export interface Message {
    direction: 'user' | 'robot';
    text: string;
    timestamp?: number;
    modelId?: number;
}

export const GREETING_ROBOT_MESSAGE: Message = {
    direction: "robot",
    text: "Привет, я виртуальный помощник Plan Design. Я помогу вам собрать расстановку вашей мечты. Составьте свой запрос, чтобы начать работу",
    timestamp: Date.now()
};

export const MODEL_ROBOT_MESSAGE: Message = {
    direction: "robot",
    text: "Генерация прошла успешно, сцена собрана, можно перейти по ссылке.",
    timestamp: Date.now()
};

// Функция для генерации сообщения робота с нужным modelId
export const createRobotMessageWithLink = (modelId: number): Message => {
    return {
        direction: "robot",
        text: `Генерация прошла успешно, сцена собрана. [Перейти к модели ${modelId}](/2d?modelId=${modelId}) (2D). [Перейти к модели ${modelId}](/3d?modelId=${modelId}) (3D)`,
        timestamp: Date.now(),
        modelId
    };
};

export const getMessageList = (): Message[] => {
    const storagedObjectString = localStorage.getItem('design') ?? '{}';
    const storagedObject = JSON.parse(storagedObjectString);

    const messages: Message[] = [];

    messages.push(GREETING_ROBOT_MESSAGE);

    if (storagedObject.username) {
        messages.push({
            direction: 'user',
            text: storagedObject.username,
            timestamp: Date.now()
        });
        messages.push(createRobotMessageWithLink(1));
    } else if (storagedObject.modelOne) {
        messages.push({
            direction: 'user',
            text: storagedObject.modelOne,
            timestamp: Date.now()
        });
        messages.push(createRobotMessageWithLink(1));
    } else if (storagedObject.modelTwo) {
        messages.push({
            direction: 'user',
            text: storagedObject.modelTwo,
            timestamp: Date.now()
        });
        messages.push(createRobotMessageWithLink(2));
    }

    return messages;
};
