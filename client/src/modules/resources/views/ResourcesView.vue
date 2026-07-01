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
  <div class="flex flex-col gap-3">
    
    <!-- Top Tabs Grid Navigation -->
    <div class="flex items-center justify-between gap-3 border-b border-github-border pb-1 overflow-x-auto">
      <div class="flex gap-1.5">
        <button
          v-for="cat in categories"
          :key="cat.value"
          @click="loadResources(cat.value)"
          :class="[
            'px-3 py-1.5 text-xs font-bold whitespace-nowrap rounded-[4px] transition-all cursor-pointer select-none border',
            activeTab === cat.value
              ? 'bg-[#2d333b] text-github-accent border-github-border'
              : 'text-github-secondary hover:text-github-text hover:bg-[#2d333b] border-transparent'
          ]"
        >
          {{ cat.label }}
        </button>
      </div>

      <button
        @click="showUploadModal = true"
        class="github-button-primary shrink-0 h-8 flex items-center justify-center font-bold text-xs"
      >
        Upload Resource
      </button>
    </div>

    <!-- Loading skeletons -->
    <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div v-for="i in 4" :key="i" class="github-card p-4 animate-pulse flex flex-col gap-3">
        <div class="w-36 h-4 bg-[#2d333b] rounded"></div>
        <div class="w-full h-12 bg-[#2d333b] rounded-[6px]"></div>
      </div>
    </div>

    <!-- Resource items List Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3">
      
      <div v-if="resources.length === 0" class="col-span-2 github-card p-8 text-center text-github-secondary border-dashed border-github-border">
        No shared resources uploaded in this category yet. Be the first to share notes or guides!
      </div>

      <div
        v-for="res in resources"
        :key="res.id"
        class="github-card p-3 flex flex-col justify-between gap-3"
      >
        
        <div class="flex flex-col gap-1.5">
          <!-- Type and Title -->
          <div class="flex items-center justify-between gap-3">
            <span class="text-[9px] font-bold uppercase px-1.5 py-0.2 bg-github-accent/10 text-github-accent border border-github-accent/25 rounded-[4px] shrink-0">
              {{ res.type }}
            </span>
            <span class="text-[10px] text-github-secondary font-medium truncate">Uploaded by {{ res.authorName }}</span>
          </div>

          <h3 class="text-xs font-bold text-github-text mt-1 leading-snug">
            {{ res.title }}
          </h3>
          <p class="text-xs text-github-secondary leading-relaxed line-clamp-2">
            {{ res.description }}
          </p>

          <!-- Tags -->
          <div v-if="res.tags && res.tags.length > 0" class="flex flex-wrap gap-1 mt-1">
            <span v-for="t in res.tags" :key="t" class="text-[10px] text-github-secondary bg-github-bg border border-github-border px-1.5 py-0.5 rounded-[4px]">
              #{{ t }}
            </span>
          </div>
        </div>

        <!-- Downloads Footer and Download Trigger -->
        <div class="flex items-center justify-between border-t border-github-border pt-3 mt-1">
          <span class="text-[10px] text-github-secondary font-semibold">
            {{ res.downloadsCount || 0 }} accesses logged
          </span>

          <button
            @click="handleDownload(res)"
            class="github-button h-8 flex items-center justify-center shrink-0"
          >
            Access / View
          </button>
        </div>

      </div>

    </div>

    <!-- Upload Resource Modal -->
    <div v-if="showUploadModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div @click="showUploadModal = false" class="absolute inset-0 bg-[#000000]/50"></div>
      
      <div class="w-full max-w-lg bg-github-surface border border-github-border p-4 rounded-[6px] relative z-10 flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-150">
        
        <div class="flex justify-between items-center border-b border-github-border pb-2">
          <h2 class="text-xs font-bold text-github-text uppercase tracking-wide">Share Academic Material</h2>
          <button @click="showUploadModal = false" class="text-github-secondary hover:text-github-text text-base cursor-pointer">&times;</button>
        </div>

        <form @submit.prevent="handleShareResource" class="flex flex-col gap-3">
          
          <div>
            <label class="block text-xs font-semibold text-github-text mb-1">Title</label>
            <input v-model="title" type="text" placeholder="e.g. Operating Systems Lecture Notes Units 1-3" required class="github-input w-full text-xs h-8 py-1" />
          </div>

          <div>
            <label class="block text-xs font-semibold text-github-text mb-1">Description</label>
            <textarea v-model="description" rows="2" placeholder="Brief summary of OS topics covered (e.g. Semaphores, Scheduling)..." required class="github-input w-full resize-none text-xs"></textarea>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-github-text mb-1">Material Type</label>
              <select v-model="type" class="github-input w-full text-xs h-8 py-1 cursor-pointer">
                <option value="notes">Lecture Notes</option>
                <option value="pdf">PDF File</option>
                <option value="cheat-sheet">Cheat Sheet</option>
                <option value="book">Reference Book</option>
                <option value="roadmap">Tech Roadmap</option>
                <option value="link">Reference URL</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-github-text mb-1">Target Category</label>
              <select v-model="category" class="github-input w-full text-xs h-8 py-1 cursor-pointer">
                <option v-for="cat in categories" :key="cat.value" :value="cat.value">{{ cat.label }}</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-github-text mb-1">Academic Semester (optional)</label>
            <select v-model="semester" class="github-input w-full text-xs h-8 py-1 cursor-pointer">
              <option :value="undefined">No Specific Semester</option>
              <option v-for="s in 8" :key="s" :value="s">Semester {{ s }}</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-github-text mb-1">Resource Link (Google Drive / GitHub)</label>
            <input v-model="url" type="url" placeholder="https://drive.google.com/..." class="github-input w-full text-xs h-8 py-1" />
          </div>

          <div>
            <label class="block text-xs font-semibold text-github-text mb-1">Topic Tags (comma separated)</label>
            <input v-model="tags" type="text" placeholder="e.g. os, cse, notes" class="github-input w-full text-xs h-8 py-1" />
          </div>

          <div class="flex justify-end gap-2 border-t border-github-border pt-2 mt-2">
            <button type="button" @click="showUploadModal = false" class="github-button h-8 flex items-center justify-center">Cancel</button>
            <button type="submit" class="github-button-primary h-8 flex items-center justify-center">Upload material</button>
          </div>

        </form>

      </div>
    </div>

  </div>
</template>
