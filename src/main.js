import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import './assets/index.css';
import clickOutside from 'v3-click-outside';
const app = createApp(App);
app.use(router).use(clickOutside);
app.mount('#app');
