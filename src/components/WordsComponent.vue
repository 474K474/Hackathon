<!-- Текстовые данные: слова, влияющие на риск (дизайн «РискСкор», экран 2) -->
<template>
  <section class="words">
    <div class="head">
      <h2>Текстовые данные</h2>
      <span v-if="list.length" class="counts">
        <span class="up">↑ {{ riskCount }}</span>
        <span class="down">↓ {{ safeCount }}</span>
      </span>
    </div>
    <div v-if="list.length" class="chips">
      <span
          v-for="w in list"
          :key="w.name"
          class="chip"
          :style="{ background: w.bg, color: w.color, fontSize: w.fs }"
          :title="'SHAP: ' + w.delta"
      >
        <span>{{ w.name }}</span><span class="v">{{ w.delta }}</span>
      </span>
    </div>
    <span v-else class="empty">Текстовых данных нет — оценка только по табличным признакам.</span>
  </section>
</template>

<script setup>
import { computed } from 'vue';
import { COLORS, signed } from '@/utils/risk.js';

const props = defineProps({
  // [{ name, shap_value }]
  words: { type: Array, default: () => [] },
});

const list = computed(() => {
  const sorted = [...props.words].sort((a, b) => Math.abs(b.shap_value) - Math.abs(a.shap_value)).slice(0, 12);
  const max = Math.max(...sorted.map(w => Math.abs(w.shap_value)), 1e-6);
  return sorted.map(w => {
    const risk = w.shap_value > 0;
    return {
      name: w.name,
      delta: signed(w.shap_value),
      risk,
      color: risk ? COLORS.upText : COLORS.downText,
      bg: risk ? '#F6DED6' : '#DCEDE2',
      fs: (13 + Math.abs(w.shap_value) / max * 9).toFixed(0) + 'px',
    };
  });
});

const riskCount = computed(() => list.value.filter(w => w.risk).length);
const safeCount = computed(() => list.value.filter(w => !w.risk).length);
</script>

<style scoped>
.words {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
}

.head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
}

h2 {
  margin: 0;
  font: 500 20px Unbounded, sans-serif;
  letter-spacing: -.03em;
}

.counts {
  display: flex;
  gap: 12px;
  font-size: 12.5px;
  font-weight: 600;
}

.up { color: #B8452D; }
.down { color: #2F7550; }

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: baseline;
}

.chip {
  display: flex;
  align-items: baseline;
  gap: 5px;
  padding: 5px 11px;
  border-radius: 999px;
  font-weight: 500;
}

.v {
  font-size: 12px;
  font-weight: 600;
  opacity: .75;
}

.empty {
  font-size: 13.5px;
  color: #8A8A85;
  padding: 14px 0;
  border-top: 1px solid #E4E4DE;
}
</style>
