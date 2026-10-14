import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// GitHub project pages are served from a subpath (e.g. /expanding-notan/), so the
// deploy workflow sets BASE_PATH. Local dev and preview keep the root base.
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [svelte()],
});
