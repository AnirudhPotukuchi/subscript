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
  <div class="flex flex-col gap-3">
    
    <!-- Top Action Card: Trigger Create Modal -->
    <div class="github-card p-3 flex items-center justify-between gap-3">
      <img
        :src="authStore.user?.profilePicture"
        alt="Profile"
        class="w-8 h-8 rounded-full object-cover border border-github-border"
      />
      <button
        @click="showCreateModal = true"
        class="flex-1 text-left px-3 py-1.5 rounded-[6px] border border-github-border bg-github-bg hover:bg-[#2d333b] transition-colors text-github-secondary font-semibold text-xs cursor-pointer select-none"
      >
        Share an update, technical resource, or ask seniors a question...
      </button>
      <button
        @click="showCreateModal = true"
        class="github-button-primary shrink-0"
      >
        Write Post
      </button>
    </div>

    <!-- Active Tag Header Indicator -->
    <div v-if="route.query.tag" class="flex justify-between items-center bg-github-accent/10 border border-github-accent/25 text-github-accent px-3 py-2 rounded-[6px]">
      <span class="text-xs font-semibold">Showing topic tag: #{{ route.query.tag }}</span>
      <button @click="loadFeed()" class="text-[11px] font-bold hover:underline cursor-pointer">Clear Filter</button>
    </div>

    <!-- Loading Skeleton list -->
    <div v-if="isLoading" class="flex flex-col gap-3">
      <div v-for="i in 3" :key="i" class="github-card p-4 flex flex-col gap-3 animate-pulse">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-[#2d333b]"></div>
          <div class="flex-1 flex flex-col gap-1">
            <div class="w-24 h-3 bg-[#2d333b] rounded"></div>
            <div class="w-16 h-2 bg-[#2d333b] rounded"></div>
          </div>
        </div>
        <div class="w-full h-12 bg-[#2d333b] rounded-[6px]"></div>
        <div class="flex gap-4">
          <div class="w-12 h-4 bg-[#2d333b] rounded"></div>
          <div class="w-12 h-4 bg-[#2d333b] rounded"></div>
        </div>
      </div>
    </div>

    <!-- Feed List -->
    <div v-else class="flex flex-col gap-3">
      
      <div v-if="posts.length === 0" class="github-card p-8 text-center text-github-secondary">
        No updates found under this feed. Be the first to share an academic or technical tip!
      </div>

      <div
        v-for="post in posts"
        :key="post.id"
        class="github-card p-4 flex flex-col gap-3"
      >
        
        <!-- Post Header -->
        <div class="flex items-center gap-3">
          <img :src="post.authorPicture" alt="Author" class="w-8 h-8 rounded-full object-cover border border-github-border" />
          <div class="flex flex-col">
            <span class="text-xs font-bold text-github-text hover:text-github-accent cursor-pointer">{{ post.authorName }}</span>
            <span class="text-[10px] text-github-secondary font-medium">
              {{ new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }}
            </span>
          </div>
        </div>

        <!-- Post Body -->
        <p class="text-xs text-github-text whitespace-pre-line leading-relaxed">
          {{ post.content }}
        </p>

        <!-- Embedded Code snippets if any -->
        <div v-if="post.codeSnippets && post.codeSnippets.length > 0" class="rounded-[6px] overflow-hidden border border-github-border">
          <div class="bg-github-surface px-3 py-1 text-[11px] text-github-secondary font-mono border-b border-github-border">
            {{ post.codeSnippets[0].language }}
          </div>
          <pre class="bg-github-bg text-github-success p-3 overflow-x-auto text-[11px] font-mono"><code>{{ post.codeSnippets[0].code }}</code></pre>
        </div>

        <!-- Tags Row -->
        <div v-if="post.tags && post.tags.length > 0" class="flex flex-wrap gap-1.5">
          <span
            v-for="tag in post.tags"
            :key="tag"
            @click="loadFeed(tag)"
            class="text-[11px] px-2 py-0.5 bg-github-bg hover:bg-github-accent/10 hover:text-github-accent text-github-secondary rounded-[4px] cursor-pointer border border-github-border transition-colors font-semibold"
          >
            #{{ tag }}
          </span>
        </div>

        <!-- Action Row -->
        <div class="flex items-center gap-4 border-t border-github-border pt-3 mt-1">
          
          <!-- Like Button -->
          <button
            @click="handleLike(post)"
            :class="[
              'flex items-center gap-1 text-xs font-semibold cursor-pointer transition-colors select-none',
              post.likes.includes(authStore.user?.uid) ? 'text-github-accent' : 'text-github-secondary hover:text-github-text'
            ]"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span>Like ({{ post.likesCount || 0 }})</span>
          </button>

          <!-- Comment Toggle Button -->
          <button
            @click="expandComments(post.id)"
            class="flex items-center gap-1 text-xs font-semibold text-github-secondary hover:text-github-text cursor-pointer transition-colors select-none"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>Comment ({{ post.commentsCount || 0 }})</span>
          </button>

          <!-- Bookmark Button -->
          <button
            @click="handleBookmark(post)"
            :class="[
              'flex items-center gap-1 text-xs font-semibold cursor-pointer ml-auto transition-colors select-none',
              post.isBookmarked ? 'text-github-accent' : 'text-github-secondary hover:text-github-text'
            ]"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            <span>Save</span>
          </button>

        </div>

        <!-- Expanded Comments Section -->
        <div v-if="activeCommentPostId === post.id" class="border-t border-github-border pt-3 flex flex-col gap-3">
          
          <!-- Comments Write Card -->
          <div class="flex items-center gap-2">
            <img :src="authStore.user?.profilePicture" alt="Profile" class="w-6 h-6 rounded-full object-cover border border-github-border" />
            <div class="flex-1 flex gap-2">
              <input
                v-model="commentText"
                @keyup.enter="handlePostComment(post)"
                type="text"
                placeholder="Write an educational reply..."
                class="github-input flex-1 h-8 py-1 text-xs"
              />
              <button
                @click="handlePostComment(post)"
                class="github-button h-8 px-3 py-1 flex items-center justify-center shrink-0"
              >
                Send
              </button>
            </div>
          </div>

          <!-- Loading comments -->
          <div v-if="isCommentsLoading" class="text-center py-1 text-[11px] text-github-secondary">Loading replies...</div>

          <!-- Comments List -->
          <div v-else class="flex flex-col gap-2.5 pl-8">
            <div v-if="commentsList.length === 0" class="text-[10px] text-github-secondary">No replies yet. Start the discussion!</div>
            
            <div
              v-for="comm in commentsList"
              :key="comm.id"
              class="bg-github-bg p-2.5 rounded-[6px] border border-github-border flex flex-col gap-1"
            >
              <div class="flex items-center gap-2">
                <img :src="comm.authorPicture" alt="Author" class="w-5 h-5 rounded-full object-cover border border-github-border" />
                <span class="text-xs font-bold text-github-text">{{ comm.authorName }}</span>
                <span class="text-[9px] text-github-secondary font-medium">
                  {{ new Date(comm.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }}
                </span>
              </div>
              <p class="text-xs text-github-text leading-relaxed">{{ comm.content }}</p>
            </div>

          </div>

        </div>

      </div>

    </div>

    <!-- Create Post Dialog Modal -->
    <div v-if="showCreateModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div @click="showCreateModal = false" class="absolute inset-0 bg-[#000000]/50"></div>
      
      <div class="w-full max-w-lg bg-github-surface border border-github-border p-4 rounded-[6px] relative z-10 flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-150">
        
        <div class="flex justify-between items-center border-b border-github-border pb-2">
          <h2 class="text-xs font-bold text-github-text uppercase tracking-wide">Create Technical Update</h2>
          <button @click="showCreateModal = false" class="text-github-secondary hover:text-github-text text-base cursor-pointer">&times;</button>
        </div>

        <div class="flex flex-col gap-3">
          <textarea
            v-model="postContent"
            rows="4"
            placeholder="What technical project or career updates do you want to share?"
            class="github-input w-full resize-none text-xs h-24"
          ></textarea>

          <input
            v-model="postTags"
            type="text"
            placeholder="Tags (comma separated e.g. placement, webdev, dsa)"
            class="github-input w-full text-xs h-8 py-1"
          />

          <!-- Toggle code inclusion -->
          <div class="flex items-center gap-2 mt-1">
            <input v-model="includeCode" type="checkbox" id="include-code" class="cursor-pointer" />
            <label for="include-code" class="text-[11px] font-semibold text-github-secondary cursor-pointer select-none">Include Code Snippet</label>
          </div>

          <div v-if="includeCode" class="flex flex-col gap-2">
            <select
              v-model="codeLanguage"
              class="github-input w-full max-w-xs text-xs h-8 py-1 cursor-pointer"
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
              class="w-full p-2.5 font-mono rounded-[6px] border border-github-border bg-github-bg text-github-success focus:outline-none resize-none text-xs"
            ></textarea>
          </div>

        </div>

        <div class="flex justify-end gap-2 border-t border-github-border pt-2">
          <button
            @click="showCreateModal = false"
            class="github-button h-8 flex items-center justify-center"
          >
            Cancel
          </button>
          <button
            @click="handlePublishPost"
            class="github-button-primary h-8 flex items-center justify-center"
          >
            Publish Update
          </button>
        </div>

      </div>
    </div>

  </div>
</template>
