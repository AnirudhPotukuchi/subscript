<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useToastStore } from '../../../stores/toast';
import api from '../../../services/api';

const toastStore = useToastStore();

const metrics = ref<any>(null);
const flaggedPosts = ref<any[]>([]);
const flaggedComments = ref<any[]>([]);
const isMetricsLoading = ref(true);
const isQueueLoading = ref(true);
const resolutionReason = ref('');

const loadMetrics = async () => {
  isMetricsLoading.value = true;
  try {
    const res = await api.get('/admin/metrics');
    if (res.data?.success) {
      metrics.value = res.data.data;
    }
  } catch (err) {
    toastStore.show('Failed to fetch platform metrics.', 'error');
  } finally {
    isMetricsLoading.value = false;
  }
};

const loadQueue = async () => {
  isQueueLoading.value = true;
  try {
    const res = await api.get('/admin/moderation-queue');
    if (res.data?.success) {
      flaggedPosts.value = res.data.data.posts;
      flaggedComments.value = res.data.data.comments;
    }
  } catch (err) {
    toastStore.show('Failed to fetch moderation queue.', 'error');
  } finally {
    isQueueLoading.value = false;
  }
};

onMounted(() => {
  loadMetrics();
  loadQueue();
});

const handleResolve = async (id: string, targetType: 'Post' | 'Comment', action: 'approve' | 'flag') => {
  const reasonText = resolutionReason.value.trim() || `Moderator manually decided to ${action} item.`;
  
  try {
    const res = await api.post(`/admin/moderation/${id}/resolve`, {
      action,
      targetType,
      reason: reasonText
    });

    if (res.data?.success) {
      toastStore.show(res.data.message || 'Item resolved successfully.', 'success');
      resolutionReason.value = '';
      
      // Update UI list arrays
      if (targetType === 'Post') {
        flaggedPosts.value = flaggedPosts.value.filter((p) => p.id !== id);
      } else {
        flaggedComments.value = flaggedComments.value.filter((c) => c.id !== id);
      }
      
      loadMetrics();
    }
  } catch (err) {
    toastStore.show('Failed to submit moderation decision.', 'error');
  }
};
</script>

<template>
  <div class="flex flex-col gap-6">
    
    <!-- Dashboard Heading -->
    <div>
      <h2 class="text-xl font-extrabold text-slate-800 dark:text-slate-200">Moderator Desk</h2>
      <p class="text-xs text-slate-400">Monitor community safety and review content flagged by the automated AI system.</p>
    </div>

    <!-- Analytics Stats Widgets -->
    <div v-if="isMetricsLoading" class="grid grid-cols-1 sm:grid-cols-4 gap-4 animate-pulse">
      <div v-for="i in 4" :key="i" class="w-full h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
    </div>

    <div v-else-if="metrics" class="grid grid-cols-1 sm:grid-cols-4 gap-4">
      
      <div class="glass-card rounded-2xl p-4 shadow-sm border border-slate-200/50 dark:border-slate-800/50">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Daily Active Users</span>
        <div class="text-2xl font-black text-primary-500 mt-1">{{ metrics.activeUsers.daily }}</div>
        <span class="text-[9px] text-slate-400">From total {{ metrics.counts.users }} students</span>
      </div>

      <div class="glass-card rounded-2xl p-4 shadow-sm border border-slate-200/50 dark:border-slate-800/50">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Discussion Posts</span>
        <div class="text-2xl font-black text-slate-800 dark:text-slate-200 mt-1">{{ metrics.counts.posts }}</div>
        <span class="text-[9px] text-slate-400">Shared in feed</span>
      </div>

      <div class="glass-card rounded-2xl p-4 shadow-sm border border-slate-200/50 dark:border-slate-800/50">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Hiring Drives Logged</span>
        <div class="text-2xl font-black text-emerald-500 mt-1">{{ metrics.counts.interviews }}</div>
        <span class="text-[9px] text-slate-400">Interview experiences</span>
      </div>

      <div class="glass-card rounded-2xl p-4 shadow-sm border border-slate-200/50 dark:border-slate-800/50">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Study Resources</span>
        <div class="text-2xl font-black text-accent-500 mt-1">{{ metrics.counts.resources }}</div>
        <span class="text-[9px] text-slate-400">Shared roadmaps & notes</span>
      </div>

    </div>

    <!-- Main Moderation Section -->
    <div class="glass-card rounded-2xl p-6 shadow-sm border border-slate-200/50 dark:border-slate-800/50 flex flex-col gap-6">
      
      <div>
        <h3 class="text-base font-bold text-slate-800 dark:text-slate-200">AI Moderation Queue</h3>
        <p class="text-[10px] text-slate-400 mt-0.5">Approve posts/comments that are professional, or confirm the flag to lock them.</p>
      </div>

      <!-- Action Reason Input -->
      <div class="flex flex-col gap-1.5 max-w-md">
        <label class="text-[10px] font-bold text-slate-400 uppercase">Decision Memo Reason</label>
        <input
          v-model="resolutionReason"
          type="text"
          placeholder="Reason for overriding (e.g. False positive, clearly violates policy)"
          class="px-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 focus:outline-none dark:text-slate-100 placeholder-slate-400"
        />
      </div>

      <div v-if="isQueueLoading" class="text-center py-6 text-slate-400 text-xs">Fetching flagged database records...</div>
      
      <div v-else class="flex flex-col gap-6">
        
        <!-- Sub-list: Posts under review -->
        <div class="flex flex-col gap-3">
          <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Flagged Feed Posts ({{ flaggedPosts.length }})</h4>
          
          <div v-if="flaggedPosts.length === 0" class="text-xs text-slate-400 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200/20 dark:border-slate-800/20">
            No posts currently flagged for review. Good job!
          </div>

          <div v-else class="flex flex-col gap-4">
            <div
              v-for="post in flaggedPosts"
              :key="post.id"
              class="p-5 border border-red-500/20 dark:border-red-500/10 rounded-2xl flex flex-col gap-3 bg-red-500/[0.02]"
            >
              <div class="flex justify-between items-start">
                <div>
                  <span class="text-xs font-bold text-slate-700 dark:text-slate-200">Author: {{ post.authorName }}</span>
                  <div class="text-[9px] text-slate-400">Score: {{ post.toxicityScore.toFixed(2) }} | Status: {{ post.moderationStatus }}</div>
                </div>
                
                <div class="flex gap-2">
                  <button
                    @click="handleResolve(post.id, 'Post', 'approve')"
                    class="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-600 hover:text-white font-bold text-[10px] rounded-lg transition-colors cursor-pointer"
                  >
                    Approve / Override
                  </button>
                  <button
                    @click="handleResolve(post.id, 'Post', 'flag')"
                    class="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-600 hover:text-white font-bold text-[10px] rounded-lg transition-colors cursor-pointer"
                  >
                    Confirm Lock
                  </button>
                </div>
              </div>

              <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-mono bg-slate-100/50 dark:bg-slate-950/40 p-3 rounded-xl">
                {{ post.content }}
              </p>
            </div>
          </div>
        </div>

        <!-- Sub-list: Comments under review -->
        <div class="flex flex-col gap-3 mt-4">
          <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Flagged Comments ({{ flaggedComments.length }})</h4>
          
          <div v-if="flaggedComments.length === 0" class="text-xs text-slate-400 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200/20 dark:border-slate-800/20">
            No comments currently flagged for review.
          </div>

          <div v-else class="flex flex-col gap-4">
            <div
              v-for="comm in flaggedComments"
              :key="comm.id"
              class="p-5 border border-red-500/20 dark:border-red-500/10 rounded-2xl flex flex-col gap-3 bg-red-500/[0.02]"
            >
              <div class="flex justify-between items-start">
                <div>
                  <span class="text-xs font-bold text-slate-700 dark:text-slate-200">Author: {{ comm.authorName }}</span>
                  <div class="text-[9px] text-slate-400">Status: {{ comm.moderationStatus }}</div>
                </div>

                <div class="flex gap-2">
                  <button
                    @click="handleResolve(comm.id, 'Comment', 'approve')"
                    class="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-600 hover:text-white font-bold text-[10px] rounded-lg transition-colors cursor-pointer"
                  >
                    Approve / Override
                  </button>
                  <button
                    @click="handleResolve(comm.id, 'Comment', 'flag')"
                    class="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-600 hover:text-white font-bold text-[10px] rounded-lg transition-colors cursor-pointer"
                  >
                    Confirm Lock
                  </button>
                </div>
              </div>

              <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-mono bg-slate-100/50 dark:bg-slate-950/40 p-3 rounded-xl">
                {{ comm.content }}
              </p>
            </div>
          </div>
        </div>

      </div>

    </div>

  </div>
</template>
