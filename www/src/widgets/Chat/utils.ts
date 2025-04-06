import { Message } from "../../shared/types";

export const GREETING_ROBOT_MESSAGE: Message = { direction: "robot", text: "Привет, давай познакомимся, введи, пожалуйста, свой логин, чтобы я мог тебя запомнить" };
export const WIDTH_ROBOT_MESSAGE: Message = { direction: "robot", text: "Приятно познакомиться! Давай попробуем создать твой проект, сейчас необходимо ввести параметры Вашего помещения. Начнём с ширины" };
export const LENGTH_ROBOT_MESSAGE: Message = { direction: "robot", text: "Отлично! Теперь запомним длину" };
export const HEIGHT_ROBOT_MESSAGE: Message = { direction: "robot", text: "Отлично! Теперь запомним высоту" };
export const DESCRIPTION_ROBOT_MESSAGE: Message = { direction: "robot", text: "Отлично! Теперь попробуйте описать желаемый интерьер, который вы хотите получить в вашей комнате" };

export const getMessageList = (): Message[] => {
    const storagedObjectString = localStorage.getItem('design') ?? '{}';
    const storagedObject = JSON.parse(storagedObjectString);

    const messages: Message[] = [];

    messages.push(GREETING_ROBOT_MESSAGE);

    if (storagedObject.username) {
        messages.push({ direction: 'user', text: storagedObject.username });
    } else {
        return messages;
    }

    messages.push(WIDTH_ROBOT_MESSAGE);

    if (storagedObject.width) {
        messages.push({ direction: 'user', text: storagedObject.width });
    } else {
        return messages;
    }

    messages.push(LENGTH_ROBOT_MESSAGE);

    if (storagedObject.length) {
        messages.push({ direction: 'user', text: storagedObject.length });
    } else {
        return messages;
    }

    messages.push(HEIGHT_ROBOT_MESSAGE);

    if (storagedObject.height) {
        messages.push({ direction: 'user', text: storagedObject.height });

    } else {
        return messages
    }

    messages.push(DESCRIPTION_ROBOT_MESSAGE);

    if (storagedObject.description) {
        messages.push({ direction: 'user', text: storagedObject.description });
    }

    return messages;
};
