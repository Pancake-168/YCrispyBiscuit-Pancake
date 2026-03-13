<template>
  <div v-if="visible" class="tbs-overlay" role="dialog" aria-modal="true" aria-label="全局搜索" @click="close">
    <div class="tbs-container" @click.stop>
      <!-- 顶部标题，与 ViewSourceDialog 风格一致 -->
      <div class="tbs-top">
        <div class="tbs-title-row">
          <h3 class="tbs-title">全局搜索</h3>
          <button class="tbs-top-close" type="button" aria-label="关闭" @click="close">✕</button>
        </div>
      </div>

      <div class="modal-content-area">
        <!-- 顶部搜索条 -->
        <div class="tbs-searchbar">
          <div class="tbs-input-wrap">
            <svg class="tbs-search-icon" viewBox="0 0 24 24">
              <path fill="currentColor"
                d="M15.5 14h-.79l-.28-.27a6.471 6.471 0 0 0 1.57-4.23 6.5 6.5 0 1 0-6.5 6.5 6.471 6.471 0 0 0 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5Zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14Z" />
            </svg>
            <input ref="inputRef" v-model="keyword" type="text" class="tbs-input" :placeholder="placeholder"
              @keydown.down.prevent="moveActive(1)" @keydown.up.prevent="moveActive(-1)"
              @keydown.enter.prevent="handleEnter" />
          </div>
        </div>

        <!-- 结果区域 -->
        <div class="tbs-body" ref="bodyRef" @scroll.passive="onBodyScroll">
          <div v-if="!keyword.trim() && !loading" class="tbs-hint">
            输入关键词以搜索人员、会话或消息。
          </div>
          <template v-else>
            <div class="tbs-tabs">
              <button :class="['tbs-tab', { active: selectedTab === 'people' }]" @click="selectedTab = 'people'">人员</button>
              <button :class="['tbs-tab', { active: selectedTab === 'rooms' }]" @click="selectedTab = 'rooms'">会话</button>
              <button :class="['tbs-tab', { active: selectedTab === 'messages' }]"
                @click="selectedTab = 'messages'">消息</button>
            </div>
            <div v-if="loading" class="tbs-loading">正在搜索…</div>
            <template v-else>
              <div class="tbs-sections">
                <!-- 人员 -->
                <section v-if="selectedTab === 'people'" class="tbs-section">

                  <ul class="tbs-list" role="listbox">
                    <li v-for="(r, i) in people" :key="r.item.userId"
                      :class="['tbs-item', { active: activeIndex === flatIndexFor('people', i) }]" role="option"
                      @mouseenter="hoverFlat('people', i)" @click="chooseUser(r.item.userId)">
                      <img v-if="r.item.avatarUrl" :src="mxcToHttp(r.item.avatarUrl, 36)" class="tbs-avatar" />
                      <div v-else class="tbs-avatar tbs-fallback">{{ getInitial(getUserDisplayName(r.item.userId, r.item.displayName)) }}
                      </div>
                      <div class="tbs-item-main">
                        <div class="tbs-title">{{ getUserDisplayName(r.item.userId, r.item.displayName) }}</div>
                        <div class="tbs-sub">{{ r.item.userId }}</div>
                      </div>
                    </li>
                  </ul>
                  <div v-if="!people.length" class="tbs-empty">没有找到匹配人员</div>
                </section>

                <!-- 房间 -->
                <section v-if="selectedTab === 'rooms'" class="tbs-section">

                  <ul class="tbs-list" role="listbox">
                    <li v-for="(r, i) in rooms" :key="r.item.roomId"
                      :class="['tbs-item', { active: activeIndex === flatIndexFor('rooms', i) }]" role="option"
                      @mouseenter="hoverFlat('rooms', i)" @click="openRoom(r.item.roomId)">
                      <img v-if="r.item.avatarUrl" :src="mxcToHttp(r.item.avatarUrl, 36)" class="tbs-avatar" />
                      <div v-else class="tbs-avatar tbs-fallback">{{ getInitial(r.item.name || r.item.alias ||
                        r.item.roomId) }}</div>
                      <div class="tbs-item-main">
                        <div class="tbs-title">{{ r.item.name }}</div>
                        <div class="tbs-sub">成员：{{ r.item.memberCount }}</div>
                      </div>
                    </li>
                  </ul>
                  <div v-if="!rooms.length" class="tbs-empty">没有找到匹配会话</div>
                </section>

                <!-- 消息 -->
                <section v-if="selectedTab === 'messages'" class="tbs-section">

                  <ul class="tbs-list tbs-messages" role="listbox">
                    <li v-for="(m, i) in messages" :key="m.eventId"
                      :class="['tbs-item', { active: activeIndex === flatIndexFor('messages', i) }]" role="option"
                      @mouseenter="hoverFlat('messages', i)" @click="openMessage(m)">
                      <div class="tbs-avatar tbs-fallback">💬</div>
                      <div class="tbs-item-main">
                        <div class="tbs-title tbs-msg">{{ m.body }}</div>
                        <div class="tbs-sub">{{ m.roomId }} · {{ m.sender }}</div>
                      </div>
                    </li>
                  </ul>
                  <div v-if="!messages.length" class="tbs-empty">没有找到匹配消息</div>
                </section>
              </div>
            </template>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted, nextTick } from 'vue'
import { searchUsersDirectory, searchPublicRoomsPaged, serverSideMessageSearchPaged, searchMyJoinedRoomsPaged } from '@/services/matrix/theBestSearch'
import { MATRIX_SERVER_URL_TAIL } from '@/apiUrls'
import { matrixClientV2 } from '@/services/matrix/client'
import type { SearchResult, UserSearchResult, RoomSearchResult } from '@/types/room-management.types'
import { showUserProfileCard } from '@/components/UserProfileCard/showUserProfileCard'
import { resolveUserDisplayName } from '@/utils/displayName'

const getUserDisplayName = (userId: string, matrixDisplayName?: string) =>
  resolveUserDisplayName({ matrixId: userId, matrixDisplayName: matrixDisplayName || null })

const props = defineProps<{ onClose?: () => void }>()
const visible = ref(true)
const keyword = ref('')
const loading = ref(false)
const selectedTab = ref<'people' | 'rooms' | 'messages'>('people')
const people = ref<SearchResult<UserSearchResult>[]>([])
const rooms = ref<SearchResult<RoomSearchResult>[]>([])
// 已移除“空间”概念
const messages = ref<any[]>([])
const inputRef = ref<HTMLInputElement | null>(null)
const bodyRef = ref<HTMLDivElement | null>(null)

// 分页状态
const peopleLimit = ref(25)
const publicRoomsSince = ref<string | undefined>(undefined)
const localRoomsNextIndex = ref(0)
const localRoomsExhausted = ref(false)
const messagesNextBatch = ref<string | undefined>(undefined)
const isLoadingMore = ref(false)

// 展示提示文案
const placeholder = computed(() => '搜索人员、会话或消息…')

// 扁平化聚合用于键盘导航
type SectionKey = 'people' | 'rooms' | 'messages'
const flatMap = computed(() => {
  const arr: Array<{ section: SectionKey; i: number }> = []
  if (selectedTab.value === 'people') people.value.forEach((_, i) => arr.push({ section: 'people', i }))
  if (selectedTab.value === 'rooms') rooms.value.forEach((_, i) => arr.push({ section: 'rooms', i }))
  if (selectedTab.value === 'messages') messages.value.forEach((_, i) => arr.push({ section: 'messages', i }))
  return arr
})
const activeIndex = ref(0)
const totalCount = computed(() => flatMap.value.length)
const flatIndexFor = (section: SectionKey, i: number) => {
  let idx = 0
  if (section === 'people') return i
  idx += people.value.length
  if (section === 'rooms') return idx + i
  idx += rooms.value.length
  return idx + i
}
const hoverFlat = (section: SectionKey, i: number) => (activeIndex.value = flatIndexFor(section, i))
const moveActive = (delta: number) => {
  if (!totalCount.value) return
  activeIndex.value = (activeIndex.value + delta + totalCount.value) % totalCount.value
}

let runId = 0
let debounceTimer: any
watch([keyword], () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => doSearch(), 200)
})

// 规范化服务器字符串：
// - 去掉协议、路径
// - 去掉前导冒号（:chat.example.org -> chat.example.org）
// 保持 element-web 行为：不对裸用户名做跨服/后缀补全探测

function dedupeUsers(list: Array<SearchResult<UserSearchResult>>): Array<SearchResult<UserSearchResult>> {
  const seen = new Set<string>()
  const out: Array<SearchResult<UserSearchResult>> = []
  for (const r of list || []) {
    const id = r?.item?.userId
    if (!id) continue
    if (seen.has(id)) continue
    seen.add(id)
    out.push(r)
  }
  return out
}

async function doSearch() {
  const term = keyword.value.trim()
  const current = ++runId
  loading.value = true
  try {
    if (!term) {
      people.value = rooms.value = messages.value = []
      activeIndex.value = 0
      return
    }
    const defTail = (MATRIX_SERVER_URL_TAIL || '').replace(/^:+/, '')
    const atLike = term.startsWith('@')
    const bangLike = term.startsWith('!')
    // 当以 '!' 开头时，把后面的文本作为“房间关键词/成员关键词”使用，便于按成员找房间
    const queryForRooms = bangLike ? term.slice(1) : term
    const queryForMessages = bangLike ? term.slice(1) : term
    // 重置分页状态
    peopleLimit.value = 25
    publicRoomsSince.value = undefined
    localRoomsNextIndex.value = 0
    localRoomsExhausted.value = false
    messagesNextBatch.value = undefined
    selectedTab.value = bangLike ? 'rooms' : 'people'
    const [p, rPaged, mPaged, localPaged] = await Promise.all([
      // 若以 '!' 开头，则不搜人员，避免误导
      bangLike ? Promise.resolve([]) : searchUsersDirectory(term, { limit: peopleLimit.value }),
      // 公开目录（分页）
      searchPublicRoomsPaged(queryForRooms, { limit: 25 }),
      // 消息（分页）
      serverSideMessageSearchPaged(queryForMessages, 20),
      // 本地：我已加入的房间（含私有）（分页）
      searchMyJoinedRoomsPaged(queryForRooms, { limit: 25, includeMemberMatch: true, memberLimitPerRoom: 80, startIndex: 0 }),
    ])
    // 人员：目录为主；若输入以 @ 开头，支持自动补全服务器后缀（仅对 @ 前缀生效）
    let peopleResults = p
    const looksLikeFullMxid = atLike && term.includes(':') && term.length > 3
    const looksLikeLocalMxid = atLike && !term.includes(':') && term.length > 1
    if ((looksLikeFullMxid || looksLikeLocalMxid) && (!peopleResults || peopleResults.length === 0)) {
      try {
        const client = matrixClientV2.getAuthedClient?.()
        // @ts-ignore
        const mxid = looksLikeLocalMxid && defTail ? `${term}:${defTail}` : term
        const profile = await client?.getProfileInfo?.(mxid)
        if (profile) {
          const item = { userId: mxid, displayName: profile.displayname || mxid, avatarUrl: profile.avatar_url || '' }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const synthetic: any = { item }
          peopleResults = [synthetic]
        }
      } catch (_) { /* ignore */ }
    }

    // 房间：若输入以 '!' 开头且未带服务器，补全默认服务器并追加最小候选（仅对 ! 前缀生效）
    // 合并房间：本地命中优先，其次公开目录去重追加
    const seen = new Set<string>()
    const roomResults = [] as Array<SearchResult<RoomSearchResult>>
    for (const rr of (localPaged?.results || [])) { if (!seen.has(rr.item.roomId)) { seen.add(rr.item.roomId); roomResults.push(rr) } }
    for (const rr of (rPaged?.results || [])) { if (!seen.has(rr.item.roomId)) { seen.add(rr.item.roomId); roomResults.push(rr) } }

    const looksLikeLocalRoomId = bangLike && !term.includes(':') && defTail && term.length > 1
    if (looksLikeLocalRoomId) {
      const roomId = `${term}:${defTail}`
      roomResults.unshift({
        index: -1,
        item: {
          roomId,
          name: roomId,
          topic: undefined,
          alias: undefined,
          memberCount: 0,
          isEncrypted: false,
          avatarUrl: undefined,
          serverName: defTail,
          joinRule: 'public',
          canJoin: true,
          score: 1,
        },
      } as SearchResult<RoomSearchResult>)
    }

    if (current === runId) {
      people.value = dedupeUsers(peopleResults || [])
      rooms.value = roomResults
      messages.value = mPaged?.results || []
      publicRoomsSince.value = rPaged?.next
      messagesNextBatch.value = mPaged?.next
      localRoomsNextIndex.value = localPaged?.nextIndex ?? 0
      localRoomsExhausted.value = (localPaged?.results?.length ?? 0) === 0
      activeIndex.value = 0
    }
  } finally {
    if (current === runId) loading.value = false
  }
}

function nearBottom(el: HTMLElement, threshold = 120) {
  return el.scrollTop + el.clientHeight >= el.scrollHeight - threshold
}

async function loadMoreSelected() {
  if (isLoadingMore.value || loading.value) return
  const term = keyword.value.trim()
  if (!term) return
  isLoadingMore.value = true
  try {
    if (selectedTab.value === 'people') {
      // 不在 '!' 模式下才加载
      if (term.startsWith('!')) return
      peopleLimit.value += 25
      const more = await searchUsersDirectory(term, { limit: peopleLimit.value })
      people.value = dedupeUsers(more || [])
    } else if (selectedTab.value === 'rooms') {
      const bangLike = term.startsWith('!')
      const queryForRooms = bangLike ? term.slice(1) : term
      let appended = 0
      // 先尝试本地房间
      if (!localRoomsExhausted.value) {
        const local = await searchMyJoinedRoomsPaged(queryForRooms, { limit: 25, includeMemberMatch: true, memberLimitPerRoom: 80, startIndex: localRoomsNextIndex.value })
        localRoomsNextIndex.value = local.nextIndex ?? localRoomsNextIndex.value
        if ((local.results?.length || 0) > 0) {
          const seen = new Set(rooms.value.map((r) => r.item.roomId))
          for (const rr of local.results) if (!seen.has(rr.item.roomId)) rooms.value.push(rr)
          appended += local.results.length
        } else {
          localRoomsExhausted.value = true
        }
      }
      // 然后公开目录
      if (appended === 0) {
        const rPaged = await searchPublicRoomsPaged(queryForRooms, { limit: 25, since: publicRoomsSince.value })
        publicRoomsSince.value = rPaged.next
        if ((rPaged.results?.length || 0) > 0) {
          const seen = new Set(rooms.value.map((r) => r.item.roomId))
          for (const rr of rPaged.results) if (!seen.has(rr.item.roomId)) rooms.value.push(rr)
        }
      }
    } else if (selectedTab.value === 'messages') {
      const bangLike = term.startsWith('!')
      const queryForMessages = bangLike ? term.slice(1) : term
      const mPaged = await serverSideMessageSearchPaged(queryForMessages, 20, messagesNextBatch.value)
      messagesNextBatch.value = mPaged.next
      if ((mPaged.results?.length || 0) > 0) messages.value.push(...mPaged.results)
    }
  } finally {
    isLoadingMore.value = false
  }
}

function onBodyScroll(e: Event) {
  const el = e.target as HTMLElement
  if (!el) return
  if (nearBottom(el)) void loadMoreSelected()
}

function close() {
  visible.value = false
  props.onClose?.()
}

onMounted(async () => {
  await nextTick()
  inputRef.value?.focus()
})

watch(visible, (v) => { if (!v) props.onClose?.() })

function mxcToHttp(url?: string, size = 36) {
  if (!url) return ''
  const client = matrixClientV2.getAuthedClient?.()
  // @ts-ignore
  return client?.mxcUrlToHttp?.(url, size, size, 'scale', false) || url
}

function getInitial(text?: string) {
  if (!text) return '#'
  return text.charAt(0).toUpperCase()
}

function handleEnter() {
  const map = flatMap.value
  if (!map.length) return
  const cur = map[activeIndex.value]
  if (cur.section === 'people') {
    const item = people.value[cur.i]?.item
    if (item) chooseUser(item.userId)
    return
  }
  if (cur.section === 'rooms') {
    const item = rooms.value[cur.i]?.item
    if (item) openRoom(item.roomId)
    return
  }
  const m = messages.value[cur.i]
  if (m) openMessage(m)
}

// 动作占位，便于外部接入
function chooseUser(userId: string) {
  try {
    /*
    showUserProfileCard(userId)

    */
  } catch (e) {
    console.warn('[TheBestSearch] 打开用户资料卡失败:', e)
  } finally {
    close()
  }
}
function openRoom(roomId: string) { console.info('[TheBestSearch] openRoom', roomId); close() }
function openMessage(m: any) { console.info('[TheBestSearch] openMessage', m); close() }
</script>

<style scoped>
/* 自定义 Overlay 弹窗：与 ViewSourceDialog 对齐 */
.tbs-overlay {
  position: fixed;
  inset: 0;
  background: var(--bg-color-mask, rgba(0, 0, 0, 0.45));
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-index-modal, 1050);
}

.tbs-container {
  width: min(780px, 96vw);
  max-height: 86vh;
  background: var(--bg-color-third);
  color: var(--text-color);
  border-radius: 8px;
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
}

.tbs-top {
  padding: 12px 14px 8px 14px;
  background: var(--bg-color-third);
}

.tbs-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.tbs-title {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
}

.tbs-top-close {
  border: none;
  background: transparent;
  color: var(--text-color);
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  padding: 4px 6px;
}

.tbs-searchbar {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  padding: 14px 16px;
}

.tbs-input-wrap {
  position: relative;
}

.tbs-search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  opacity: .7;
}

.tbs-input {
  width: 100%;
  height: 40px;
  padding: 0 12px 0 34px;
  border: 1px solid var(--bg-color-6);
  border-radius: 8px;
  background: var(--bg-color-fourth);
  color: var(--text-color);
}

.tbs-input:hover {
  border-color: var(--bg-color-fifth);
}

.tbs-input:focus {
  outline: none;
  border-color: var(--bg-color-fifth);
  background: var(--bg-color-third);
}

.tbs-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tbs-label {
  opacity: .8;
  font-size: 12px;
}

.tbs-select,
.tbs-server-input {
  height: 32px;
  border: 1px solid var(--border-color);
  background: var(--bg-color-third);
  color: var(--text-color);
  border-radius: 8px;
  padding: 0 8px;
}



.tbs-body {
  max-height: 65vh;
  overflow: auto;
  padding: 8px 8px 12px;
}

.tbs-loading,
.tbs-hint,
.tbs-empty {
  padding: 16px;
  opacity: .85;
}

.tbs-tabs {
  display: flex;
  gap: 8px;
  padding: 6px 8px 10px;
  position: sticky;
  top: -9px;
  z-index: 2;
  background: var(--bg-color-third);
}

.tbs-tab {
  padding: 4px 10px;
  font-size: 12px;
  border: none;
  background: var(--bg-color-fourth);
  color: var(--text-color-secondary);
  border-radius: 16px;
  cursor: pointer;
}

.tbs-tab.active {
  background: var(--bg-color-fifth);
  color: var(--text-color);
}

.tbs-sections {
  display: grid;
  gap: 12px;
}

.tbs-section {
  background: var(--bg-color-third);
  border-radius: 10px;
  overflow: hidden;
}

.tbs-section-title {
  margin: 0;
  padding: 10px 12px;
  font-size: 12px;
  letter-spacing: .5px;
  opacity: .7;
  background: var(--bg-color-secondary);
}

.tbs-list {
  list-style: none;
  margin: 0;
  padding: 6px;
  display: grid;
  gap: 6px;
}

.tbs-item {
  display: grid;
  grid-template-columns: 36px 1fr;
  gap: 10px;
  align-items: center;
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
}

.tbs-item:hover {
  background: var(--bg-color-6);
}

.tbs-item.active {
  background: var(--bg-color-fifth);
}

.tbs-avatar {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  object-fit: cover;
  background: var(--bg-color);
}

.tbs-fallback {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  color: var(--text-color);
  border: none;
}

.tbs-item-main {
  min-width: 0;
}

.tbs-title {
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tbs-sub {
  font-size: 12px;
  opacity: .7;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tbs-msg {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 移动端适配，与自定义弹窗一致 */
@media (max-width: 600px) {
  .tbs-container {
    width: 96vw;
    max-height: 90vh;
    border-radius: 6px;
  }

  .tbs-top {
    padding: 10px 10px 6px;
  }

  .tbs-body {
    padding: 8px 8px 10px;
  }
}
</style>
