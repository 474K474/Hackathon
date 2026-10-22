<!-- Модальное окно «Изменить значение признака» (дизайн «РискСкор») -->
<template>
  <Teleport to="body">
  <div class="modal-mask" @click.self="emit('close')">
    <div class="modal" @keydown.esc="emit('close')">
      <div class="top">
        <div class="titles">
          <span class="caption">Изменить значение признака</span>
          <span class="title">{{ name }}</span>
        </div>
        <button class="x" title="Закрыть" @click="emit('close')">×</button>
      </div>
      <div class="fields">
        <div class="field">
          <span class="caption">Исходное</span>
          <div class="orig">{{ num(oldValue) }}</div>
        </div>
        <label class="field">
          <span class="caption">Новое значение</span>
          <input ref="inputRef" v-model="draft" class="input" @keydown.enter="apply" @keydown.esc="emit('close')">
        </label>
      </div>
      <span v-if="baselineValue != null" class="baseline">Эталонное значение: {{ num(baselineValue) }}</span>
      <span v-if="!valid" class="error">Введите число</span>
      <div class="actions">
        <button class="cancel" @click="emit('close')">Отмена</button>
        <button class="apply" :disabled="!valid" @click="apply">Пересчитать риск</button>
      </div>
    </div>
  </div>
  </Teleport>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { num } from '@/utils/risk.js';

const props = defineProps({
  name: String,
  oldValue: Number,
  currentValue: Number,
  baselineValue: Number,
});

const emit = defineEmits(['change', 'close']);

const draft = ref(num(props.currentValue ?? props.oldValue));
const inputRef = ref(null);

const parsed = computed(() => parseFloat(String(draft.value).replace(',', '.').replace(/\s/g, '')));
const valid = computed(() => Number.isFinite(parsed.value));

const apply = () => {
  if (!valid.value) return;
  emit('change', parsed.value);
};

onMounted(() => {
  inputRef.value?.focus();
  inputRef.value?.select();
});
</script>

<style scoped>
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(22, 22, 22, .32);
  display: grid;
  place-items: center;
  z-index: 50;
  padding: 16px;
}

.modal {
  width: 400px;
  max-width: 100%;
  box-sizing: border-box;
  background: #fff;
  border-radius: 18px;
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, .18);
  font-family: Onest, sans-serif;
  color: #161616;
}

.top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.titles {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.caption {
  font-size: 12.5px;
  color: #8A8A85;
}

.title {
  font: 500 22px Unbounded, sans-serif;
  letter-spacing: -.03em;
  overflow-wrap: anywhere;
}

.x {
  border: 0;
  background: transparent;
  font-size: 22px;
  line-height: 1;
  color: #8A8A85;
  cursor: pointer;
  padding: 2px 4px;
}

.x:hover { color: #161616; }

.fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.orig {
  height: 48px;
  border-radius: 10px;
  background: #F3F3F0;
  display: flex;
  align-items: center;
  padding: 0 14px;
  font: 500 17px Onest, sans-serif;
  color: #55554F;
}

.input {
  height: 48px;
  box-sizing: border-box;
  border: 1.5px solid #161616;
  border-radius: 10px;
  padding: 0 14px;
  font: 500 17px Onest, sans-serif;
  color: #161616;
  outline: none;
  width: 100%;
}

.baseline {
  font-size: 12.5px;
  color: #8A8A85;
  margin-top: -10px;
}

.error {
  font-size: 12.5px;
  color: #B8452D;
  margin-top: -10px;
}

.actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.cancel {
  height: 44px;
  padding: 0 18px;
  border: 1px solid #D6D6D0;
  border-radius: 999px;
  background: #fff;
  font: 500 14px Onest, sans-serif;
  color: #161616;
  cursor: pointer;
}

.cancel:hover { border-color: #161616; }

.apply {
  height: 44px;
  padding: 0 22px;
  border: 0;
  border-radius: 999px;
  background: #161616;
  color: #fff;
  font: 600 14px Onest, sans-serif;
  cursor: pointer;
}

.apply:disabled { background: #A9A9A2; cursor: default; }
</style>
