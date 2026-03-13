<template>
  <div class="left-function-sidebar" :class="{ 'left-function-sidebar--compact': compact }">
  
    <!--NewCurrentOrganization /-->

    <NewCurrentOrganizationV2 />

    <!-- 功能列表组件 -->
    <FunctionList 
      :compact="compact"
      @function-change="emit('function-change', $event)" 
    />
    
    <!-- 用户面板组件 -->
    <UserPanel 
      :user-initials="userInitials"
      :compact="compact"
      @userInfo="emit('userInfo')"
      @deviceManager="emit('function-change', 'deviceManager')"
    />
  </div>
</template>

<script setup lang="ts">
import { toRefs } from 'vue'
import NewCurrentOrganization from './NewCurrentOrganization'
import FunctionList from './FunctionList'
import UserPanel from './UserPanel'
import NewCurrentOrganizationV2 from './NewCurrentOrganizationV2'

interface Props {
  userInitials: string
  currentOrg: any
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  compact: false
})

const { compact } = toRefs(props)

const emit = defineEmits(['userInfo', 'function-change', 'open-organization-dropdown'])
</script>

<style scoped>
.left-function-sidebar {

  padding: 0.5rem;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-color-secondary);

}

.left-function-sidebar--compact {
  align-items: center;
}
</style>
