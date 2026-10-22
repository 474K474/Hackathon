import { ref } from 'vue';

// Локальная история проверок (хранится в localStorage браузера, у каждого пользователя своя)
const KEY = 'riskscore.history';
const LIMIT = 4;

const read = () => {
    try {
        const list = JSON.parse(localStorage.getItem(KEY) || '[]');
        return Array.isArray(list) ? list : [];
    } catch {
        return [];
    }
};

const write = (list) => {
    try {
        localStorage.setItem(KEY, JSON.stringify(list));
    } catch {
        // приватный режим / переполнение — история просто не сохранится
    }
};

export const history = ref(read());

/**
 * Добавить запись в начало истории.
 * entry: { type: 'id' | 'file', value: string, probability: number, data?: object }
 *  - для index храним только сам index — при клике запрос уйдёт заново;
 *  - для файла храним результат (сам файл браузер повторно прочитать не может).
 */
export const addToHistory = (entry) => {
    const key = entry.type + ':' + entry.value;
    const rest = history.value.filter(h => h.type + ':' + h.value !== key);
    history.value = [{ ...entry, at: Date.now() }, ...rest].slice(0, LIMIT);
    write(history.value);
};

// Для мок-режима: если истории нет, показать несколько тестовых index
export const seedHistory = (entries) => {
    if (history.value.length) return;
    history.value = entries.slice(0, LIMIT);
    write(history.value);
};
