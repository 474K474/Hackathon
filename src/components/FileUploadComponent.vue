<!-- Поле ввода index / выбор файла (дизайн «РискСкор», экран 1) -->
<template>
  <div class="upload">
    <div class="pill">
      <template v-if="file">
        <div class="file-chip">
          <span class="ext">{{ fileExt }}</span>
          <span class="fname">{{ file.name }}</span>
          <span class="fsize">{{ fileSize }}</span>
          <button class="clear" title="Убрать файл" :disabled="disabled" @click="clearFile">×</button>
        </div>
      </template>
      <template v-else>
        <span class="prefix">index</span>
        <input
            v-model="localId"
            class="id-input"
            inputmode="numeric"
            placeholder="Введите ID"
            :disabled="disabled"
            @keydown.enter="run"
        >
        <button class="file-btn" title="Выбрать файл" :disabled="disabled" @click="pickFile">Файл…</button>
      </template>
      <button class="run-btn" :disabled="disabled || !canRun" @click="run">Проверить</button>
    </div>
    <input ref="fileInput" type="file" accept=".csv,.json" style="display:none" @change="onFile">
    <span class="hint">или перетащите CSV / JSON с признаками нового клиента</span>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';

const props = defineProps({
  disabled: { type: Boolean, default: false },
});

const emit = defineEmits(['analyze']);

const localId = ref('');
const file = ref(null);
const fileInput = ref(null);

const fileExt = computed(() => (file.value?.name.split('.').pop() || '').toUpperCase().slice(0, 4));
const fileSize = computed(() => file.value ? (file.value.size / 1024).toFixed(0) + ' КБ' : '');
const canRun = computed(() => !!file.value || !!localId.value.replace(/\D/g, ''));

const pickFile = () => fileInput.value?.click();

const setFile = (f) => {
  if (!f) return;
  file.value = f;
};

const onFile = (e) => {
  setFile(e.target.files[0]);
  e.target.value = '';
};

const clearFile = () => { file.value = null; };

const run = () => {
  if (props.disabled || !canRun.value) return;
  if (file.value) {
    emit('analyze', { type: 'file', files: [file.value] });
    return;
  }
  emit('analyze', { type: 'id', value: localId.value.replace(/\D/g, '') });
};

// Позволяет App.vue передать файл, брошенный на экран (drag & drop)
// и подставить index из истории
const setId = (id) => {
  file.value = null;
  localId.value = String(id);
};

defineExpose({ setFile, setId });
</script>

<style scoped>
.upload {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.pill {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 999px;
  padding: 6px 6px 6px 22px;
  gap: 10px;
  width: 440px;
  max-width: calc(100vw - 32px);
  box-sizing: border-box;
  box-shadow: 0 1px 2px rgba(0, 0, 0, .06);
}

.prefix {
  font-size: 13px;
  color: #8A8A85;
}

.id-input {
  flex: 1;
  min-width: 0;
  border: 0;
  background: transparent;
  font: 500 18px Onest, sans-serif;
  color: #161616;
  outline: none;
}

.id-input::placeholder {
  color: #C2C2BC;
  font-weight: 400;
}

.file-chip {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: -12px;
}

.ext {
  font: 600 10.5px Onest, sans-serif;
  letter-spacing: .06em;
  padding: 4px 7px;
  border-radius: 5px;
  background: #161616;
  color: #fff;
}

.fname {
  font-size: 14.5px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.fsize {
  font-size: 12.5px;
  color: #8A8A85;
  white-space: nowrap;
}

.clear {
  margin-left: auto;
  border: 0;
  background: transparent;
  font-size: 18px;
  line-height: 1;
  color: #8A8A85;
  cursor: pointer;
  padding: 4px 6px;
}

.clear:hover { color: #161616; }

.file-btn {
  height: 42px;
  padding: 0 14px;
  border: 0;
  border-radius: 999px;
  background: #F3F3F0;
  color: #161616;
  font: 500 13px Onest, sans-serif;
  cursor: pointer;
  white-space: nowrap;
}

.file-btn:hover { background: #E7E7E2; }

.run-btn {
  height: 42px;
  padding: 0 20px;
  border: 0;
  border-radius: 999px;
  background: #161616;
  color: #fff;
  font: 600 14px Onest, sans-serif;
  cursor: pointer;
  white-space: nowrap;
}

.run-btn:hover:not(:disabled) { background: #333; }
.run-btn:disabled { background: #A9A9A2; cursor: default; }

.hint {
  font-size: 12.5px;
  color: #8A8A85;
  text-align: center;
}
</style>
