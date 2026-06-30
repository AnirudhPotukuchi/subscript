<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToastStore } from '../../../stores/toast';
import api from '../../../services/api';

const route = useRoute();
const router = useRouter();
const toastStore = useToastStore();

const searchInput = ref((route.query.q as string) || '');
const results = ref({
  students: [] as any[],
  posts: [] as any[],
  resources: [] as any[],
  interviews: [] as any[]
});
const isLoading = ref(false);

const executeSearch = async () => {
  if (!searchInput.value.trim()) return;
  
  isLoading.value = true;
  // Sync URL query
  router.replace({ query: { q: searchInput.value } });
  
  try {
    const res = await api.get(`/search?q=${encodeURIComponent(searchInput.value)}`);
    if (res.data?.success) {
      results.value = res.data.data;
    }
  } catch (err) {
    toastStore.show('Failed to execute search query.', 'error');
  } finally {
    isLoading.value = false;
  }
};

watch(() => route.query.q, (newQ) => {
  if (newQ !== undefined) {
    searchInput.value = newQ as string;
    executeSearch();
  }
});

onMounted(() => {
  if (searchInput.value) {
    executeSearch();
  }
});
</script>

<template>
  <div class="flex flex-col gap-6">
    
    <!-- Large search header card -->
    <div class="glass-card rounded-2xl p-6 shadow-sm border border-slate-200/50 dark:border-slate-800/50 flex flex-col gap-4">
      <h2 class="text-lg font-bold text-slate-800 dark:text-slate-200">Unified Directory Search</h2>
      <div class="flex items-center gap-3 w-full">
        <input
          v-model="searchInput"
          @keyup.enter="executeSearch"
          type="text"
          placeholder="Search roll numbers, student names, skills, coding questions, resources..."
          class="flex-1 px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 focus:outline-none dark:text-slate-100"
        />
        <button
          @click="executeSearch"
          class="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-semibold text-xs rounded-xl cursor-pointer"
        >
          Search
        </button>
      </div>
    </div>

    <!-- Loading Indicators -->
    <div v-if="isLoading" class="text-center py-12 text-slate-400 text-sm">Searching the academic index database...</div>

    <!-- Search Results View -->
    <div v-else class="flex flex-col gap-8">
      
      <div v-if="!route.query.q" class="text-center py-12 text-slate-400 text-xs">
        Enter a keyword above to find students, posts, resources, or interview records.
      </div>

      <div v-else-if="results.students.length === 0 && results.posts.length === 0 && results.resources.length === 0 && results.interviews.length === 0" class="text-center py-12 text-slate-400 text-sm">
        No results found for keyword "{{ route.query.q }}". Try a simpler word.
      </div>

      <div v-else class="flex flex-col gap-8">
        
        <!-- Category: Students -->
        <div v-if="results.students.length > 0" class="flex flex-col gap-3">
          <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Matching Students ({{ results.students.length }})</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              v-for="stud in results.students"
              :key="stud.uid"
              @click="router.push(`/profile/${stud.uid}`)"
              class="glass-card rounded-xl p-4 flex items-center gap-3 border border-slate-200/40 dark:border-slate-800/40 hover:border-primary-500/30 transition-all cursor-pointer shadow-sm"
            >
              <img :src="stud.profilePicture" alt="Student" class="w-10 h-10 rounded-lg object-cover" />
              <div class="min-w-0">
                <h4 class="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{{ stud.fullName }}</h4>
                <p class="text-[10px] text-slate-400 truncate">{{ stud.branch }} &bull; Year {{ stud.year }}</p>
                <span class="text-[8px] font-extrabold uppercase text-slate-400 bg-slate-100 dark:bg-slate-900 px-1 py-0.5 rounded mt-1 inline-block">
                  {{ stud.placementStatus }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Category: Interview drives -->
        <div v-if="results.interviews.length > 0" class="flex flex-col gap-3">
          <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Interview Drives ({{ results.interviews.length }})</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              v-for="exp in results.interviews"
              :key="exp.id"
              @click="router.push('/interviews')"
              class="glass-card rounded-xl p-4 border border-slate-200/40 dark:border-slate-800/40 hover:border-primary-500/30 transition-all cursor-pointer flex flex-col justify-between shadow-sm"
            >
              <div>
                <h4 class="text-xs font-bold text-slate-800 dark:text-slate-100">{{ exp.role }} drive at <span class="text-primary-500">{{ exp.company }}</span></h4>
                <p class="text-[10px] text-slate-400 mt-1 leading-relaxed line-clamp-2">{{ exp.preparationTips }}</p>
              </div>
              <div class="flex justify-between items-center mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-[9px] text-slate-400">
                <span>{{ exp.votes.length || 0 }} Upvotes</span>
                <span class="font-bold uppercase">{{ exp.difficulty }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Category: Shared Resources -->
        <div v-if="results.resources.length > 0" class="flex flex-col gap-3">
          <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Shared Documents & Notes ({{ results.resources.length }})</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              v-for="res in results.resources"
              :key="res.id"
              @click="router.push('/resources')"
              class="glass-card rounded-xl p-4 border border-slate-200/40 dark:border-slate-800/40 hover:border-primary-500/30 transition-all cursor-pointer flex flex-col justify-between shadow-sm"
            >
              <div>
                <div class="flex justify-between items-center">
                  <span class="text-[8px] font-extrabold uppercase bg-primary-500/10 text-primary-500 px-1 py-0.5 rounded">{{ res.type }}</span>
                  <span class="text-[9px] text-slate-400">Downloads: {{ res.downloadsCount || 0 }}</span>
                </div>
                <h4 class="text-xs font-bold text-slate-800 dark:text-slate-100 mt-1 truncate">{{ res.title }}</h4>
                <p class="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">{{ res.description }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Category: Posts -->
        <div v-if="results.posts.length > 0" class="flex flex-col gap-3">
          <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Discussion Posts ({{ results.posts.length }})</h3>
          <div class="flex flex-col gap-3">
            <div
              v-for="post in results.posts"
              :key="post.id"
              @click="router.push('/')"
              class="glass-card rounded-xl p-4 border border-slate-200/40 dark:border-slate-800/40 hover:border-primary-500/30 transition-all cursor-pointer flex flex-col gap-1.5 shadow-sm"
            >
              <div class="flex justify-between text-[9px] text-slate-400">
                <span class="font-bold">{{ post.authorName }}</span>
                <span>{{ new Date(post.createdAt).toLocaleDateString() }}</span>
              </div>
              <p class="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">{{ post.content }}</p>
            </div>
          </div>
        </div>

      </div>

    </div>

  </div>
</template>
