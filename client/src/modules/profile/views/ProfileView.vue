<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '../../../stores/auth';
import { useToastStore } from '../../../stores/toast';
import api from '../../../services/api';

const authStore = useAuthStore();
const toastStore = useToastStore();
const route = useRoute();

const profile = ref<any>(null);
const isLoading = ref(true);
const isEditing = ref(false);
const isFollowLoading = ref(false);

// Editable Fields Form State
const editForm = ref({
  fullName: '',
  bio: '',
  profilePicture: '',
  skills: '',
  programmingLanguages: '',
  techStack: '',
  leetcodeUrl: '',
  codeforcesUrl: '',
  githubUrl: '',
  linkedinUrl: '',
  resumeUrl: '',
  placementStatus: 'unplaced' as 'unplaced' | 'placed' | 'internship',
  currentCompany: '',
  year: 1,
  section: 'A'
});

const loadProfile = async (uid: string) => {
  isLoading.value = true;
  try {
    const res = await api.get(`/users/profile/${uid}`);
    if (res.data?.success) {
      profile.value = res.data.data;
      
      // Populate edit form
      editForm.value = {
        fullName: profile.value.fullName,
        bio: profile.value.bio || '',
        profilePicture: profile.value.profilePicture || '',
        skills: (profile.value.skills || []).join(', '),
        programmingLanguages: (profile.value.programmingLanguages || []).join(', '),
        techStack: (profile.value.techStack || []).join(', '),
        leetcodeUrl: profile.value.leetcodeUrl || '',
        codeforcesUrl: profile.value.codeforcesUrl || '',
        githubUrl: profile.value.githubUrl || '',
        linkedinUrl: profile.value.linkedinUrl || '',
        resumeUrl: profile.value.resumeUrl || '',
        placementStatus: profile.value.placementStatus || 'unplaced',
        currentCompany: profile.value.currentCompany || '',
        year: profile.value.year || 1,
        section: profile.value.section || 'A'
      };
    }
  } catch (err) {
    toastStore.show('Failed to fetch profile details.', 'error');
  } finally {
    isLoading.value = false;
  }
};

watch(() => route.params.id, (newId) => {
  if (newId) {
    loadProfile(newId as string);
  }
});

onMounted(() => {
  if (route.params.id) {
    loadProfile(route.params.id as string);
  }
});

const handleSaveProfile = async () => {
  try {
    const payload = {
      ...editForm.value,
      skills: editForm.value.skills ? editForm.value.skills.split(',').map((s) => s.trim()) : [],
      programmingLanguages: editForm.value.programmingLanguages ? editForm.value.programmingLanguages.split(',').map((s) => s.trim()) : [],
      techStack: editForm.value.techStack ? editForm.value.techStack.split(',').map((s) => s.trim()) : []
    };

    const res = await api.put('/users/profile', payload);
    if (res.data?.success) {
      profile.value = res.data.data;
      
      // Update local auth store so layout avatar/details align
      authStore.updateProfileState({
        fullName: profile.value.fullName,
        profilePicture: profile.value.profilePicture,
        isVerified: profile.value.isVerified
      });

      toastStore.show('Profile updated successfully.', 'success');
      isEditing.value = false;
    }
  } catch (err) {
    toastStore.show('Failed to save profile changes.', 'error');
  }
};

const handleFollow = async () => {
  if (isFollowLoading.value) return;
  isFollowLoading.value = true;
  try {
    const res = await api.post(`/users/${profile.value.uid}/follow`);
    if (res.data?.success) {
      const isFollowing = res.data.data.isFollowing;
      
      if (isFollowing) {
        profile.value.followers.push(authStore.user?.uid);
        profile.value.followersCount++;
      } else {
        profile.value.followers = profile.value.followers.filter((uid: string) => uid !== authStore.user?.uid);
        profile.value.followersCount--;
      }
      
      toastStore.show(res.data.message, 'success');
    }
  } catch (err) {
    toastStore.show('Follow operation failed.', 'error');
  } finally {
    isFollowLoading.value = false;
  }
};
</script>

<template>
  <div class="flex flex-col gap-6">
    
    <div v-if="isLoading" class="glass-card rounded-3xl p-8 animate-pulse flex flex-col gap-6">
      <div class="flex flex-col sm:flex-row items-center gap-6">
        <div class="w-24 h-24 rounded-full bg-slate-200 dark:bg-slate-800"></div>
        <div class="flex-1 flex flex-col gap-2">
          <div class="w-48 h-6 bg-slate-200 dark:bg-slate-800 rounded"></div>
          <div class="w-32 h-4 bg-slate-200 dark:bg-slate-800 rounded"></div>
        </div>
      </div>
      <div class="w-full h-24 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
    </div>

    <div v-else-if="!profile" class="glass-card rounded-3xl p-12 text-center text-slate-400">
      Requested user profile does not exist.
    </div>

    <!-- Active Profile view -->
    <div v-else class="flex flex-col gap-6">
      
      <!-- Profile Header block -->
      <div class="glass-card rounded-3xl p-6 md:p-8 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-6 shadow-sm border border-slate-200/50 dark:border-slate-800/50">
        <img
          :src="profile.profilePicture"
          alt="Avatar"
          class="w-24 h-24 rounded-full border-4 border-white dark:border-slate-900 object-cover shadow-md"
        />
        
        <div class="flex-1 flex flex-col gap-2">
          <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h2 class="text-2xl font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                {{ profile.fullName }}
                <span
                  v-if="profile.role === 'admin' || profile.role === 'moderator'"
                  class="text-[10px] px-2 py-0.5 bg-accent-500/10 text-accent-600 rounded-full font-bold border border-accent-500/20"
                >
                  MOD
                </span>
              </h2>
              <p class="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                Roll: {{ profile.rollNumber }} &bull; Branch: {{ profile.branch }} &bull; Year: {{ profile.year }} &bull; Sec: {{ profile.section }}
              </p>
            </div>
            
            <!-- Actions: Edit (if self) or Follow (if peer) -->
            <div class="flex gap-2">
              <button
                v-if="profile.uid === authStore.user?.uid"
                @click="isEditing = !isEditing"
                class="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl border border-slate-200/50 dark:border-slate-800/50 cursor-pointer select-none transition-colors"
              >
                {{ isEditing ? 'Cancel Edit' : 'Edit Profile' }}
              </button>

              <button
                v-else
                @click="handleFollow"
                :disabled="isFollowLoading"
                :class="[
                  'px-5 py-2 font-bold text-xs rounded-xl cursor-pointer select-none transition-colors border',
                  profile.followers.includes(authStore.user?.uid)
                    ? 'bg-slate-100 dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800'
                    : 'bg-primary-500 hover:bg-primary-600 text-white border-transparent shadow-md shadow-primary-500/15'
                ]"
              >
                {{ profile.followers.includes(authStore.user?.uid) ? 'Following' : 'Follow Student' }}
              </button>
            </div>
          </div>

          <p class="text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
            {{ profile.bio || "No professional bio written yet. Click 'Edit Profile' to add your summary!" }}
          </p>

          <div class="flex items-center gap-6 text-xs text-slate-400 font-semibold mt-2">
            <span>{{ profile.followersCount || 0 }} Followers</span>
            <span>{{ profile.followingCount || 0 }} Following</span>
            <span
              :class="[
                'px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase',
                profile.placementStatus === 'placed' ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/20' : '',
                profile.placementStatus === 'internship' ? 'bg-primary-500/15 text-primary-500 border-primary-500/20' : '',
                profile.placementStatus === 'unplaced' ? 'bg-amber-500/15 text-amber-500 border-amber-500/20' : ''
              ]"
            >
              {{ profile.placementStatus }} {{ profile.currentCompany ? `at ${profile.currentCompany}` : '' }}
            </span>
          </div>
        </div>

      </div>

      <!-- Editing Card -->
      <div v-if="isEditing" class="glass-card rounded-3xl p-6 md:p-8 flex flex-col gap-4 border border-primary-500/30">
        <h3 class="text-base font-bold text-slate-800 dark:text-slate-200">Update Profile Portfolio</h3>
        
        <form @submit.prevent="handleSaveProfile" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-[10px] font-bold uppercase text-slate-400 mb-1">Full Name</label>
            <input v-model="editForm.fullName" type="text" class="w-full px-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 focus:outline-none dark:text-slate-100" />
          </div>

          <div>
            <label class="block text-[10px] font-bold uppercase text-slate-400 mb-1">Placement Status</label>
            <select v-model="editForm.placementStatus" class="w-full px-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none dark:text-slate-100">
              <option value="unplaced">Unplaced</option>
              <option value="internship">Internship Offer</option>
              <option value="placed">Full-Time Placed</option>
            </select>
          </div>

          <div>
            <label class="block text-[10px] font-bold uppercase text-slate-400 mb-1">Current Company (if placed/intern)</label>
            <input v-model="editForm.currentCompany" type="text" class="w-full px-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 focus:outline-none dark:text-slate-100" />
          </div>

          <div>
            <label class="block text-[10px] font-bold uppercase text-slate-400 mb-1">Bio Summary</label>
            <input v-model="editForm.bio" type="text" class="w-full px-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 focus:outline-none dark:text-slate-100" />
          </div>

          <div>
            <label class="block text-[10px] font-bold uppercase text-slate-400 mb-1">Skills (comma separated)</label>
            <input v-model="editForm.skills" type="text" placeholder="e.g. React, Spring Boot, Data Structures" class="w-full px-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 focus:outline-none dark:text-slate-100" />
          </div>

          <div>
            <label class="block text-[10px] font-bold uppercase text-slate-400 mb-1">Programming Languages</label>
            <input v-model="editForm.programmingLanguages" type="text" placeholder="e.g. C++, Java, Python" class="w-full px-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 focus:outline-none dark:text-slate-100" />
          </div>

          <div>
            <label class="block text-[10px] font-bold uppercase text-slate-400 mb-1">Tech Stack</label>
            <input v-model="editForm.techStack" type="text" placeholder="e.g. MERN, LAMP" class="w-full px-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 focus:outline-none dark:text-slate-100" />
          </div>

          <div>
            <label class="block text-[10px] font-bold uppercase text-slate-400 mb-1">Github URL</label>
            <input v-model="editForm.githubUrl" type="url" class="w-full px-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 focus:outline-none dark:text-slate-100" />
          </div>

          <div>
            <label class="block text-[10px] font-bold uppercase text-slate-400 mb-1">LeetCode URL</label>
            <input v-model="editForm.leetcodeUrl" type="url" class="w-full px-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 focus:outline-none dark:text-slate-100" />
          </div>

          <div>
            <label class="block text-[10px] font-bold uppercase text-slate-400 mb-1">LinkedIn URL</label>
            <input v-model="editForm.linkedinUrl" type="url" class="w-full px-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 focus:outline-none dark:text-slate-100" />
          </div>

          <div class="sm:col-span-2 flex justify-end gap-2 mt-2">
            <button
              type="button"
              @click="isEditing = false"
              class="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="px-5 py-2.5 bg-primary-500 text-white font-semibold text-xs rounded-xl cursor-pointer"
            >
              Save Profile
            </button>
          </div>
        </form>
      </div>

      <!-- Core Portfolio Cards grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <!-- Left Pane: Technical Skills details -->
        <div class="flex flex-col gap-6 md:col-span-1">
          
          <div class="glass-card rounded-2xl p-5 shadow-sm">
            <h3 class="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 uppercase tracking-wider">
              Technical Stack
            </h3>
            
            <div class="flex flex-col gap-4">
              <div>
                <span class="text-[10px] font-bold text-slate-400 uppercase">Core Stack</span>
                <div class="flex flex-wrap gap-1.5 mt-1.5">
                  <span
                    v-for="st in profile.techStack"
                    :key="st"
                    class="text-xs px-2.5 py-1 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 rounded-lg border border-slate-200/40 dark:border-slate-800/40 font-medium"
                  >
                    {{ st }}
                  </span>
                  <span v-if="!profile.techStack || profile.techStack.length === 0" class="text-xs text-slate-400">Not specified</span>
                </div>
              </div>

              <div>
                <span class="text-[10px] font-bold text-slate-400 uppercase">Programming Languages</span>
                <div class="flex flex-wrap gap-1.5 mt-1.5">
                  <span
                    v-for="pl in profile.programmingLanguages"
                    :key="pl"
                    class="text-xs px-2.5 py-1 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 rounded-lg border border-slate-200/40 dark:border-slate-800/40 font-medium"
                  >
                    {{ pl }}
                  </span>
                  <span v-if="!profile.programmingLanguages || profile.programmingLanguages.length === 0" class="text-xs text-slate-400">Not specified</span>
                </div>
              </div>

              <div>
                <span class="text-[10px] font-bold text-slate-400 uppercase">Skill Badges</span>
                <div class="flex flex-wrap gap-1.5 mt-1.5">
                  <span
                    v-for="sk in profile.skills"
                    :key="sk"
                    class="text-xs px-2.5 py-1 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 rounded-lg border border-slate-200/40 dark:border-slate-800/40 font-medium"
                  >
                    {{ sk }}
                  </span>
                  <span v-if="!profile.skills || profile.skills.length === 0" class="text-xs text-slate-400">Not specified</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Portals Links -->
          <div class="glass-card rounded-2xl p-5 shadow-sm flex flex-col gap-3">
            <h3 class="text-sm font-bold text-slate-800 dark:text-slate-200 mb-2 uppercase tracking-wider">
              Profile Badges
            </h3>
            
            <a
              v-if="profile.githubUrl"
              :href="profile.githubUrl"
              target="_blank"
              class="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300 hover:text-primary-500 font-semibold transition-colors"
            >
              <span>GitHub Profile</span>
            </a>
            
            <a
              v-if="profile.linkedinUrl"
              :href="profile.linkedinUrl"
              target="_blank"
              class="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300 hover:text-primary-500 font-semibold transition-colors"
            >
              <span>LinkedIn Network</span>
            </a>
            
            <a
              v-if="profile.leetcodeUrl"
              :href="profile.leetcodeUrl"
              target="_blank"
              class="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300 hover:text-primary-500 font-semibold transition-colors"
            >
              <span>LeetCode Practice</span>
            </a>

            <div v-if="!profile.githubUrl && !profile.linkedinUrl && !profile.leetcodeUrl" class="text-xs text-slate-400">
              No portfolio badges linked.
            </div>
          </div>

        </div>

        <!-- Right Pane: Projects list & achievements -->
        <div class="flex flex-col gap-6 md:col-span-2">
          
          <div class="glass-card rounded-2xl p-6 shadow-sm">
            <h3 class="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4">
              Projects & Portfolios
            </h3>

            <!-- Projects Empty State -->
            <div v-if="!profile.projects || profile.projects.length === 0" class="text-center py-6 text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              No technical projects added to portfolio directory.
            </div>

            <div v-else class="flex flex-col gap-4">
              <div
                v-for="proj in profile.projects"
                :key="proj.title"
                class="p-4 rounded-xl border border-slate-200/50 dark:border-slate-800/50 flex flex-col gap-2 bg-slate-50/30 dark:bg-slate-900/10"
              >
                <div class="flex justify-between items-center">
                  <h4 class="text-sm font-bold text-slate-800 dark:text-slate-100">{{ proj.title }}</h4>
                  <div class="flex gap-2">
                    <a v-if="proj.githubUrl" :href="proj.githubUrl" target="_blank" class="text-xs text-primary-500 hover:underline">Code</a>
                    <a v-if="proj.liveUrl" :href="proj.liveUrl" target="_blank" class="text-xs text-primary-500 hover:underline">Live Demo</a>
                  </div>
                </div>
                <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{{ proj.description }}</p>
              </div>
            </div>
          </div>

          <!-- Internships & Work Experience -->
          <div class="glass-card rounded-2xl p-6 shadow-sm">
            <h3 class="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4">
              Work Experience & Internships
            </h3>

            <div v-if="!profile.internships || profile.internships.length === 0" class="text-center py-6 text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              No prior internship records uploaded.
            </div>

            <div v-else class="flex flex-col gap-4">
              <div
                v-for="intern in profile.internships"
                :key="intern.company"
                class="flex gap-4 items-start"
              >
                <div class="w-2.5 h-2.5 rounded-full bg-primary-500 mt-1.5 shrink-0"></div>
                <div>
                  <h4 class="text-xs font-bold text-slate-800 dark:text-slate-100">{{ intern.role }} &bull; {{ intern.company }}</h4>
                  <p class="text-[10px] text-slate-400 font-semibold">{{ intern.duration }}</p>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>

  </div>
</template>
