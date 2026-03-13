<template>
    <div class="FunctionList" :class="{ 'is-fixed': shouldUseFixedStyle, 'is-collapsed': shouldCollapse }">
        <div class="title">
            <img src="@/assets/YanJingAI2/研境LOGO@4x.png" alt="image" />
            <h3 v-show="!shouldCollapse">管理系统</h3>
        </div>
        <div class="item" :class="{ 'is-active': systemStore.currentFunction === func.id }" v-for="func in functions"
            :key="func.id" @click="switchFunction(func.id)" :title="shouldCollapse ? func.name : undefined">
            <div class="icons">
                <div class="icon nocobase-icon" v-if="func.id == 'NocoBase'">
                    <img class="nocobase-logo" src="@/assets/NocoBase/NocoBase.png" alt="logo">
                </div>
            </div>
            <div class="itemName" v-show="!shouldCollapse">
                {{ func.name }}
            </div>
        </div>
        <div class="bottom" :class="{ 'is-active': systemStore.currentFunction === 'Settings' }"
            @click="switchFunction('Settings')" :title="shouldCollapse ? '设置' : undefined">
            <div class="icons">
                <div class="icon">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"
                        stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="3" />
                        <path
                            d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09c0 .66.39 1.26 1 1.51.61.25 1.31.11 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06c-.44.51-.58 1.21-.33 1.82.25.61.85 1 1.51 1H21a2 2 0 0 1 0 4h-.09c-.66 0-1.26.39-1.51 1z" />
                    </svg>
                </div>
            </div>
            <div class="itemName" v-show="!shouldCollapse">
                设置
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { SYSTEM_FUNCTIONS, type SystemFunctionId, useSystemManagerStore } from '@/stores/SystemManager'
import { computed } from 'vue'
import { useAppManagerStore } from '@/stores/appManager'

const props = withDefaults(defineProps<{
    mobileCompact?: boolean
}>(), {
    mobileCompact: false
})

const systemStore = useSystemManagerStore()
const appStore = useAppManagerStore()

const functions = SYSTEM_FUNCTIONS.filter(func => func.id !== 'Settings')
const isCollapsed = computed(() => appStore.functionListMode === 'fixed' && appStore.functionListCollapsed)
const shouldUseFixedStyle = computed(() => appStore.functionListMode === 'fixed' || props.mobileCompact)
const shouldCollapse = computed(() => isCollapsed.value || props.mobileCompact)

function switchFunction(functionId: SystemFunctionId) {
    systemStore.setCurrentFunction(functionId)
}

</script>

<style scoped>
.FunctionList {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    padding: var(--space-md);
    padding-top: 10vh;
    height: 100%;
    width: 100%;
    background: var(--glass-bg);
    border-right: var(--glass-border);
    box-shadow: var(--glass-shadow);
    backdrop-filter: var(--glass-blur);
    -webkit-backdrop-filter: var(--glass-blur);
    user-select: none;
}

.FunctionList.is-fixed.is-collapsed {
    padding-left: var(--space-xs);
    padding-right: var(--space-xs);
}

.FunctionList.is-fixed {

    padding: 0;
    padding-top: 0.3rem;
}


.title {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: var(--space-sm);
    padding: var(--space-xs) var(--space-xs);
    margin-bottom: var(--space-sm);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: var(--radius-sm);
    transition: background-color 0.2s ease, transform 0.2s ease;
    cursor: pointer;


}
.FunctionList.is-fixed.is-collapsed .title {
    justify-content: center;
    padding-left: var(--space-xs);
    padding-right: var(--space-xs);

}

.FunctionList.is-fixed.is-collapsed .title img {
    width: 28px;
    max-width: none;
    margin-right: 0;
}



.title:active {
    background: var(--active-bg);
    transform: translateY(1px);
}

.title img {
    width: 20px;
    height: 20px;
    margin-right: 0;
    object-fit: contain;
    margin-left: 0.5rem;
    display: block;
}

.title h3 {
    font-size: var(--font-lg);
    color: var(--text-color);
    font-weight: 600;
    text-align: left;
    margin: 0;
    line-height: 1;
    display: flex;
    align-items: center;
}


.item {
    display: flex;
    align-items: center;
    gap: 0;
    padding: var(--space-xs) var(--space-xs);

    border-radius: var(--radius-sm);
    color: var(--text-color);
    cursor: pointer;
    transition: background-color 0.2s ease, transform 0.2s ease, color 0.2s ease;
}


.FunctionList.is-fixed.is-collapsed .item,
.FunctionList.is-fixed.is-collapsed .bottom {
    justify-content: center;
    padding-left: var(--space-xs);
    padding-right: var(--space-xs);
    min-height: 38px;
}

.FunctionList.is-fixed.is-collapsed .icons {
    width: 16px;
    height: 16px;
}

.FunctionList.is-fixed.is-collapsed .icons .icon svg {
    width: 16px;
    height: 16px;
}

.item:hover {
    background: var(--hover-bg);
}

.item:active {
    background: var(--active-bg);
    transform: translateY(1px);
}

.item.is-active {
    background: var(--active-bg);
    border: var(--glass-border);
    box-shadow: var(--glass-shadow);
}





.bottom {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    padding: var(--space-sm) var(--space-md);
    min-height: 44px;
    border-radius: var(--radius-sm);
    color: var(--text-color);
    cursor: pointer;
    transition: background-color 0.2s ease, transform 0.2s ease, color 0.2s ease;
    margin-top: auto;
}

.bottom:hover {
    background: var(--hover-bg);
}

.bottom:active {
    background: var(--active-bg);
    transform: translateY(1px);
}

.bottom.is-active {
    background: var(--active-bg);
    border: var(--glass-border);
    box-shadow: var(--glass-shadow);
}




.icons {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-sm);

    color: var(--text-color);
    flex-shrink: 0;
}

.icons .icon {
    display: flex;
    align-items: center;
    justify-content: center;
}

.icons .icon.nocobase-icon {
    width: 24px;
    height: 24px;
    border-radius: 6px;
    background: color-mix(in srgb, var(--text-color) 10%, transparent);
}

.nocobase-logo {
    width: 18px;
    height: 18px;
    object-fit: contain;
    filter: drop-shadow(0 0 1px rgba(0, 0, 0, 0.35));
}

@media (prefers-color-scheme: dark) {
    .nocobase-logo {
        filter: brightness(0) invert(1) drop-shadow(0 0 1px rgba(255, 255, 255, 0.25));
    }
}

.itemName {
    font-size: var(--font-sm);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

@media (max-width: 768px) {
    .FunctionList {
        padding: var(--space-md);
    }

    .item {
        padding: var(--space-sm) var(--space-md);
        gap: var(--space-sm);
    }

    .bottom {
        padding: var(--space-sm) var(--space-md);
        gap: var(--space-sm);
    }
}

@media (max-width: 768px) {
    .FunctionList {
        padding: var(--space-md);
    }

    .item {
        padding: var(--space-sm) var(--space-md);
        gap: var(--space-sm);
        justify-content: center;
    }

    .bottom {
        padding: var(--space-sm) var(--space-md);
        gap: var(--space-sm);
        justify-content: center;
    }

    .itemName {
        display: none;
    }
}
</style>
