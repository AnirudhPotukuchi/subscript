<script setup lang="ts">
import { onMounted } from 'vue';
import { useThemeStore } from './stores/theme';
import { useToastStore } from './stores/toast';

const themeStore = useThemeStore();
const toastStore = useToastStore();

onMounted(() => {
  themeStore.initTheme();
});
</script>

<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
    <router-view />

    <!-- Premium Floating Toast System -->
    <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toastStore.toasts"
          :key="toast.id"
          :class="[
            'flex items-center p-4 rounded-xl shadow-lg border backdrop-blur-md transition-all duration-300',
            toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' : '',
            toast.type === 'error' ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400' : '',
            toast.type === 'warning' ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400' : '',
            toast.type === 'info' ? 'bg-sky-500/10 border-sky-500/30 text-sky-600 dark:text-sky-400' : ''
          ]"
        >
          <div class="flex-1 mr-3 text-sm font-medium">
            {{ toast.text }}
          </div>
          <button
            @click="toastStore.remove(toast.id)"
            class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            &times;
          </button>
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<style>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(100px);
}
</style>
