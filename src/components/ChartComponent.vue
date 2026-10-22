<!-- Вклад признаков: двусторонние SHAP-столбики (дизайн «РискСкор», экран 2) -->
<template>
  <section class="shap">
    <div class="head">
      <h2>Вклад признаков</h2>
      <span class="note">Отклонение от среднего по не-банкротам</span>
    </div>
    <div class="rows">
      <div class="row axis-top">
        <span></span>
        <div class="halves"><span>← снижает</span><span class="r">повышает →</span></div>
        <span></span>
      </div>
      <div v-for="s in bars" :key="s.name" class="row bar-row">
        <span class="name" :title="s.name">{{ s.name }}</span>
        <div class="track">
          <div class="neg"><div class="bar l" :style="{ width: s.neg, background: s.color }"></div></div>
          <div class="pos"><div class="bar r" :style="{ width: s.pos, background: s.color }"></div></div>
          <div class="zero"></div>
        </div>
        <span class="delta" :style="{ color: s.color }">{{ s.delta }}</span>
      </div>
      <div class="row axis-bottom">
        <span></span>
        <div class="zero-label">0</div>
        <span></span>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';
import { COLORS, signed } from '@/utils/risk.js';

const props = defineProps({
  // [{ name, shap }]
  features: { type: Array, default: () => [] },
});

const bars = computed(() => {
  const list = [...props.features].sort((a, b) => Math.abs(b.shap) - Math.abs(a.shap));
  const max = Math.max(...list.map(f => Math.abs(f.shap)), 1e-6);
  return list.map(f => ({
    name: f.name,
    neg: f.shap < 0 ? (Math.abs(f.shap) / max * 100) + '%' : '0%',
    pos: f.shap > 0 ? (f.shap / max * 100) + '%' : '0%',
    color: Math.abs(f.shap) < 0.005 ? COLORS.neutral : f.shap > 0 ? COLORS.up : COLORS.down,
    delta: signed(f.shap),
  }));
});
</script>

<style scoped>
.shap {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}

.head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 16px;
}

h2 {
  margin: 0;
  font: 500 20px Unbounded, sans-serif;
  letter-spacing: -.03em;
}

.note {
  font-size: 12px;
  color: #8A8A85;
}

.rows {
  display: flex;
  flex-direction: column;
}

.row {
  display: grid;
  grid-template-columns: 150px minmax(0, 1fr) 60px;
  gap: 14px;
  align-items: center;
}

.axis-top {
  padding: 4px 0 10px;
  font-size: 12px;
  color: #8A8A85;
}

.halves {
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.halves .r { text-align: right; }

.bar-row {
  padding: 16px 0;
  border-top: 1px solid #E4E4DE;
}

.name {
  font-size: 15px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #161616;
}

.track {
  display: grid;
  grid-template-columns: 1fr 1fr;
  height: 18px;
  position: relative;
}

.neg { display: flex; justify-content: flex-end; }
.pos { display: flex; }

.bar {
  height: 100%;
  transition: width .35s;
}

.bar.l { border-radius: 3px 0 0 3px; }
.bar.r { border-radius: 0 3px 3px 0; }

.zero {
  position: absolute;
  left: 50%;
  top: -17px;
  bottom: -17px;
  width: 1.5px;
  background: #161616;
  transform: translateX(-50%);
}

.delta {
  text-align: right;
  font-size: 14px;
  font-weight: 600;
}

.axis-bottom {
  padding: 8px 0;
  border-top: 1px solid #E4E4DE;
  font-size: 12px;
  color: #8A8A85;
}

.zero-label { text-align: center; }

@media (max-width: 640px) {
  .row { grid-template-columns: 92px minmax(0, 1fr) 52px; gap: 10px; }
  .name { font-size: 14px; }
  .head { flex-direction: column; gap: 4px; }
}
</style>
