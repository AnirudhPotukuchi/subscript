<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../../stores/auth';
import { useToastStore } from '../../../stores/toast';

const authStore = useAuthStore();
const toastStore = useToastStore();
const router = useRouter();

const email = ref('');
const password = ref('');
const isLoading = ref(false);

const handleLogin = async () => {
  if (!email.value || !password.value) {
    toastStore.show('Please fill in all credentials.', 'warning');
    return;
  }

  isLoading.value = true;
  const success = await authStore.login({
    email: email.value,
    password: password.value
  });
  isLoading.value = false;

  if (success) {
    router.push('/');
  }
};
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950 px-4 transition-colors duration-300">
    
    <!-- Premium Glassmorphism Card -->
    <div class="w-full max-w-md bg-white/70 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-8 rounded-3xl shadow-2xl flex flex-col gap-6">
      
      <!-- Card Header -->
      <div class="text-center">
        <h1 class="text-3xl font-extrabold bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent mb-1 text-glow">
          subscript
        </h1>
        <p class="text-sm text-slate-500 dark:text-slate-400">
          The official college networking platform
        </p>
      </div>

      <!-- Form Inputs -->
      <form @submit.prevent="handleLogin" class="flex flex-col gap-4">
        
        <div>
          <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            College Email Address
          </label>
          <input
            v-model="email"
            type="email"
            placeholder="student@college.edu"
            required
            class="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all dark:text-slate-100 placeholder-slate-400"
          />
        </div>

        <div>
          <div class="flex justify-between items-center mb-1.5">
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Password
            </label>
            <router-link to="/forgot-password" class="text-xs text-primary-500 hover:text-primary-600 font-medium">
              Forgot?
            </router-link>
          </div>
          <input
            v-model="password"
            type="password"
            placeholder="••••••••"
            required
            class="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all dark:text-slate-100 placeholder-slate-400"
          />
        </div>

        <button
          type="submit"
          :disabled="isLoading"
          class="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold text-sm shadow-md shadow-primary-500/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex justify-center items-center"
        >
          <span v-if="isLoading" class="border-2 border-white/30 border-t-white h-4 w-4 rounded-full animate-spin"></span>
          <span v-else>Sign In</span>
        </button>

      </form>

      <!-- Toggle Registration Link -->
      <div class="text-center text-xs text-slate-500 dark:text-slate-400">
        New to the community?
        <router-link to="/signup" class="text-primary-500 hover:text-primary-600 font-bold ml-1">
          Create an Account
        </router-link>
      </div>

    </div>
  </div>
</template>
