import { Flex, RadioButton, RadioButtonOption } from "@gravity-ui/uikit"
import { useState } from "react"
import { ChatWidget } from "../../widgets"
import Scene from "../../widgets/Scene/Scene";
import block from 'bem-cn-lite';
import './Demo.scss';

const b = block('demo-page');

enum EDemoWidget {
    MONACO = "monaco",
    SCENE = "scene"
}

export const Demo = () => {
    const [router, setRouter] = useState<"monaco" | "scene">("scene");

    const options: RadioButtonOption[] = [
        { value: "monaco", content: "monaco" },
        { value: "scene", content: "scene" },
    ];


    return (
        <Flex className={b()}>
            {/* <RadioButton name={'edemowidget'} defaultValue={EDemoWidget.SCENE} options={options} onUpdate={(value) => { setRouter(value as any) }} /> */}
            <Scene />
            <ChatWidget />
        </Flex>
    )
}