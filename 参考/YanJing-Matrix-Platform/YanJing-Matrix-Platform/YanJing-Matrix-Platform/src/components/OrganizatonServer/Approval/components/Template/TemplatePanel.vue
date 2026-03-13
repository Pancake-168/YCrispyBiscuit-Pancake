<template>
    <div class="template-panel">
        <!-- 左侧：类型列表 -->
        <div class="type-list">
            <div class="panel-header">业务类型</div>
            <div class="add-type-wrapper">
                <button class="add-btn" @click="showCreateTypeDialog = true">+ 新建业务类型</button>
            </div>
            <div v-if="loadingTypes" class="loading-text">加载中...</div>
            <div v-else v-for="type in types" :key="type.id" class="type-item"
                :class="{ active: selectedType?.code === type.code }" @click="selectType(type)">
                <span class="type-name">{{ type.name }}</span>
                <span class="type-code">{{ type.code }}</span>
            </div>
        </div>

        <!-- 右侧：管理详情 -->
        <div class="template-detail" v-if="selectedType">
            <div class="detail-header">
                <div class="header-info">
                    <h3>{{ selectedType.name }}配置管理</h3>
                    <span class="version-tag" v-if="currentTemplate">
                        当前版本: v{{ currentTemplate.template.version }}
                    </span>
                    <span class="version-tag new" v-else>未初始化</span>
                </div>
                <div class="header-actions">
                    <button class="btn secondary" @click="isEditing = !isEditing">
                        {{ isEditing ? '取消编辑' : (currentTemplate ? '修改配置' : '初始化配置') }}
                    </button>
                    <button v-if="isEditing" class="btn primary" @click="handleSave" :disabled="saving">
                        {{ saving ? '保存中...' : '保存新版本' }}
                    </button>
                </div>
            </div>

            <div class="detail-content">
                <!-- 编辑模式 -->
                <div v-if="isEditing" class="edit-mode">

                    <!-- 1. 基础信息配置 -->
                    <div class="config-section">
                        <h4 class="section-title">基础配置</h4>
                        <div class="form-row">
                            <label>模板名称</label>
                            <input v-model="editForm.name" type="text" placeholder="例如：通用采购申请模板" />
                        </div>
                    </div>

                    <!-- 2. 表单字段配置 -->
                    <div class="config-section">
                        <h4 class="section-title">
                            表单字段配置
                            <button class="btn-icon small" @click="addField">+ 添加字段</button>
                        </h4>
                        <div class="field-list-editor">
                            <div v-for="(field, idx) in editForm.uiConfig.fields" :key="idx" class="field-edit-row">
                                <input v-model="field.id" placeholder="字段ID (如: amount)" class="input-sm" />
                                <input v-model="field.label" placeholder="字段名称 (如: 金额)" class="input-sm" />
                                <select v-model="field.type" class="select-sm">
                                    <option value="text">文本</option>
                                    <option value="number">数字</option>
                                    <option value="date">日期</option>
                                    <option value="textarea">多行文本</option>
                                </select>
                                <label class="checkbox-label" title="是否必填">
                                    <input type="checkbox" :checked="!!field.rules?.required"
                                        @change="toggleRequired(field, ($event.target as HTMLInputElement).checked)" />
                                    必填
                                </label>
                                <button class="btn-icon danger" @click="removeField(idx)">×</button>
                            </div>
                            <div v-if="editForm.uiConfig.fields.length === 0" class="empty-tip">
                                暂无字段，请添加
                            </div>
                        </div>
                    </div>

                    <!-- 3. 审批流程配置 -->
                    <div class="config-section">
                        <h4 class="section-title">
                            审批流程节点
                            <button class="btn-icon small" @click="addNode">+ 添加节点</button>
                        </h4>
                        <div class="node-list-editor">
                            <div v-for="(node, idx) in editForm.nodes" :key="idx" class="node-edit-row">
                                <span class="step-num">{{ idx + 1 }}</span>
                                <select v-model="node.approver_type" class="select-sm">
                                    <option value="position">指定职位</option>
                                    <option value="manager">直属主管</option>
                                </select>

                                <!-- 职位选择 -->
                                <select v-if="node.approver_type === 'position'" v-model="node.approver_role"
                                    class="select-sm">
                                    <option value="" disabled>选择职位</option>
                                    <option v-for="pos in positions" :key="pos.id" :value="pos.code">
                                        {{ pos.name }}
                                    </option>
                                </select>

                                <!-- 主管层级输入 -->
                                <input v-else v-model="node.approver_role" type="number" min="1"
                                    placeholder="层级(1=直接主管)" class="input-sm" />

                                <label class="checkbox-label">
                                    <input type="checkbox" v-model="node.required" /> 必审
                                </label>

                                <button class="btn-icon danger" @click="removeNode(idx)">×</button>
                            </div>
                            <div v-if="editForm.nodes.length === 0" class="empty-tip">
                                暂无审批节点，流程将直接完成
                            </div>
                        </div>
                    </div>

                </div>

                <!-- 预览模式 -->
                <div v-else class="preview-mode">
                    <div v-if="loadingTemplate" class="loading-area">读取配置中...</div>
                    <template v-else-if="currentTemplate">
                        <!-- 复用 DynamicForm 展示表单预览 -->
                        <div class="preview-section">
                            <div class="section-label">表单预览</div>
                            <DynamicForm :fields="currentTemplate.template.ui_config?.fields || []" :model-value="{}"
                                :read-only="true" />
                        </div>

                    </template>
                    <div v-else class="empty-state">
                        该业务类型尚未配置模板
                    </div>
                </div>
            </div>
        </div>

        <!-- 初始空状态 -->
        <div class="empty-selection" v-else>
            请从左侧选择一个业务类型进行管理
        </div>

        <!-- 创建审批类型弹窗 -->
        <div v-if="showCreateTypeDialog" class="dialog-overlay yj-dialog-mask">
            <div class="dialog yj-dialog-content">
                <div class="dialog-header">
                    <h4>新建审批类型</h4>
                    <button class="close-btn" @click="cancelCreateType">×</button>
                </div>
                <div class="dialog-body">
                    <div class="form-row">
                        <label>类型名称<span class="required">*</span></label>
                        <input v-model="createTypeForm.name" type="text" placeholder="例如：采购申请" />
                    </div>
                    <div class="form-row">
                        <label>类型编码<span class="required">*</span></label>
                        <input v-model="createTypeForm.code" type="text" placeholder="例如：purchase (唯一标识)" />
                    </div>
                    <div class="form-row">
                        <label>描述说明</label>
                        <textarea v-model="createTypeForm.description" placeholder="请输入该业务类型的适用场景..."></textarea>
                    </div>
                </div>
                <div class="dialog-footer">
                    <button class="btn secondary" @click="cancelCreateType" :disabled="creatingType">取消</button>
                    <button class="btn primary" @click="submitCreateType" :disabled="creatingType">
                        {{ creatingType ? '创建中...' : '确认创建' }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, watch } from 'vue'
import { openMessageDialog } from '@/components/MessageDialog/open'
import {
    ApprovalTypes,
    ApprovalTemplateActive,
    ApprovalPositions,
    ApprovalTemplatesUpsert,
    ApprovalTypesCreate
} from '@/services/Project/Approval/data'
import type {
    ApprovalType,
    ApprovalTemplateActiveResult,
    ApprovalPosition,
    ApprovalTemplateUpsertInput,
    ApprovalTemplateNodeInput,
    ApprovalUiConfigField,
    ApprovalTypeCreateInput
} from '@/types/approval'

// 复用现有组件
import DynamicForm from '../Shared/DynamicForm.vue'

// 状态定义
const types = ref<ApprovalType[]>([])
const positions = ref<ApprovalPosition[]>([])
const loadingTypes = ref(false)
const selectedType = ref<ApprovalType | null>(null)

const currentTemplate = ref<ApprovalTemplateActiveResult | null>(null)
const loadingTemplate = ref(false)

const isEditing = ref(false)
const saving = ref(false)

// Create Type State
const showCreateTypeDialog = ref(false)
const creatingType = ref(false)
const createTypeForm = reactive<ApprovalTypeCreateInput>({
    name: '',
    code: '',
    description: ''
})

const cancelCreateType = () => {
    showCreateTypeDialog.value = false
    createTypeForm.name = ''
    createTypeForm.code = ''
    createTypeForm.description = ''
}

const submitCreateType = async () => {
    if (!createTypeForm.name || !createTypeForm.code) {
        openMessageDialog('名称和编码不能为空')
        return
    }
    
    try {
        creatingType.value = true
        loadingTypes.value = true
        
        await ApprovalTypesCreate(createTypeForm)
        
        openMessageDialog('审批类型创建成功')
        cancelCreateType() // 关闭并重置表单
        
        // 重新加载列表
        await fetchTypes() // 会触发 selectedType 重置和关联数据加载
    } catch (err: any) {
        console.error('新建审批类型失败', err)
        openMessageDialog(err.message || '操作失败')
    } finally {
        creatingType.value = false
        loadingTypes.value = false
    }
}

// 编辑表单状态
const editForm = reactive<{
    name: string;
    uiConfig: { fields: ApprovalUiConfigField[] };
    nodes: ApprovalTemplateNodeInput[];
}>({
    name: '',
    uiConfig: { fields: [] },
    nodes: []
})

// 初始化加载
const fetchTypes = async () => {
    loadingTypes.value = true
    const [typesData, positionsData] = await Promise.all([
        ApprovalTypes(),
        ApprovalPositions()
    ])
    types.value = typesData
    positions.value = positionsData
    loadingTypes.value = false
}

onMounted(async () => {
    await fetchTypes()
})

// 选择业务类型
async function selectType(type: ApprovalType) {
    selectedType.value = type
    isEditing.value = false
    currentTemplate.value = null
    loadingTemplate.value = true

    try {
        const res = await ApprovalTemplateActive(type.code)
        currentTemplate.value = res
        if (res) {
            // 如果存在，初始化编辑表单数据，以备用户通过“修改”按钮进入编辑模式
            syncToEditForm(res)
        } else {
            // 如果不存在，初始化为空
            resetEditForm(type)
        }
    } catch (e) {
        console.error(e)
    } finally {
        loadingTemplate.value = false
    }
}

function syncToEditForm(data: ApprovalTemplateActiveResult) {
    editForm.name = data.template.name
    editForm.uiConfig = {
        fields: data.template.ui_config?.fields ? [...data.template.ui_config.fields] : []
    }
    // 转换 Nodes 数据结构以适配 Input
    editForm.nodes = data.nodes.map(n => ({
        node_order: n.node_order,
        approver_type: n.approver_type as "position" | "manager", // 类型断言简化
        approver_role: n.approver_role,
        required: n.required
    }))
}

function resetEditForm(type: ApprovalType) {
    editForm.name = `${type.name}`
    editForm.uiConfig = { fields: [] }
    editForm.nodes = []
}

// 编辑逻辑
function addField() {
    editForm.uiConfig.fields.push({
        id: `field_${Date.now()}`,
        label: '新字段',
        type: 'text',
        rules: { required: false }
    })
}

function toggleRequired(field: ApprovalUiConfigField, checked: boolean) {
    if (!field.rules) {
        field.rules = {}
    }
    field.rules.required = checked
}

function removeField(index: number) {
    editForm.uiConfig.fields.splice(index, 1)
}

function addNode() {
    editForm.nodes.push({
        node_order: editForm.nodes.length + 1,
        approver_type: 'manager',
        approver_role: '1',
        required: true
    })
}

function removeNode(index: number) {
    editForm.nodes.splice(index, 1)
    // 重新排序
    editForm.nodes.forEach((n, i) => n.node_order = i + 1)
}

// 保存逻辑
async function handleSave() {
    if (!selectedType.value) return
    saving.value = true

    const input: ApprovalTemplateUpsertInput = {
       // templateId: currentTemplate.value?.template?.id,
        typeId: selectedType.value.id,
        typeCode: selectedType.value.code,
        name: editForm.name,
        version: currentTemplate.value ? parseInt(currentTemplate.value.template.version) + 1 : 1,
        isActive: true,
        uiConfig: {
            layout: 'vertical',
            fields: editForm.uiConfig.fields
        },
        nodes: editForm.nodes
    }

    try {
        const res = await ApprovalTemplatesUpsert(input)
        if (res) {
            currentTemplate.value = res
            isEditing.value = false
            openMessageDialog('模板保存成功')
        } else {
            openMessageDialog('保存失败')
        }
    } catch (e) {
        console.error(e)
        openMessageDialog('保存异常')
    } finally {
        saving.value = false
    }
}

// 监听编辑状态切换，每次进入编辑重新同步一次最新数据（如果是修改模式）
watch(isEditing, (val) => {
    if (val && currentTemplate.value) {
        syncToEditForm(currentTemplate.value)
    }
})

</script>

<style scoped>
.template-panel {
    display: flex;
    height: 100%;
    min-height: 0;
    border-radius: var(--radius-md);
    overflow: hidden;
    background: var(--glass-bg);
    color: var(--text-color);
    border: var(--glass-border);
    gap: var(--space-sm);
    padding: var(--space-sm);
}

/* 左侧列表 */
.type-list {
    width: 280px;
    background: color-mix(in srgb, var(--bg-color) 80%, var(--panel-bg));
    border: 1px solid color-mix(in srgb, var(--text-color) 12%, transparent);
    border-radius: var(--radius-md);
    display: flex;
    flex-direction: column;
    min-height: 0;
}

.panel-header {
    padding: var(--space-md);
    font-weight: 600;
    border-bottom: 1px solid color-mix(in srgb, var(--text-color) 10%, transparent);
    font-size: var(--font-base);
}

.add-type-wrapper {
    padding: 0 var(--space-md) var(--space-sm);
}

.add-btn {
    width: 100%;
    appearance: none;
    border: 1px dashed color-mix(in srgb, var(--primary-color) 60%, transparent);
    border-radius: var(--radius-sm);
    background: color-mix(in srgb, var(--primary-color) 8%, transparent);
    color: var(--primary-color);
    padding: var(--space-sm) var(--space-md);
    font-size: var(--font-sm);
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
}

.add-btn:hover {
    background: color-mix(in srgb, var(--primary-color) 14%, transparent);
    border-color: color-mix(in srgb, var(--primary-color) 80%, transparent);
    transform: translateY(-1px);
}

.add-btn:active {
    transform: translateY(0);
}

.loading-text {
    padding: var(--space-md);
    color: var(--text-muted);
    font-size: var(--font-sm);
}

.type-item {
    margin: 0 var(--space-xs) var(--space-xs);
    padding: var(--space-sm) var(--space-md);
    cursor: pointer;
    display: flex;
    flex-direction: column;
    gap: 2px;
    border: 1px solid transparent;
    border-radius: var(--radius-sm);
    transition: background-color 0.2s, border-color 0.2s;
}

.type-item:hover {
    background: var(--hover-bg);
}

.type-item.active {
    background: color-mix(in srgb, var(--active-bg) 76%, var(--panel-bg));
    border-color: color-mix(in srgb, var(--primary-color) 34%, transparent);
}

.type-name {
    font-size: var(--font-base);
    font-weight: 500;
}

.type-code {
    font-size: var(--font-sm);
    color: var(--text-muted);
}

/* 右侧详情 */
.template-detail {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
    background: var(--panel-bg);
    border: 1px solid color-mix(in srgb, var(--text-color) 10%, transparent);
    border-radius: var(--radius-md);
    overflow: hidden;
}

.detail-header {
    padding: var(--space-md) var(--space-lg);
    border-bottom: 1px solid color-mix(in srgb, var(--text-color) 10%, transparent);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--space-md);
    background: color-mix(in srgb, var(--bg-color) 78%, var(--panel-bg));
}

.header-info h3 {
    margin: 0 0 8px 0;
    font-size: var(--font-base);
}

.version-tag {
    font-size: var(--font-sm);
    background: color-mix(in srgb, var(--text-color) 10%, transparent);
    padding: 2px 10px;
    border-radius: var(--radius-sm);
}

.version-tag.new {
    background: color-mix(in srgb, var(--warning-color) 10%, transparent);
    color: var(--warning-color);
}

.detail-content {
    flex: 1;
    overflow-y: auto;
    min-height: 0;
    padding: var(--space-lg);
}

/* 预览模式 */
.preview-mode {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
}

.section-label {
    font-size: var(--font-base);
    color: var(--text-muted);
    margin-bottom: var(--space-sm);
    display: block;
}

/* 编辑模式 */
.edit-mode {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
}

.config-section {
    background: color-mix(in srgb, var(--bg-color) 76%, var(--panel-bg));
    padding: var(--space-md);
    border-radius: var(--radius-sm);
    border: 1px solid color-mix(in srgb, var(--text-color) 10%, transparent);
}

.section-title {
    margin: 0 0 var(--space-md) 0;
    font-size: var(--font-base);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.form-row {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
}

.form-row label {
    font-size: var(--font-sm);
    color: var(--text-muted);
}

.form-row input {
    padding: 10px 12px;
    border: 1px solid color-mix(in srgb, var(--text-color) 16%, transparent);
    border-radius: var(--radius-sm);
    background: var(--input-bg);
    color: var(--text-color);
}

.form-row textarea,
.select-sm {
    border: 1px solid color-mix(in srgb, var(--text-color) 16%, transparent);
    border-radius: var(--radius-sm);
    background: var(--input-bg);
    color: var(--text-color);
}

.form-row textarea {
    min-height: 88px;
    padding: 10px 12px;
    resize: vertical;
    font: inherit;
}

.form-row input:focus,
.form-row textarea:focus,
.input-sm:focus,
.select-sm:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary-color) 24%, transparent);
}

/* 列表编辑器 */
.field-list-editor,
.node-list-editor {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.field-edit-row,
.node-edit-row {
    display: flex;
    gap: var(--space-xs);
    align-items: center;
    background: var(--panel-bg);
    padding: var(--space-sm);
    border-radius: var(--radius-sm);
    border: 1px solid color-mix(in srgb, var(--text-color) 8%, transparent);
}

.input-sm,
.select-sm {
    height: 32px;
    padding: 0 10px;
    border: 1px solid color-mix(in srgb, var(--text-color) 16%, transparent);
    border-radius: var(--radius-sm);
    background: var(--input-bg);
    color: var(--text-color);
    font-size: var(--font-sm);
}

.input-sm {
    flex: 1;
}

.btn {
    padding: var(--space-sm) var(--space-md);
    border-radius: var(--radius-sm);
    cursor: pointer;
    border: 1px solid transparent;
    font-size: var(--font-sm);
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s ease, border-color 0.2s ease, transform 0.2s ease, opacity 0.2s ease;
}

.btn.primary {
    background: var(--primary-color);
    color: var(--btn-text);
    border-color: color-mix(in srgb, var(--primary-color) 40%, transparent);
}

.btn.primary:hover:not(:disabled) {
    background: var(--primary-hover);
    transform: translateY(-1px);
}

.btn.primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.btn.secondary {
    background: var(--input-bg);
    border: 1px solid color-mix(in srgb, var(--text-color) 18%, transparent);
    color: var(--text-color);
}

.btn.secondary:hover:not(:disabled) {
    background: color-mix(in srgb, var(--hover-bg) 45%, var(--input-bg));
}

.btn:disabled {
    opacity: 0.55;
    cursor: not-allowed;
}

.btn-icon {
    background: transparent;
    border: none;
    cursor: pointer;
    color: var(--primary-color);
}

.btn-icon.danger {
    color: var(--danger-color);
    font-size: 18px;
    padding: 0 8px;
}

.btn-icon.small {
    font-size: var(--font-sm);
    border: 1px dashed color-mix(in srgb, var(--primary-color) 65%, transparent);
    border-radius: var(--radius-sm);
    padding: 2px 10px;
}

.empty-selection,
.loading-area,
.empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--text-muted);
    font-size: var(--font-base);
    border: 1px dashed color-mix(in srgb, var(--text-color) 22%, transparent);
    border-radius: var(--radius-md);
    background: color-mix(in srgb, var(--bg-color) 70%, var(--panel-bg));
}

.empty-selection{
    margin-left: 0;
}


.empty-tip {
    text-align: center;
    color: var(--text-muted);
    font-size: var(--font-sm);
    padding: var(--space-sm);
    border: 1px dashed color-mix(in srgb, var(--text-color) 20%, transparent);
    border-radius: var(--radius-sm);
}

.required {
    color: var(--danger-color);
    margin-left: 2px;
}

.dialog-overlay {
    position: fixed;
    inset: 0;
    z-index: 1100;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-lg);
    background: color-mix(in srgb, var(--bg-color) 70%, transparent);
    backdrop-filter: blur(2px);
}

.dialog {
    width: min(560px, 100%);
    background: var(--panel-bg);
    border: 1px solid color-mix(in srgb, var(--text-color) 12%, transparent);
    border-radius: var(--radius-md);
    box-shadow: var(--glass-shadow);
    overflow: hidden;
}

.dialog-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-md) var(--space-lg);
    border-bottom: 1px solid color-mix(in srgb, var(--text-color) 10%, transparent);
    background: color-mix(in srgb, var(--bg-color) 78%, var(--panel-bg));
}

.dialog-header h4 {
    margin: 0;
    font-size: var(--font-md);
}

.close-btn {
    width: 30px;
    height: 30px;
    border: 1px solid color-mix(in srgb, var(--text-color) 16%, transparent);
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text-muted);
    font-size: var(--font-lg);
    line-height: 1;
    cursor: pointer;
    transition: color 0.2s ease, border-color 0.2s ease, background-color 0.2s ease;
}

.close-btn:hover {
    color: var(--text-color);
    border-color: color-mix(in srgb, var(--text-color) 24%, transparent);
    background: var(--hover-bg);
}

.dialog-body {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    padding: var(--space-lg);
}

.dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-sm);
    padding: var(--space-md) var(--space-lg);
    border-top: 1px solid color-mix(in srgb, var(--text-color) 10%, transparent);
    background: color-mix(in srgb, var(--bg-color) 82%, var(--panel-bg));
}

@media (max-width: 1080px) {
    .template-panel {
        flex-direction: column;
    }

    .type-list {
        width: 100%;
        max-height: 200px;
        overflow-y: auto;
    }

    .detail-header {
        flex-direction: column;
        align-items: flex-start;
    }

    .header-actions {
        width: 100%;
        display: flex;
        gap: var(--space-sm);
    }

    .header-actions .btn {
        flex: 1;
    }

    .detail-content {
        padding: var(--space-md);
    }

    .dialog-overlay {
        padding: var(--space-md);
    }

    .dialog-header,
    .dialog-body,
    .dialog-footer {
        padding-left: var(--space-md);
        padding-right: var(--space-md);
    }
}
</style>
