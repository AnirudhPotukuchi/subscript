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
  <div class="min-h-screen bg-github-bg font-sans text-github-text transition-colors duration-300">
    <router-view />

    <!-- Premium Floating Toast System -->
    <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toastStore.toasts"
          :key="toast.id"
          :class="[
            'flex items-center p-3 rounded-[6px] border transition-all duration-300',
            toast.type === 'success' ? 'bg-github-success/10 border-github-success/30 text-github-success' : '',
            toast.type === 'error' ? 'bg-github-danger/10 border-github-danger/30 text-github-danger' : '',
            toast.type === 'warning' ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : '',
            toast.type === 'info' ? 'bg-github-accent/10 border-github-accent/30 text-github-accent' : ''
          ]"
        >
          <div class="flex-1 mr-3 text-xs font-semibold">
            {{ toast.text }}
          </div>
          <button
            @click="toastStore.remove(toast.id)"
            class="text-github-secondary hover:text-github-text transition-colors cursor-pointer text-sm"
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
