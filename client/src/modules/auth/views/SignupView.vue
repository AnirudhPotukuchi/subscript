<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../../stores/auth';
import { useToastStore } from '../../../stores/toast';

const authStore = useAuthStore();
const toastStore = useToastStore();
const router = useRouter();

const fullName = ref('');
const rollNumber = ref('');
const email = ref('');
const password = ref('');
const branch = ref('Computer Science');
const year = ref(1);
const section = ref('A');
const isLoading = ref(false);

const branches = [
  'Computer Science',
  'Information Technology',
  'Electronics & Communication',
  'Electrical & Electronics',
  'Mechanical Engineering',
  'Civil Engineering',
  'Artificial Intelligence & ML'
];

const handleSignup = async () => {
  if (!fullName.value || !rollNumber.value || !email.value || !password.value || !branch.value || !section.value) {
    toastStore.show('Please fill in all registration fields.', 'warning');
    return;
  }

  // Frontend email domain check
  const emailDomain = email.value.split('@')[1];
  if (!emailDomain || !['college.edu', 'student.college.edu', 'alumni.college.edu'].includes(emailDomain.toLowerCase())) {
    toastStore.show('Signup restricted to official @college.edu emails.', 'error');
    return;
  }

  isLoading.value = true;
  const success = await authStore.signup({
    fullName: fullName.value,
    rollNumber: rollNumber.value,
    email: email.value,
    password: password.value,
    branch: branch.value,
    year: Number(year.value),
    section: section.value
  });
  isLoading.value = false;

  if (success) {
    // Redirect to login page and show email verify instructions
    router.push('/login');
  }
};
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-github-bg px-4 py-8 font-sans text-github-text">
    
    <!-- GitHub Dimmed Dark style Signup Card -->
    <div class="w-full max-w-md bg-github-surface border border-github-border p-6 rounded-[6px] flex flex-col gap-5">
      
      <!-- Header -->
      <div class="text-center">
        <h1 class="text-2xl font-bold text-github-accent mb-1">
          Join subscript
        </h1>
        <p class="text-xs text-github-secondary">
          Create an exclusive account to collaborate with peers & seniors
        </p>
      </div>

      <form @submit.prevent="handleSignup" class="flex flex-col gap-4">
        
        <!-- Row 1: Name and Roll Number -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-github-text mb-1.5">
              Full Name
            </label>
            <input
              v-model="fullName"
              type="text"
              placeholder="Aditya Verma"
              required
              class="github-input w-full"
            />
          </div>
          <div>
            <label class="block text-xs font-semibold text-github-text mb-1.5">
              Roll Number
            </label>
            <input
              v-model="rollNumber"
              type="text"
              placeholder="CS23B1002"
              required
              class="github-input w-full"
            />
          </div>
        </div>

        <!-- Row 2: Branch and Year/Section -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="sm:col-span-2">
            <label class="block text-xs font-semibold text-github-text mb-1.5">
              Department Branch
            </label>
            <select
              v-model="branch"
              class="github-input w-full cursor-pointer"
            >
              <option v-for="b in branches" :key="b" :value="b">{{ b }}</option>
            </select>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-xs font-semibold text-github-text mb-1.5">
                Year
              </label>
              <select
                v-model="year"
                class="github-input w-full cursor-pointer"
              >
                <option :value="1">1st</option>
                <option :value="2">2nd</option>
                <option :value="3">3rd</option>
                <option :value="4">4th</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-github-text mb-1.5">
                Sec
              </label>
              <input
                v-model="section"
                type="text"
                maxLength="1"
                placeholder="A"
                required
                class="github-input w-full text-center"
              />
            </div>
          </div>
        </div>

        <!-- Row 3: College Email -->
        <div>
          <label class="block text-xs font-semibold text-github-text mb-1.5">
            College Email Address (@college.edu)
          </label>
          <input
            v-model="email"
            type="email"
            placeholder="aditya.verma@college.edu"
            required
            class="github-input w-full"
          />
        </div>

        <!-- Row 4: Password -->
        <div>
          <label class="block text-xs font-semibold text-github-text mb-1.5">
            Password
          </label>
          <input
            v-model="password"
            type="password"
            placeholder="Min 6 characters"
            required
            class="github-input w-full"
          />
        </div>

        <!-- Submit -->
        <button
          type="submit"
          :disabled="isLoading"
          class="github-button-primary w-full mt-2 flex justify-center items-center h-9"
        >
          <span v-if="isLoading" class="border-2 border-white/20 border-t-white h-3.5 w-3.5 rounded-full animate-spin"></span>
          <span v-else>Register Profile</span>
        </button>

      </form>

      <!-- Toggle Signup Link -->
      <div class="text-center text-xs text-github-secondary">
        Already registered?
        <router-link to="/login" class="text-github-accent hover:underline font-semibold ml-1">
          Sign In here
        </router-link>
      </div>

    </div>
  </div>
</template>
