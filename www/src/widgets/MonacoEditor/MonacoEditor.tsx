import { Editor } from "@monaco-editor/react"
import { jsonObj } from "../../json"

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