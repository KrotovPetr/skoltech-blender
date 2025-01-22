import { Editor } from "@monaco-editor/react"
import { jsonObj } from "../../shared/utils/json"
import { Flex } from "@gravity-ui/uikit"
import "./MonacoEditor.scss";
import block from 'bem-cn-lite';

const b = block('monaco');

export const MonacoEditor = () => {
    return (
        <Flex className={b()}>
            <Editor
                height="85vh"
                language={"json"}
                value={JSON.stringify(jsonObj, null, 2)}
                theme={"light"}
                className={b()}
            />
        </Flex>

    )
}