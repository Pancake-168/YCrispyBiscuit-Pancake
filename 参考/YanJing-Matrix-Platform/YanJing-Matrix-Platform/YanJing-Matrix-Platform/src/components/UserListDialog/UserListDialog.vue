<template>
    <div class="dialog-mask yj-dialog-mask" @click.self="emit('close')">
        <div class="dialog yj-dialog-content">
            <div class="dialog-header">
                <div class="dialog-title">成员列表</div>
                <button class="close-btn" @click="emit('close')">×</button>
            </div>

            <div class="dialog-body">
                <section class="section">
                    <div class="section-header">
                        <div class="section-title">普通成员</div>
                        <div class="section-count">{{ normalMembers.length }}</div>
                    </div>
                    <div v-if="!normalMembers.length" class="empty-text">暂无成员</div>
                    <div v-else class="grid">
                        <div v-for="m in normalMembers" :key="m.id" class="card" @click="handleTalk(m.username)">
                            <div class="avatar">
                                <svg class="avatar-icon avatar-icon--bot" viewBox="0 0 1024 1024" aria-hidden="true">
                                    <rect width="1024" height="1024" rx="512"  fill-opacity="0.25" />
                                    <path
                                        d="M828.3 818.2c-8-66.8-31.8-129.9-68.7-182.4-31.8-45.2-72.1-81-117.7-104.6 27.5-20.6 49.7-47.2 64.9-78 19.6-39.6 26.4-84.2 19.7-128.8-6.5-43.2-26-83.2-56.4-115.7-30.6-32.7-69.2-54.7-111.9-63.6-15.7-3.3-31.5-4.9-47-4.9-58.2 0-112.9 22.7-154 63.8s-63.8 95.8-63.8 154c0 38.3 10.2 76 29.5 108.9 14.7 25 34.3 46.9 57.6 64.4-45.6 23.7-86 59.5-117.7 104.7-36.9 52.5-60.7 115.5-68.7 182.4-2 16.3 3.2 32.8 14.2 45.1 11.1 12.5 26.9 19.7 43.5 19.7h518.8c16.6 0 32.5-7.2 43.5-19.7 10.9-12.6 16.1-29.1 14.2-45.3zM429.2 586.4c20.1-8.5 33.6-27.3 35.2-49.2 1.5-21.8-9.2-42.4-28.1-53.7-45.2-27-72.2-74-72.2-125.6 0-81.1 65.9-147 147-147 10.6 0 21.5 1.1 32.5 3.4 57.6 12 103.9 61.6 112.8 120.6 9 60.3-18 117.3-70.4 148.7-18.8 11.2-29.5 31.7-28.1 53.7 1.6 21.9 15 40.7 35.2 49.2 84.6 35.7 146 121.6 162.5 225.6H266.4C283.3 708 344.8 622 429.2 586.4z"
                                        fill="currentColor"
                                        transform="translate(512, 512) scale(0.6) translate(-512, -512)" />
                                </svg>
                            </div>
                            <div class="info">
                                <div class="nickname" :title="m.displayName">{{ m.displayName }}</div>
                                <div class="meta" :title="m.username">{{ m.username }}</div>
                            </div>
                        </div>
                    </div>
                </section>




                <section class="section">
                    <div class="section-header">
                        <div class="section-title">通用助手</div>
                        <div class="section-count">{{  }}</div>
                    </div>
                    <div  class="grid">
                        <div  class="card" @click="handleTalk(userbot?.username)">
                            <div class="avatar">
                                <svg class="avatar-icon avatar-icon--bot" viewBox="0 0 1024 1024" aria-hidden="true">
                                    <rect width="1024" height="1024" rx="512"  fill-opacity="0.25" />
                                    <path
                                        d="M828.3 818.2c-8-66.8-31.8-129.9-68.7-182.4-31.8-45.2-72.1-81-117.7-104.6 27.5-20.6 49.7-47.2 64.9-78 19.6-39.6 26.4-84.2 19.7-128.8-6.5-43.2-26-83.2-56.4-115.7-30.6-32.7-69.2-54.7-111.9-63.6-15.7-3.3-31.5-4.9-47-4.9-58.2 0-112.9 22.7-154 63.8s-63.8 95.8-63.8 154c0 38.3 10.2 76 29.5 108.9 14.7 25 34.3 46.9 57.6 64.4-45.6 23.7-86 59.5-117.7 104.7-36.9 52.5-60.7 115.5-68.7 182.4-2 16.3 3.2 32.8 14.2 45.1 11.1 12.5 26.9 19.7 43.5 19.7h518.8c16.6 0 32.5-7.2 43.5-19.7 10.9-12.6 16.1-29.1 14.2-45.3zM429.2 586.4c20.1-8.5 33.6-27.3 35.2-49.2 1.5-21.8-9.2-42.4-28.1-53.7-45.2-27-72.2-74-72.2-125.6 0-81.1 65.9-147 147-147 10.6 0 21.5 1.1 32.5 3.4 57.6 12 103.9 61.6 112.8 120.6 9 60.3-18 117.3-70.4 148.7-18.8 11.2-29.5 31.7-28.1 53.7 1.6 21.9 15 40.7 35.2 49.2 84.6 35.7 146 121.6 162.5 225.6H266.4C283.3 708 344.8 622 429.2 586.4z"
                                        fill="currentColor"
                                        transform="translate(512, 512) scale(0.6) translate(-512, -512)" />
                                </svg>
                            </div>
                            <div class="info">
                                <div class="nickname" :title="userbot?.nickname || '通用助手'">{{ userbot?.nickname || '通用助手' }}</div>
                                <div class="meta" :title="userbot?.username || '-'">{{ userbot?.username || '-' }}</div>
                            </div>
                        </div>
                    </div>
                </section>

                <section class="section">
                    <div class="section-header">
                        <div class="section-title">组织AI助理</div>
                        <div class="section-count">{{ botMembers.length }}</div>
                    </div>
                    <div v-if="!botMembers.length" class="empty-text">暂无助理</div>
                    <div v-else class="grid">
                        <div v-for="b in botMembers" :key="b.id" class="card" @click="handleTalk(b.username)">
                            <div class="avatar">
                                <svg class="avatar-icon avatar-icon--bot" viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M12 8V4H8" />
                                    <rect x="4" y="8" width="16" height="12" rx="2" />
                                    <path d="M9 12h.01" />
                                    <path d="M15 12h.01" />
                                    <path d="M8 16h8" />
                                </svg>
                            </div>
                            <div class="info">
                                <div class="nickname" :title="b.displayName">{{ b.displayName }}</div>
                             
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useOrganizationStore } from '@/stores/Organization';
import { storeToRefs } from 'pinia';
import { useUserBotStore } from '@/stores/UserBot';
import { talkWithTargetAccount } from '@/composables/useTalkWithTargetAccount3';
import { refreshRoomState } from '@/services/Matrix/refreshRoomState';
import { MOBILE_MAX_WIDTH } from '@/constants/breakpoints';

const emit = defineEmits<{
    (e: 'close'): void;
}>();

const store = useOrganizationStore();
const { currentOrganization, currentApplicationUsers } = storeToRefs(store);
const MOBILE_MAX_WIDTH_PX = `${MOBILE_MAX_WIDTH}px`;

onMounted(() => {
    const appid = currentOrganization.value?.app_id;
    if (appid) {
        store.loadApplicationUsers(String(appid)).catch(() => undefined);
    }
});


type UserbotLike = {
    username?: string;
    nickname?: string;
}

const userbotStore = useUserBotStore();
const userbot = computed<UserbotLike | null>(() => {
    const bot = userbotStore.userBot as UserbotLike | undefined;
    return bot ?? null;
});



const normalMembers = computed(() => {
    const res = currentApplicationUsers.value;
    if (!res?.data) return [];
    const list: Array<{
        id: string;
        displayName: string;
        username: string;
    }> = [];

    res.data
        .filter((u) => String(u.type).toLowerCase() !== 'bot')
        .forEach((u) => {
            const displayName = u.nickname || u.username || '未知成员';
            list.push({
                id: String(u.id),
                displayName,
                username: u.username,
            });
        });

    return list;
});

const botMembers = computed(() => {
    const res = currentApplicationUsers.value;
    if (!res?.data) return [];
    return res.data
        .filter((u) => String(u.type).toLowerCase() === 'bot')
        .map((u) => ({
            id: String(u.id),
            displayName: u.nickname || u.username || 'Bot',
            username: u.username,
        }));
});

async function handleTalk(username?: string) {
    if (!username) return;
    const roomId = await talkWithTargetAccount(username);
    if (roomId) {
        await refreshRoomState({
            showLoading: true,
            loadingText: '正在进入对话...',
            preferredRoomId: roomId,
        });
    }
    emit('close');
}
</script>

<style scoped>
.dialog-mask {
    position: fixed;
    inset: 0;
    background: color-mix(in srgb, var(--bg-color) 88%, transparent);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
}

.dialog {
    width: min(92vw, 1100px);
    max-height: 80vh;
    background: var(--panel-bg);
    border-radius: var(--radius-lg);
    overflow: hidden;
    box-shadow: var(--glass-shadow);
    display: flex;
    flex-direction: column;
}

.dialog-header {
    padding: var(--space-sm) var(--space-md);
    border-bottom: 1px solid color-mix(in srgb, var(--text-color) 18%, transparent);
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.dialog-title {
    color: var(--text-color);
    font-size: var(--font-sm);
    font-weight: 600;
}

.close-btn {
    border: none;
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
    font-size: var(--font-md);
    line-height: 1;
    width: 28px;
    height: 28px;
    border-radius: 50%;
}

.close-btn:hover {
    background: var(--hover-bg);
    color: var(--primary-color);
}

.dialog-body {
    padding: var(--space-sm) var(--space-md) var(--space-md);
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
}

.section {
     border-radius: var(--radius-md);
    padding: var(--space-sm);
}

.section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
}

.section-title {
    color: var(--text-color);
    font-size: var(--font-xs);
    font-weight: 500;
}

.section-count {
    color: var(--text-muted);
    font-size: var(--font-xs);
}

.empty-text {
    color: var(--text-muted);
    font-size: var(--font-xs);
    padding: var(--space-sm) var(--space-xs);
}

.grid {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: var(--space-md);
    padding: var(--space-xs);
}

.card {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    padding: var(--space-xs) var(--space-sm);
    background: var(--panel-bg);
    border: 1px solid color-mix(in srgb, var(--text-color) 14%, transparent);
    border-radius: var(--radius-md);
    min-height: 20px;
    transition: background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.card:hover {
    background: var(--hover-bg);
    border-color: color-mix(in srgb, var(--primary-color) 45%, transparent);
    box-shadow: var(--glass-shadow);
    transform: translateY(-1px);
}

.avatar {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-muted);
   
    flex-shrink: 0;
    overflow: hidden;
}

.avatar-icon {
    width: 24px;
    height: 24px;
    fill: currentColor;
}

.avatar-icon--bot {
    fill: none;
    stroke: currentColor;

    stroke-linecap: round;
    stroke-linejoin: round;
}

.info {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 1px;
}

.nickname {
    font-size: var(--font-xs);
    font-weight: 500;
    color: var(--text-color);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.meta {
    font-size: var(--font-xs);
    color: var(--text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.tag {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 16px;
    padding: 0 8px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--panel-bg) 80%, var(--text-color) 20%);
    color: var(--text-muted);
    border: 1px solid color-mix(in srgb, var(--text-color) 14%, transparent);
    font-size: var(--font-xs);
    width: max-content;
}

@media (max-width: v-bind(MOBILE_MAX_WIDTH_PX)) {
    .dialog {
        width: 96vw;
        max-height: 90vh;
    }

    .grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
        padding: 6px;
    }
}
</style>
