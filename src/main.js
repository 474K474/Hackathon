import { createApp } from 'vue';
import App from './App.vue';
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';
import 'primeicons/primeicons.css';
import Nora from '@primevue/themes/nora';
import { updatePrimaryPalette } from '@primevue/themes';
import ToastService from 'primevue/toastservice';
import './style/style.css';

const app = createApp(App);

app.use(PrimeVue, {
    theme: {
        preset: Aura,
        options: {
            darkModeSelector: false,
            ripple: true,
        }
    }
}).use(ToastService);

document.title = import.meta.env.VITE_APP_TITLE || "РискСкор";

app.mount('#app');

// sky, cyan, indigo
updatePrimaryPalette({
    50: '{sky.50}',
    100: '{sky.100}',
    200: '{sky.200}',
    300: '{sky.300}',
    400: '{sky.400}',
    500: '{sky.500}',
    600: '{sky.600}',
    700: '{sky.700}',
    800: '{sky.800}',
    900: '{sky.900}',
    950: '{sky.950}'
});
