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
  <div class="flex flex-col gap-3">
    
    <!-- Top Action Filters Block -->
    <div class="github-card p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
      
      <div class="flex flex-wrap items-center gap-2 w-full sm:w-auto">
        <input
          v-model="filterCompany"
          @input="loadInterviews"
          type="text"
          placeholder="Filter by company name..."
          class="github-input text-xs py-1 h-8 w-full sm:w-48"
        />

        <select
          v-model="filterDifficulty"
          @change="loadInterviews"
          class="github-input text-xs py-1 h-8 w-full sm:w-36 cursor-pointer"
        >
          <option value="">Any Difficulty</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      <button
        @click="showShareModal = true"
        class="github-button-primary w-full sm:w-auto shrink-0 h-8 flex items-center justify-center"
      >
        Share My Experience
      </button>

    </div>

    <!-- Loading Indicators -->
    <div v-if="isLoading" class="flex flex-col gap-3">
      <div v-for="i in 2" :key="i" class="github-card p-4 animate-pulse flex flex-col gap-3">
        <div class="w-48 h-4 bg-[#2d333b] rounded"></div>
        <div class="w-full h-16 bg-[#2d333b] rounded-[6px]"></div>
      </div>
    </div>

    <!-- Experiences List -->
    <div v-else class="flex flex-col gap-3">
      
      <div v-if="experiences.length === 0" class="github-card p-8 text-center text-github-secondary">
        No interview experiences logged for this query. Be the first to help juniors prepare!
      </div>

      <div
        v-for="exp in experiences"
        :key="exp.id"
        class="github-card p-4 flex flex-col gap-3"
      >
        
        <!-- Experience Header -->
        <div class="flex items-start justify-between gap-3">
          <div>
            <h3 class="text-xs font-bold text-github-text">
              {{ exp.role }} drive at <span class="text-github-accent">{{ exp.company }}</span>
            </h3>
            <p class="text-[10px] text-github-secondary font-semibold uppercase tracking-wider mt-0.5">
              Shared by {{ exp.authorName }} &bull; Package: {{ exp.packageDetails || 'N/A' }} &bull; Mode: {{ exp.mode }}
            </p>
          </div>
          
          <div class="flex items-center gap-1.5 shrink-0">
            <span
              :class="[
                'text-[10px] font-bold uppercase px-1.5 py-0.2 border rounded-[4px]',
                exp.outcome === 'selected' ? 'bg-github-success/10 text-github-success border-github-success/25' : '',
                exp.outcome === 'rejected' ? 'bg-github-danger/10 text-github-danger border-github-danger/25' : '',
                exp.outcome === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/25' : ''
              ]"
            >
              {{ exp.outcome }}
            </span>
            <span
              :class="[
                'text-[10px] font-bold uppercase px-1.5 py-0.2 border rounded-[4px]',
                exp.difficulty === 'easy' ? 'bg-github-success/10 text-github-success border-github-success/25' : '',
                exp.difficulty === 'medium' ? 'bg-github-accent/10 text-github-accent border-github-accent/25' : '',
                exp.difficulty === 'hard' ? 'bg-github-danger/10 text-github-danger border-github-danger/25' : ''
              ]"
            >
              {{ exp.difficulty }}
            </span>
          </div>
        </div>

        <!-- Rounds details Accordions -->
        <div v-if="exp.interviewRounds && exp.interviewRounds.length > 0" class="flex flex-col gap-2">
          <span class="text-[10px] font-bold text-github-secondary uppercase tracking-wide">Interview Rounds Detail</span>
          <div class="flex flex-col gap-1.5 pl-3">
            <div
              v-for="rnd in exp.interviewRounds"
              :key="rnd.roundName"
              class="p-2.5 bg-github-bg border border-github-border rounded-[6px] flex flex-col gap-0.5"
            >
              <h4 class="text-xs font-bold text-github-text">{{ rnd.roundName }}</h4>
              <p class="text-xs text-github-secondary leading-relaxed">{{ rnd.details }}</p>
            </div>
          </div>
        </div>

        <!-- Coding/HR Questions Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div v-if="exp.codingQuestions && exp.codingQuestions.length > 0" class="p-3 bg-github-bg border border-github-border rounded-[6px]">
            <h4 class="text-xs font-bold text-github-text uppercase tracking-wide mb-1.5">Coding Questions Asked</h4>
            <ul class="list-disc pl-4 text-xs text-github-secondary flex flex-col gap-0.5">
              <li v-for="q in exp.codingQuestions" :key="q">{{ q }}</li>
            </ul>
          </div>

          <div v-if="exp.hrQuestions && exp.hrQuestions.length > 0" class="p-3 bg-github-bg border border-github-border rounded-[6px]">
            <h4 class="text-xs font-bold text-github-text uppercase tracking-wide mb-1.5">HR/Behavioral Questions</h4>
            <ul class="list-disc pl-4 text-xs text-github-secondary flex flex-col gap-0.5">
              <li v-for="q in exp.hrQuestions" :key="q">{{ q }}</li>
            </ul>
          </div>
        </div>

        <!-- Prep tips -->
        <div class="flex flex-col gap-1">
          <span class="text-[10px] font-bold text-github-secondary uppercase tracking-wide">Preparation Tips & Advice</span>
          <p class="text-xs text-github-text leading-relaxed italic bg-github-bg p-3 rounded-[6px] border border-github-border">
            "{{ exp.preparationTips }}"
          </p>
        </div>

        <!-- Voting Footer -->
        <div class="flex items-center border-t border-github-border pt-3 mt-1">
          <button
            @click="handleVote(exp)"
            :class="[
              'flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-colors select-none',
              exp.votes.includes(authStore.user?.uid) ? 'text-github-accent' : 'text-github-secondary hover:text-github-text'
            ]"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 11l3-3m0 0l3 3m-3-3v8m0-13a9 9 0 110 18 9 9 0 010-18z" />
            </svg>
            <span>Upvote ({{ exp.votes.length || 0 }})</span>
          </button>
        </div>

      </div>

    </div>

    <!-- Share Experience Dialog Modal -->
    <div v-if="showShareModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div @click="showShareModal = false" class="absolute inset-0 bg-[#000000]/50"></div>
      
      <div class="w-full max-w-lg bg-github-surface border border-github-border p-4 rounded-[6px] relative z-10 flex flex-col gap-3 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
        
        <div class="flex justify-between items-center border-b border-github-border pb-2">
          <h2 class="text-xs font-bold text-github-text uppercase tracking-wide">Share Hiring Experience</h2>
          <button @click="showShareModal = false" class="text-github-secondary hover:text-github-text text-base cursor-pointer">&times;</button>
        </div>

        <form @submit.prevent="handleShareExperience" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          
          <div>
            <label class="block text-xs font-semibold text-github-text mb-1">Company</label>
            <input v-model="company" type="text" placeholder="Google, Microsoft, TCS" required class="github-input w-full text-xs h-8 py-1" />
          </div>

          <div>
            <label class="block text-xs font-semibold text-github-text mb-1">Role / Profile Name</label>
            <input v-model="role" type="text" placeholder="Software Engineer Intern, System Analyst" required class="github-input w-full text-xs h-8 py-1" />
          </div>

          <div>
            <label class="block text-xs font-semibold text-github-text mb-1">CTC Package Offered</label>
            <input v-model="packageDetails" type="text" placeholder="e.g. 14 LPA, 40k/month" class="github-input w-full text-xs h-8 py-1" />
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-xs font-semibold text-github-text mb-1">Type</label>
              <select v-model="type" class="github-input w-full text-xs h-8 py-1 cursor-pointer">
                <option value="internship">Internship</option>
                <option value="full-time">Full-Time</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-github-text mb-1">Difficulty</label>
              <select v-model="difficulty" class="github-input w-full text-xs h-8 py-1 cursor-pointer">
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-xs font-semibold text-github-text mb-1">Mode</label>
              <select v-model="mode" class="github-input w-full text-xs h-8 py-1 cursor-pointer">
                <option value="online">Online</option>
                <option value="offline">Offline</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-github-text mb-1">Outcome</label>
              <select v-model="outcome" class="github-input w-full text-xs h-8 py-1 cursor-pointer">
                <option value="selected">Selected</option>
                <option value="rejected">Rejected</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          <div class="sm:col-span-2">
            <label class="block text-xs font-semibold text-github-text mb-1">Rounds Detail Description</label>
            <div class="flex flex-col gap-2">
              <div v-for="(rnd, idx) in rounds" :key="idx" class="flex flex-col gap-1 p-2 border border-github-border rounded-[6px] bg-github-bg">
                <input v-model="rnd.roundName" type="text" class="font-bold text-xs bg-transparent focus:outline-none text-github-text w-full" />
                <textarea v-model="rnd.details" rows="2" placeholder="Describe the topics discussed and interview format..." class="w-full text-xs bg-transparent border-t border-github-border pt-1.5 focus:outline-none text-github-text resize-none"></textarea>
              </div>
              <button type="button" @click="addRoundField" class="text-left text-xs text-github-accent font-bold hover:underline cursor-pointer select-none mt-1">+ Add Round Stage</button>
            </div>
          </div>

          <div class="sm:col-span-2">
            <label class="block text-xs font-semibold text-github-text mb-1">Coding Questions (One per line)</label>
            <textarea v-model="codingQuestions" rows="2" placeholder="e.g. Reverse Linked List, Knapsack DP" class="github-input w-full resize-none text-xs"></textarea>
          </div>

          <div class="sm:col-span-2">
            <label class="block text-xs font-semibold text-github-text mb-1">HR & Behavioral Questions</label>
            <textarea v-model="hrQuestions" rows="2" placeholder="e.g. Tell me about a time you resolved a conflict in a project group." class="github-input w-full resize-none text-xs"></textarea>
          </div>

          <div class="sm:col-span-2">
            <label class="block text-xs font-semibold text-github-text mb-1">Preparation Tips & Helpful Resources</label>
            <textarea v-model="preparationTips" rows="3" required placeholder="What roadmap or coding platforms did you use? Any tips for technical rounds?" class="github-input w-full resize-none text-xs"></textarea>
          </div>

          <div class="sm:col-span-2 flex justify-end gap-2 border-t border-github-border pt-2 mt-2">
            <button type="button" @click="showShareModal = false" class="github-button h-8 flex items-center justify-center">Cancel</button>
            <button type="submit" class="github-button-primary h-8 flex items-center justify-center">Share drive</button>
          </div>

        </form>

      </div>
    </div>

  </div>
</template>
