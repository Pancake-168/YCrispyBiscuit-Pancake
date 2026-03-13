<template>
    <div class="OperationPanel">
        <div class="PanelHeader">
            <h5>组织</h5>
        </div>

        <div class="CategoryTabs">
            <div v-for="category in categories" :key="category.key" class="CategoryTab"
                :class="{ 'is-active': category.key === activeCategory }" @click="activeCategory = category.key">
                {{ category.name }}
            </div>
        </div>

        <div class="CategoryBody">
            <div class="CategoryTitleRow">
                <h4>{{ currentCategory?.name }}</h4>
                <!--span>{{ currentCategory?.items.length || 0 }} 项业务</span-->
            </div>

            <div class="BusinessGrid">
                <div v-for="item in currentCategory?.items || []" :key="item.key" class="BusinessCard"
                    @click="handleSelect(item)">
                    <div class="BusinessIconWrap">
                        <img :src="item.icon" :alt="item.name" class="BusinessIcon" />
                    </div>
                    <div class="BusinessText">
                        <strong>{{ item.name }}</strong>
                        <p>{{ item.status === 'connected' ? item.desc : '待开发' }}</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import approvalIcon from '@/assets/Project/components/Organization/审批.svg'
import comingSoonIcon from '@/assets/Project/components/Organization/待开发.svg'

type BusinessStatus = 'connected' | 'planning'

type BusinessItem = {
    key: string
    name: string
    desc: string
    status: BusinessStatus
    icon: string
}

type BusinessCategory = {
    key: string
    name: string
    items: BusinessItem[]
}

const emit = defineEmits<{
    select: [payload: { categoryKey: string; itemKey: string; status: BusinessStatus }]
}>()

const categories = ref<BusinessCategory[]>([
    {
        key: 'regular',
        name: '常规',
        items: [
            { key: 'approval-workflow', name: '审批', desc: '发起、待办与节点流转。', status: 'connected', icon: approvalIcon },
            { key: 'notice-center', name: '通知公告', desc: '组织公告发布与确认。', status: 'planning', icon: comingSoonIcon },
            { key: 'attendance-signin', name: '打卡签到', desc: '日常签到签退与统计。', status: 'planning', icon: comingSoonIcon },
            { key: 'schedule', name: '日程排班', desc: '团队排班与工作日程。', status: 'planning', icon: comingSoonIcon },
        ],
    },
    {
        key: 'hr',
        name: '人事',
        items: [
            { key: 'onboarding', name: '入职办理', desc: '入职流程与账号开通。', status: 'planning', icon: comingSoonIcon },
            { key: 'offboarding', name: '离职办理', desc: '离职流程与交接处理。', status: 'planning', icon: comingSoonIcon },
            { key: 'transfer', name: '调岗调薪', desc: '岗位与薪酬变更。', status: 'planning', icon: comingSoonIcon },
            { key: 'leave', name: '假勤管理', desc: '请假、补卡、出勤核验。', status: 'planning', icon: comingSoonIcon },
        ],
    },
    {
        key: 'finance',
        name: '财务',
        items: [
            { key: 'reimbursement', name: '费用报销', desc: '差旅与日常报销。', status: 'planning', icon: comingSoonIcon },
            { key: 'payment', name: '付款申请', desc: '供应商与内部付款。', status: 'planning', icon: comingSoonIcon },
            { key: 'budget', name: '预算管理', desc: '预算编制与调整。', status: 'planning', icon: comingSoonIcon },
            { key: 'invoice', name: '发票管理', desc: '发票验真与归档。', status: 'planning', icon: comingSoonIcon },
        ],
    },
    {
        key: 'admin',
        name: '行政',
        items: [
            { key: 'asset', name: '资产管理', desc: '设备采购、借用、归还。', status: 'planning', icon: comingSoonIcon },
            { key: 'seal', name: '印章管理', desc: '印章申请与使用记录。', status: 'planning', icon: comingSoonIcon },
            { key: 'vehicle', name: '用车申请', desc: '车辆调度与审批。', status: 'planning', icon: comingSoonIcon },
            { key: 'meeting', name: '会议室管理', desc: '会议室预约与排期。', status: 'planning', icon: comingSoonIcon },
        ],
    },
    {
        key: 'sales',
        name: '销售',
        items: [
            { key: 'customer', name: '客户管理', desc: '客户线索与档案维护。', status: 'planning', icon: comingSoonIcon },
            { key: 'follow-up', name: '跟进记录', desc: '销售跟进过程沉淀。', status: 'planning', icon: comingSoonIcon },
            { key: 'contract', name: '合同管理', desc: '合同起草、审批、归档。', status: 'planning', icon: comingSoonIcon },
            { key: 'performance', name: '业绩看板', desc: '销售目标与达成分析。', status: 'planning', icon: comingSoonIcon },
        ],
    },
])

const activeCategory = ref(categories.value[0]?.key || 'regular')

const currentCategory = computed(() => categories.value.find((item) => item.key === activeCategory.value) || categories.value[0])

function handleSelect(item: BusinessItem) {
    const category = currentCategory.value
    if (!category) return

    emit('select', {
        categoryKey: category.key,
        itemKey: item.key,
        status: item.status,
    })
}
</script>

<style scoped>
.OperationPanel {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    min-height: 0;
    padding: var(--space-sm);
    gap: var(--space-sm);
}

.PanelHeader {
    padding: var(--space-sm);
    border-radius: var(--radius-md);
    background: var(--glass-bg);
    border: var(--glass-border);
}

.PanelHeader h3 {
    margin: 0;
    font-size: var(--font-md);
    color: var(--text-color);
}

.PanelHeader p {
    margin: var(--space-xs) 0 0;
    font-size: var(--font-sm);
    color: var(--text-muted);
}

.CategoryTabs {
    display: flex;
    gap: var(--space-xs);
    overflow-x: auto;
    padding-bottom: var(--space-xs);
}

.CategoryTab {
    border: var(--glass-border);
    background: var(--glass-bg);
    color: var(--text-color);
    border-radius: var(--radius-sm);
    padding: var(--space-xs) var(--space-sm);
    display: inline-flex;
    align-items: center;
    gap: var(--space-xs);
    cursor: pointer;
    white-space: nowrap;
    transition: background-color 0.2s ease, transform 0.2s ease;
    font-size:var(--font-sm)
}

.CategoryTab small {
    font-size: var(--font-xs);
    color: var(--text-muted);
}

.CategoryTab:hover {
    background: var(--hover-bg);
}

.CategoryTab.is-active {
    background: var(--active-bg);
}

.CategoryBody {
    flex: 1;
    min-height: 0;
    overflow: auto;
    border-radius: var(--radius-md);
    border: var(--glass-border);
    background: var(--glass-bg);
    padding: var(--space-sm);
}

.CategoryTitleRow {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: var(--space-sm);
    margin-bottom: var(--space-sm);
}

.CategoryTitleRow h4 {
    margin: 0;
    font-size: var(--font-base);
    color: var(--text-color);
}

.CategoryTitleRow span {
    color: var(--text-muted);
    font-size: var(--font-xs);
}

.BusinessGrid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(92px, 1fr));
    gap: var(--space-md);
}

.BusinessCard {
    border: none;
    background: var(--glass-bg);
    color: var(--text-color);
    border-radius: var(--radius-sm);
    padding: var(--space-xs);
    text-align: center;
    cursor: pointer;
    transition: background-color 0.2s ease, box-shadow 0.2s ease;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    gap: var(--space-md);
    aspect-ratio: 1 / 1;
    overflow: hidden;
}

.BusinessCard:hover {
    background: var(--hover-bg);
}

.BusinessCard:active,
.BusinessCard:focus-visible {
    background: var(--active-bg);
    outline: none;
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
}

.BusinessIconWrap {
    width: 26px;
    height: 26px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-sm);
    margin-top: 0.5rem;
}

.BusinessIcon {
    width: 100%;
    height: 100%;
    object-fit: contain;
}

.BusinessText {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0;
    width: 100%;
}

.BusinessText strong {
    font-size: var(--font-xs);
    font-weight: 600;
    line-height: 1.2;
}

.BusinessText p {
    margin: 0;
    font-size: var(--font-xs);
    color: var(--text-muted);
    line-height: 1.2;
    min-height: calc(var(--font-xs) * 1.2);
}

@media (max-width: 768px) {
    .OperationPanel {
        padding: var(--space-xs);
        gap: var(--space-xs);
    }

    .PanelHeader {
        padding: var(--space-xs) var(--space-sm);
    }

    .PanelHeader h3 {
        font-size: var(--font-sm);
    }

    .PanelHeader p {
        font-size: var(--font-xs);
        line-height: 1.3;
    }

    .CategoryTabs {
        gap: 6px;
        padding-bottom: 2px;
    }

    .CategoryTab {
        padding: 4px 8px;
        font-size: var(--font-xs);
        border-radius: var(--radius-sm);
    }

    .CategoryTab small {
        display: none;
    }

    .CategoryBody {
        padding: var(--space-xs);
    }

    .CategoryTitleRow {
        margin-bottom: var(--space-xs);
    }

    .CategoryTitleRow h4 {
        font-size: var(--font-sm);
    }

    .BusinessGrid {
        grid-template-columns: repeat(auto-fill, minmax(78px, 1fr));
        gap: 8px;
    }

    .BusinessCard {
        padding: 6px;
        gap: 6px;
    }

    .BusinessIconWrap {
        width: 22px;
        height: 22px;
        margin-top: 2px;
    }

    .BusinessText strong {
        font-size: 11px;
        line-height: 1.1;
    }

    .BusinessText p {
        font-size: 10px;
        line-height: 1.1;
        min-height: auto;
    }
}
</style>
