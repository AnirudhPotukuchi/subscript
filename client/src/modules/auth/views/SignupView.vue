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
  <div class="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950 px-4 py-8 transition-colors duration-300">
    
    <!-- Large Signup Card -->
    <div class="w-full max-w-lg bg-white/70 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-8 rounded-3xl shadow-2xl flex flex-col gap-6">
      
      <!-- Header -->
      <div class="text-center">
        <h1 class="text-3xl font-extrabold bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent mb-1 text-glow">
          Join subscript
        </h1>
        <p class="text-xs text-slate-500 dark:text-slate-400">
          Create an exclusive account to collaborate with peers & seniors
        </p>
      </div>

      <form @submit.prevent="handleSignup" class="flex flex-col gap-4">
        
        <!-- Row 1: Name and Roll Number -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Full Name
            </label>
            <input
              v-model="fullName"
              type="text"
              placeholder="Aditya Verma"
              required
              class="w-full px-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all dark:text-slate-100"
            />
          </div>
          <div>
            <label class="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Roll Number
            </label>
            <input
              v-model="rollNumber"
              type="text"
              placeholder="CS23B1002"
              required
              class="w-full px-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all dark:text-slate-100"
            />
          </div>
        </div>

        <!-- Row 2: Branch and Year/Section -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="sm:col-span-2">
            <label class="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Department Branch
            </label>
            <select
              v-model="branch"
              class="w-full px-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all dark:text-slate-100 cursor-pointer"
            >
              <option v-for="b in branches" :key="b" :value="b">{{ b }}</option>
            </select>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Year
              </label>
              <select
                v-model="year"
                class="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all dark:text-slate-100 cursor-pointer"
              >
                <option :value="1">1st</option>
                <option :value="2">2nd</option>
                <option :value="3">3rd</option>
                <option :value="4">4th</option>
              </select>
            </div>
            <div>
              <label class="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Sec
              </label>
              <input
                v-model="section"
                type="text"
                maxLength="1"
                placeholder="A"
                required
                class="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-center transition-all dark:text-slate-100"
              />
            </div>
          </div>
        </div>

        <!-- Row 3: College Email -->
        <div>
          <label class="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
            College Email Address (@college.edu)
          </label>
          <input
            v-model="email"
            type="email"
            placeholder="aditya.verma@college.edu"
            required
            class="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all dark:text-slate-100"
          />
        </div>

        <!-- Row 4: Password -->
        <div>
          <label class="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
            Password
          </label>
          <input
            v-model="password"
            type="password"
            placeholder="Min 6 characters"
            required
            class="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all dark:text-slate-100"
          />
        </div>

        <!-- Submit -->
        <button
          type="submit"
          :disabled="isLoading"
          class="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold text-sm shadow-md shadow-primary-500/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex justify-center items-center"
        >
          <span v-if="isLoading" class="border-2 border-white/30 border-t-white h-4 w-4 rounded-full animate-spin"></span>
          <span v-else>Register Profile</span>
        </button>

      </form>

      <!-- Toggle Signup Link -->
      <div class="text-center text-xs text-slate-500 dark:text-slate-400">
        Already registered?
        <router-link to="/login" class="text-primary-500 hover:text-primary-600 font-bold ml-1">
          Sign In here
        </router-link>
      </div>

    </div>
  </div>
</template>
