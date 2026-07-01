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
  <div class="flex flex-col gap-3">
    
    <!-- Dashboard Heading -->
    <div>
      <h2 class="text-sm font-bold text-github-text uppercase tracking-wide">Moderator Desk</h2>
      <p class="text-xs text-github-secondary">Monitor community safety and review content flagged by the automated AI system.</p>
    </div>

    <!-- Analytics Stats Widgets -->
    <div v-if="isMetricsLoading" class="grid grid-cols-1 sm:grid-cols-4 gap-3 animate-pulse">
      <div v-for="i in 4" :key="i" class="w-full h-16 bg-[#2d333b] rounded-[6px]"></div>
    </div>

    <div v-else-if="metrics" class="grid grid-cols-1 sm:grid-cols-4 gap-3">
      
      <div class="github-card p-3">
        <span class="text-[10px] font-bold text-github-secondary uppercase tracking-wide">Daily Active Users</span>
        <div class="text-xl font-bold text-github-accent mt-1">{{ metrics.activeUsers.daily }}</div>
        <span class="text-[9px] text-github-secondary">From total {{ metrics.counts.users }} students</span>
      </div>

      <div class="github-card p-3">
        <span class="text-[10px] font-bold text-github-secondary uppercase tracking-wide">Discussion Posts</span>
        <div class="text-xl font-bold text-github-text mt-1">{{ metrics.counts.posts }}</div>
        <span class="text-[9px] text-github-secondary">Shared in feed</span>
      </div>

      <div class="github-card p-3">
        <span class="text-[10px] font-bold text-github-secondary uppercase tracking-wide">Hiring Drives Logged</span>
        <div class="text-xl font-bold text-github-success mt-1">{{ metrics.counts.interviews }}</div>
        <span class="text-[9px] text-github-secondary">Interview experiences</span>
      </div>

      <div class="github-card p-3">
        <span class="text-[10px] font-bold text-github-secondary uppercase tracking-wide">Study Resources</span>
        <div class="text-xl font-bold text-github-accent mt-1">{{ metrics.counts.resources }}</div>
        <span class="text-[9px] text-github-secondary">Shared roadmaps & notes</span>
      </div>

    </div>

    <!-- Main Moderation Section -->
    <div class="github-card p-4 flex flex-col gap-4">
      
      <div>
        <h3 class="text-xs font-bold text-github-text uppercase tracking-wide">AI Moderation Queue</h3>
        <p class="text-[10px] text-github-secondary mt-0.5">Approve posts/comments that are professional, or confirm the flag to lock them.</p>
      </div>

      <!-- Action Reason Input -->
      <div class="flex flex-col gap-1.5 w-full">
        <label class="text-[10px] font-bold text-github-secondary uppercase">Decision Memo Reason</label>
        <input
          v-model="resolutionReason"
          type="text"
          placeholder="Reason for overriding (e.g. False positive, clearly violates policy)"
          class="github-input max-w-md text-xs h-8 py-1 placeholder-github-secondary"
        />
      </div>

      <div v-if="isQueueLoading" class="text-center py-4 text-github-secondary text-xs">Fetching flagged database records...</div>
      
      <div v-else class="flex flex-col gap-4">
        
        <!-- Sub-list: Posts under review -->
        <div class="flex flex-col gap-2">
          <h4 class="text-[10px] font-bold text-github-secondary uppercase tracking-wider pl-1">Flagged Feed Posts ({{ flaggedPosts.length }})</h4>
          
          <div v-if="flaggedPosts.length === 0" class="text-xs text-github-secondary bg-github-bg p-3 border border-github-border rounded-[6px]">
            No posts currently flagged for review. Good job!
          </div>

          <div v-else class="flex flex-col gap-3">
            <div
              v-for="post in flaggedPosts"
              :key="post.id"
              class="p-3 border border-github-danger/25 bg-github-danger/5 rounded-[6px] flex flex-col gap-2.5"
            >
              <div class="flex justify-between items-start gap-3">
                <div>
                  <span class="text-xs font-bold text-github-text">Author: {{ post.authorName }}</span>
                  <div class="text-[9px] text-github-secondary">Score: {{ post.toxicityScore.toFixed(2) }} | Status: {{ post.moderationStatus }}</div>
                </div>
                
                <div class="flex gap-1.5">
                  <button
                    @click="handleResolve(post.id, 'Post', 'approve')"
                    class="github-button hover:bg-github-success/15 hover:text-github-success border-github-border h-7 text-[10px] py-1 px-2.5 flex items-center justify-center font-bold"
                  >
                    Approve / Override
                  </button>
                  <button
                    @click="handleResolve(post.id, 'Post', 'flag')"
                    class="github-button hover:bg-github-danger/15 hover:text-github-danger border-github-border h-7 text-[10px] py-1 px-2.5 flex items-center justify-center font-bold"
                  >
                    Confirm Lock
                  </button>
                </div>
              </div>

              <p class="text-xs text-github-text leading-relaxed font-mono bg-github-bg border border-github-border p-2.5 rounded-[6px]">
                {{ post.content }}
              </p>
            </div>
          </div>
        </div>

        <!-- Sub-list: Comments under review -->
        <div class="flex flex-col gap-2 mt-2">
          <h4 class="text-[10px] font-bold text-github-secondary uppercase tracking-wider pl-1">Flagged Comments ({{ flaggedComments.length }})</h4>
          
          <div v-if="flaggedComments.length === 0" class="text-xs text-github-secondary bg-github-bg p-3 border border-github-border rounded-[6px]">
            No comments currently flagged for review.
          </div>

          <div v-else class="flex flex-col gap-3">
            <div
              v-for="comm in flaggedComments"
              :key="comm.id"
              class="p-3 border border-github-danger/25 bg-github-danger/5 rounded-[6px] flex flex-col gap-2.5"
            >
              <div class="flex justify-between items-start gap-3">
                <div>
                  <span class="text-xs font-bold text-github-text">Author: {{ comm.authorName }}</span>
                  <div class="text-[9px] text-github-secondary">Status: {{ comm.moderationStatus }}</div>
                </div>

                <div class="flex gap-1.5">
                  <button
                    @click="handleResolve(comm.id, 'Comment', 'approve')"
                    class="github-button hover:bg-github-success/15 hover:text-github-success border-github-border h-7 text-[10px] py-1 px-2.5 flex items-center justify-center font-bold"
                  >
                    Approve / Override
                  </button>
                  <button
                    @click="handleResolve(comm.id, 'Comment', 'flag')"
                    class="github-button hover:bg-github-danger/15 hover:text-github-danger border-github-border h-7 text-[10px] py-1 px-2.5 flex items-center justify-center font-bold"
                  >
                    Confirm Lock
                  </button>
                </div>
              </div>

              <p class="text-xs text-github-text leading-relaxed font-mono bg-github-bg border border-github-border p-2.5 rounded-[6px]">
                {{ comm.content }}
              </p>
            </div>
          </div>
        </div>

      </div>

    </div>

  </div>
</template>
