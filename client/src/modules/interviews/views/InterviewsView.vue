<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../../../stores/auth';
import { useToastStore } from '../../../stores/toast';
import api from '../../../services/api';

const authStore = useAuthStore();
const toastStore = useToastStore();

const experiences = ref<any[]>([]);
const isLoading = ref(true);

// Filters
const filterCompany = ref('');
const filterDifficulty = ref('');

// Creation States
const showShareModal = ref(false);
const company = ref('');
const role = ref('');
const packageDetails = ref('');
const type = ref<'internship' | 'full-time'>('full-time');
const mode = ref<'online' | 'offline'>('online');
const difficulty = ref<'easy' | 'medium' | 'hard'>('medium');
const preparationTips = ref('');
const outcome = ref<'selected' | 'rejected' | 'pending'>('selected');
const codingQuestions = ref('');
const hrQuestions = ref('');

// Accordion detailed round lists
const rounds = ref([
  { roundName: 'Round 1: Online Assessment', details: '' },
  { roundName: 'Round 2: Technical Interview', details: '' }
]);

const loadInterviews = async () => {
  isLoading.value = true;
  try {
    let query = '';
    if (filterCompany.value) query += `company=${encodeURIComponent(filterCompany.value)}&`;
    if (filterDifficulty.value) query += `difficulty=${encodeURIComponent(filterDifficulty.value)}`;

    const res = await api.get(`/interviews?${query}`);
    if (res.data?.success) {
      experiences.value = res.data.data;
    }
  } catch (err) {
    toastStore.show('Failed to fetch interview experiences.', 'error');
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  loadInterviews();
});

const addRoundField = () => {
  rounds.value.push({ roundName: `Round ${rounds.value.length + 1}`, details: '' });
};

const handleShareExperience = async () => {
  if (!company.value || !role.value || !preparationTips.value) {
    toastStore.show('Company, role, and preparation tips are required fields.', 'warning');
    return;
  }

  const payload = {
    company: company.value,
    role: role.value,
    packageDetails: packageDetails.value,
    type: type.value,
    mode: mode.value,
    difficulty: difficulty.value,
    preparationTips: preparationTips.value,
    outcome: outcome.value,
    codingQuestions: codingQuestions.value ? codingQuestions.value.split('\n').filter((q) => q.trim()) : [],
    hrQuestions: hrQuestions.value ? hrQuestions.value.split('\n').filter((q) => q.trim()) : [],
    interviewRounds: rounds.value.filter((r) => r.details.trim() !== '')
  };

  try {
    const res = await api.post('/interviews', payload);
    if (res.data?.success) {
      toastStore.show('Experience shared successfully!', 'success');
      showShareModal.value = false;
      
      // Reset form fields
      company.value = '';
      role.value = '';
      packageDetails.value = '';
      preparationTips.value = '';
      codingQuestions.value = '';
      hrQuestions.value = '';
      rounds.value = [
        { roundName: 'Round 1: Online Assessment', details: '' },
        { roundName: 'Round 2: Technical Interview', details: '' }
      ];

      loadInterviews();
    }
  } catch (err) {
    toastStore.show('Failed to share experience.', 'error');
  }
};

const handleVote = async (exp: any) => {
  const uid = authStore.user?.uid;
  const isVoted = exp.votes.includes(uid);

  // Optimistic Toggle
  if (isVoted) {
    exp.votes = exp.votes.filter((x: string) => x !== uid);
  } else {
    exp.votes.push(uid);
  }

  try {
    await api.post(`/interviews/${exp.id}/vote`);
  } catch (err) {
    // Revert
    if (isVoted) {
      exp.votes.push(uid);
    } else {
      exp.votes = exp.votes.filter((x: string) => x !== uid);
    }
    toastStore.show('Failed to toggle upvote.', 'error');
  }
};
</script>

<template>
  <div class="flex flex-col gap-6">
    
    <!-- Top Action Filters Block -->
    <div class="glass-card rounded-2xl p-5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 border border-slate-200/50 dark:border-slate-800/50">
      
      <div class="flex flex-wrap items-center gap-3 w-full md:w-auto">
        <input
          v-model="filterCompany"
          @input="loadInterviews"
          type="text"
          placeholder="Filter by company name..."
          class="px-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 focus:outline-none dark:text-slate-100 placeholder-slate-400 w-full sm:w-48"
        />

        <select
          v-model="filterDifficulty"
          @change="loadInterviews"
          class="px-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none dark:text-slate-100 cursor-pointer w-full sm:w-36"
        >
          <option value="">Any Difficulty</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      <button
        @click="showShareModal = true"
        class="w-full md:w-auto px-5 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold text-xs rounded-xl cursor-pointer shadow-md shadow-primary-500/10 transition-colors select-none"
      >
        Share My Experience
      </button>

    </div>

    <!-- Loading Indicators -->
    <div v-if="isLoading" class="flex flex-col gap-6">
      <div v-for="i in 2" :key="i" class="glass-card rounded-2xl p-6 animate-pulse flex flex-col gap-4">
        <div class="w-48 h-5 bg-slate-200 dark:bg-slate-800 rounded"></div>
        <div class="w-full h-24 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
      </div>
    </div>

    <!-- Experiences List -->
    <div v-else class="flex flex-col gap-6">
      
      <div v-if="experiences.length === 0" class="glass-card rounded-2xl p-12 text-center text-slate-400">
        No interview experiences logged for this query. Be the first to help juniors prepare!
      </div>

      <div
        v-for="exp in experiences"
        :key="exp.id"
        class="glass-card rounded-2xl p-6 shadow-sm border border-slate-200/50 dark:border-slate-800/50 flex flex-col gap-4"
      >
        
        <!-- Experience Header -->
        <div class="flex items-start justify-between gap-4">
          <div>
            <h3 class="text-base font-bold text-slate-800 dark:text-slate-100">
              {{ exp.role }} drive at <span class="text-primary-500">{{ exp.company }}</span>
            </h3>
            <p class="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
              Shared by {{ exp.authorName }} &bull; Package: {{ exp.packageDetails || 'N/A' }} &bull; Mode: {{ exp.mode }}
            </p>
          </div>
          
          <div class="flex items-center gap-1.5">
            <span
              :class="[
                'text-[10px] font-bold uppercase px-2 py-0.5 border rounded-full',
                exp.outcome === 'selected' ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/20' : '',
                exp.outcome === 'rejected' ? 'bg-rose-500/15 text-rose-500 border-rose-500/20' : '',
                exp.outcome === 'pending' ? 'bg-amber-500/15 text-amber-500 border-amber-500/20' : ''
              ]"
            >
              {{ exp.outcome }}
            </span>
            <span
              :class="[
                'text-[10px] font-bold uppercase px-2 py-0.5 border rounded-full',
                exp.difficulty === 'easy' ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/20' : '',
                exp.difficulty === 'medium' ? 'bg-primary-500/15 text-primary-500 border-primary-500/20' : '',
                exp.difficulty === 'hard' ? 'bg-rose-500/15 text-rose-500 border-rose-500/20' : ''
              ]"
            >
              {{ exp.difficulty }}
            </span>
          </div>
        </div>

        <!-- Rounds details Accordions -->
        <div v-if="exp.interviewRounds && exp.interviewRounds.length > 0" class="flex flex-col gap-3">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Interview Rounds Detail</span>
          <div class="flex flex-col gap-2 pl-3">
            <div
              v-for="rnd in exp.interviewRounds"
              :key="rnd.roundName"
              class="p-3 bg-slate-100/50 dark:bg-slate-900/40 border border-slate-200/25 dark:border-slate-800/25 rounded-xl flex flex-col gap-1"
            >
              <h4 class="text-xs font-bold text-slate-700 dark:text-slate-200">{{ rnd.roundName }}</h4>
              <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{{ rnd.details }}</p>
            </div>
          </div>
        </div>

        <!-- Coding/HR Questions Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div v-if="exp.codingQuestions && exp.codingQuestions.length > 0" class="p-4 bg-slate-100/30 dark:bg-slate-900/10 border border-slate-200/50 dark:border-slate-800/50 rounded-xl">
            <h4 class="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-2">Coding Questions Asked</h4>
            <ul class="list-disc pl-4 text-xs text-slate-600 dark:text-slate-400 flex flex-col gap-1">
              <li v-for="q in exp.codingQuestions" :key="q">{{ q }}</li>
            </ul>
          </div>

          <div v-if="exp.hrQuestions && exp.hrQuestions.length > 0" class="p-4 bg-slate-100/30 dark:bg-slate-900/10 border border-slate-200/50 dark:border-slate-800/50 rounded-xl">
            <h4 class="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-2">HR/Behavioral Questions</h4>
            <ul class="list-disc pl-4 text-xs text-slate-600 dark:text-slate-400 flex flex-col gap-1">
              <li v-for="q in exp.hrQuestions" :key="q">{{ q }}</li>
            </ul>
          </div>
        </div>

        <!-- Prep tips -->
        <div class="flex flex-col gap-1.5">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Preparation Tips & Advice</span>
          <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed italic bg-slate-50 dark:bg-slate-900/20 p-3 rounded-xl border border-slate-200/10">
            "{{ exp.preparationTips }}"
          </p>
        </div>

        <!-- Voting Footer -->
        <div class="flex items-center border-t border-slate-100 dark:border-slate-800/60 pt-4 mt-2">
          <button
            @click="handleVote(exp)"
            :class="[
              'flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-colors select-none',
              exp.votes.includes(authStore.user?.uid) ? 'text-primary-500' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            ]"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 11l3-3m0 0l3 3m-3-3v8m0-13a9 9 0 110 18 9 9 0 010-18z" />
            </svg>
            <span>Upvote ({{ exp.votes.length || 0 }})</span>
          </button>
        </div>

      </div>

    </div>

    <!-- Share Experience Dialog Modal -->
    <div v-if="showShareModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div @click="showShareModal = false" class="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"></div>
      
      <div class="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-2xl relative z-10 flex flex-col gap-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        
        <div class="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 class="text-base font-bold text-slate-800 dark:text-slate-200">Share Hiring Experience</h2>
          <button @click="showShareModal = false" class="text-slate-400 hover:text-slate-600 text-lg cursor-pointer">&times;</button>
        </div>

        <form @submit.prevent="handleShareExperience" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          <div>
            <label class="block text-[10px] font-bold uppercase text-slate-400 mb-1">Company</label>
            <input v-model="company" type="text" placeholder="Google, Microsoft, TCS" required class="w-full px-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 focus:outline-none dark:text-slate-100" />
          </div>

          <div>
            <label class="block text-[10px] font-bold uppercase text-slate-400 mb-1">Role / Profile Name</label>
            <input v-model="role" type="text" placeholder="Software Engineer Intern, System Analyst" required class="w-full px-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 focus:outline-none dark:text-slate-100" />
          </div>

          <div>
            <label class="block text-[10px] font-bold uppercase text-slate-400 mb-1">CTC Package Offered</label>
            <input v-model="packageDetails" type="text" placeholder="e.g. 14 LPA, 40k/month" class="w-full px-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 focus:outline-none dark:text-slate-100" />
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-[10px] font-bold uppercase text-slate-400 mb-1">Type</label>
              <select v-model="type" class="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none dark:text-slate-100 cursor-pointer">
                <option value="internship">Internship</option>
                <option value="full-time">Full-Time</option>
              </select>
            </div>
            <div>
              <label class="block text-[10px] font-bold uppercase text-slate-400 mb-1">Difficulty</label>
              <select v-model="difficulty" class="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none dark:text-slate-100 cursor-pointer">
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-[10px] font-bold uppercase text-slate-400 mb-1">Mode</label>
              <select v-model="mode" class="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none dark:text-slate-100 cursor-pointer">
                <option value="online">Online</option>
                <option value="offline">Offline</option>
              </select>
            </div>
            <div>
              <label class="block text-[10px] font-bold uppercase text-slate-400 mb-1">Outcome</label>
              <select v-model="outcome" class="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none dark:text-slate-100 cursor-pointer">
                <option value="selected">Selected</option>
                <option value="rejected">Rejected</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          <div class="sm:col-span-2">
            <label class="block text-[10px] font-bold uppercase text-slate-400 mb-1">Rounds Detail Description</label>
            <div class="flex flex-col gap-2">
              <div v-for="(rnd, idx) in rounds" :key="idx" class="flex flex-col gap-1.5 p-3 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/50">
                <input v-model="rnd.roundName" type="text" class="font-bold text-xs bg-transparent focus:outline-none dark:text-slate-200 w-full" />
                <textarea v-model="rnd.details" rows="2" placeholder="Describe the topics discussed and interview format..." class="w-full text-xs bg-transparent border-t border-slate-200/50 dark:border-slate-800/50 pt-1.5 focus:outline-none dark:text-slate-300 resize-none"></textarea>
              </div>
              <button type="button" @click="addRoundField" class="text-left text-xs text-primary-500 font-bold hover:underline cursor-pointer select-none mt-1">+ Add Round Stage</button>
            </div>
          </div>

          <div class="sm:col-span-2">
            <label class="block text-[10px] font-bold uppercase text-slate-400 mb-1">Coding Questions (One per line)</label>
            <textarea v-model="codingQuestions" rows="2" placeholder="e.g. Reverse Linked List, Knapsack DP" class="w-full px-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 focus:outline-none dark:text-slate-100 resize-none"></textarea>
          </div>

          <div class="sm:col-span-2">
            <label class="block text-[10px] font-bold uppercase text-slate-400 mb-1">HR & Behavioral Questions</label>
            <textarea v-model="hrQuestions" rows="2" placeholder="e.g. Tell me about a time you resolved a conflict in a project group." class="w-full px-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 focus:outline-none dark:text-slate-100 resize-none"></textarea>
          </div>

          <div class="sm:col-span-2">
            <label class="block text-[10px] font-bold uppercase text-slate-400 mb-1">Preparation Tips & Helpful Resources</label>
            <textarea v-model="preparationTips" rows="3" required placeholder="What roadmap or coding platforms did you use? Any tips for technical rounds?" class="w-full px-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 focus:outline-none dark:text-slate-100 resize-none"></textarea>
          </div>

          <div class="sm:col-span-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-3 mt-2">
            <button type="button" @click="showShareModal = false" class="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-600 cursor-pointer">Cancel</button>
            <button type="submit" class="px-5 py-2.5 bg-primary-500 text-white font-semibold text-xs rounded-xl cursor-pointer shadow-md shadow-primary-500/10">Share drive</button>
          </div>

        </form>

      </div>
    </div>

  </div>
</template>
