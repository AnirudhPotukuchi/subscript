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
  <div class="min-h-screen flex items-center justify-center bg-github-bg px-4 font-sans text-github-text">
    
    <!-- GitHub Dimmed Dark style Login Card -->
    <div class="w-full max-w-sm bg-github-surface border border-github-border p-6 rounded-[6px] flex flex-col gap-5">
      
      <!-- Card Header -->
      <div class="text-center">
        <h1 class="text-2xl font-bold text-github-accent mb-1">
          SubscriptStack
        </h1>
        <p class="text-xs text-github-secondary">
          The official college networking platform
        </p>
      </div>

      <!-- Form Inputs -->
      <form @submit.prevent="handleLogin" class="flex flex-col gap-4">
        
        <div>
          <label class="block text-xs font-semibold text-github-text mb-1.5">
            College Email Address
          </label>
          <input
            v-model="email"
            type="email"
            placeholder="student@college.edu"
            required
            class="github-input w-full"
          />
        </div>

        <div>
          <div class="flex justify-between items-center mb-1.5">
            <label class="block text-xs font-semibold text-github-text">
              Password
            </label>
            <router-link to="/forgot-password" class="text-xs text-github-accent hover:underline font-semibold">
              Forgot?
            </router-link>
          </div>
          <input
            v-model="password"
            type="password"
            placeholder="••••••••"
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
          <span v-else>Sign In</span>
        </button>

      </form>

      <!-- Toggle Registration Link -->
      <div class="text-center text-xs text-github-secondary">
        New to the community?
        <router-link to="/signup" class="text-github-accent hover:underline font-semibold ml-1">
          Create an Account
        </router-link>
      </div>

    </div>
  </div>
</template>
