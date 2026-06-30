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
  <div class="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950 px-4 transition-colors duration-300">
    <div class="w-full max-w-md bg-white/70 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-8 rounded-3xl shadow-2xl flex flex-col gap-6">
      
      <div class="text-center">
        <h1 class="text-2xl font-extrabold text-slate-800 dark:text-slate-100 mb-1">
          Recover Password
        </h1>
        <p class="text-xs text-slate-500">
          Enter your registered college email to fetch recovery key details.
        </p>
      </div>

      <form @submit.prevent="handleForgotPassword" class="flex flex-col gap-4">
        <div>
          <label class="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            College Email
          </label>
          <input
            v-model="email"
            type="email"
            placeholder="student@college.edu"
            required
            class="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 focus:outline-none dark:text-slate-100"
          />
        </div>

        <button
          type="submit"
          :disabled="isLoading"
          class="w-full mt-2 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-semibold text-sm transition-colors cursor-pointer flex justify-center items-center"
        >
          <span v-if="isLoading" class="border-2 border-white/30 border-t-white h-4 w-4 rounded-full animate-spin"></span>
          <span v-else>Send Recovery Code</span>
        </button>
      </form>

      <div class="text-center text-xs flex justify-between">
        <router-link to="/login" class="text-slate-400 hover:text-slate-600">
          Sign In
        </router-link>
        <router-link to="/reset-password" class="text-primary-500 font-bold">
          Enter Reset Token
        </router-link>
      </div>

    </div>
  </div>
</template>
