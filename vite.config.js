// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    hmr: {
      clientPort: 443, // ngrok সাধারণত HTTPS (443 পোর্ট) ব্যবহার করে
    },
    host: '0.0.0.0', // এটি মাঝে মাঝে নেটওয়ার্ক সংযোগের জন্য সাহায্য করে
  },
});