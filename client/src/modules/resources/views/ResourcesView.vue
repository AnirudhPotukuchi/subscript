<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useToastStore } from '../../../stores/toast';
import api from '../../../services/api';

const toastStore = useToastStore();

const resources = ref<any[]>([]);
const isLoading = ref(true);
const activeTab = ref('placement');

// Creation States
const showUploadModal = ref(false);
const title = ref('');
const description = ref('');
const type = ref<'notes' | 'pdf' | 'cheat-sheet' | 'book' | 'roadmap' | 'video' | 'link'>('notes');
const url = ref('');
const category = ref('placement');
const semester = ref<number | undefined>(undefined);
const tags = ref('');

const categories = [
  { value: 'placement', label: 'Placement Prep' },
  { value: 'dsa', label: 'Data Structures & Algorithms' },
  { value: 'web-dev', label: 'Web Development' },
  { value: 'ai-ml', label: 'AI & Machine Learning' },
  { value: 'cp', label: 'Competitive Programming' },
  { value: 'subject', label: 'Academic Subjects' },
  { value: 'technology', label: 'Frameworks & Systems' }
];

const loadResources = async (cat: string) => {
  activeTab.value = cat;
  isLoading.value = true;
  try {
    const res = await api.get(`/resources?category=${cat}`);
    if (res.data?.success) {
      resources.value = res.data.data;
    }
  } catch (err) {
    toastStore.show('Failed to fetch resources.', 'error');
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  loadResources('placement');
});

const handleShareResource = async () => {
  if (!title.value || !description.value || !category.value) {
    toastStore.show('Title, description, and category are required.', 'warning');
    return;
  }

  const payload = {
    title: title.value,
    description: description.value,
    type: type.value,
    url: url.value,
    category: category.value,
    semester: semester.value ? Number(semester.value) : undefined,
    tags: tags.value ? tags.value.split(',').map((t) => t.trim()) : []
  };

  try {
    const res = await api.post('/resources', payload);
    if (res.data?.success) {
      toastStore.show('Resource shared successfully!', 'success');
      showUploadModal.value = false;
      
      // Reset
      title.value = '';
      description.value = '';
      url.value = '';
      tags.value = '';
      semester.value = undefined;
      
      loadResources(category.value);
    }
  } catch (err) {
    toastStore.show('Failed to share resource.', 'error');
  }
};

const handleDownload = async (resource: any) => {
  // Increment downloads count optimistically
  resource.downloadsCount++;
  
  try {
    await api.post(`/resources/${resource.id}/download`);
    toastStore.show(`Accessing resource: "${resource.title}"`, 'success');
    if (resource.url) {
      window.open(resource.url, '_blank');
    }
  } catch (err) {
    resource.downloadsCount--;
    toastStore.show('Failed to update download counts.', 'error');
  }
};
</script>

<template>
  <div class="flex flex-col gap-6">
    
    <!-- Top Tabs Grid Navigation -->
    <div class="flex items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-1 overflow-x-auto">
      <div class="flex gap-2">
        <button
          v-for="cat in categories"
          :key="cat.value"
          @click="loadResources(cat.value)"
          :class="[
            'px-4 py-2.5 text-xs font-bold whitespace-nowrap rounded-xl transition-all cursor-pointer select-none',
            activeTab === cat.value
              ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/25'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 border border-transparent'
          ]"
        >
          {{ cat.label }}
        </button>
      </div>

      <button
        @click="showUploadModal = true"
        class="px-5 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold text-xs rounded-xl cursor-pointer shadow-md shadow-primary-500/10 transition-colors select-none shrink-0"
      >
        Upload Resource
      </button>
    </div>

    <!-- Loading skeletons -->
    <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div v-for="i in 4" :key="i" class="glass-card rounded-2xl p-5 animate-pulse flex flex-col gap-3">
        <div class="w-36 h-4 bg-slate-200 dark:bg-slate-800 rounded"></div>
        <div class="w-full h-12 bg-slate-200 dark:bg-slate-800 rounded"></div>
      </div>
    </div>

    <!-- Resource items List Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
      
      <div v-if="resources.length === 0" class="col-span-2 glass-card rounded-2xl p-12 text-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-800">
        No shared resources uploaded in this category yet. Be the first to share notes or guides!
      </div>

      <div
        v-for="res in resources"
        :key="res.id"
        class="glass-card rounded-2xl p-5 shadow-sm border border-slate-200/50 dark:border-slate-800/50 flex flex-col justify-between gap-4 hover:shadow-md transition-shadow"
      >
        
        <div class="flex flex-col gap-2">
          <!-- Type and Title -->
          <div class="flex items-center justify-between gap-3">
            <span class="text-[9px] font-extrabold uppercase px-2 py-0.5 bg-primary-500/15 text-primary-500 border border-primary-500/20 rounded-md">
              {{ res.type }}
            </span>
            <span class="text-[10px] text-slate-400 font-medium">Uploaded by {{ res.authorName }}</span>
          </div>

          <h3 class="text-sm font-bold text-slate-800 dark:text-slate-100 mt-1 leading-snug">
            {{ res.title }}
          </h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {{ res.description }}
          </p>

          <!-- Tags -->
          <div v-if="res.tags && res.tags.length > 0" class="flex flex-wrap gap-1 mt-1">
            <span v-for="t in res.tags" :key="t" class="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-900/60 px-2 py-0.5 rounded">
              #{{ t }}
            </span>
          </div>
        </div>

        <!-- Downloads Footer and Download Trigger -->
        <div class="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60 pt-4 mt-2">
          <span class="text-[10px] text-slate-400 font-semibold">
            {{ res.downloadsCount || 0 }} accesses logged
          </span>

          <button
            @click="handleDownload(res)"
            class="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl cursor-pointer select-none transition-colors border border-slate-200/50 dark:border-slate-800/50"
          >
            Access / View
          </button>
        </div>

      </div>

    </div>

    <!-- Upload Resource Modal -->
    <div v-if="showUploadModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div @click="showUploadModal = false" class="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"></div>
      
      <div class="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-2xl relative z-10 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
        
        <div class="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 class="text-base font-bold text-slate-800 dark:text-slate-200">Share Academic Material</h2>
          <button @click="showUploadModal = false" class="text-slate-400 hover:text-slate-600 text-lg cursor-pointer">&times;</button>
        </div>

        <form @submit.prevent="handleShareResource" class="flex flex-col gap-4">
          
          <div>
            <label class="block text-[10px] font-bold uppercase text-slate-400 mb-1">Title</label>
            <input v-model="title" type="text" placeholder="e.g. Operating Systems Lecture Notes Units 1-3" required class="w-full px-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 focus:outline-none dark:text-slate-100" />
          </div>

          <div>
            <label class="block text-[10px] font-bold uppercase text-slate-400 mb-1">Description</label>
            <textarea v-model="description" rows="3" placeholder="Brief summary of OS topics covered (e.g. Semaphores, Scheduling)..." required class="w-full px-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 focus:outline-none dark:text-slate-100 resize-none"></textarea>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-[10px] font-bold uppercase text-slate-400 mb-1">Material Type</label>
              <select v-model="type" class="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none dark:text-slate-100 cursor-pointer">
                <option value="notes">Lecture Notes</option>
                <option value="pdf">PDF File</option>
                <option value="cheat-sheet">Cheat Sheet</option>
                <option value="book">Reference Book</option>
                <option value="roadmap">Tech Roadmap</option>
                <option value="link">Reference URL</option>
              </select>
            </div>

            <div>
              <label class="block text-[10px] font-bold uppercase text-slate-400 mb-1">Target Category</label>
              <select v-model="category" class="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none dark:text-slate-100 cursor-pointer">
                <option v-for="cat in categories" :key="cat.value" :value="cat.value">{{ cat.label }}</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-[10px] font-bold uppercase text-slate-400 mb-1">Academic Semester (optional)</label>
            <select v-model="semester" class="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none dark:text-slate-100 cursor-pointer">
              <option :value="undefined">No Specific Semester</option>
              <option v-for="s in 8" :key="s" :value="s">Semester {{ s }}</option>
            </select>
          </div>

          <div>
            <label class="block text-[10px] font-bold uppercase text-slate-400 mb-1">Resource Link (Google Drive / GitHub)</label>
            <input v-model="url" type="url" placeholder="https://drive.google.com/..." class="w-full px-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 focus:outline-none dark:text-slate-100" />
          </div>

          <div>
            <label class="block text-[10px] font-bold uppercase text-slate-400 mb-1">Topic Tags (comma separated)</label>
            <input v-model="tags" type="text" placeholder="e.g. os, cse, notes" class="w-full px-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 focus:outline-none dark:text-slate-100" />
          </div>

          <div class="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-3 mt-2">
            <button type="button" @click="showUploadModal = false" class="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-600 cursor-pointer">Cancel</button>
            <button type="submit" class="px-5 py-2.5 bg-primary-500 text-white font-semibold text-xs rounded-xl cursor-pointer shadow-md shadow-primary-500/10">Upload material</button>
          </div>

        </form>

      </div>
    </div>

  </div>
</template>
