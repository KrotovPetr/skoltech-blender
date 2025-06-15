#!/bin/bash

# Цвета для вывода
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Файл лога
LOG_FILE="aggressive_optimization_log_$(date +%Y%m%d_%H%M%S).txt"

# Счетчики
processed_count=0
error_count=0
total_original_size=0
total_optimized_size=0

# Функция для получения размера файла
get_file_size() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        stat -f%z "$1" 2>/dev/null || echo 0
    else
        stat -c%s "$1" 2>/dev/null || echo 0
    fi
}

# Функция для форматирования размера
format_size() {
    local size=$1
    if command -v numfmt >/dev/null 2>&1; then
        numfmt --to=iec-i --suffix=B $size
    else
        if [ $size -gt 1073741824 ]; then
            echo "$(( size / 1073741824 )).$(( (size % 1073741824) / 107374182 ))GB"
        elif [ $size -gt 1048576 ]; then
            echo "$(( size / 1048576 )).$(( (size % 1048576) / 104857 ))MB"
        elif [ $size -gt 1024 ]; then
            echo "$(( size / 1024 )).$(( (size % 1024) / 102 ))KB"
        else
            echo "${size}B"
        fi
    fi
}

# Функция агрессивной оптимизации
aggressive_optimize() {
    local INPUT="$1"
    local file_size_mb=$2
    local TEMP1="temp1_${RANDOM}.glb"
    local TEMP2="temp2_${RANDOM}.glb"
    local BACKUP="${INPUT}.backup"
    
    echo -e "\n${CYAN}Агрессивная оптимизация: $INPUT${NC}"
    echo -e "${MAGENTA}Размер файла: $(format_size $(get_file_size "$INPUT"))${NC}"
    
    # Получаем исходный размер
    local original_size=$(get_file_size "$INPUT")
    
    # Создаем резервную копию
    cp "$INPUT" "$BACKUP"
    
    # Используем TEMP1 как рабочий файл, TEMP2 как промежуточный
    cp "$INPUT" "$TEMP1"
    
    # Начинаем оптимизацию
    local success=true
    local current_file="$TEMP1"
    local next_file="$TEMP2"
    
    # Шаг 1: Удаление неиспользуемых данных
    echo "  1. Удаление неиспользуемых данных..."
    if gltf-transform prune "$current_file" "$next_file" 2>/dev/null; then
        current_file="$next_file"
        next_file="$TEMP1"
    else
        echo -e "  ${YELLOW}⚠ Пропуск очистки${NC}"
    fi
    
    # Шаг 2: Дедупликация
    echo "  2. Дедупликация..."
    if gltf-transform dedup "$current_file" "$next_file" 2>/dev/null; then
        current_file="$next_file"
        next_file=$([ "$next_file" = "$TEMP1" ] && echo "$TEMP2" || echo "$TEMP1")
    else
        echo -e "  ${YELLOW}⚠ Пропуск дедупликации${NC}"
    fi
    
    # Шаг 3: Переупорядочивание
    echo "  3. Оптимизация порядка данных..."
    if gltf-transform reorder "$current_file" "$next_file" 2>/dev/null; then
        current_file="$next_file"
        next_file=$([ "$next_file" = "$TEMP1" ] && echo "$TEMP2" || echo "$TEMP1")
    else
        echo -e "  ${YELLOW}⚠ Пропуск переупорядочивания${NC}"
    fi
    
    # Шаг 4: Упрощение геометрии для больших файлов
    if [ $file_size_mb -gt 5 ]; then
        echo "  4. Упрощение геометрии (файл > 5MB)..."
        if command -v gltf-transform &> /dev/null && gltf-transform simplify --help &> /dev/null; then
            if gltf-transform simplify "$current_file" "$next_file" --ratio 0.85 --error 0.001 2>/dev/null; then
                current_file="$next_file"
                next_file=$([ "$next_file" = "$TEMP1" ] && echo "$TEMP2" || echo "$TEMP1")
            else
                echo -e "  ${YELLOW}⚠ Пропуск упрощения геометрии${NC}"
            fi
        else
            echo -e "  ${YELLOW}⚠ Команда simplify не доступна${NC}"
        fi
    fi
    
    # Шаг 5: Квантование
    echo "  5. Квантование атрибутов..."
    if command -v gltf-transform &> /dev/null && gltf-transform quantize --help &> /dev/null; then
        if gltf-transform quantize "$current_file" "$next_file" 2>/dev/null; then
            current_file="$next_file"
            next_file=$([ "$next_file" = "$TEMP1" ] && echo "$TEMP2" || echo "$TEMP1")
        else
            echo -e "  ${YELLOW}⚠ Пропуск квантования${NC}"
        fi
    else
        echo -e "  ${YELLOW}⚠ Команда quantize не доступна${NC}"
    fi
    
    # Шаг 6: Оптимизация текстур
    echo "  6. Оптимизация текстур..."
    
    # Изменение размера текстур для больших файлов
    if [ $file_size_mb -gt 10 ] && command -v gltf-transform &> /dev/null && gltf-transform resize --help &> /dev/null; then
        echo "     - Уменьшение размера текстур..."
        if gltf-transform resize "$current_file" "$next_file" --width 1024 --height 1024 2>/dev/null; then
            current_file="$next_file"
            next_file=$([ "$next_file" = "$TEMP1" ] && echo "$TEMP2" || echo "$TEMP1")
        fi
    elif [ $file_size_mb -gt 5 ] && command -v gltf-transform &> /dev/null && gltf-transform resize --help &> /dev/null; then
        echo "     - Уменьшение размера текстур..."
        if gltf-transform resize "$current_file" "$next_file" --width 2048 --height 2048 2>/dev/null; then
            current_file="$next_file"
            next_file=$([ "$next_file" = "$TEMP1" ] && echo "$TEMP2" || echo "$TEMP1")
        fi
    fi
    
    # WebP конвертация
    if command -v gltf-transform &> /dev/null && gltf-transform webp --help &> /dev/null; then
        local quality=95
        [ $file_size_mb -gt 10 ] && quality=85
        [ $file_size_mb -gt 5 ] && [ $quality -eq 95 ] && quality=90
        
        echo "     - Конвертация в WebP (качество: $quality)..."
        if gltf-transform webp "$current_file" "$next_file" --quality $quality 2>/dev/null; then
            current_file="$next_file"
            next_file=$([ "$next_file" = "$TEMP1" ] && echo "$TEMP2" || echo "$TEMP1")
        else
            echo -e "  ${YELLOW}⚠ Пропуск WebP конвертации${NC}"
        fi
    fi
    
    # Шаг 7: Meshopt сжатие
    echo "  7. Применение meshopt сжатия..."
    if command -v gltf-transform &> /dev/null && gltf-transform meshopt --help &> /dev/null; then
        if gltf-transform meshopt "$current_file" "$next_file" 2>/dev/null; then
            current_file="$next_file"
            next_file=$([ "$next_file" = "$TEMP1" ] && echo "$TEMP2" || echo "$TEMP1")
        else
            echo -e "  ${YELLOW}⚠ Пропуск meshopt сжатия${NC}"
        fi
    else
        echo -e "  ${YELLOW}⚠ Команда meshopt не доступна${NC}"
    fi
    
    # Шаг 8: Draco сжатие (финальный шаг)
    echo "  8. Применение Draco сжатия..."
    
    # Адаптивные параметры в зависимости от размера
    if [ $file_size_mb -gt 10 ]; then
        echo "     - Агрессивное Draco сжатие..."
        gltf-transform draco "$current_file" "$INPUT" \
            --quantizePosition 12 \
            --quantizeNormal 8 \
            --quantizeTexcoord 10 \
            --quantizeColor 8 \
            --quantizeGeneric 8 2>/dev/null
    elif [ $file_size_mb -gt 5 ]; then
        echo "     - Среднее Draco сжатие..."
        gltf-transform draco "$current_file" "$INPUT" \
            --quantizePosition 13 \
            --quantizeNormal 9 \
            --quantizeTexcoord 11 \
            --quantizeColor 8 2>/dev/null
    else
        # Стандартное сжатие
        gltf-transform draco "$current_file" "$INPUT" \
            --quantizePosition 14 \
            --quantizeNormal 10 \
            --quantizeTexcoord 12 2>/dev/null
    fi
    
    if [ $? -eq 0 ]; then
        success=true
    else
        echo -e "  ${RED}✗ Ошибка при Draco сжатии${NC}"
        success=false
    fi
    
    # Обработка результата
    if [ "$success" = true ]; then
        # Получаем новый размер
        local new_size=$(get_file_size "$INPUT")
        local reduction=$(( 100 - (new_size * 100 / original_size) ))
        local saved=$((original_size - new_size))
        
        echo -e "  ${GREEN}✅ Готово!${NC}"
        echo -e "  Исходный размер: $(format_size $original_size)"
        echo -e "  Новый размер:    $(format_size $new_size)"
        echo -e "  ${BLUE}Сжатие: ${reduction}% (сэкономлено $(format_size $saved))${NC}"
        
        # Обновляем глобальные счетчики
        total_original_size=$((total_original_size + original_size))
        total_optimized_size=$((total_optimized_size + new_size))
        ((processed_count++))
        
        # Логирование
        echo "SUCCESS: $INPUT | $original_size -> $new_size | -${reduction}%" >> "$LOG_FILE"
        
        # Удаляем резервную копию при успехе
        rm -f "$BACKUP"
    else
        # Восстанавливаем из резервной копии при ошибке
        mv "$BACKUP" "$INPUT"
        echo -e "  ${RED}✗ Оптимизация не удалась, файл восстановлен${NC}"
        ((error_count++))
        echo "ERROR: $INPUT" >> "$LOG_FILE"
    fi
    
    # Очистка временных файлов
    rm -f "$TEMP1" "$TEMP2"
}

# Проверяем установку необходимых инструментов
echo -e "${CYAN}Проверка установленных инструментов...${NC}"

if ! command -v gltf-transform &> /dev/null; then
    echo -e "${RED}Ошибка: gltf-transform не установлен${NC}"
    echo "Установите его командой: npm install -g @gltf-transform/cli"
    exit 1
fi

# Начало работы
echo -e "${YELLOW}═══════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}   АГРЕССИВНАЯ ОПТИМИЗАЦИЯ GLB/GLTF ФАЙЛОВ           ${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════${NC}"
echo "Начало: $(date)" | tee "$LOG_FILE"
echo ""

# Находим все файлы с постфиксом processed
echo -e "${CYAN}Поиск файлов с постфиксом 'processed'...${NC}"

# Используем find с правильной обработкой пробелов
files=()
while IFS= read -r -d '' file; do
    files+=("$file")
done < <(find . -type f \( -name "*processed.glb" -o -name "*processed.gltf" \) -print0 2>/dev/null)

if [ ${#files[@]} -eq 0 ]; then
    echo -e "${YELLOW}Файлы с постфиксом 'processed' не найдены${NC}"
    exit 0
fi

echo -e "${GREEN}Найдено файлов: ${#files[@]}${NC}"

# Обрабатываем каждый файл
current=0
for file in "${files[@]}"; do
    ((current++))
    size=$(get_file_size "$file")
    size_mb=$((size / 1048576))
    
    echo -e "\n${YELLOW}[$current/${#files[@]}]${NC} Обработка файла..."
    aggressive_optimize "$file" $size_mb
done

# Итоговая статистика
echo -e "\n${YELLOW}═══════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}                 ИТОГОВАЯ СТАТИСТИКА                   ${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════${NC}"

if [ $processed_count -gt 0 ]; then
    total_saved=$((total_original_size - total_optimized_size))
    total_reduction=$(( 100 - (total_optimized_size * 100 / total_original_size) ))
    
    echo -e "\n${GREEN}Успешно оптимизировано:${NC} $processed_count из ${#files[@]} файлов"
    echo -e "\n${BLUE}Общая статистика:${NC}"
    echo -e "├─ Исходный размер: $(format_size $total_original_size)"
    echo -e "├─ Итоговый размер: $(format_size $total_optimized_size)"
    echo -e "├─ Сэкономлено:     ${GREEN}$(format_size $total_saved)${NC}"
    echo -e "└─ Общее сжатие:    ${GREEN}${total_reduction}%${NC}"
fi

echo -e "\n${CYAN}Лог сохранен в: $LOG_FILE${NC}"
