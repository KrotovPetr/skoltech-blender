import { Editor } from "@monaco-editor/react"
import { jsonObj } from "../../shared/utils/json"

export const MonacoEditor = () => {
    return (
        <Editor
            height="85vh"
            width={`100%`}
            language={"json"}
            value={JSON.stringify(jsonObj, null, 2)}
            theme={"light"}
        // onChange={}
        />
    )
}