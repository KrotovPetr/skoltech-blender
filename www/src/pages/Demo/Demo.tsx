import { Flex, RadioButton, RadioButtonOption} from "@gravity-ui/uikit"
import { MonacoEditor } from "../../widgets/MonacoEditor"
import { useState } from "react"
import { ChatBlock } from "../../widgets"
import { ThreeDScene } from "../../widgets/Scene/3DScene"
import { jsonObj } from "../../json"
import Scene from "../../widgets/Scene/Scene"

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
        <Flex direction={"column"}>
            <RadioButton name={'edemowidget'} defaultValue={EDemoWidget.SCENE} options={options} onUpdate={(value) => { setRouter(value as any) }} />
            <Flex>
                {/* {router === EDemoWidget.MONACO ? <MonacoEditor /> : <ThreeDScene sceneData={jsonObj} />} */}
                {router === EDemoWidget.MONACO ? <MonacoEditor /> : <Scene />}
            </Flex>
            <ChatBlock/>
        </Flex>
    )
}