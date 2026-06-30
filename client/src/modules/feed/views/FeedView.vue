<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '../../../stores/auth';
import { useToastStore } from '../../../stores/toast';
import api from '../../../services/api';

const authStore = useAuthStore();
const toastStore = useToastStore();
const route = useRoute();

const posts = ref<any[]>([]);
const isLoading = ref(false);

// Post creation states
const showCreateModal = ref(false);
const postContent = ref('');
const postTags = ref('');
const codeLanguage = ref('javascript');
const codeValue = ref('');
const includeCode = ref(false);

// Active comments expanded states
const activeCommentPostId = ref<string | null>(null);
const commentsList = ref<any[]>([]);
const commentText = ref('');
const isCommentsLoading = ref(false);

const loadFeed = async (tagFilter?: string) => {
  isLoading.value = true;
  try {
    const endpoint = tagFilter ? `/feed?tag=${encodeURIComponent(tagFilter)}` : '/feed';
    const res = await api.get(endpoint);
    if (res.data?.success) {
      posts.value = res.data.data;
    }
  } catch (err) {
    toastStore.show('Failed to fetch home feed.', 'error');
  } finally {
    isLoading.value = false;
  }
};

watch(() => route.query.tag, (newTag) => {
  loadFeed(newTag as string);
});

onMounted(() => {
  loadFeed(route.query.tag as string);
});

const handlePublishPost = async () => {
  if (!postContent.value.trim()) {
    toastStore.show('Post content cannot be empty.', 'warning');
    return;
  }

  const payload: Record<string, any> = {
    content: postContent.value,
    tags: postTags.value ? postTags.value.split(',').map((t) => t.trim()) : []
  };

  if (includeCode.value && codeValue.value.trim()) {
    payload.codeSnippets = [{
      language: codeLanguage.value,
      code: codeValue.value
    }];
  }

  try {
    const res = await api.post('/feed/posts', payload);
    if (res.data?.success) {
      toastStore.show(res.data.message || 'Post published!', 'success');
      postContent.value = '';
      postTags.value = '';
      codeValue.value = '';
      includeCode.value = false;
      showCreateModal.value = false;
      loadFeed(route.query.tag as string);
    }
  } catch (err: any) {
    toastStore.show(err.response?.data?.message || 'Failed to publish post.', 'error');
  }
};

// Optimistic UI updates for Liking
const handleLike = async (post: any) => {
  const isLiked = post.likes.includes(authStore.user?.uid);
  
  // Optimistic Toggle
  if (isLiked) {
    post.likes = post.likes.filter((uid: string) => uid !== authStore.user?.uid);
    post.likesCount--;
  } else {
    post.likes.push(authStore.user?.uid);
    post.likesCount++;
  }

  try {
    await api.post(`/feed/posts/${post.id}/like`);
  } catch (err) {
    // Revert if API fail
    if (isLiked) {
      post.likes.push(authStore.user?.uid);
      post.likesCount++;
    } else {
      post.likes = post.likes.filter((uid: string) => uid !== authStore.user?.uid);
      post.likesCount--;
    }
    toastStore.show('Failed to toggle like.', 'error');
  }
};

// Optimistic UI updates for Bookmark
const handleBookmark = async (post: any) => {
  const isBookmarked = post.isBookmarked || false;
  post.isBookmarked = !isBookmarked;

  try {
    await api.post(`/feed/posts/${post.id}/bookmark`);
    toastStore.show(isBookmarked ? 'Bookmark removed.' : 'Bookmark saved.', 'success');
  } catch (err) {
    post.isBookmarked = isBookmarked;
    toastStore.show('Failed to save bookmark.', 'error');
  }
};

// Comments handling
const expandComments = async (postId: string) => {
  if (activeCommentPostId.value === postId) {
    activeCommentPostId.value = null;
    return;
  }
  
  activeCommentPostId.value = postId;
  isCommentsLoading.value = true;
  try {
    const res = await api.get(`/feed/posts/${postId}/comments`);
    if (res.data?.success) {
      commentsList.value = res.data.data;
    }
  } catch (err) {
    toastStore.show('Failed to load comments.', 'error');
  } finally {
    isCommentsLoading.value = false;
  }
};

const handlePostComment = async (post: any) => {
  if (!commentText.value.trim()) return;

  try {
    const res = await api.post(`/feed/posts/${post.id}/comments`, {
      content: commentText.value
    });

    if (res.data?.success) {
      const savedComment = res.data.data;
      if (res.data.message.includes('flagged')) {
        toastStore.show('Comment flagged by moderation review.', 'warning');
      } else {
        commentsList.value.push(savedComment);
        post.commentsCount++;
        toastStore.show('Comment posted!', 'success');
      }
      commentText.value = '';
    }
  } catch (err) {
    toastStore.show('Failed to submit comment.', 'error');
  }
};
</script>

<template>
  <div class="flex flex-col gap-6">
    
    <!-- Top Action Card: Trigger Create Modal -->
    <div class="glass-card rounded-2xl p-4 shadow-sm flex items-center justify-between gap-4">
      <img
        :src="authStore.user?.profilePicture"
        alt="Profile"
        class="w-10 h-10 rounded-xl object-cover"
      />
      <button
        @click="showCreateModal = true"
        class="flex-1 text-left px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/50 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors text-slate-400 dark:text-slate-500 font-medium text-sm cursor-pointer select-none"
      >
        Share an update, technical resource, or ask seniors a question...
      </button>
      <button
        @click="showCreateModal = true"
        class="px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-semibold text-sm rounded-xl cursor-pointer shadow-md shadow-primary-500/10 transition-colors select-none"
      >
        Write Post
      </button>
    </div>

    <!-- Active Tag Header Indicator -->
    <div v-if="route.query.tag" class="flex justify-between items-center bg-primary-500/10 border border-primary-500/20 text-primary-600 dark:text-primary-400 px-4 py-3 rounded-xl">
      <span class="text-sm font-semibold">Showing topic tag: #{{ route.query.tag }}</span>
      <button @click="loadFeed()" class="text-xs font-bold hover:underline cursor-pointer">Clear Filter</button>
    </div>

    <!-- Loading Skeleton list -->
    <div v-if="isLoading" class="flex flex-col gap-6">
      <div v-for="i in 3" :key="i" class="glass-card rounded-2xl p-6 shadow-sm flex flex-col gap-4 animate-pulse">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800"></div>
          <div class="flex-1 flex flex-col gap-1.5">
            <div class="w-24 h-4 bg-slate-200 dark:bg-slate-800 rounded"></div>
            <div class="w-16 h-3 bg-slate-200 dark:bg-slate-800 rounded"></div>
          </div>
        </div>
        <div class="w-full h-16 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
        <div class="flex gap-4">
          <div class="w-12 h-6 bg-slate-200 dark:bg-slate-800 rounded"></div>
          <div class="w-12 h-6 bg-slate-200 dark:bg-slate-800 rounded"></div>
        </div>
      </div>
    </div>

    <!-- Feed List -->
    <div v-else class="flex flex-col gap-6">
      
      <div v-if="posts.length === 0" class="glass-card rounded-2xl p-12 text-center text-slate-400">
        No updates found under this feed. Be the first to share an academic or technical tip!
      </div>

      <div
        v-for="post in posts"
        :key="post.id"
        class="glass-card rounded-2xl p-6 shadow-sm flex flex-col gap-4 border border-slate-200/50 dark:border-slate-800/50 hover:shadow-md transition-shadow"
      >
        
        <!-- Post Header -->
        <div class="flex items-center gap-3">
          <img :src="post.authorPicture" alt="Author" class="w-10 h-10 rounded-xl object-cover" />
          <div class="flex flex-col">
            <span class="text-sm font-semibold text-slate-800 dark:text-slate-200">{{ post.authorName }}</span>
            <span class="text-[10px] text-slate-400 font-medium">
              {{ new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }}
            </span>
          </div>
        </div>

        <!-- Post Body -->
        <p class="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
          {{ post.content }}
        </p>

        <!-- Embedded Code snippets if any -->
        <div v-if="post.codeSnippets && post.codeSnippets.length > 0" class="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
          <div class="bg-slate-100 dark:bg-slate-900 px-4 py-1.5 text-xs text-slate-400 font-mono border-b border-slate-200/50 dark:border-slate-800/50">
            {{ post.codeSnippets[0].language }}
          </div>
          <pre class="bg-slate-950 text-emerald-400 p-4 overflow-x-auto text-xs font-mono"><code>{{ post.codeSnippets[0].code }}</code></pre>
        </div>

        <!-- Tags Row -->
        <div v-if="post.tags && post.tags.length > 0" class="flex flex-wrap gap-1.5">
          <span
            v-for="tag in post.tags"
            :key="tag"
            @click="loadFeed(tag)"
            class="text-xs px-2.5 py-1 bg-slate-100 hover:bg-primary-500/10 dark:bg-slate-900/60 dark:hover:bg-primary-500/10 dark:text-slate-400 text-slate-500 rounded-lg cursor-pointer transition-colors"
          >
            #{{ tag }}
          </span>
        </div>

        <!-- Action Row -->
        <div class="flex items-center gap-6 border-t border-slate-100 dark:border-slate-800/60 pt-4">
          
          <!-- Like Button -->
          <button
            @click="handleLike(post)"
            :class="[
              'flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-colors select-none',
              post.likes.includes(authStore.user?.uid) ? 'text-primary-500' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            ]"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span>Like ({{ post.likesCount || 0 }})</span>
          </button>

          <!-- Comment Toggle Button -->
          <button
            @click="expandComments(post.id)"
            class="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer transition-colors select-none"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>Comment ({{ post.commentsCount || 0 }})</span>
          </button>

          <!-- Bookmark Button -->
          <button
            @click="handleBookmark(post)"
            :class="[
              'flex items-center gap-1.5 text-xs font-semibold cursor-pointer ml-auto transition-colors select-none',
              post.isBookmarked ? 'text-accent-500' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            ]"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            <span>Save</span>
          </button>

        </div>

        <!-- Expanded Comments Section -->
        <div v-if="activeCommentPostId === post.id" class="border-t border-slate-100 dark:border-slate-800/60 pt-4 flex flex-col gap-4">
          
          <!-- Comments Write Card -->
          <div class="flex items-start gap-3">
            <img :src="authStore.user?.profilePicture" alt="Profile" class="w-8 h-8 rounded-lg object-cover" />
            <div class="flex-1 flex gap-2">
              <input
                v-model="commentText"
                @keyup.enter="handlePostComment(post)"
                type="text"
                placeholder="Write an educational reply..."
                class="flex-1 px-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 focus:outline-none dark:text-slate-100"
              />
              <button
                @click="handlePostComment(post)"
                class="px-4 py-2 bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 font-bold text-xs rounded-xl cursor-pointer"
              >
                Send
              </button>
            </div>
          </div>

          <!-- Loading comments -->
          <div v-if="isCommentsLoading" class="text-center py-2 text-xs text-slate-400">Loading replies...</div>

          <!-- Comments List -->
          <div v-else class="flex flex-col gap-3 pl-11">
            <div v-if="commentsList.length === 0" class="text-[11px] text-slate-400">No replies yet. Start the discussion!</div>
            
            <div
              v-for="comm in commentsList"
              :key="comm.id"
              class="bg-slate-100/50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200/20 dark:border-slate-800/20 flex flex-col gap-1.5"
            >
              <div class="flex items-center gap-2">
                <img :src="comm.authorPicture" alt="Author" class="w-6 h-6 rounded-md object-cover" />
                <span class="text-xs font-semibold text-slate-800 dark:text-slate-200">{{ comm.authorName }}</span>
                <span class="text-[9px] text-slate-400">
                  {{ new Date(comm.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }}
                </span>
              </div>
              <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{{ comm.content }}</p>
            </div>

          </div>

        </div>

      </div>

    </div>

    <!-- Create Post Dialog Modal -->
    <div v-if="showCreateModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div @click="showCreateModal = false" class="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"></div>
      
      <div class="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-2xl relative z-10 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
        
        <div class="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 class="text-lg font-bold text-slate-800 dark:text-slate-200">Create Technical Update</h2>
          <button @click="showCreateModal = false" class="text-slate-400 hover:text-slate-600 text-lg cursor-pointer">&times;</button>
        </div>

        <div class="flex flex-col gap-3">
          <textarea
            v-model="postContent"
            rows="5"
            placeholder="What technical project or career updates do you want to share?"
            class="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 focus:outline-none dark:text-slate-100 resize-none"
          ></textarea>

          <input
            v-model="postTags"
            type="text"
            placeholder="Tags (comma separated e.g. placement, webdev, dsa)"
            class="w-full px-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 focus:outline-none dark:text-slate-100"
          />

          <!-- Toggle code inclusion -->
          <div class="flex items-center gap-2 mt-1">
            <input v-model="includeCode" type="checkbox" id="include-code" class="cursor-pointer" />
            <label for="include-code" class="text-xs font-semibold text-slate-500 cursor-pointer select-none">Include Code Snippet</label>
          </div>

          <div v-if="includeCode" class="flex flex-col gap-2">
            <select
              v-model="codeLanguage"
              class="w-full max-w-xs px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none dark:text-slate-100 cursor-pointer"
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="cpp">C++</option>
              <option value="java">Java</option>
              <option value="typescript">TypeScript</option>
            </select>
            
            <textarea
              v-model="codeValue"
              rows="4"
              placeholder="// Write/paste code here"
              class="w-full px-4 py-3 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 text-emerald-400 focus:outline-none resize-none"
            ></textarea>
          </div>

        </div>

        <div class="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
          <button
            @click="showCreateModal = false"
            class="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            Cancel
          </button>
          <button
            @click="handlePublishPost"
            class="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-semibold text-xs rounded-xl cursor-pointer"
          >
            Publish Update
          </button>
        </div>

      </div>
    </div>

  </div>
</template>
