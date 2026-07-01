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
  <div class="flex flex-col gap-3">
    
    <div v-if="isLoading" class="github-card p-4 animate-pulse flex flex-col gap-3">
      <div class="flex flex-col sm:flex-row items-center gap-4">
        <div class="w-16 h-16 rounded-full bg-[#2d333b]"></div>
        <div class="flex-1 flex flex-col gap-1.5">
          <div class="w-48 h-4 bg-[#2d333b] rounded"></div>
          <div class="w-32 h-3 bg-[#2d333b] rounded"></div>
        </div>
      </div>
      <div class="w-full h-12 bg-[#2d333b] rounded-[6px]"></div>
    </div>

    <div v-else-if="!profile" class="github-card p-8 text-center text-github-secondary">
      Requested user profile does not exist.
    </div>

    <!-- Active Profile view -->
    <div v-else class="flex flex-col gap-3">
      
      <!-- Profile Header block -->
      <div class="github-card p-4 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4">
        <img
          :src="profile.profilePicture"
          alt="Avatar"
          class="w-20 h-20 rounded-full border border-github-border object-cover"
        />
        
        <div class="flex-1 flex flex-col gap-1.5 w-full">
          <div class="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h2 class="text-base font-bold text-github-text flex items-center gap-2 justify-center sm:justify-start">
                {{ profile.fullName }}
                <span
                  v-if="profile.role === 'admin' || profile.role === 'moderator'"
                  class="text-[10px] px-1.5 py-0.2 bg-github-accent/10 text-github-accent rounded-[4px] font-bold border border-github-accent/25"
                >
                  MOD
                </span>
              </h2>
              <p class="text-[11px] text-github-secondary font-semibold mt-0.5">
                Roll: {{ profile.rollNumber }} &bull; Branch: {{ profile.branch }} &bull; Year: {{ profile.year }} &bull; Sec: {{ profile.section }}
              </p>
            </div>
            
            <!-- Actions: Edit (if self) or Follow (if peer) -->
            <div class="flex gap-1.5 shrink-0">
              <button
                v-if="profile.uid === authStore.user?.uid"
                @click="isEditing = !isEditing"
                class="github-button h-8 flex items-center justify-center font-bold text-xs"
              >
                {{ isEditing ? 'Cancel Edit' : 'Edit Profile' }}
              </button>

              <button
                v-else
                @click="handleFollow"
                :disabled="isFollowLoading"
                :class="[
                  'h-8 flex items-center justify-center font-bold text-xs px-4 rounded-[4px] cursor-pointer select-none transition-colors border',
                  profile.followers.includes(authStore.user?.uid)
                    ? 'bg-[#2d333b] text-github-secondary border-github-border hover:bg-github-surface'
                    : 'github-button-primary'
                ]"
              >
                {{ profile.followers.includes(authStore.user?.uid) ? 'Following' : 'Follow Student' }}
              </button>
            </div>
          </div>

          <p class="text-xs text-github-text max-w-2xl leading-relaxed mt-1">
            {{ profile.bio || "No professional bio written yet. Click 'Edit Profile' to add your summary!" }}
          </p>

          <div class="flex items-center gap-4 text-xs text-github-secondary font-semibold mt-2 justify-center sm:justify-start">
            <span>{{ profile.followersCount || 0 }} Followers</span>
            <span>{{ profile.followingCount || 0 }} Following</span>
            <span
              :class="[
                'px-1.5 py-0.2 rounded-[4px] border text-[10px] font-bold uppercase',
                profile.placementStatus === 'placed' ? 'bg-github-success/10 text-github-success border-github-success/25' : '',
                profile.placementStatus === 'internship' ? 'bg-github-accent/10 text-github-accent border-github-accent/25' : '',
                profile.placementStatus === 'unplaced' ? 'bg-amber-500/10 text-amber-500 border-amber-500/25' : ''
              ]"
            >
              {{ profile.placementStatus }} {{ profile.currentCompany ? `at ${profile.currentCompany}` : '' }}
            </span>
          </div>
        </div>

      </div>

      <!-- Editing Card -->
      <div v-if="isEditing" class="github-card p-4 flex flex-col gap-3 border-github-accent/30">
        <h3 class="text-xs font-bold text-github-text uppercase tracking-wide border-b border-github-border pb-1">Update Profile Portfolio</h3>
        
        <form @submit.prevent="handleSaveProfile" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold text-github-text mb-1">Full Name</label>
            <input v-model="editForm.fullName" type="text" class="github-input w-full text-xs h-8 py-1" />
          </div>

          <div>
            <label class="block text-xs font-semibold text-github-text mb-1">Placement Status</label>
            <select v-model="editForm.placementStatus" class="github-input w-full text-xs h-8 py-1 cursor-pointer">
              <option value="unplaced">Unplaced</option>
              <option value="internship">Internship Offer</option>
              <option value="placed">Full-Time Placed</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-github-text mb-1">Current Company (if placed/intern)</label>
            <input v-model="editForm.currentCompany" type="text" class="github-input w-full text-xs h-8 py-1" />
          </div>

          <div>
            <label class="block text-xs font-semibold text-github-text mb-1">Bio Summary</label>
            <input v-model="editForm.bio" type="text" class="github-input w-full text-xs h-8 py-1" />
          </div>

          <div>
            <label class="block text-xs font-semibold text-github-text mb-1">Skills (comma separated)</label>
            <input v-model="editForm.skills" type="text" placeholder="e.g. React, Spring Boot, Data Structures" class="github-input w-full text-xs h-8 py-1" />
          </div>

          <div>
            <label class="block text-xs font-semibold text-github-text mb-1">Programming Languages</label>
            <input v-model="editForm.programmingLanguages" type="text" placeholder="e.g. C++, Java, Python" class="github-input w-full text-xs h-8 py-1" />
          </div>

          <div>
            <label class="block text-xs font-semibold text-github-text mb-1">Tech Stack</label>
            <input v-model="editForm.techStack" type="text" placeholder="e.g. MERN, LAMP" class="github-input w-full text-xs h-8 py-1" />
          </div>

          <div>
            <label class="block text-xs font-semibold text-github-text mb-1">Github URL</label>
            <input v-model="editForm.githubUrl" type="url" class="github-input w-full text-xs h-8 py-1" />
          </div>

          <div>
            <label class="block text-xs font-semibold text-github-text mb-1">LeetCode URL</label>
            <input v-model="editForm.leetcodeUrl" type="url" class="github-input w-full text-xs h-8 py-1" />
          </div>

          <div>
            <label class="block text-xs font-semibold text-github-text mb-1">LinkedIn URL</label>
            <input v-model="editForm.linkedinUrl" type="url" class="github-input w-full text-xs h-8 py-1" />
          </div>

          <div class="sm:col-span-2 flex justify-end gap-2 border-t border-github-border pt-2 mt-1">
            <button
              type="button"
              @click="isEditing = false"
              class="github-button h-8 flex items-center justify-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="github-button-primary h-8 flex items-center justify-center"
            >
              Save Profile
            </button>
          </div>
        </form>
      </div>

      <!-- Core Portfolio Cards grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        
        <!-- Left Pane: Technical Skills details -->
        <div class="flex flex-col gap-3 md:col-span-1">
          
          <div class="github-card p-4">
            <h3 class="text-xs font-bold text-github-text mb-3 uppercase tracking-wider border-b border-github-border pb-1">
              Technical Stack
            </h3>
            
            <div class="flex flex-col gap-3">
              <div>
                <span class="text-[9px] font-bold text-github-secondary uppercase">Core Stack</span>
                <div class="flex flex-wrap gap-1 mt-1">
                  <span
                    v-for="st in profile.techStack"
                    :key="st"
                    class="text-xs px-2 py-0.5 bg-github-bg text-github-text rounded-[4px] border border-github-border font-semibold"
                  >
                    {{ st }}
                  </span>
                  <span v-if="!profile.techStack || profile.techStack.length === 0" class="text-xs text-github-secondary">Not specified</span>
                </div>
              </div>

              <div>
                <span class="text-[9px] font-bold text-github-secondary uppercase">Programming Languages</span>
                <div class="flex flex-wrap gap-1 mt-1">
                  <span
                    v-for="pl in profile.programmingLanguages"
                    :key="pl"
                    class="text-xs px-2 py-0.5 bg-github-bg text-github-text rounded-[4px] border border-github-border font-semibold"
                  >
                    {{ pl }}
                  </span>
                  <span v-if="!profile.programmingLanguages || profile.programmingLanguages.length === 0" class="text-xs text-github-secondary">Not specified</span>
                </div>
              </div>

              <div>
                <span class="text-[9px] font-bold text-github-secondary uppercase">Skill Badges</span>
                <div class="flex flex-wrap gap-1 mt-1">
                  <span
                    v-for="sk in profile.skills"
                    :key="sk"
                    class="text-xs px-2 py-0.5 bg-github-bg text-github-text rounded-[4px] border border-github-border font-semibold"
                  >
                    {{ sk }}
                  </span>
                  <span v-if="!profile.skills || profile.skills.length === 0" class="text-xs text-github-secondary">Not specified</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Portals Links -->
          <div class="github-card p-4 flex flex-col gap-2">
            <h3 class="text-xs font-bold text-github-text mb-2 uppercase tracking-wider border-b border-github-border pb-1">
              Profile Badges
            </h3>
            
            <a
              v-if="profile.githubUrl"
              :href="profile.githubUrl"
              target="_blank"
              class="flex items-center gap-2 text-xs text-github-text hover:text-github-accent font-semibold hover:underline transition-colors"
            >
              <span>GitHub Profile</span>
            </a>
            
            <a
              v-if="profile.linkedinUrl"
              :href="profile.linkedinUrl"
              target="_blank"
              class="flex items-center gap-2 text-xs text-github-text hover:text-github-accent font-semibold hover:underline transition-colors"
            >
              <span>LinkedIn Network</span>
            </a>
            
            <a
              v-if="profile.leetcodeUrl"
              :href="profile.leetcodeUrl"
              target="_blank"
              class="flex items-center gap-2 text-xs text-github-text hover:text-github-accent font-semibold hover:underline transition-colors"
            >
              <span>LeetCode Practice</span>
            </a>

            <div v-if="!profile.githubUrl && !profile.linkedinUrl && !profile.leetcodeUrl" class="text-xs text-github-secondary">
              No portfolio badges linked.
            </div>
          </div>

        </div>

        <!-- Right Pane: Projects list & achievements -->
        <div class="flex flex-col gap-3 md:col-span-2">
          
          <div class="github-card p-4">
            <h3 class="text-xs font-bold text-github-text mb-3 uppercase tracking-wider border-b border-github-border pb-1">
              Projects & Portfolios
            </h3>

            <!-- Projects Empty State -->
            <div v-if="!profile.projects || profile.projects.length === 0" class="text-center py-6 text-xs text-github-secondary border border-dashed border-github-border rounded-[6px]">
              No technical projects added to portfolio directory.
            </div>

            <div v-else class="flex flex-col gap-3">
              <div
                v-for="proj in profile.projects"
                :key="proj.title"
                class="p-3 rounded-[6px] border border-github-border flex flex-col gap-1.5 bg-github-bg"
              >
                <div class="flex justify-between items-center">
                  <h4 class="text-xs font-bold text-github-text">{{ proj.title }}</h4>
                  <div class="flex gap-2">
                    <a v-if="proj.githubUrl" :href="proj.githubUrl" target="_blank" class="text-xs text-github-accent hover:underline font-semibold">Code</a>
                    <a v-if="proj.liveUrl" :href="proj.liveUrl" target="_blank" class="text-xs text-github-accent hover:underline font-semibold">Live Demo</a>
                  </div>
                </div>
                <p class="text-xs text-github-secondary leading-relaxed">{{ proj.description }}</p>
              </div>
            </div>
          </div>

          <!-- Internships & Work Experience -->
          <div class="github-card p-4">
            <h3 class="text-xs font-bold text-github-text mb-3 uppercase tracking-wider border-b border-github-border pb-1">
              Work Experience & Internships
            </h3>

            <div v-if="!profile.internships || profile.internships.length === 0" class="text-center py-6 text-xs text-github-secondary border border-dashed border-github-border rounded-[6px]">
              No prior internship records uploaded.
            </div>

            <div v-else class="flex flex-col gap-3">
              <div
                v-for="intern in profile.internships"
                :key="intern.company"
                class="flex gap-2 items-start"
              >
                <div class="w-2 h-2 rounded-full bg-github-accent mt-1.5 shrink-0"></div>
                <div>
                  <h4 class="text-xs font-bold text-github-text">{{ intern.role }} &bull; {{ intern.company }}</h4>
                  <p class="text-[10px] text-github-secondary font-semibold">{{ intern.duration }}</p>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>

  </div>
</template>
