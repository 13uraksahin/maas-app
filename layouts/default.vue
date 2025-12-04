<script setup lang="ts">
import { 
  Droplets, 
  Activity, 
  Gauge, 
  Bell, 
  Settings, 
  Building2,
  LayoutDashboard,
  Signal,
  Menu,
  X,
} from 'lucide-vue-next'

const { isConnected } = useSocket()
const route = useRoute()

const isMobileMenuOpen = ref(false)

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Live Readings', href: '/readings', icon: Activity },
  { name: 'Assets', href: '/assets', icon: Gauge },
  { name: 'Tenants', href: '/tenants', icon: Building2 },
  { name: 'Alerts', href: '/alerts', icon: Bell },
  { name: 'Settings', href: '/settings', icon: Settings },
]

const isActive = (href: string) => {
  if (href === '/') return route.path === '/'
  return route.path.startsWith(href)
}
</script>

<template>
  <div class="min-h-screen bg-background">
    <!-- Background pattern -->
    <div class="fixed inset-0 bg-grid-pattern opacity-30 pointer-events-none" />
    <div class="fixed inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
    
    <!-- Sidebar -->
    <aside 
      class="fixed inset-y-0 left-0 z-50 w-64 glass-card border-r border-border/50 transform transition-transform duration-300 lg:translate-x-0"
      :class="isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <div class="flex flex-col h-full">
        <!-- Logo -->
        <div class="flex items-center gap-3 px-6 py-5 border-b border-border/50">
          <div class="p-2 rounded-xl bg-primary/10 text-primary">
            <Droplets class="w-6 h-6" />
          </div>
          <div>
            <h1 class="text-lg font-bold text-gradient">MAAS</h1>
            <p class="text-xs text-muted-foreground">Water Meter Platform</p>
          </div>
        </div>
        
        <!-- Navigation -->
        <nav class="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <NuxtLink
            v-for="item in navigation"
            :key="item.name"
            :to="item.href"
            class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200"
            :class="[
              isActive(item.href)
                ? 'bg-primary/10 text-primary glow-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            ]"
            @click="isMobileMenuOpen = false"
          >
            <component :is="item.icon" class="w-5 h-5" />
            {{ item.name }}
          </NuxtLink>
        </nav>
        
        <!-- Connection status -->
        <div class="p-4 mx-4 mb-4 rounded-xl bg-muted/30 border border-border/50">
          <div class="flex items-center gap-3">
            <div 
              class="data-dot"
              :class="isConnected ? 'bg-signal-excellent' : 'bg-signal-none'"
            />
            <div>
              <p class="text-sm font-medium">
                {{ isConnected ? 'Connected' : 'Disconnected' }}
              </p>
              <p class="text-xs text-muted-foreground">
                Real-time data stream
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
    
    <!-- Mobile menu button -->
    <button
      class="fixed top-4 left-4 z-50 p-2 rounded-lg glass-card lg:hidden"
      @click="isMobileMenuOpen = !isMobileMenuOpen"
    >
      <Menu v-if="!isMobileMenuOpen" class="w-6 h-6" />
      <X v-else class="w-6 h-6" />
    </button>
    
    <!-- Overlay -->
    <div 
      v-if="isMobileMenuOpen"
      class="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
      @click="isMobileMenuOpen = false"
    />
    
    <!-- Main content -->
    <main class="lg:pl-64 min-h-screen">
      <div class="p-6 lg:p-8">
        <slot />
      </div>
    </main>
  </div>
</template>

