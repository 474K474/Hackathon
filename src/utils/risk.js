// Общие правила отображения риска (по дизайну «РискСкор»)

export const COLORS = {
    up: '#D0603F',      // столбик: повышает риск
    down: '#4C9A6F',    // столбик: снижает риск
    upText: '#B8452D',
    downText: '#2F7550',
    neutral: '#A9A9A2',
};

const LEVELS = [
    { max: 0.10, label: 'Низкий риск', color: '#2E8B57', verb: 'Можно одобрять по стандартной процедуре.' },
    { max: 0.30, label: 'Умеренный риск', color: '#A9861A', verb: 'Запросите подтверждение дохода.' },
    { max: 0.60, label: 'Высокий риск', color: '#C26A1C', verb: 'Нужна ручная проверка андеррайтером.' },
    { max: Infinity, label: 'Критический риск', color: '#B83A2E', verb: 'Рекомендуем отказ или кредитный комитет.' },
];

export const classify = (p) => LEVELS.find(l => p < l.max);

// 0.843 -> "84,3"
export const pct1 = (p) => (p * 100).toFixed(1).replace('.', ',');

// Число со знаком в русской записи: +0,90 / −0,40
export const signed = (v, digits = 2) => {
    if (Math.abs(v) < 0.5 * 10 ** -digits) return (0).toFixed(digits).replace('.', ',');
    return (v > 0 ? '+' : '−') + Math.abs(v).toFixed(digits).replace('.', ',');
};

export const num = (v) => (v == null ? '—' : String(v).replace('.', ','));

export const formatId = (id) => String(id ?? '').replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

const logit = (p) => Math.log(p / (1 - p));
const sigmoid = (x) => 1 / (1 + Math.exp(-x));

/**
 * Сценарий «что если»: локальная оценка нового риска после изменения признаков.
 * SHAP-вклад признака масштабируется линейно по отклонению от эталона,
 * изменение суммируется в пространстве логитов.
 * Когда на бэкенде появится пересчёт — заменить на запрос к API.
 */
export const applyOverrides = (data, overrides) => {
    if (!data) return null;
    let deltaLogit = 0;
    const features = (data.top_features || []).map(f => {
        const ov = overrides[f.name];
        if (ov == null) return { ...f, shap: f.shap_value, value: f.raw_value, changed: false };
        const span = f.raw_value - f.baseline_value;
        const shap = span === 0 ? f.shap_value : f.shap_value * (ov - f.baseline_value) / span;
        deltaLogit += shap - f.shap_value;
        return { ...f, shap, value: ov, changed: ov !== f.raw_value };
    });
    const p0 = Math.min(0.999, Math.max(0.001, data.probability));
    const probability = deltaLogit === 0 ? data.probability : sigmoid(logit(p0) + deltaLogit);
    return { probability, features, changed: features.some(f => f.changed) };
};
