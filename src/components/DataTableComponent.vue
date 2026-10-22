<template>
  <div class="ml-4 mt-4">
    <Button
        label="Запустить ML-анализ"
        icon="pi pi-play"
        severity="primary"
        size="large"
        @click="startLoading"
    />

    <DataTable
        :value="stateData || skeletonData"
        :paginator="stateData ? stateData.length > 10 : false"
        :rows="10"
        :rowsPerPageOptions="[5, 10, 20, 50]"
        tableStyle="min-width: 50rem"
        class="custom-table"
    >
      <Column field="name" header="Имя" style="width: 65%; min-width: 65%;">
        <template #body="slotProp">
          <Skeleton v-if="isRendering" width="80%" height="1.2rem"/>
          <span v-else>{{ slotProp.data.name }}</span>
        </template>

      </Column>
      <Column field="age" header="Возраст" style="width: 35%; min-width: 35%;">
        <template #body="slotProp">
          <Skeleton v-if="isRendering" width="40%" height="1.2rem"/>
          <span v-else>{{ slotProp.data.age }}</span>
        </template>
      </Column>
    </DataTable>

    <Dialog
        v-model:visible="isDialogVisible"
        modal
        header="Анализ данных алгоритмами ML"
        :style="{ width: '100%', maxWidth: '30rem' }"
        class="custom-v4-dialog"
        @hide="endLoading"
    >
      <TimelineComponent v-if="isDialogVisible" @close="isDialogVisible = false" />
    </Dialog>

  </div>
</template>

<script setup>
import {computed, ref} from 'vue';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import DataTable from "primevue/datatable";
import Column from 'primevue/column';
import Skeleton from "primevue/skeleton";
import {clearAppState, stateData} from "@/composables/useAppState.js";

import TimelineComponent from './TimelineComponent.vue';

const isDialogVisible = ref(false);
let isAnalyzing = ref(false);

const isRendering = computed(() => isAnalyzing.value && stateData.value === null);

const skeletonData = ref();


const startLoading = () => {
  clearAppState();
  skeletonData.value = [...Array(10).keys()];
  isDialogVisible.value = true;
  isAnalyzing.value = true;
}

const endLoading = () => {
  isAnalyzing.value = false;
  skeletonData.value = [];
}
</script>

<style scoped>
/* 🌟 ЖЕСТКАЯ ФИКСАЦИЯ ВЫСОТЫ СТРОК И ЯЧЕЕК */
.custom-table ::v-deep(.p-datatable-tbody > tr) {
  height: 50px !important; /* Фиксированная высота всей строки */
}

.custom-table ::v-deep(.p-datatable-tbody > tr > td) {
  height: 50px !important;
  padding: 0 1rem !important; /* Убираем вертикальные паддинги, чтобы они не раздували строку */
  white-space: nowrap; /* Запрещаем перенос текста, чтобы строка не увеличивалась в высоту */
  overflow: hidden;
  text-overflow: ellipsis; /* Если текст слишком длинный, он аккуратно обрежется в три точки (...) */
}

/* Стили центрирования шапки диалога остаются на родителе, так как Dialog рендерится в корне родителя */
.custom-v4-dialog ::v-deep(.p-dialog-header) {
  display: flex !important;
  justify-content: center !important;
  text-align: center !important;
  padding-bottom: 0 !important;
  position: relative;
}

.custom-v4-dialog ::v-deep(.p-dialog-header-actions) {
  position: absolute;
  right: 1.5rem;
  top: 1.5rem;
}

.custom-v4-dialog ::v-deep(.p-dialog-title) {
  width: 100% !important;
  text-align: center !important;
  color: var(--p-primary-color) !important;
  font-weight: 700 !important;
  font-size: 1.5rem !important;
}

.custom-v4-dialog ::v-deep(.p-dialog-content) {
  overflow: visible !important;
}
</style>
