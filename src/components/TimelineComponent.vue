<template>
  <Toast/>
  <div class="dialog-content-wrapper pt-3">
    <div class="flex justify-center w-full px-3">
      <Timeline :value="timelineSteps" class="custom-timeline">
        <template #marker="slotProps">
          <span
              class="flex items-center justify-center text-white shadow-md transition-all duration-300"
              :style="getMarkerStyle(slotProps.index)"
              :class="{ 'current-pulse': currentStepIndex === slotProps.index }"
          >
            <i :class="getMarkerIcon(slotProps.index)" style="font-size: 1.1rem;"></i>
          </span>
        </template>

        <template #content="slotProps">
          <span
              class="ml-3 text-lg flex items-center font-medium"
              style="height: 50px; line-height: 50px; white-space: nowrap;"
              :class="{ 'font-bold text-[var(--p-primary-color)]': currentStepIndex === slotProps.index }"
          >
            {{ slotProps.item.label }}
          </span>
        </template>
      </Timeline>
    </div>

    <div class="card-footer-center mt-5 pt-4 border-t border-gray-200">
      <div class="flex flex-col items-center w-full">
        <div class="indicator-fixed-box mb-2">
          <ProgressSpinner
              strokeWidth="5"
              class="spinner-transform-target"
              :class="{ 'is-success-state': currentStatus === 'success' }"
          />
          <i
              class="pi pi-check success-check-icon"
              :class="{ 'show-icon': currentStatus === 'success' }"
          ></i>
        </div>

        <!-- текущий текст -->
        <p
            class="text-lg m-0 transition-colors duration-300 font-semibold text-center"
            :class="currentStatus === 'success' ? 'text-green-600 font-bold' : 'text-slate-700'"
        >
          {{ currentStatus === 'success' ? 'Успешно!' : statusMessages[currentStatus] }}
        </p>

        <!-- кнопка закрытия при успехе -->
        <!--        <div v-if="currentStatus === 'success'" class="w-full mt-4 border-t border-gray-100 pt-3">-->
        <!--          <Button label="Отлично" severity="success" class="w-full" @click="emit('close')" />-->
        <!--        </div>-->

      </div>
    </div>

  </div>
</template>


<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import Timeline from 'primevue/timeline';
import ProgressSpinner from 'primevue/progressspinner';
import Button from 'primevue/button';
import Toast from 'primevue/toast';

import { startTaskPolling } from '@/services/api.js';
import axios from "axios";
import {useToast} from "primevue/usetoast";

const emit = defineEmits(['close']);

const toast = useToast();

const currentStatus = ref('loading');
const errorMessage = ref('');
let stopPollingFn = null;

const toastLife = 3000;

const timelineSteps = ref([
  { label: 'Загрузка файла', icon: 'pi pi-file-import', hex: '#3B82F6' },
  { label: 'Предобработка данных', icon: 'pi pi-cog', hex: '#F97316' },
  { label: 'Инференс ML-модели', icon: 'pi pi-bolt', hex: '#A855F7' },
  { label: 'Визуализация', icon: 'pi pi-chart-bar', hex: '#06B6D4' }
]);

const statusMessages = {
  loading: 'Принимаем датасет на сервере...',
  preload: 'Очищаем данные от шумов и пропусков...',
  inference: 'Алгоритмы ИИ рассчитывают прогноз...',
  visual: 'Упаковываем цифры в аналитические графики...',
  error: 'Технические шоколадки...'
};

const currentStepIndex = computed(() => {
  const mapping = { loading: 0, preload: 1, inference: 2, visual: 3, success: 4 };
  return mapping[currentStatus.value] ?? 0;
});

const getMarkerStyle = (index) => {
  const baseStyle = {
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease'
  };

  if (currentStepIndex.value > index || currentStatus.value === 'success') {
    return { ...baseStyle, backgroundColor: '#22C55E' };
  }

  if (currentStepIndex.value === index) {
    return {
      ...baseStyle,
      backgroundColor: timelineSteps.value[index].hex,
      transform: 'scale(1.15)'
    };
  }

  return {
    ...baseStyle,
    backgroundColor: timelineSteps.value[index].hex,
    opacity: '0.35'
  };
};

const getMarkerIcon = (index) => {
  if (currentStepIndex.value > index || currentStatus.value === 'success') return 'pi pi-check';
  return timelineSteps.value[index].icon;
};

onMounted(async() => {
  let taskId;
  if (import.meta.env.VITE_IS_MOCK_MODE === 'true') {
    taskId = '42';

    currentStatus.value = 'loading';
  } else {
    try {
      const res = await axios(import.meta.env.VITE_API_URL + "/start");

      taskId = res.data.taskId;
      currentStatus.value = res.data.status;
    } catch (e) {
      currentStatus.value = 'error';
      errorMessage.value = e.message || e || "Не удалось инициализировать задачу на сервере.";

      toast.add({
        severity: "error",
        summary: "Error",
        detail: errorMessage.value,
        life: toastLife,
      });

      setTimeout(() => {
        emit('close')
      }, toastLife);
      return;
    }
  }


  stopPollingFn = startTaskPolling(taskId, currentStatus, {
    onSuccess: () => {
      console.log('Компонент зафиксировал: все данные готовы!');
      setTimeout(() => {
        emit('close');
      }, 1000);
    },
    onError: (err) => {
      currentStatus.value = 'error';
      errorMessage.value = err;

      toast.add({
        severity: "error",
        summary: "Error",
        detail: errorMessage.value,
        life: toastLife,
      });

      setTimeout(() => {
        emit('close');
      }, toastLife);
    }
  });


});

onUnmounted(() => {
  if (stopPollingFn) stopPollingFn();
});
</script>


<style scoped>
/* Центрирование нижнего контента */
.card-footer-center {
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: center !important;
  text-align: center !important;
  width: 100% !important;
}

/* ИЗОЛИРОВАННАЯ ФЛЕКС-ОБЕРТКА ДЛЯ ИНДИКАТОРА */
.indicator-fixed-box {
  position: relative !important;
  width: 2rem !important;
  height: 2rem !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  margin: 0 auto !important;
}

/* Базовый спиннер */
.spinner-transform-target {
  display: block !important;
  width: 2rem !important;
  height: 2rem !important;
  margin: 0 !important;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.spinner-transform-target ::v-deep(.p-progressspinner-circle) {
  transition: stroke 0.5s ease, stroke-dasharray 0.5s ease;
}

/* 🌟 Жестко ЗАМОРАЖИВАЕМ анимацию в текущем кадре вместо сброса */
.spinner-transform-target.is-success-state,
.spinner-transform-target.is-success-state ::v-deep(.p-progressspinner-spinner),
.spinner-transform-target.is-success-state ::v-deep(svg) {
  animation-play-state: paused !important; /* Останавливает вращение на месте */
}

.spinner-transform-target.is-success-state ::v-deep(.p-progressspinner-circle) {
  stroke: transparent !important;      /* 🌟 Убираем цвет линии обводки, чтобы полностью скрыть хвост */
  stroke-width: 0 !important;          /* 🌟 Обнуляем толщину линии, чтобы убрать субпиксельные артефакты */
  stroke-dasharray: 280, 0 !important;
  fill: #22c55e !important;
  animation-play-state: paused !important;
}

/* Стили для белой галочки */
.success-check-icon {
  position: absolute;
  color: #ffffff !important;
  font-size: 0.9rem;
  font-weight: 900;
  opacity: 0;
  transform: scale(0.5);
  transition: opacity 0.3s ease 0.2s, transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.2s;
  pointer-events: none;
  z-index: 2;
}

.success-check-icon.show-icon {
  opacity: 1;
  transform: scale(1);
}

/* Таймлайн стили */
.custom-timeline {
  width: fit-content;
  margin: 0 auto;
  padding: 20px 0 10px 0 !important;
}

::v-deep(.p-timeline-event) {
  overflow: visible !important;
}
::v-deep(.p-timeline-event-content) {
  flex-grow: 0 !important;
}
::v-deep(.p-timeline-event-opposite) {
  display: none !important;
}
::v-deep(.p-timeline-event-marker) {
  background: transparent !important;
  border: none !important;
  padding: 0 !important;
}
::v-deep(.p-timeline-event-connector) {
  width: 2px !important;
  background-color: #cbd5e1 !important;
}

/* Пульсация маркеров */
.current-pulse {
  animation: markerPulse 2s infinite ease-in-out;
}
@keyframes markerPulse {
  0% { box-shadow: 0 0 0 0 rgba(100, 116, 139, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(100, 116, 139, 0); }
  100% { box-shadow: 0 0 0 0 rgba(100, 116, 139, 0); }
}
</style>
