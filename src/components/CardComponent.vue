<!-- Ключевые факторы с редактированием значений (дизайн «РискСкор», экран 2) -->
<template>
  <section class="kf">
    <div class="head">
      <h2>Ключевые факторы</h2>
      <button v-if="changed" class="reset" data-noexport @click="emit('reset')">Сбросить значения</button>
    </div>
    <span class="sub">Нажмите на значение, чтобы смоделировать изменение риска</span>
    <div class="list">
      <div v-for="f in rows" :key="f.name" class="item">
        <span class="arrow" :style="{ color: f.color }">{{ f.arrow }}</span>
        <span class="name" :title="f.name">{{ f.name }}</span>
        <button
            class="val"
            :class="{ edited: f.changed }"
            @click="open(f)"
        >
          <span class="pen">✎</span><span>{{ num(f.value) }}</span>
        </button>
        <span class="base" title="Эталонное значение">{{ num(f.baseline_value) }}</span>
      </div>
    </div>

    <ChangeFeatureComponent
        v-if="editing"
        :name="editing.name"
        :old-value="editing.raw_value"
        :current-value="editing.value"
        :baseline-value="editing.baseline_value"
        @change="change"
        @close="editing = null"
    />
  </section>
</template>

<script setup>
import { computed, ref } from 'vue';
import ChangeFeatureComponent from '@/components/ChangeFeatureComponent.vue';
import { COLORS, num } from '@/utils/risk.js';

const props = defineProps({
  // [{ name, raw_value, baseline_value, shap, value, changed }]
  features: { type: Array, default: () => [] },
  changed: { type: Boolean, default: false },
});

const emit = defineEmits(['changeFeatureInCSV', 'reset']);

const editing = ref(null);

const rows = computed(() => props.features.map(f => {
  const flat = Math.abs(f.shap) < 0.005;
  return {
    ...f,
    arrow: flat ? '·' : f.shap > 0 ? '↑' : '↓',
    color: flat ? '#8A8A85' : f.shap > 0 ? COLORS.upText : COLORS.downText,
  };
}));

const open = (f) => { editing.value = f; };

const change = (newValue) => {
  emit('changeFeatureInCSV', { newValue, nameFeature: editing.value.name });
  editing.value = null;
};
</script>

<style scoped>
.kf {
  display: flex;
  flex-direction: column;
  gap: 12px;
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

.reset {
  border: 0;
  background: transparent;
  font: 500 13px Onest, sans-serif;
  color: #161616;
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
  padding: 0;
}

.sub {
  font-size: 12.5px;
  color: #8A8A85;
  margin-top: -4px;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.item {
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr) 92px 84px;
  gap: 12px;
  align-items: center;
  padding: 8px 8px 8px 14px;
  border-radius: 10px;
  background: #fff;
}

.arrow {
  font-size: 15px;
  font-weight: 600;
}

.name {
  font-size: 15px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.val {
  height: 34px;
  width: 100%;
  box-sizing: border-box;
  border: 1px solid #E4E4DE;
  border-radius: 8px;
  background: #F7F7F4;
  padding: 0 10px;
  font: 500 14px Onest, sans-serif;
  color: #161616;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.val:hover,
.val.edited {
  border-color: #161616;
  background: #fff;
}

.pen {
  font-size: 12px;
  color: #8A8A85;
}

.base {
  justify-self: end;
  padding: 5px 10px;
  border-radius: 8px;
  background: #E2EBF4; /* COLORS.baselineBg */
  color: #3C6E9F;      /* COLORS.baseline */
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  max-width: 100%;
  box-sizing: border-box;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
