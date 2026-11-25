import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

// Six pages identiques (mêmes graphiques, mêmes données), une seule différence :
// la bibliothèque utilisée. Le poids rapporté est le delta vs la page « interne ».
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        interne: resolve(__dirname, 'interne.html'),
        recharts: resolve(__dirname, 'recharts.html'),
        chartjs: resolve(__dirname, 'chartjs.html'),
        visx: resolve(__dirname, 'visx.html'),
        apexcharts: resolve(__dirname, 'apexcharts.html'),
        echarts: resolve(__dirname, 'echarts.html'),
      },
    },
  },
});
