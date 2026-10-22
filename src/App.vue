<template>
  <Toast />
  <div class="viewport">
    <div class="slider" :class="{ down: isDown }">

      <!-- ЭКРАН 1: кольцо с вероятностью и ввод -->
      <div
          class="screen screen-1"
          :class="{ 'is-hidden': isDown }"
          @dragover.prevent="dragging = true"
          @dragleave="onDragLeave"
          @drop.prevent="onDrop"
          @wheel="onWheelHero"
      >
        <header class="topbar">
          <span class="logo">риск/скор</span>
          <span class="muted">История</span>
        </header>

        <div class="hero">
          <div class="risk-ring">
            <svg class="ring-svg" :class="{ spinning: isAnalyzing }" viewBox="0 0 360 360" aria-hidden="true">
              <circle cx="180" cy="180" r="175" fill="none" stroke="#DCDCD6" stroke-width="10" />
              <circle
                  cx="180" cy="180" r="175" fill="none" stroke-width="10"
                  :stroke="ringArc.color"
                  :stroke-dasharray="ringArc.dash"
                  class="ring-arc"
              />
            </svg>
            <div class="ring-inner">
              <template v-if="isAnalyzing">
                <span class="big">··</span>
                <span class="level" style="color:#55554F">Анализ ИИ…</span>
              </template>
              <template v-else-if="view">
                <span class="big">{{ Math.round(view.probability * 100) }}<span class="pct">%</span></span>
                <span class="level" :style="{ color: level.color }">{{ level.label }}</span>
              </template>
              <template v-else>
                <span class="big empty">—<span class="pct">%</span></span>
                <span class="level" style="color:#8A8A85">Нет данных</span>
              </template>
            </div>
          </div>

          <span class="verb">
            {{ view && !isAnalyzing ? level.verb : 'Введите index клиента или загрузите файл с признаками.' }}
          </span>

          <FileUploadComponent ref="uploadRef" :disabled="isAnalyzing" @analyze="startLoading" />

          <!-- последние 4 проверки (локальная история) -->
          <div v-if="history.length" class="recent">
            <button
                v-for="h in history"
                :key="h.type + ':' + h.value"
                class="recent-item"
                :disabled="isAnalyzing"
                :title="historyTitle(h)"
                @click="openHistory(h)"
            >
              {{ h.type === 'file' ? shortName(h.value) : formatId(h.value) }}
            </button>
          </div>
        </div>

        <button v-if="view" class="round-btn down-btn" title="Подробнее" @click="isDown = true">↓</button>
        <div v-else class="down-spacer"></div>

        <div v-if="dragging" class="drop-overlay">
          <span class="drop-title">Отпустите файл</span>
          <span class="drop-sub">CSV или JSON с признаками клиента</span>
        </div>
      </div>

      <!-- ЭКРАН 2: подробности -->
      <div
          v-if="view"
          ref="pdfContent"
          class="screen screen-2"
          :class="{ 'is-hidden': !isDown }"
          @wheel="onWheelDetails"
      >
        <div class="detail-head">
          <div class="who">
            <button class="round-btn small" title="Наверх" data-noexport @click="isDown = false">↑</button>
            <span class="dot" :style="{ background: level.color }"></span>
            <span class="subject">{{ subject }}</span>
            <span class="strong">{{ pct1(view.probability) }} %</span>
            <span :style="{ color: level.color }">{{ level.label }}</span>
            <span v-if="view.changed" class="was">было {{ pct1(stateData.probability) }} % · сценарий «что если»</span>
          </div>
          <button class="pdf-btn" data-noexport @click="exportToPDF">Скачать отчёт PDF</button>
        </div>

        <div class="legend">
          <span class="lg"><span class="sw" style="background:#D0603F"></span>повышает риск</span>
          <span class="lg"><span class="sw" style="background:#4C9A6F"></span>снижает риск</span>
          <span class="muted">— цвета одинаковы для признаков, факторов и слов</span>
        </div>

        <div class="grid">
          <ChartComponent :features="view.features" />
          <div class="side">
            <CardComponent
                :features="view.features"
                :changed="view.changed"
                @change-feature-in-c-s-v="changeFeature"
                @reset="overrides = {}"
            />
            <WordsComponent :words="stateData.top_words || []" />
          </div>
        </div>

        <div class="footer">
          <span>Модель прогноза банкротства физлиц</span>
          <span>{{ analyzedAt }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import axios from 'axios';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import FileUploadComponent from '@/components/FileUploadComponent.vue';
import CardComponent from '@/components/CardComponent.vue';
import ChartComponent from '@/components/ChartComponent.vue';
import WordsComponent from '@/components/WordsComponent.vue';
import { clearAppState, stateData } from '@/composables/useAppState.js';
import { addToHistory, history, seedHistory } from '@/composables/useHistory.js';
import { applyOverrides, classify, formatId, pct1 } from '@/utils/risk.js';

const toast = useToast();

const isMock = import.meta.env.VITE_IS_MOCK_MODE === 'true';

const isAnalyzing = ref(false);
const isDown = ref(false);
const dragging = ref(false);
const uploadRef = ref(null);
const pdfContent = ref(null);
const fileRef = ref(null);
const sourceName = ref('');      // имя файла, если анализировали файл
const analyzedAt = ref('');
const overrides = ref({});       // { [featureName]: newValue } — сценарий «что если»

// Данные с учётом изменённых пользователем признаков
const view = computed(() => applyOverrides(stateData.value, overrides.value));
const level = computed(() => classify(view.value?.probability ?? 0));

const subject = computed(() => sourceName.value
    ? 'Новый объект · ' + sourceName.value
    : 'Клиент № ' + formatId(stateData.value?.id));

const RING_C = 2 * Math.PI * 175;
const ringArc = computed(() => {
  if (isAnalyzing.value) return { color: '#161616', dash: `${RING_C * 0.18} ${RING_C}` };
  const p = view.value ? view.value.probability : 0;
  return { color: level.value.color, dash: `${RING_C * p} ${RING_C}` };
});

// --- история проверок ---
if (isMock) {
  // тестовые index из public/mock-clients.json — по одному на каждый уровень риска
  seedHistory([
    { type: 'id', value: '7743', probability: 0.05 },
    { type: 'id', value: '88410', probability: 0.27 },
    { type: 'id', value: '52011', probability: 0.46 },
    { type: 'id', value: '184327', probability: 0.89 },
  ]);
}

const formatDate = (ts) => new Date(ts).toLocaleString('ru-RU', {
  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
}).replace(',', '');

const shortName = (name) => name.length > 18 ? name.slice(0, 15) + '…' : name;

const historyTitle = (h) => {
  const what = h.type === 'file' ? 'Файл ' + h.value : 'index ' + h.value;
  return h.probability != null
      ? `${what} · ${pct1(h.probability)} % · ${classify(h.probability).label}`
      : what;
};

const openHistory = (h) => {
  if (isAnalyzing.value) return;
  if (h.type === 'id') {
    uploadRef.value?.setId(h.value);
    startLoading({ type: 'id', value: h.value });
    return;
  }
  // файл повторно не читаем — показываем сохранённый результат
  if (!h.data) return;
  overrides.value = {};
  isDown.value = false;
  sourceName.value = h.value;
  stateData.value = h.data;
  analyzedAt.value = formatDate(h.at);
  addToHistory(h);
};

// --- мок-режим: набор тестовых клиентов ---
const hashStr = (str) => {
  let h = 2166136261;
  for (const c of String(str)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  return h >>> 0;
};

const mockRequest = async (payload) => {
  try {
    const { data: clients } = await axios.get('/mock-clients.json');
    const keys = Object.keys(clients);
    if (payload?.type === 'file') {
      const name = payload.files?.[0]?.name ?? '';
      return { data: clients[keys[hashStr(name) % keys.length]] };
    }
    const id = String(payload?.value ?? '');
    if (clients[id]) return { data: clients[id] };
    // неизвестный index — берём одного из тестовых клиентов, но с введённым index
    return { data: { ...clients[keys[hashStr(id) % keys.length]], id: Number(id) || id } };
  } catch {
    return axios.get('/mock-data.json');
  }
};

// --- навигация между экранами ---
const onWheelHero = (e) => { if (view.value && e.deltaY > 40) isDown.value = true; };
const onWheelDetails = (e) => {
  if (e.deltaY < -40 && e.currentTarget.scrollTop === 0) isDown.value = false;
};

// --- drag & drop ---
const onDragLeave = (e) => {
  if (!e.currentTarget.contains(e.relatedTarget)) dragging.value = false;
};
const onDrop = (e) => {
  dragging.value = false;
  const f = e.dataTransfer?.files?.[0];
  if (f) uploadRef.value?.setFile(f);
};

// --- сценарий «что если» ---
// Сейчас пересчёт локальный (utils/risk.js → applyOverrides).
// Если на бэкенде появится эндпоинт пересчёта — отправлять запрос здесь.
const changeFeature = ({ newValue, nameFeature }) => {
  overrides.value = { ...overrides.value, [nameFeature]: newValue };
};

// --- экспорт в PDF ---
const exportToPDF = async () => {
  const el = pdfContent.value;
  if (!el) return;
  try {
    const width = el.scrollWidth;
    const height = el.scrollHeight;
    const dataUrl = await toPng(el, {
      quality: 0.95,
      pixelRatio: 2,
      backgroundColor: '#F3F3F0',
      width,
      height,
      style: { opacity: '1', overflow: 'visible', height: height + 'px' },
      filter: (node) => !(node.dataset && 'noexport' in node.dataset),
    });
    const pdf = new jsPDF({
      orientation: width >= height ? 'landscape' : 'portrait',
      unit: 'px',
      format: [width + 40, height + 40],
    });
    pdf.addImage(dataUrl, 'PNG', 20, 20, width, height);
    pdf.save(`riskscore-${stateData.value?.id ?? 'report'}.pdf`);
  } catch (error) {
    console.error('Не удалось сгенерировать PDF:', error);
    toast.add({ severity: 'error', summary: 'PDF', detail: 'Не удалось сформировать отчёт', life: 3000 });
  }
};

// --- запрос к модели ---
const startLoading = async (payload) => {
  clearAppState();
  overrides.value = {};
  isDown.value = false;
  isAnalyzing.value = true;
  sourceName.value = payload?.type === 'file' ? payload.files?.[0]?.name ?? '' : '';

  const url = import.meta.env.VITE_API_URL + '/result';

  try {
    let res;
    if (isMock) {
      res = await mockRequest(payload);
      await new Promise(r => setTimeout(r, 900)); // чтобы было видно состояние загрузки
    } else if (payload?.type === 'id') {
      res = await axios.get(url, { params: { id: payload.value } });
    } else if (payload?.type === 'file') {
      fileRef.value = payload.files;
      const formData = new FormData();
      if (payload.files && payload.files.length > 0) {
        formData.append('file', payload.files[0]);
      }
      res = await axios.post(url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }

    if (res) {
      stateData.value = res.data;
      analyzedAt.value = formatDate(Date.now());
      addToHistory(payload?.type === 'file'
          ? { type: 'file', value: sourceName.value, probability: res.data.probability, data: res.data }
          : { type: 'id', value: String(payload?.value ?? res.data.id), probability: res.data.probability });
    }
  } catch (e) {
    console.error('Ошибка при выполнении запроса:', e);
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: e.response?.data?.message || e.message,
      life: 3000,
    });
  } finally {
    isAnalyzing.value = false;
  }
};
</script>

<style scoped>
.viewport {
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  position: relative;
  background: #F3F3F0;
  color: #161616;
  font-family: Onest, sans-serif;
}

.slider {
  transition: transform .9s cubic-bezier(.7, 0, .2, 1);
}

.slider.down {
  transform: translateY(-100vh);
  transform: translateY(-100dvh);
}

.screen {
  height: 100vh;
  height: 100dvh;
  position: relative;
  box-sizing: border-box;
  transition: opacity .6s ease;
}

.screen.is-hidden { opacity: 0; }

/* ---------- экран 1 ---------- */
.screen-1 {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 56px;
}

.topbar {
  height: 80px;
  flex: none;
  align-self: stretch;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
}

.logo {
  font: 600 15px Unbounded, sans-serif;
  letter-spacing: -.02em;
}

.muted { color: #8A8A85; }

.hero {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 32px;
}

.risk-ring {
  width: 360px;
  height: 360px;
  position: relative;
  display: grid;
  place-items: center;
  flex: none;
}

.ring-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.ring-svg.spinning { animation: spin 1s linear infinite; }

.ring-arc { transition: stroke-dasharray .6s ease, stroke .4s; }

@keyframes spin {
  from { transform: rotate(-90deg); }
  to { transform: rotate(270deg); }
}

.ring-inner {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.big {
  font: 500 88px/1 Unbounded, sans-serif;
  letter-spacing: -.06em;
}

.big.empty { color: #C2C2BC; }

.pct { font-size: 36px; }

.level {
  font-size: 15px;
  font-weight: 500;
}

.verb {
  font-size: 15px;
  color: #55554F;
  max-width: 420px;
  text-align: center;
  text-wrap: balance;
}

.recent {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px;
  margin-top: -16px;
}

.recent-item {
  border: 0;
  background: transparent;
  padding: 4px 8px;
  font: 500 12.5px Onest, sans-serif;
  color: #8A8A85;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 3px;
  white-space: nowrap;
}

.recent-item:hover:not(:disabled) { color: #161616; }
.recent-item:disabled { cursor: default; opacity: .5; }

.round-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid #D6D6D0;
  background: transparent;
  color: #8A8A85;
  font-size: 16px;
  cursor: pointer;
  display: grid;
  place-items: center;
  flex: none;
}

.round-btn:hover {
  color: #161616;
  border-color: #161616;
}

.round-btn.small {
  width: 34px;
  height: 34px;
  font-size: 14px;
}

.down-btn { margin-bottom: 22px; }
.down-spacer { height: 62px; flex: none; }

.drop-overlay {
  position: absolute;
  inset: 16px;
  border: 2px dashed #161616;
  border-radius: 20px;
  background: rgba(243, 243, 240, .92);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  pointer-events: none;
  z-index: 10;
}

.drop-title {
  font: 500 28px Unbounded, sans-serif;
  letter-spacing: -.03em;
}

.drop-sub {
  font-size: 14px;
  color: #55554F;
}

/* ---------- экран 2 ---------- */
.screen-2 {
  display: flex;
  flex-direction: column;
  padding: 0 48px;
  background: #F3F3F0;
  overflow-y: auto;
  transition: opacity .7s ease .25s;
}

.detail-head {
  min-height: 72px;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid #E4E4DE;
}

.who {
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 14px;
  flex-wrap: wrap;
  min-width: 0;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.subject,
.strong { font-weight: 500; }

.was {
  font-size: 12.5px;
  color: #8A8A85;
  white-space: nowrap;
}

.pdf-btn {
  height: 40px;
  padding: 0 20px;
  border: 0;
  border-radius: 999px;
  background: #161616;
  color: #fff;
  font: 600 13.5px Onest, sans-serif;
  cursor: pointer;
  white-space: nowrap;
  flex: none;
}

.pdf-btn:hover { background: #333; }

.legend {
  flex: none;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 22px;
  padding: 18px 0 0;
  font-size: 13px;
  color: #55554F;
}

.lg {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sw {
  width: 12px;
  height: 12px;
  border-radius: 3px;
}

.grid {
  flex: 1;
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
  gap: 48px;
  padding: 22px 0 24px;
}

.side {
  display: flex;
  flex-direction: column;
  gap: 28px;
  min-width: 0;
}

.footer {
  height: 40px;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid #E4E4DE;
  font-size: 12px;
  color: #8A8A85;
}

/* ---------- узкие экраны ---------- */
@media (max-width: 960px) {
  .grid {
    grid-template-columns: minmax(0, 1fr);
    gap: 36px;
  }
}

@media (max-width: 640px) {
  .screen-1 { padding: 0 16px; }
  .screen-2 { padding: 0 16px; }
  .risk-ring { width: 280px; height: 280px; }
  .big { font-size: 68px; }
  .hero { gap: 24px; }
  .detail-head { flex-wrap: wrap; padding: 12px 0; }
}

@media (max-height: 760px) and (min-width: 641px) {
  .risk-ring { width: 300px; height: 300px; }
  .big { font-size: 72px; }
  .hero { gap: 24px; }
}
</style>
