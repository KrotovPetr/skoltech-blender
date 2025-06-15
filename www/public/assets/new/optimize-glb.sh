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
size_limit=1048576 # 1 МБ в байтах

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
    local target_size_limit=$3
    local TEMP1="temp1_${RANDOM}.glb"
    local TEMP2="temp2_${RANDOM}.glb"
    local BACKUP="${INPUT}.backup"
    
    echo -e "\n${CYAN}Агрессивная оптимизация: $INPUT${NC}"
    echo -e "${MAGENTA}Размер файла: $(format_size $(get_file_size "$INPUT"))${NC}"
    echo -e "${MAGENTA}Целевой лимит: $(format_size $target_size_limit)${NC}"
    
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
    local simplify_ratio=0.85
    if [ $original_size -gt $target_size_limit ]; then
        # Расчет более агрессивного упрощения если файл больше лимита
        local desired_ratio=$(echo "scale=2; $target_size_limit / $original_size" | bc)
        if (( $(echo "$desired_ratio < 0.8" | bc -l) )); then
            simplify_ratio=$desired_ratio
            [ $(echo "$simplify_ratio < 0.3" | bc -l) ] && simplify_ratio=0.3
        fi
    fi
    
    echo "  4. Упрощение геометрии (коэффициент: $simplify_ratio)..."
    if command -v gltf-transform > /dev/null && gltf-transform simplify --help > /dev/null; then
        if gltf-transform simplify "$current_file" "$next_file" --ratio $simplify_ratio --error 0.001 2>/dev/null; then
            current_file="$next_file"
            next_file=$([ "$next_file" = "$TEMP1" ] && echo "$TEMP2" || echo "$TEMP1")
        else
            echo -e "  ${YELLOW}⚠ Пропуск упрощения геометрии${NC}"
        fi
    else
        echo -e "  ${YELLOW}⚠ Команда simplify не доступна${NC}"
    fi
    
    # Шаг 5: Квантование
    echo "  5. Квантование атрибутов..."
    if command -v gltf-transform > /dev/null && gltf-transform quantize --help > /dev/null; then
        local q_params=""
        # Более агрессивное квантование для больших файлов
        if [ $original_size -gt $((target_size_limit * 2)) ]; then
            q_params="--quantize-position 10 --quantize-normal 8 --quantize-texcoord 8 --quantize-color 8 --quantize-weight 8 --quantize-generic 8"
        fi
        
        if gltf-transform quantize $q_params "$current_file" "$next_file" 2>/dev/null; then
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
    
    # Адаптивное изменение размера текстур на основе размера файла и лимита
    local texture_size=2048
    if [ $original_size -gt $((target_size_limit * 3)) ]; then
        texture_size=512
    elif [ $original_size -gt $((target_size_limit * 2)) ]; then
        texture_size=768
    elif [ $original_size -gt $target_size_limit ]; then
        texture_size=1024
    fi
    
    if command -v gltf-transform > /dev/null && gltf-transform resize --help > /dev/null; then
        echo "     - Уменьшение размера текстур до ${texture_size}x${texture_size}..."
        if gltf-transform resize "$current_file" "$next_file" --width $texture_size --height $texture_size 2>/dev/null; then
            current_file="$next_file"
            next_file=$([ "$next_file" = "$TEMP1" ] && echo "$TEMP2" || echo "$TEMP1")
        fi
    fi
    
    # WebP конвертация с адаптивным качеством
    if command -v gltf-transform > /dev/null && gltf-transform webp --help > /dev/null; then
        local quality=85
        
        # Еще более агрессивное качество для больших файлов
        if [ $original_size -gt $((target_size_limit * 3)) ]; then
            quality=60
        elif [ $original_size -gt $((target_size_limit * 2)) ]; then
            quality=70
        elif [ $original_size -gt $target_size_limit ]; then
            quality=75
        fi
        
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
    if command -v gltf-transform > /dev/null && gltf-transform meshopt --help > /dev/null; then
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
    
    # Адаптивные параметры сжатия
    local q_pos=14
    local q_norm=10
    local q_tex=12
    local q_col=8
    local q_gen=8
    
    # Более агрессивные параметры для больших файлов
    if [ $original_size -gt $((target_size_limit * 3)) ]; then
        q_pos=10
        q_norm=8
        q_tex=8
        q_col=8
        q_gen=8
    elif [ $original_size -gt $((target_size_limit * 2)) ]; then
        q_pos=11
        q_norm=8
        q_tex=9
        q_col=8
        q_gen=8
    elif [ $original_size -gt $target_size_limit ]; then
        q_pos=12
        q_norm=9
        q_tex=10
        q_col=8
        q_gen=8
    fi
    
    echo "     - Draco сжатие (quantizePosition: $q_pos, quantizeNormal: $q_norm, quantizeTexcoord: $q_tex)..."
    if gltf-transform draco "$current_file" "$INPUT" \
        --quantizePosition $q_pos \
        --quantizeNormal $q_norm \
        --quantizeTexcoord $q_tex \
        --quantizeColor $q_col \
        --quantizeGeneric $q_gen 2>/dev/null; then
        success=true
    else
        echo -e "  ${RED}✗ Ошибка при Draco сжатии${NC}"
        success=false
    fi
    
    # Проверка размера после оптимизации
    local new_size=$(get_file_size "$INPUT")
    if [ $new_size -gt $target_size_limit ] && [ "$success" = true ]; then
        echo -e "  ${YELLOW}⚠ Предупреждение: Размер файла ($(format_size $new_size)) все еще превышает лимит ($(format_size $target_size_limit))${NC}"
        
        # Если в первый раз не получилось, пробуем еще раз с самыми агрессивными настройками
        if [ $4 != "retry" ]; then
            echo -e "  ${CYAN}Повторная попытка с максимальной оптимизацией...${NC}"
            
            # Очистка временных файлов
            rm -f "$TEMP1" "$TEMP2"
            
            # Вызываем функцию повторно с флагом retry
            aggressive_optimize "$INPUT" $file_size_mb $target_size_limit "retry"
            return
        else
            echo -e "  ${RED}⚠ Не удалось уменьшить размер файла до заданного лимита даже после повторной попытки${NC}"
        fi
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
        
        if [ $new_size -le $target_size_limit ]; then
            echo -e "  ${GREEN}✓ Размер файла в пределах лимита ($(format_size $target_size_limit))${NC}"
        else
            echo -e "  ${RED}✗ Размер файла превышает лимит ($(format_size $target_size_limit))${NC}"
        fi
        
        # Обновляем глобальные счетчики
        total_original_size=$((total_original_size + original_size))
        total_optimized_size=$((total_optimized_size + new_size))
        ((processed_count++))
        
        # Логирование
        echo "SUCCESS: $INPUT | $original_size -> $new_size | -${reduction}% | Лимит: $([ $new_size -le $target_size_limit ] && echo "Соблюден" || echo "Превышен")" >> "$LOG_FILE"
        
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

if ! command -v gltf-transform > /dev/null; then
    echo -e "${RED}Ошибка: gltf-transform не установлен${NC}"
    echo "Установите его командой: npm install -g @gltf-transform/cli"
    exit 1
fi

if ! command -v bc > /dev/null; then
    echo -e "${YELLOW}Внимание: утилита 'bc' не установлена, некоторые расчеты могут быть неточными${NC}"
fi

# Начало работы
echo -e "${YELLOW}═══════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}   АГРЕССИВНАЯ ОПТИМИЗАЦИЯ GLB/GLTF ФАЙЛОВ           ${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════${NC}"
echo "Начало: $(date)" | tee "$LOG_FILE"
echo -e "${CYAN}Целевой размер файлов: $(format_size $size_limit)${NC}"
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
    aggressive_optimize "$file" $size_mb $size_limit
done

# Итоговая статистика
echo -e "\n${YELLOW}═══════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}                 ИТОГОВАЯ СТАТИСТИКА                   ${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════${NC}"

if [ $processed_count -gt 0 ]; then
    total_saved=$((total_original_size - total_optimized_size))
    total_reduction=$(( 100 - (total_optimized_size * 100 / total_original_size) ))
    
    echo -e "\n${GREEN}Успешно оптимизировано:${NC} $processed_count из ${#files[@]} файлов"
    
    # Проверка, сколько файлов в пределах лимита
    files_within_limit=0
    files_exceeding_limit=0
    
    for file in "${files[@]}"; do
        size=$(get_file_size "$file")
        if [ $size -le $size_limit ]; then
            ((files_within_limit++))
        else
            ((files_exceeding_limit++))
        fi
    done
    
    echo -e "${GREEN}В пределах лимита ${size_limit}B:${NC} $files_within_limit из ${#files[@]} файлов"
    if [ $files_exceeding_limit -gt 0 ]; then
        echo -e "${RED}Превышают лимит:${NC} $files_exceeding_limit файлов"
    fi
    
    echo -e "\n${BLUE}Общая статистика:${NC}"
    echo -e "├─ Исходный размер: $(format_size $total_original_size)"
    echo -e "├─ Итоговый размер: $(format_size $total_optimized_size)"
    echo -e "├─ Сэкономлено:     ${GREEN}$(format_size $total_saved)${NC}"
    echo -e "└─ Общее сжатие:    ${GREEN}${total_reduction}%${NC}"
fi

echo -e "\n${CYAN}Лог сохранен в: $LOG_FILE${NC}"
