#!/bin/bash

# Цвета для вывода
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Счетчики
processed_count=0
error_count=0

echo -e "${YELLOW}Начинаем обработку файлов с постфиксом 'processed'...${NC}\n"

# Находим все файлы с постфиксом processed (glb и gltf)
for file in *_processed.{glb,gltf}; do
    # Проверяем, существует ли файл (bash может вернуть паттерн, если файлов нет)
    if [ -f "$file" ]; then
        echo -e "${GREEN}Обрабатываем:${NC} $file"
        
        # Выполняем преобразование с draco сжатием
        if gltf-transform draco "$file" "$file"; then
            echo -e "${GREEN}✓ Успешно обработан:${NC} $file"
            ((processed_count++))
        else
            echo -e "${RED}✗ Ошибка при обработке:${NC} $file"
            ((error_count++))
        fi
        
        echo "-------------------"
    fi
done

# Итоговая статистика
echo -e "\n${YELLOW}Обработка завершена!${NC}"
echo -e "${GREEN}Успешно обработано файлов:${NC} $processed_count"

if [ $error_count -gt 0 ]; then
    echo -e "${RED}Файлов с ошибками:${NC} $error_count"
fi

if [ $processed_count -eq 0 ] && [ $error_count -eq 0 ]; then
    echo -e "${YELLOW}Файлы с постфиксом '_processed' не найдены${NC}"
fi
