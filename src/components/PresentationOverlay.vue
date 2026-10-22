<!--
  Презентация поверх сайта.
  Сама презентация лежит в public/presentation/index.html и открывается в iframe.
  Она шлёт сообщения:
    pres:slide      { slide, total } — текущий слайд
    pres:demo       — показать живой сайт (клавиша D или кнопка на слайде 9)
    pres:close      — закрыть презентацию (Esc или ×)
    pres:fullscreen — полный экран (клавиша F)
  Iframe не уничтожается при скрытии, поэтому после демо презентация
  возвращается на тот же слайд.
-->
<template>
  <Transition name="pres">
    <div v-if="loaded" v-show="mode === 'show'" class="pres-overlay">
      <iframe
          ref="frame"
          :src="src"
          title="Презентация «РискСкор»"
          allow="fullscreen"
          @load="focusFrame"
      ></iframe>
    </div>
  </Transition>

  <Transition name="pill">
    <button v-if="mode === 'demo'" class="pres-return" @click="open" title="Вернуться к презентации (Ctrl + →)">
      <svg viewBox="0 0 36 36" class="mini-ring" aria-hidden="true">
        <circle cx="18" cy="18" r="15" fill="none" stroke="#55554F" stroke-width="3" />
        <circle cx="18" cy="18" r="15" fill="none" stroke="#fff" stroke-width="3"
                :stroke-dasharray="`${94.25 * progress} 94.25`" transform="rotate(-90 18 18)" />
      </svg>
      <span>Вернуться к презентации</span>
      <span class="slide-no">слайд {{ slide }}</span>
    </button>
  </Transition>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';

const src = import.meta.env.BASE_URL + 'presentation/index.html';

const loaded = ref(false);     // iframe создан (создаём при первом открытии)
const mode = ref('off');       // off — скрыта, show — на экране, demo — показываем сайт
const slide = ref(1);
const total = ref(13);
const frame = ref(null);

const progress = computed(() => (total.value > 1 ? (slide.value - 1) / (total.value - 1) : 0));

const focusFrame = () => {
  try {
    frame.value?.focus();
    frame.value?.contentWindow?.focus();
    frame.value?.contentWindow?.postMessage({ type: 'pres:resume' }, location.origin);
  } catch { /* iframe ещё грузится */ }
};

const open = async () => {
  loaded.value = true;
  mode.value = 'show';
  await nextTick();
  focusFrame();
};

const toggleFullscreen = () => {
  try {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
    else document.exitFullscreen?.().catch(() => {});
  } catch { /* браузер не поддерживает */ }
};

const onMessage = (e) => {
  if (!frame.value || e.source !== frame.value.contentWindow) return;
  const d = e.data || {};
  if (d.type === 'pres:slide') { slide.value = d.slide; total.value = d.total; }
  else if (d.type === 'pres:demo') mode.value = 'demo';
  else if (d.type === 'pres:close') mode.value = 'off';
  else if (d.type === 'pres:fullscreen') toggleFullscreen();
};

// во время демо вернуться к презентации можно с клавиатуры: Ctrl + →
const onKey = (e) => {
  if (mode.value === 'demo' && e.ctrlKey && e.key === 'ArrowRight') { e.preventDefault(); open(); }
};

onMounted(() => { addEventListener('message', onMessage); addEventListener('keydown', onKey); });
onBeforeUnmount(() => { removeEventListener('message', onMessage); removeEventListener('keydown', onKey); });

defineExpose({ open });
</script>

<style scoped>
.pres-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: #F3F3F0;
}

.pres-overlay iframe {
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
}

.pres-return {
  position: fixed;
  right: 24px;
  bottom: 56px;
  z-index: 999;
  height: 48px;
  padding: 0 20px 0 12px;
  border: 0;
  border-radius: 999px;
  background: #161616;
  color: #fff;
  font: 600 14px Onest, sans-serif;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  box-shadow: 0 6px 24px rgba(22, 22, 22, .18);
}

.pres-return:hover { background: #333; }

.mini-ring { width: 26px; height: 26px; flex: none; }

.slide-no {
  font-weight: 500;
  color: #A9A9A2;
}

.pres-enter-active, .pres-leave-active { transition: opacity .45s ease, transform .6s cubic-bezier(.7, 0, .2, 1); }
.pres-enter-from, .pres-leave-to { opacity: 0; transform: translateY(24px); }

.pill-enter-active, .pill-leave-active { transition: opacity .3s ease, transform .3s ease; }
.pill-enter-from, .pill-leave-to { opacity: 0; transform: translateY(8px); }

@media (prefers-reduced-motion: reduce) {
  .pres-enter-active, .pres-leave-active, .pill-enter-active, .pill-leave-active { transition: none; }
}
</style>
