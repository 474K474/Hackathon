import {ref} from "vue";

export let stateData = ref(null);

export const clearAppState = () => {
    stateData.value = null;
};