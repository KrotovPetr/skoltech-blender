import { Editor, Monaco } from "@monaco-editor/react";
import { useRef, useState } from "react";

interface JsonEditorProps {
    onUpdateFromJSON: (jsonData: any) => void;
    sceneJSON: string;
}

export const JsonEditor = ({ onUpdateFromJSON, sceneJSON }: JsonEditorProps) => {
    const editorRef = useRef<any>(null);
    const [editorErrors, setEditorErrors] = useState<string | null>(null);

    // Обработчик изменений в Monaco Editor
    const handleEditorChange = (value: string | undefined) => {
        if (!value) return;

        try {
            const sceneData = JSON.parse(value);

            // Валидация данных
            if (!sceneData.objects || !Array.isArray(sceneData.objects)) {
                setEditorErrors("Неверный формат данных: objects должен быть массивом");
                return;
            }

            setEditorErrors(null);
        } catch (e) {
            setEditorErrors("Ошибка парсинга JSON: " + (e as Error).message);
        }

    }

    // Применение изменений из редактора
    const handleApplyJSON = () => {
        if (editorRef.current) {
            try {
                const value = editorRef.current.getValue();
                const sceneData = JSON.parse(value);
                onUpdateFromJSON(sceneData);
                setEditorErrors(null);
            } catch (e) {
                setEditorErrors("Ошибка парсинга JSON: " + (e as Error).message);
            }
        }
    };

    // Функция для скачивания JSON
    const handleDownloadJSON = () => {
        if (editorRef.current) {
            const value = editorRef.current.getValue();
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(value);
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", "room-layout.json");
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
        }
    };

    // Настройка Monaco Editor
    const handleEditorDidMount = (editor: any, monaco: Monaco) => {
        editorRef.current = editor;

        // Настройка автоформатирования
        monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
            validate: true,
            schemas: [
                {
                    uri: "http://myserver/scene-schema.json",
                    fileMatch: ["*"],
                    schema: {
                        type: "object",
                        properties: {
                            roomDimensions: {
                                type: "object",
                                properties: {
                                    width: { type: "number" },
                                    height: { type: "number" }
                                }
                            },
                            objects: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        id: { type: "string" },
                                        label: { type: "string" },
                                        coordinates: {
                                            type: "object",
                                            properties: {
                                                x: { type: "number" },
                                                y: { type: "number" },
                                                width: { type: "number" },
                                                height: { type: "number" }
                                            }
                                        },
                                        rotation: { type: "number" }
                                    }
                                }
                            }
                        }
                    }
                }
            ]
        });
    };



    // // Обработчик изменений в Monaco Editor
    // const handleEditorChange = (value: string | undefined) => {
    //     if (!value) return;

    //     try {
    //         const sceneData = JSON.parse(value);

    //         // Валидация данных
    //         if (!Array.isArray(sceneData.objects)) {
    //             setEditorErrors("Неверный формат данных: objects должен быть массивом");
    //             return;
    //         }

    //         // Проверяем каждый объект на валидность
    //         for (const obj of sceneData.objects) {
    //             if (!obj.coordinates ||
    //                 typeof obj.coordinates.x !== 'number' ||
    //                 typeof obj.coordinates.y !== 'number' ||
    //                 typeof obj.coordinates.width !== 'number' ||
    //                 typeof obj.coordinates.height !== 'number') {
    //                 setEditorErrors(`Неверный формат координат для объекта ${obj.id}`);
    //                 return;
    //             }

    //             if (typeof obj.rotation !== 'number') {
    //                 setEditorErrors(`Неверный формат угла поворота для объекта ${obj.id}`);
    //                 return;
    //             }
    //         }

    //         // Применяем изменения
    //         setObjects(sceneData.objects);
    //         if (sceneData.selectedObjectId) {
    //             setSelectedObjectId(sceneData.selectedObjectId);
    //         }

    //         setEditorErrors(null);
    //     } catch (e) {
    //         setEditorErrors("Ошибка парсинга JSON: " + (e as Error).message);
    //     }
    // };

    return (<div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <h3 style={{
            fontSize: "16px",
            padding: "5px 0",
            borderBottom: "1px solid #ddd",
            marginBottom: "10px"
        }}>
            JSON редактор
        </h3>

        {editorErrors && (
            <div style={{
                color: "white",
                backgroundColor: "#FF5555",
                padding: "8px 12px",
                borderRadius: "4px",
                marginBottom: "10px",
                fontSize: "12px"
            }}>
                {editorErrors}
            </div>
        )}

        <div style={{ flex: 1, border: "1px solid #ccc", borderRadius: "4px", overflow: "hidden", marginBottom: "10px" }}>
            <Editor
                height="100%"
                defaultLanguage="json"
                value={sceneJSON}
                onChange={handleEditorChange}
                options={{
                    minimap: { enabled: false },
                    lineNumbers: "on",
                    scrollBeyondLastLine: false,
                    wordWrap: "on",
                    wrappingIndent: "indent"
                }}
                onMount={handleEditorDidMount}
            />
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
            <button
                onClick={handleApplyJSON}
                style={{
                    flex: 1,
                    padding: "8px 12px",
                    backgroundColor: "#4CAF50",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "14px"
                }}
            >
                Применить
            </button>
            <button
                onClick={handleDownloadJSON}
                style={{
                    flex: 1,
                    padding: "8px 12px",
                    backgroundColor: "#2196F3",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "14px"
                }}
            >
                Скачать JSON
            </button>
        </div>
    </div>)
}