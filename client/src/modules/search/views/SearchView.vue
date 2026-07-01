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
  <div class="flex flex-col gap-3">
    
    <!-- Large search header card -->
    <div class="github-card p-4 flex flex-col gap-3">
      <h2 class="text-xs font-bold text-github-text uppercase tracking-wide border-b border-github-border pb-1">Unified Directory Search</h2>
      <div class="flex items-center gap-2 w-full">
        <input
          v-model="searchInput"
          @keyup.enter="executeSearch"
          type="text"
          placeholder="Search roll numbers, student names, skills, coding questions, resources..."
          class="github-input flex-1 text-xs h-8 py-1"
        />
        <button
          @click="executeSearch"
          class="github-button-primary h-8 flex items-center justify-center shrink-0"
        >
          Search
        </button>
      </div>
    </div>

    <!-- Loading Indicators -->
    <div v-if="isLoading" class="text-center py-8 text-github-secondary text-xs">Searching the academic index database...</div>

    <!-- Search Results View -->
    <div v-else class="flex flex-col gap-5">
      
      <div v-if="!route.query.q" class="text-center py-8 text-github-secondary text-xs">
        Enter a keyword above to find students, posts, resources, or interview records.
      </div>

      <div v-else-if="results.students.length === 0 && results.posts.length === 0 && results.resources.length === 0 && results.interviews.length === 0" class="text-center py-8 text-github-secondary text-xs">
        No results found for keyword "{{ route.query.q }}". Try a simpler word.
      </div>

      <div v-else class="flex flex-col gap-5">
        
        <!-- Category: Students -->
        <div v-if="results.students.length > 0" class="flex flex-col gap-2">
          <h3 class="text-[10px] font-bold text-github-secondary uppercase tracking-wider pl-1">Matching Students ({{ results.students.length }})</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div
              v-for="stud in results.students"
              :key="stud.uid"
              @click="router.push(`/profile/${stud.uid}`)"
              class="github-card p-3 flex items-center gap-3 hover:border-github-accent transition-all cursor-pointer"
            >
              <img :src="stud.profilePicture" alt="Student" class="w-8 h-8 rounded-full object-cover border border-github-border shrink-0" />
              <div class="min-w-0">
                <h4 class="text-xs font-bold text-github-text truncate">{{ stud.fullName }}</h4>
                <p class="text-[10px] text-github-secondary truncate">{{ stud.branch }} &bull; Year {{ stud.year }}</p>
                <span class="text-[8px] font-bold uppercase text-github-secondary bg-github-bg border border-github-border px-1.5 py-0.2 rounded-[4px] mt-1 inline-block">
                  {{ stud.placementStatus }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Category: Interview drives -->
        <div v-if="results.interviews.length > 0" class="flex flex-col gap-2">
          <h3 class="text-[10px] font-bold text-github-secondary uppercase tracking-wider pl-1">Interview Drives ({{ results.interviews.length }})</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div
              v-for="exp in results.interviews"
              :key="exp.id"
              @click="router.push('/interviews')"
              class="github-card p-3 hover:border-github-accent transition-all cursor-pointer flex flex-col justify-between animate-in"
            >
              <div>
                <h4 class="text-xs font-bold text-github-text">{{ exp.role }} drive at <span class="text-github-accent">{{ exp.company }}</span></h4>
                <p class="text-[10px] text-github-secondary mt-1 leading-relaxed line-clamp-2">{{ exp.preparationTips }}</p>
              </div>
              <div class="flex justify-between items-center mt-3 pt-2 border-t border-github-border text-[9px] text-github-secondary">
                <span>{{ exp.votes.length || 0 }} Upvotes</span>
                <span class="font-bold uppercase">{{ exp.difficulty }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Category: Shared Resources -->
        <div v-if="results.resources.length > 0" class="flex flex-col gap-2">
          <h3 class="text-[10px] font-bold text-github-secondary uppercase tracking-wider pl-1">Shared Documents & Notes ({{ results.resources.length }})</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div
              v-for="res in results.resources"
              :key="res.id"
              @click="router.push('/resources')"
              class="github-card p-3 hover:border-github-accent transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div class="flex justify-between items-center">
                  <span class="text-[8px] font-bold uppercase bg-github-accent/10 text-github-accent px-1.5 py-0.2 border border-github-accent/25 rounded-[4px]">{{ res.type }}</span>
                  <span class="text-[9px] text-github-secondary">Downloads: {{ res.downloadsCount || 0 }}</span>
                </div>
                <h4 class="text-xs font-bold text-github-text mt-1 truncate">{{ res.title }}</h4>
                <p class="text-[10px] text-github-secondary mt-1 line-clamp-2 leading-relaxed">{{ res.description }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Category: Posts -->
        <div v-if="results.posts.length > 0" class="flex flex-col gap-2">
          <h3 class="text-[10px] font-bold text-github-secondary uppercase tracking-wider pl-1">Discussion Posts ({{ results.posts.length }})</h3>
          <div class="flex flex-col gap-2">
            <div
              v-for="post in results.posts"
              :key="post.id"
              @click="router.push('/')"
              class="github-card p-3 hover:border-github-accent transition-all cursor-pointer flex flex-col gap-1.5"
            >
              <div class="flex justify-between text-[9px] text-github-secondary">
                <span class="font-bold">{{ post.authorName }}</span>
                <span>{{ new Date(post.createdAt).toLocaleDateString() }}</span>
              </div>
              <p class="text-xs text-github-text line-clamp-3 leading-relaxed">{{ post.content }}</p>
            </div>
          </div>
        </div>

      </div>

    </div>

  </div>
</template>
