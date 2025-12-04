<script setup lang="ts">
import { Code2, Plus, Pencil, Trash2, Play, Check, X, Wifi } from 'lucide-vue-next'

definePageMeta({
  title: 'Device Profiles',
})

const config = useRuntimeConfig()

// State
const profiles = ref<any[]>([])
const isLoading = ref(true)
const showModal = ref(false)
const editingProfile = ref<any>(null)

// Form state
const form = reactive({
  name: '',
  manufacturer: '',
  protocol: 'SIGFOX' as 'SIGFOX' | 'LORAWAN' | 'NBIOT' | 'CUSTOM',
  decoderScript: '',
  description: '',
  samplePayload: '',
})

// Test state
const testPayload = ref('')
const testResult = ref<{ success: boolean; result?: any; error?: string } | null>(null)
const isTesting = ref(false)

// Fetch profiles
async function fetchProfiles() {
  isLoading.value = true
  try {
    const response = await fetch(`${config.public.apiBaseUrl}/api/device-profiles`)
    const data = await response.json()
    profiles.value = data.data || []
  } catch (error) {
    console.error('Failed to fetch profiles:', error)
  } finally {
    isLoading.value = false
  }
}

// Open create modal
function openCreateModal() {
  editingProfile.value = null
  form.name = ''
  form.manufacturer = ''
  form.protocol = 'SIGFOX'
  form.decoderScript = getDefaultDecoder('SIGFOX')
  form.description = ''
  form.samplePayload = ''
  testResult.value = null
  showModal.value = true
}

// Open edit modal
function openEditModal(profile: any) {
  editingProfile.value = profile
  form.name = profile.name
  form.manufacturer = profile.manufacturer
  form.protocol = profile.protocol
  form.decoderScript = profile.decoderScript
  form.description = profile.description || ''
  form.samplePayload = profile.samplePayload || ''
  testPayload.value = profile.samplePayload || ''
  testResult.value = null
  showModal.value = true
}

// Save profile
async function saveProfile() {
  try {
    const url = editingProfile.value
      ? `${config.public.apiBaseUrl}/api/device-profiles/${editingProfile.value.id}`
      : `${config.public.apiBaseUrl}/api/device-profiles`
    
    const response = await fetch(url, {
      method: editingProfile.value ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        manufacturer: form.manufacturer,
        protocol: form.protocol,
        decoderScript: form.decoderScript,
        description: form.description,
        samplePayload: form.samplePayload,
      }),
    })

    if (response.ok) {
      showModal.value = false
      await fetchProfiles()
    } else {
      const error = await response.json()
      alert(`Error: ${error.message}`)
    }
  } catch (error) {
    console.error('Failed to save profile:', error)
    alert('Failed to save profile')
  }
}

// Delete profile
async function deleteProfile(profile: any) {
  if (!confirm(`Delete profile "${profile.name}"?`)) return

  try {
    const response = await fetch(
      `${config.public.apiBaseUrl}/api/device-profiles/${profile.id}`,
      { method: 'DELETE' },
    )

    if (response.ok) {
      await fetchProfiles()
    } else {
      const error = await response.json()
      alert(`Error: ${error.message}`)
    }
  } catch (error) {
    console.error('Failed to delete profile:', error)
  }
}

// Test decoder
async function testDecoder() {
  if (!testPayload.value) {
    alert('Please enter a test payload')
    return
  }

  isTesting.value = true
  testResult.value = null

  try {
    const response = await fetch(
      `${config.public.apiBaseUrl}/api/device-profiles/test-decoder`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decoderScript: form.decoderScript,
          payload: testPayload.value,
        }),
      },
    )

    testResult.value = await response.json()
  } catch (error) {
    testResult.value = {
      success: false,
      error: error instanceof Error ? error.message : 'Test failed',
    }
  } finally {
    isTesting.value = false
  }
}

// Get default decoder template
function getDefaultDecoder(protocol: string): string {
  if (protocol === 'SIGFOX') {
    return `// Sigfox Decoder
// Input: payload (hex string)
// Output: { value: number, battery?: number, signal?: number }

const bytes = [];
for (let i = 0; i < payload.length; i += 2) {
  bytes.push(parseInt(payload.substr(i, 2), 16));
}

// Read 32-bit unsigned integer (little-endian)
const value = (bytes[0] | (bytes[1] << 8) | (bytes[2] << 16) | (bytes[3] << 24)) / 1000;

// Battery in byte 4
const battery = bytes.length > 4 ? Math.min(100, bytes[4]) : null;

return { value, battery };`
  }

  return `// LoRaWAN Decoder
// Input: payload (base64 string)
// Output: { value: number, battery?: number, signal?: number }

const binary = Buffer.from(payload, "base64");
const bytes = Array.from(binary);

// Read 32-bit unsigned integer (big-endian)
const value = ((bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]) / 1000;

// Battery in byte 4
const battery = bytes.length > 4 ? Math.min(100, bytes[4]) : null;

return { value, battery };`
}

// Update decoder template when protocol changes
watch(() => form.protocol, (newProtocol) => {
  if (!editingProfile.value) {
    form.decoderScript = getDefaultDecoder(newProtocol)
  }
})

// Protocol badge color
function getProtocolColor(protocol: string): string {
  const colors: Record<string, string> = {
    SIGFOX: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    LORAWAN: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    NBIOT: 'bg-green-500/10 text-green-400 border-green-500/20',
    CUSTOM: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  }
  return colors[protocol] || colors.CUSTOM
}

onMounted(fetchProfiles)
</script>

<template>
  <div class="space-y-8">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <div class="p-3 rounded-xl bg-primary/10">
          <Code2 class="w-8 h-8 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-gradient">Device Profiles</h1>
          <p class="text-muted-foreground mt-1">
            Manage decoder scripts for different device types
          </p>
        </div>
      </div>

      <button
        class="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        @click="openCreateModal"
      >
        <Plus class="w-5 h-5" />
        Create Profile
      </button>
    </div>

    <!-- Profiles Grid -->
    <div v-if="isLoading" class="flex justify-center py-12">
      <div class="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>

    <div v-else-if="profiles.length === 0" class="glass-card p-12 text-center">
      <Code2 class="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
      <h2 class="text-xl font-semibold mb-2">No Device Profiles</h2>
      <p class="text-muted-foreground mb-6">
        Create your first device profile to start decoding IoT payloads.
      </p>
      <button
        class="px-6 py-2 rounded-xl bg-primary text-primary-foreground"
        @click="openCreateModal"
      >
        Create Profile
      </button>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      <div
        v-for="profile in profiles"
        :key="profile.id"
        class="glass-card p-6 hover:border-primary/30 transition-colors"
      >
        <div class="flex items-start justify-between mb-4">
          <div>
            <h3 class="text-lg font-semibold">{{ profile.name }}</h3>
            <p class="text-sm text-muted-foreground">{{ profile.manufacturer }}</p>
          </div>
          <span
            class="px-2 py-1 text-xs font-medium rounded-full border"
            :class="getProtocolColor(profile.protocol)"
          >
            {{ profile.protocol }}
          </span>
        </div>

        <p v-if="profile.description" class="text-sm text-muted-foreground mb-4 line-clamp-2">
          {{ profile.description }}
        </p>

        <div class="flex items-center justify-between text-sm">
          <span class="text-muted-foreground">
            {{ profile._count?.devices || 0 }} devices
          </span>

          <div class="flex items-center gap-2">
            <button
              class="p-2 rounded-lg hover:bg-muted transition-colors"
              @click="openEditModal(profile)"
            >
              <Pencil class="w-4 h-4" />
            </button>
            <button
              class="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
              @click="deleteProfile(profile)"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div
      v-if="showModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      @click.self="showModal = false"
    >
      <div class="glass-card w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
        <div class="p-6 border-b border-border">
          <h2 class="text-xl font-semibold">
            {{ editingProfile ? 'Edit Profile' : 'Create Profile' }}
          </h2>
        </div>

        <div class="p-6 space-y-6">
          <!-- Basic Info -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium mb-2">Name</label>
              <input
                v-model="form.name"
                type="text"
                class="w-full px-4 py-2 rounded-xl bg-muted border border-border focus:border-primary outline-none"
                placeholder="Meter Model X"
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">Manufacturer</label>
              <input
                v-model="form.manufacturer"
                type="text"
                class="w-full px-4 py-2 rounded-xl bg-muted border border-border focus:border-primary outline-none"
                placeholder="Acme Corp"
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">Protocol</label>
              <select
                v-model="form.protocol"
                class="w-full px-4 py-2 rounded-xl bg-muted border border-border focus:border-primary outline-none"
              >
                <option value="SIGFOX">Sigfox</option>
                <option value="LORAWAN">LoRaWAN</option>
                <option value="NBIOT">NB-IoT</option>
                <option value="CUSTOM">Custom</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">Description</label>
            <input
              v-model="form.description"
              type="text"
              class="w-full px-4 py-2 rounded-xl bg-muted border border-border focus:border-primary outline-none"
              placeholder="Brief description of this profile"
            />
          </div>

          <!-- Decoder Script -->
          <div>
            <label class="block text-sm font-medium mb-2">
              Decoder Script (JavaScript)
            </label>
            <textarea
              v-model="form.decoderScript"
              class="w-full h-64 px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary outline-none font-mono text-sm resize-none"
              placeholder="// Write your decoder script here..."
            />
          </div>

          <!-- Test Section -->
          <div class="p-4 rounded-xl bg-muted/50 border border-border">
            <h3 class="text-sm font-semibold mb-3">Test Decoder</h3>
            <div class="flex gap-4">
              <input
                v-model="testPayload"
                type="text"
                class="flex-1 px-4 py-2 rounded-xl bg-background border border-border focus:border-primary outline-none font-mono text-sm"
                placeholder="Enter hex/base64 payload to test..."
              />
              <button
                class="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 transition-colors"
                :disabled="isTesting"
                @click="testDecoder"
              >
                <Play v-if="!isTesting" class="w-4 h-4" />
                <div v-else class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Test
              </button>
            </div>

            <div v-if="testResult" class="mt-4">
              <div
                v-if="testResult.success"
                class="p-3 rounded-lg bg-signal-excellent/10 border border-signal-excellent/20"
              >
                <div class="flex items-center gap-2 text-signal-excellent mb-2">
                  <Check class="w-4 h-4" />
                  <span class="font-medium">Success</span>
                </div>
                <pre class="text-sm font-mono">{{ JSON.stringify(testResult.result, null, 2) }}</pre>
              </div>
              <div
                v-else
                class="p-3 rounded-lg bg-destructive/10 border border-destructive/20"
              >
                <div class="flex items-center gap-2 text-destructive mb-2">
                  <X class="w-4 h-4" />
                  <span class="font-medium">Error</span>
                </div>
                <pre class="text-sm font-mono text-destructive">{{ testResult.error }}</pre>
              </div>
            </div>
          </div>

          <!-- Sample Payload -->
          <div>
            <label class="block text-sm font-medium mb-2">Sample Payload (for documentation)</label>
            <input
              v-model="form.samplePayload"
              type="text"
              class="w-full px-4 py-2 rounded-xl bg-muted border border-border focus:border-primary outline-none font-mono text-sm"
              placeholder="000000646400000000000000"
            />
          </div>
        </div>

        <div class="p-6 border-t border-border flex justify-end gap-4">
          <button
            class="px-6 py-2 rounded-xl bg-muted hover:bg-muted/80 transition-colors"
            @click="showModal = false"
          >
            Cancel
          </button>
          <button
            class="px-6 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            @click="saveProfile"
          >
            {{ editingProfile ? 'Save Changes' : 'Create Profile' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

