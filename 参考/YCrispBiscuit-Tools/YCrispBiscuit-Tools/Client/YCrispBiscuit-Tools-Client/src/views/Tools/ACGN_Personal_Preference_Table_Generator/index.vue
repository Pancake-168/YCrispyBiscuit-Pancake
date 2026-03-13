<template>
  <n-message-provider> <!-- Naive UI 消息提示全局包裹 -->
    <div class="preference-table-root"> <!-- 页面根容器 -->
      <!-- 动态背景装饰图（左右两侧） -->
      <img v-if="bgLeft" class="bg-decor bg-decor-left" :src="bgLeft" alt="bg-left" />
      <img v-if="bgRight" class="bg-decor bg-decor-right" :src="bgRight" alt="bg-right" />
      <!-- 顶部右上角操作栏 -->
      <div class="fixed-header-bar"> <!-- 固定在右上角的操作栏 -->
        <n-button quaternary class="header-btn" @click="goBack">返回工具页</n-button> <!-- 返回按钮 -->
      </div>
      <!-- 主内容区垂直水平居中 -->
      <div class="main-content"> <!-- 主内容区，居中 -->
        <div class="main-card"> <!-- 卡片容器 -->
          <h2 class="main-title">ACGN个人喜好表生成器</h2> <!-- 标题 -->
          <div class="selector-bar"> <!-- 表类型选择和切换按钮 -->
            <n-select v-model:value="selectedTable" :options="tableOptions" placeholder="请选择喜好表类型"
              style="width: 220px" />
            <n-button quaternary style="margin-left: 16px;" @click="isTableView = !isTableView">
              {{ isTableView ? '切换为数据源' : '切换为表格' }} <!-- 切换按钮文本 -->
            </n-button>
          </div>

          <!-- 新增：导出用的表格标题和表格整体包裹，便于一起导出 -->
          <div v-if="isTableView" class="export-area">
            <div class="export-title">
              {{allTables.find(t => t.tableId === selectedTable)?.name || ''}}
            </div>
            <div class="table-container"> <!-- 表格模式 -->
              <n-spin :show="loading"> <!-- 加载动画 -->
                <n-grid :cols="5" x-gap="18" y-gap="18" responsive="screen"> <!-- 5列网格布局 -->
                  <n-grid-item v-for="(cell, idx) in gridData" :key="cell.type"> <!-- 遍历每个格子 -->
                    <n-card class="character-card" hoverable @click="openDialog(idx)"> <!-- 角色卡片 -->
                      <div class="cell-type">{{ cell.type }}</div> <!-- 格子类型 -->
                      <img v-if="cell.character" :src="cell.character.image" class="character-img"
                        crossorigin="anonymous" /> <!-- 已选角色头像 -->
                      <div v-else class="character-placeholder">点击选择</div> <!-- 未选角色占位 -->
                    </n-card>
                  </n-grid-item>
                </n-grid>
              </n-spin>
            </div>
            <!-- 表底部说明区域，导出时会一同包含 -->
            <div class="table-readme">
              <div><b>项目名称：</b>ACGN个人喜好表生成器</div>
              <div><b>制表人：</b>依酥饼</div>
              <div><b>开源地址：</b>https://github.com/YCrispBiscuit/YCrispBiscuit-Tools</div>
            </div>
          </div>



          <!-- 按钮移到 .export-area 外部，保证功能和导出都正常 -->
          <div v-if="isTableView" class="save-bar">
            <n-button type="primary" @click="saveAsPng">保存PNG到本地</n-button>
          </div>
          <div v-else class="datasource-list-container"> <!-- 数据源模式 -->
            <n-input v-model:value="searchText" placeholder="搜索名称或ID" clearable
              style="margin-bottom: 16px; width: 320px;" /> <!-- 搜索框 -->
            <n-scrollbar> <!-- 滚动区域 -->
              <n-list bordered> <!-- 列表 -->
                <n-list-item v-for="item in filteredDataSourceList" :key="item.id"> <!-- 遍历数据源 -->
                  <div class="ds-item"> <!-- 单项容器 -->
                    <img :src="item.image" class="ds-avatar" crossorigin="anonymous" /> <!-- 头像 -->
                    <div class="ds-info"> <!-- 信息区 -->
                      <div class="ds-name">{{ item.name }}</div> <!-- 名称 -->
                      <div class="ds-id">ID: {{ item.id }}</div> <!-- ID -->
                    </div>
                  </div>
                </n-list-item>
              </n-list>
            </n-scrollbar>
            <button class="invisible-trigger" @click="updateDataSource" aria-label="update-ds"></button> <!-- 隐形触发按钮 -->
          </div>
        </div>
      </div>
      <!-- 选择角色弹窗 -->
      <n-modal v-model:show="dialogVisible" preset="dialog" title="选择角色" :mask-closable="true">
        <div v-if="dialogIdx !== null"> <!-- 弹窗内容 -->
          <div class="cell-type">{{ gridData[dialogIdx].type }}</div>
          <n-select v-model:value="selectedCharacterId" :options="characterOptions" placeholder="请选择角色" filterable
            style="width: 240px; margin: 16px 0;" />
          <div v-if="selectedCharacter">
            <img :src="selectedCharacter.image" class="dialog-img" crossorigin="anonymous" />
          </div>
        </div>
        <template #action>
          <n-button @click="dialogVisible = false">取消</n-button>
          <n-button type="primary" @click="confirmSelect">确定</n-button>
        </template>
      </n-modal>
    </div>
  </n-message-provider>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue' // Vue3 响应式API
import { useRouter } from 'vue-router' // 路由
import { NButton, NSelect, NGrid, NGridItem, NCard, NModal, NSpin, useMessage, NMessageProvider, NScrollbar, NList, NListItem, NInput } from 'naive-ui' // Naive UI 组件
import { fetchAllPreferenceTables, fetchPreferenceTableItems, fetchDataSourceByGeneratorId, type PreferenceTable, type PreferenceTableItem } from './Data/data'

const router = useRouter()
const message = useMessage()

// 所有表类型
const tableOptions = ref<{ label: string, value: number }[]>([])
const selectedTable = ref<number | null>(null)

// 动态背景图（可根据表类型扩展）
const bgMap: Record<number, { left: string, right: string }> = {
  1: {
    left: '/Tools/ACGN_Personal_Preference_Table_Generator/心海.png',
    right: '/Tools/ACGN_Personal_Preference_Table_Generator/芙宁娜.png',
  },
  2: {
    left: '/Tools/ACGN_Personal_Preference_Table_Generator/星期日.png',
    right: '/Tools/ACGN_Personal_Preference_Table_Generator/黄泉.png',
  },
  3: {
    left: '/Tools/ACGN_Personal_Preference_Table_Generator/薇薇安.png',
    right: '/Tools/ACGN_Personal_Preference_Table_Generator/浮波柚叶.png',
  },
  4: {
    left: '/Tools/ACGN_Personal_Preference_Table_Generator/长离.png',
    right: '/Tools/ACGN_Personal_Preference_Table_Generator/坎特蕾拉.png',
  }
  // 可扩展其他表类型
}
const bgLeft = computed(() => selectedTable.value && bgMap[selectedTable.value]?.left || '')
const bgRight = computed(() => selectedTable.value && bgMap[selectedTable.value]?.right || '')

// 角色数据源
const allCharacters = ref<PreferenceTableItem[]>([])
const characterOptions = computed(() =>
  allCharacters.value.map(c => ({ label: c.name, value: c.id, image: c.image }))
)

// 喜好表格数据（类型+角色）
interface SimpleCell {
  type: string
  character?: PreferenceTableItem
}
const gridData = ref<SimpleCell[]>([])
const loading = ref(false)

// 获取所有表类型
const allTables = ref<PreferenceTable[]>([])
async function loadTableList() {
  const tables = await fetchAllPreferenceTables()
  tableOptions.value = tables.map(t => ({ label: t.name, value: t.tableId }))
  allTables.value = tables
  if (tables.length > 0) selectedTable.value = tables[0].tableId
}

function parseTypesFromMainContent(mainContent: string | null | undefined): string[] {
  if (!mainContent) return []
  try {
    const arr = JSON.parse(mainContent)
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

// 获取指定表的数据源
async function loadTableData() {
  if (!selectedTable.value) return
  loading.value = true
  // 先解析类型，保证类型格子能显示
  const table = allTables.value.find(t => t.tableId === selectedTable.value)
  const types = parseTypesFromMainContent(table?.mainContent)
  console.log('当前表 mainContent:', table?.mainContent, '解析后 types:', types)
  gridData.value = types.length > 0 ? types.map(type => ({ type })) : []
  try {
    allCharacters.value = await fetchPreferenceTableItems(selectedTable.value)
  } catch (e) {
    message.error('加载数据源失败')
    console.error('loadTableData error:', e, JSON.stringify(e))
  } finally {
    loading.value = false
  }
}

// 手动刷新当前表数据源并触发后端爬取
async function updateDataSource() {
  if (!selectedTable.value) return
  loading.value = true
  try {
    // 先触发后端爬取
    const res = await fetchDataSourceByGeneratorId(selectedTable.value)
    if (res.success) {
      message.success(res.message || '已触发后端爬取并刷新数据源')
    } else {
      message.error(res.message || '后端爬取失败')
    }
    // 再刷新前端数据源
    allCharacters.value = await fetchPreferenceTableItems(selectedTable.value)
  } catch (e) {
    message.error('刷新数据源失败')
    console.error('updateDataSource error:', e)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await loadTableList()
  // 不再主动调用 loadTableData，避免重复和空数据
})
watch(selectedTable, loadTableData)

// 弹窗交互
const dialogVisible = ref(false)
const dialogIdx = ref<number | null>(null)
const selectedCharacterId = ref<string | number | null>(null)
const selectedCharacter = computed(() =>
  allCharacters.value.find(c => c.id === selectedCharacterId.value)
)
function openDialog(idx: number) {
  dialogIdx.value = idx
  selectedCharacterId.value = gridData.value[idx].character?.id ?? null
  dialogVisible.value = true
}
function confirmSelect() {
  if (dialogIdx.value !== null) {
    const char = allCharacters.value.find(c => c.id === selectedCharacterId.value)
    gridData.value[dialogIdx.value].character = char
    dialogVisible.value = false
  }
}

// 等待所有图片加载完毕
async function waitAllImagesLoaded(container: HTMLElement) {
  const imgs = Array.from(container.querySelectorAll('img'));
  await Promise.all(imgs.map(img => {
    if ((img as HTMLImageElement).complete) return Promise.resolve();
    return new Promise(res => {
      img.onload = img.onerror = res;
    });
  }));
}

// 保存PNG（导出包含标题和表格的整体区域，并增加留白）
async function saveAsPng() {
  try {
    // 1. 导出合成表格PNG（包含标题）
    const el = document.querySelector('.export-area') as HTMLElement
    if (!el) return
    await waitAllImagesLoaded(el)
    const html2canvas = (await import('html2canvas')).default
    const canvas = await html2canvas(el, { useCORS: true, backgroundColor: null })
    // 2. 增加边缘留白
    const padding = 32 // px
    const paddedCanvas = document.createElement('canvas')
    paddedCanvas.width = canvas.width + padding * 2
    paddedCanvas.height = canvas.height + padding * 2
    const ctx = paddedCanvas.getContext('2d')!
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, paddedCanvas.width, paddedCanvas.height)
    ctx.drawImage(canvas, padding, padding)
    // 3. 下载
    const link = document.createElement('a')
    link.download = 'preference-table.png'
    link.href = paddedCanvas.toDataURL('image/png')
    link.click()
    message.success('已保存PNG到本地')
  } catch (e) {
    message.error('保存失败')
  }
}

const isTableView = ref(true)

// 数据源搜索
const searchText = ref('')
const filteredDataSourceList = computed(() => {
  if (!searchText.value) return allCharacters.value
  const kw = searchText.value.trim().toLowerCase()
  return allCharacters.value.filter(item =>
    item.name.toLowerCase().includes(kw) || String(item.id).toLowerCase().includes(kw)
  )
})

function goBack() {
  router.push('/Tools')
}



</script>

<style scoped>
.preference-table-root {
  min-height: 100vh;
  /* 页面最小高度 */
  background: var(--n-color-body, #f8f9fa);
  position: relative;
  overflow: hidden;
}

.bg-decor {
  position: fixed;
  top: 50%;
  width: 480px;
  height: auto;

  opacity: 0.28;
  pointer-events: none;
  user-select: none;
  z-index: 10;
  transform: translateY(-50%);
}

.bg-decor-left {
  left: 0;
}

.bg-decor-right {
  right: 0;
}

.fixed-header-bar {
  position: fixed;
  top: 0;
  right: 32px;
  display: flex;
  gap: 12px;
  z-index: 100;
  background: transparent;
  box-shadow: none;
  height: 48px;
  align-items: center;
}

.main-content {
  z-index: 2;
  min-height: 100vh;
  /* 恢复为100vh，保证主内容始终垂直居中 */
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 0;
}

.main-card {
  max-width: 700px;
  width: 100%;
  background: var(--n-color-card, #fff);
  border-radius: 22px;
  box-shadow: 0 6px 32px 0 rgba(0, 0, 0, 0.10);
  padding: 48px 32px 32px 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.main-title {
  font-size: 1.6rem;
  font-weight: bold;
  margin-bottom: 24px;
  text-align: center;
  color: #222 !important;
  /* 固定深色，不跟随主题 */
}

/* 新增：导出用的表格标题样式 */
.export-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 38px;
  text-align: center;
}

/* 新增：导出整体区域样式，增加留白 */
.export-area {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: transparent;
  padding: 24px 0 24px 0;
  /* 上下留白，左右可根据需要调整 */
}

.selector-bar {
  width: 100%;
  display: flex;
  justify-content: center;
  margin-bottom: 32px;
}

.table-container {
  width: 100%;
  margin: 0 auto;
  background: transparent;
  padding: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.character-card {
  border-radius: 16px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.2s, transform 0.2s;
  cursor: pointer;
  min-height: 140px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--n-color-card, #fff);
}

.character-card:hover {
  box-shadow: 0 6px 24px 0 rgba(0, 0, 0, 0.13);
  transform: translateY(-2px) scale(1.03);
}

.cell-type {
  font-size: 16px;
  font-weight: 700;
  text-align: center;
  margin-bottom: 10px;
  color: var(--n-text-color, #222);
}

.character-img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 12px;
  box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.10);
  background: #f8f8f8;
}

.character-placeholder {
  width: 80px;
  height: 80px;
  background: #f0f0f0;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #aaa;
  font-size: 15px;
  font-weight: 500;
  letter-spacing: 1px;
}

.save-bar {
  width: 100%;
  margin: 32px 0 0 0;
  display: flex;
  justify-content: flex-end;
}

.dialog-img {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 14px;
  margin: 0 auto 8px auto;
  display: block;
  box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.10);
}

.datasource-list-container {
  width: 100%;
  margin: 0 auto;
  background: transparent;
  padding: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.ds-item {
  display: flex;
  align-items: center;
  padding: 48px 0 48px 48px;
  /* 上右下左，左与上下相同 */
}

.ds-avatar {
  width: 100px;
  height: 100px;
  border-radius: 10px;
  object-fit: cover;
  margin-right: 16px;
  /* 固定间距 */
  background: #f0f0f0;
  box-shadow: 0 1px 4px 0 rgba(0, 0, 0, 0.08);
}

.ds-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.ds-name {
  font-size: 22px;
  font-weight: 600;
  color: #222;
}

.ds-id {
  font-size: 16px;
  color: #888;
  margin-top: 6px;
}

.invisible-trigger {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: #fff;
  outline: none;
  box-shadow: none;
  opacity: 0;
  cursor: pointer;
  padding: 0;
  margin: 0 auto;
  display: block;
}

.table-readme {
  width: 100%;
  margin: 12px 0 0 0;
  padding: 18px 24px 12px 24px;
  background: var(--n-color-card, #fff);
  /* 与表格背景色保持一致 */
  border-radius: 12px;
  font-size: 15px;
  color: #444;
  box-sizing: border-box;
  line-height: 1.8;
}

.table-readme-tip {
  color: #b00;
  font-size: 13px;
  margin-top: 8px;
}

@media (max-width: 900px) {
  .main-card {
    max-width: 98vw;
    padding: 48px 2vw 16px 2vw;
  }

  .fixed-header-bar {
    right: 10px;
    top: 0;
  }
}

@media (max-width: 600px) {
  .main-card {
    max-width: 100vw;
    padding: 8px 0 8px 0;
    border-radius: 0;
    box-shadow: none;
  }

  .character-img,
  .character-placeholder {
    width: 60px;
    height: 60px;
  }

  .dialog-img {
    width: 70px;
    height: 70px;
  }

  .cell-type {
    font-size: 14px;
  }
}
</style>