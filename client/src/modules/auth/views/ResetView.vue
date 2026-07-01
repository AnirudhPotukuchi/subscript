<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import api from '../../../services/api';
import { useToastStore } from '../../../stores/toast';

const router = useRouter();
const toastStore = useToastStore();

const email = ref('');
const token = ref('');
const newPassword = ref('');
const isLoading = ref(false);

const handleResetPassword = async () => {
  if (!email.value || !token.value || !newPassword.value) {
    toastStore.show('Please fill in all inputs.', 'warning');
    return;
  }

  isLoading.value = true;
  try {
    const res = await api.post('/auth/reset-password', {
      email: email.value,
      token: token.value,
      newPassword: newPassword.value
    });

    if (res.data?.success) {
      toastStore.show('Password updated successfully! Redirecting to login.', 'success');
      router.push('/login');
    }
  } catch (err: any) {
    toastStore.show(err.response?.data?.message || 'Failed to update password.', 'error');
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
          Set New Password
        </h1>
        <p class="text-xs text-github-secondary">
          Enter reset token details printed in server console alongside new credentials.
        </p>
      </div>

      <form @submit.prevent="handleResetPassword" class="flex flex-col gap-4">
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

        <div>
          <label class="block text-xs font-semibold text-github-text mb-1.5">
            Reset Token
          </label>
          <input
            v-model="token"
            type="text"
            placeholder="Token key from terminal"
            required
            class="github-input w-full"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-github-text mb-1.5">
            New Password
          </label>
          <input
            v-model="newPassword"
            type="password"
            placeholder="Min 6 characters"
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
          <span v-else>Reset Password</span>
        </button>
      </form>

      <div class="text-center text-xs text-github-secondary">
        <router-link to="/login" class="text-github-accent hover:underline font-semibold">
          Back to Sign In
        </router-link>
      </div>

    </div>
  </div>
</template>
