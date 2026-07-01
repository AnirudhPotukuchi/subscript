<script setup lang="ts">
import { ref } from 'vue';
import api from '../../../services/api';
import { useToastStore } from '../../../stores/toast';

const toastStore = useToastStore();
const email = ref('');
const isLoading = ref(false);

const handleForgotPassword = async () => {
  if (!email.value) return;

  isLoading.value = true;
  try {
    const res = await api.post('/auth/forgot-password', { email: email.value });
    if (res.data?.success) {
      toastStore.show('If registered, reset code printed to server logs/terminal.', 'success', 7000);
    }
  } catch (err: any) {
    toastStore.show(err.response?.data?.message || 'Error triggering forgot password.', 'error');
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-github-bg px-4 font-sans text-github-text">
    <div class="w-full max-w-sm bg-github-surface border border-github-border p-6 rounded-[6px] flex flex-col gap-5">
      
      <div class="text-center">
        <h1 class="text-xl font-bold text-github-text mb-1">
          Recover Password
        </h1>
        <p class="text-xs text-github-secondary">
          Enter your registered college email to fetch recovery key details.
        </p>
      </div>

      <form @submit.prevent="handleForgotPassword" class="flex flex-col gap-4">
        <div>
          <label class="block text-xs font-semibold text-github-text mb-1.5">
            College Email
          </label>
          <input
            v-model="email"
            type="email"
            placeholder="student@college.edu"
            required
            class="github-input w-full"
          />
        </div>

        <button
          type="submit"
          :disabled="isLoading"
          class="github-button-primary w-full mt-2 flex justify-center items-center h-9"
        >
          <span v-if="isLoading" class="border-2 border-white/20 border-t-white h-3.5 w-3.5 rounded-full animate-spin"></span>
          <span v-else>Send Recovery Code</span>
        </button>
      </form>

      <div class="text-center text-xs flex justify-between text-github-secondary">
        <router-link to="/login" class="hover:text-github-text">
          Sign In
        </router-link>
        <router-link to="/reset-password" class="text-github-accent hover:underline font-semibold">
          Enter Reset Token
        </router-link>
      </div>

    </div>
  </div>
</template>
