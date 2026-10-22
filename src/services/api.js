import axios from "axios";
import {stateData} from "@/composables/useAppState.js";


export const Inference = (taskId, statusRef, { onSuccess, onError }) => {
    let isPollingActive = true;
    let flowTimeout = null;

    let index = 0;
    let attempt = 0;

    const runNextStep = async() => {
        if (!isPollingActive) return;

        if (attempt >= MAX_POLLING_ATTEMPTS) {
            isPollingActive = false;
            onError("Превышено максимальное время ожидания ответа от модели.");
            return;
        }

        const urlStatus = import.meta.env.VITE_IS_MOCK_MODE === 'true' ?
            "/mock-status.json":
            import.meta.env.VITE_API_URL + "/status";
        const urlRes = import.meta.env.VITE_IS_MOCK_MODE === 'true' ?
            "/mock-data.json":
            import.meta.env.VITE_API_URL + "/result";

        try {
            if (attempt++ === 0) {
                statusRef.value = 'loading';
            } else {
                const res = await axios(urlStatus, {
                    timeout: Number(import.meta.env.VITE_API_TIMEOUT)
                });
                if (import.meta.env.VITE_IS_MOCK_MODE === 'true') {
                    statusRef.value = res.data[index++].status;
                } else {
                    statusRef.value = res.data.status;
                }
            }
        } catch (e) {
            if (e.response?.status === 500) {
                onError("Соединение с сервером потеряно.");
            } else {
                onError("Превышено время ожидания ответа.");
            }
            isPollingActive = false;
            return;
        }
        if (statusRef.value === 'success') {
            isPollingActive = false;
            try {
                const res = await axios(urlRes, {
                    timeout: Number(import.meta.env.VITE_API_TIMEOUT)
                });
                stateData.value = res.data;
                if (onSuccess) onSuccess();
            } catch (e) {
                isPollingActive = false;
                onError("Ошибка получения результата.");
            }
            return;
        }
        flowTimeout = setTimeout(runNextStep, Number(import.meta.env.VITE_POLLING_INTERVAL));
    }

    runNextStep();

    return () => {
        isPollingActive = false;
        if (flowTimeout) clearTimeout(flowTimeout);
    };
};
