<template>

    <div class="talk-page">

        <div class="talk-header">
            <span v-if="applicationId && applicationId !== 'create'">当前应用: {{ appInfo?.name }}</span>
            <span v-else>创建新应用</span>
            <span class="back-link" @click="emit('show-market-page')">返回</span>
        </div>

        <div class="app-market-layout">
            <!-- 左侧：展示应用信息 -->
            <div class="left-content">
                <div class="scroll-body" v-if="applicationId && applicationId !== 'create'">
                    <div class="Tools-body">
                        <div class="main-content">
                            <div class="Docus-page">

                                <div class="app-info-card">
                                    <h1 class="Docus-page-h1">应用信息</h1>
                                    <div class="app-info-row">
                                        <div class="app-info-label">应用名称：</div>
                                        <div class="app-info-value">{{ appInfo?.name || '-' }}</div>
                                    </div>
                                    <div class="app-info-row">
                                        <div class="app-info-label">应用ID：</div>
                                        <div class="app-info-value">{{ appInfo?.application_id || '-' }}</div>
                                    </div>
                                    <div class="app-info-row">
                                        <div class="app-info-label">应用作者：</div>
                                        <div class="app-info-value">{{ appInfo?.author || '-' }}</div>
                                    </div>
                                    <div class="app-info-row">
                                        <div class="app-info-label">上架市场：</div>
                                        <div class="app-info-value">{{ appInfo?.isPublic === "true" ? "是" : "否" }}</div>
                                    </div>
                                    <!--div class="app-info-row">
                                    <div class="app-info-label">是否发布：</div>
                                    <div class="app-info-value">{{ appInfo?.isPublished === "true" ? "是" : "否" }}</div>
                                </div-->
                                    <div class="app-info-row app-info-desc">
                                        <div class="app-info-label">描述：</div>
                                        <div class="app-info-value">{{ appInfo?.description || '-' }}</div>
                                    </div>
                                    <n-button v-if="source !== 'my-apps'" @click="openDeployModal"
                                        style="min-width: 80px; width: 50px;">部署应用</n-button>

                                    <n-button v-if="hasEditPermission" @click="openAppSettingsModal"
                                        style="min-width: 80px; width: 50px;">应用设置</n-button>

                                    <div v-else style="color: var(--text-color-secondary); font-size: calc(var(--font-size-lg) * 0.9); margin-top: 12px;">
                                        * 您正在浏览智能体市场，仅可查看
                                    </div>
                                </div>

                            </div>
                        </div>
                        <div class="doc-list-wrapper" ref="docListRef">
                            <n-card v-for="item in filteredAgentList" :key="item.id" hoverable class="doc-big-card">
                                <div class="doc-card-header">
                                    <div class="doc-card-title">{{ item.name }}</div>
                                </div>
                                <div class="doc-card-desc">id: {{ item.id }}</div>
                                <div class="doc-card-desc">IM账号: {{ item.imAccount }}</div>
                                <!--div class="doc-card-desc">状态: {{ item.status }}</div-->
                                <div  v-if="source === 'my-apps'" class="doc-card-desc">是否公开: {{ item.isPublic === "true" ? "是" : "否" }}</div>
                                <div class="doc-card-footer">
                                    <n-button v-if="(item.imAccount)&&source === 'my-apps'"
                                        @click="openMarkdown((item.imAccount)!, item.application_id)">文档</n-button>
                                    <n-button v-if="(item.imAccount)"
                                        @click="goToTalkPage((item.imAccount)!, item.application_id, item.name)">对话</n-button>
                                    <n-button v-if="hasEditPermission"
                                        @click="openAgentSettingsModal(item)">智能体设置</n-button>
                                    <!--n-button
                                        v-if="(item.imAccount) && shouldShowDevelopButton(item) && hasEditPermission"
                                        @click="goToTalkPageWorkBench((item.imAccount)!, item.application_id)">开发</n-button-->
                                </div>
                            </n-card>
                            <n-card hoverable class="doc-big-card empty-card" :key="'empty-card'"
                                v-if="hasEditPermission">
                                <div class="doc-card-header">
                                    <div class="doc-card-title"> 空 </div>
                                </div>
                                <div class="doc-card-desc">暂无数据，点击新增</div>
                                <div class="doc-card-footer">
                                    <n-button @click="openNewAgentModal">新增</n-button>
                                </div>
                            </n-card>
                        </div>
                    </div>
                </div>

                <!-- 创建应用表单 -->
                <div class="scroll-body" v-else>
                    <div class="Tools-body">
                        <div class="main-content">
                            <div class="Docus-page">
                                <h1 class="Docus-page-h1">创建新应用</h1>
                                <n-form :model="createForm" ref="createFormRef" label-width="80">
                                    <n-form-item label="应用名称">
                                        <n-input v-model:value="createForm.displayName" placeholder="请输入应用名称" />
                                    </n-form-item>
                                    <!--n-form-item label="用户名">
                                        <n-input v-model:value="createForm.username" placeholder="请输入用户名" />
                                    </n-form-item-->
                                    <n-form-item>
                                        <n-button type="primary" @click="handleCreate" :loading="creating">创建</n-button>
                                    </n-form-item>
                                </n-form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 右侧：成员列表 -->
            <!--div v-if="source === 'my-apps'&&applicationId !== 'create'" class="right-content">
                <div class="member-list-section">
                    <div class="member-list-card">
                        <div class="member-list-title">应用成员列表</div>
                        <div v-if="loadingMembers" class="text-secondary">成员加载中...</div>
                        <div v-else-if="memberList.length > 0" class="member-list-container">
                            <div class="member-list">
                                <div v-for="member in memberList" :key="member.item.userId" 
                                     class="member-item" 
                                     @click="handleMemberClick(member)">
                                    <img v-if="member.item.avatarUrl" :src="member.item.avatarUrl" class="member-avatar" />
                                    <div v-else class="member-avatar member-avatar-placeholder">{{ member.item.displayName?.charAt(0)?.toUpperCase() || '?' }}</div>
                                    <div class="member-info">
                                        <div class="member-name">{{ member.item.displayName }}</div>
                                        <div class="member-status text-secondary">
                                            <span v-if="member.status === 'join'">已加入</span>
                                            <span v-else-if="member.status === 'leave'">已离开</span>
                                            <span v-else-if="member.status === 'ban'">已禁用</span>
                                            <span v-else-if="member.status === 'invite'">邀请中</span>
                                            <span v-else-if="member.status === 'knock'">请求加入</span>
                                            <span v-else-if="member.status === 'indirect'">间接成员</span>
                                            <span v-else>{{ member.status || '未知状态' }}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div v-else class="text-secondary">暂无成员</div>
                    </div>
                </div>
            </div-->
        </div>

        <!-- 应用设置弹窗 -->
        <n-modal v-model:show="showAppSettingsModal" :mask-closable="false">
            <n-card style="width: 500px" title="应用设置" :bordered="false" size="huge" role="dialog" aria-modal="true">
                <div class="modal-content-area">
                    <div class="dialog-content-appInfo">
                        <div class="settings-section">
                            <h3 class="settings-title">操作列表</h3>
                            <div class="settings-actions">
                                <div class="action-item">
                                    <span class="action-label">上架市场 : {{ appInfo?.isPublic === 'true' ? '是' : '否'
                                        }}</span>
                                    <n-button type="primary" @click="setAppPublic" class="action-button">
                                        {{ appInfo?.isPublic === 'true' ? '是' : '否' }}
                                    </n-button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <template #footer>
                    <div style="display: flex; justify-content: flex-end; gap: 12px;">
                        <n-button @click="closeAppSettingsModal">取消</n-button>
                    </div>
                </template>
            </n-card>
        </n-modal>



        <!-- Agent设置弹窗 -->
        <n-modal v-model:show="showAgentSettingsModal" :mask-closable="false">
            <n-card style="width: 500px" :title="`智能体设置 - ${currentAgent?.name || '未知'}`" :bordered="false" size="huge"
                role="dialog" aria-modal="true">
                <div class="modal-content-area">
                    <div class="dialog-content-appInfo">
                        <div class="settings-section">
                            <h3 class="settings-title">智能体信息</h3>
                            <div class="agent-info">
                                <div class="info-row">
                                    <span class="info-label">智能体 ID:</span>
                                    <span class="info-value">{{ currentAgent?.id || '-' }}</span>
                                </div>
                                <div class="info-row">
                                    <span class="info-label">智能体名称:</span>
                                    <span class="info-value">{{ currentAgent?.name || '-' }}</span>
                                </div>
                                <div class="info-row">
                                    <span class="info-label">IM账号:</span>
                                    <span class="info-value">{{ currentAgent?.imAccount || '-' }}</span>
                                </div>
                                <div class="info-row">
                                    <span class="info-label">状态:</span>
                                    <span class="info-value">{{ currentAgent?.status || '-' }}</span>
                                </div>
                            </div>
                        </div>
                        <div class="settings-section">
                            <h3 class="settings-title">操作列表</h3>
                            <div class="settings-actions">
                                <!--div class="action-item">
                                    <span class="action-label">可见状态: {{ currentAgent?.isPublic === 'true' ? '公开' : '私密'
                                        }}</span>
                                    <n-button type="primary" @click="setAgentPublic" class="action-button">
                                        {{ currentAgent?.isPublic === 'true' ? '设为私密' : '设为公开' }}
                                    </n-button>
                                </div-->
                                <!--div class="action-item">
                                    <span class="action-label">部署状态: {{ currentAgent?.status || '-' }}</span>
                                    <n-button type="primary" @click="handleDeployAgent" class="action-button">
                                        {{ currentAgent?.status === 'running' ? '撤销部署' : '部署智能体' }}
                                    </n-button>
                                </div-->
                                <div class="action-item">
                                    <span class="action-label">删除操作</span>
                                    <n-button type="error" @click="deleteAgent" class="action-button">
                                        删除智能体
                                    </n-button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <template #footer>
                    <div style="display: flex; justify-content: flex-end; gap: 12px;">
                        <n-button @click="closeAgentSettingsModal">取消</n-button>
                    </div>
                </template>
            </n-card>
        </n-modal>




        <!-- 新增Agent弹窗 -->
        <n-modal v-model:show="showNewAgentModal" :mask-closable="false">
            <n-card style="width: 500px" title="新增智能体" :bordered="false" size="huge" role="dialog" aria-modal="true">
                <div class="modal-content-area">
                    <div class="dialog-content-appInfo">
                        <div class="settings-section">
                            <h3 class="settings-title">智能体信息</h3>
                            <n-form :model="newAgentForm" ref="newAgentFormRef" label-placement="left"
                                label-width="100">
                                <!--n-form-item label="所属应用" path="field1">
                                    <n-input v-model:value="newAgentForm.field1" placeholder="请输入应用id" :disabled="true" />
                                </n-form-item-->
                                <n-form-item label="昵称" path="field2">
                                    <n-input v-model:value="newAgentForm.field2" placeholder="请输入自定义昵称" />
                                </n-form-item>
                                <n-form-item label="账号" path="field3">
                                    <n-input v-model:value="newAgentForm.field3" placeholder="请输入自定义账号" />
                                </n-form-item>
                                <!--n-form-item label="应用标识(选填)" path="field4">
                                    <n-input v-model:value="newAgentForm.field4" placeholder="请输入自定义应用 标识" />
                                </n-form-item-->
                            </n-form>
                        </div>
                    </div>
                </div>
                <template #footer>
                    <div style="display: flex; justify-content: flex-end; gap: 12px;">
                        <n-button @click="closeNewAgentModal">取消</n-button>
                        <n-button type="primary" @click="handleCreateAgent" :loading="creatingAgent">
                            提交创建
                        </n-button>
                    </div>
                </template>
            </n-card>
        </n-modal>


        <!--markdown弹窗-->
        <n-modal v-model:show="showMarkdown" :mask-closable="false" preset="card"
            style="width: 80vw; max-width: 900px; height: 80vh;" title="文档内容" :content-style="{
                overflowY: 'auto',

            }">
            <div class="modal-content-area">
                <Markdown_For_Market :imAccount="markdownImAccount" :applicationId="markdownApplicationId" />
            </div>
            <template #footer>
                <div class="modal-content-area" style="display: flex; justify-content: flex-end; gap: 12px;">
                    <n-button @click="closeMarkdown">关闭</n-button>
                </div>
            </template>
        </n-modal>



        <n-modal v-model:show="showCopyAppModal" :mask-closable="false">
            <n-card style="width: 400px" title="部署应用" :bordered="false" size="huge" role="dialog" aria-modal="true">
                <div class="modal-content-area">
                    <n-form :model="copyAppForm" label-width="80">
                        <n-form-item label="应用名称">
                            <n-input v-model:value="copyAppForm.displayName" placeholder="请输入应用名称" />
                        </n-form-item>
                        <n-form-item label="应用描述">
                            <n-input v-model:value="copyAppForm.description" placeholder="请输入应用描述" />
                        </n-form-item>
                        <n-form-item label="组织名称">
                            <n-input v-model:value="copyAppForm.organization_name" placeholder="请输入组织名称" />
                        </n-form-item>
                    </n-form>
                </div>
                <template #footer>
                    <div style="display: flex; justify-content: flex-end; gap: 12px;">
                        <n-button @click="showCopyAppModal = false">取消</n-button>
                        <n-button type="primary" :loading="copyAppLoading" @click="handleCopyApp">确认部署</n-button>
                    </div>
                </template>
            </n-card>
        </n-modal>


        <!-- 新增：部署应用弹窗 -->
        <n-modal v-model:show="showDeployModal" :mask-closable="false">
            <n-card style="width: 500px" title="部署应用" :bordered="false" size="huge" role="dialog" aria-modal="true">
                <div class="modal-content-area">
                    <n-form label-placement="left" label-width="100" style="margin-top: 24px;">
                        <n-form-item label="选择组织">
                            <n-select 
                                v-model:value="deployForm.orgId" 
                                :options="userOrgOptions" 
                                placeholder="请选择目标组织"
                                @update:value="deployForm.deptId = ''; deployForm.deptName = ''"
                            />
                        </n-form-item>
                        <n-form-item label="选择部门">
                            <div style="display: flex; gap: 8px; width: 100%;">
                                <n-input 
                                    v-model:value="deployForm.deptName" 
                                    placeholder="请选择部门" 
                                    readonly 
                                    @click="handleSelectDept"
                                    style="cursor: pointer;"
                                />
                                <n-button @click="handleSelectDept">选择</n-button>
                            </div>
                        </n-form-item>
                    </n-form>
                </div>
                <template #footer>
                    <div style="display: flex; justify-content: flex-end; gap: 12px;">
                        <n-button @click="showDeployModal = false">取消</n-button>
                        <n-button type="primary" :loading="deployLoading" @click="handleDeploy">确认部署</n-button>
                    </div>
                </template>
            </n-card>
        </n-modal>




    </div>
</template>

<script setup lang="ts">

import { useRoute } from 'vue-router';
import { watch, ref, onMounted, computed } from 'vue';
import { NCard, NButton, NForm, NFormItem, NInput, NModal, useMessage, NSelect } from 'naive-ui';
import type { ApiApplicationItem } from '@/types/market';
import { useMarketStore } from '@/stores/market';
import Markdown_For_Market from '../../RightContent/Markdown_For_Market';
import { addPrefixSuffix, removePrefixSuffix } from '@/utils/stringUtils';
import { userInfoManager } from '@/utils/userInfo'
import { findRoomByUserIds } from '@/utils/roomMatcher'
import { roomCreateServiceV2 } from '@/services/rooms/room-create.service'
import { inviteManagementServiceV2 } from '@/services/members/invite.service'
import { 搜索指定空间内的用户 } from '@/services/matrix/search'
import { MATRIX_SERVER_URL_TAIL } from '@/apiUrls'
import { selectDepartment } from '@/components/NewOrganizationAndDepartment/ListViewForSomeSelectOperations/open';
import { handleMarketApplicationDeploy } from '@/services/Project/market/market';
import { useOrganizationStore } from '@/stores/organization';
import { openConfirmDialog } from '@/components/MessageDialog/open'
const memberList = ref<any[]>([])
const loadingMembers = ref(false)


// 注入chatContext以访问MainPage的方法
// const chatContext = inject('chatContext') as any


// 获取本地存储的 userProfile.userID 作为默认用户名
let matrixUserId = '';
let defaultUserId = '';
try {
    const encoded = localStorage.getItem('matrix_login_params');
    if (encoded) {
        const loginParams = JSON.parse(atob(encoded));
        matrixUserId = loginParams.username || '';
        console.log('[Market_Information_Page] 获取到的matrix用户ID:', matrixUserId);
        defaultUserId = loginParams.username || '';
        console.log('[Market_Information_Page] 获取到的默认用户ID:', defaultUserId);
        // 你还可以获取 homeserver: loginParams.homeserver
    }
} catch (e) {
    matrixUserId = '';
}


const route = useRoute();
// const router = useRouter();
const message = useMessage();

const props = defineProps<{
    applicationId: string
    source: string
}>()
const emit = defineEmits<{
    'show-market-page': []
    'agent-talk-request': [agentID: string, applicationID: string]
    'agent-develop-request': [agentID: string, applicationID: string]
}>()

const applicationId = props.applicationId
console.log("当前的applicationId：", applicationId)
const source = props.source

const marketStore = useMarketStore();
const organizationStore = useOrganizationStore();

const agentList = ref<any[]>([]); // 新增：Agent列表
const appInfo = ref<ApiApplicationItem | null>(null);

async function getAppInfo() {
    if (applicationId === 'create') return;

    // 使用 Store 获取应用详情
    const app = await marketStore.ensureAppDetailByAppId(applicationId, defaultUserId);
    appInfo.value = app || null;
    console.log('应用信息:', appInfo.value);

    if (app && app.agentTeams) {
        agentList.value = app.agentTeams;
        console.log('使用 agentTeams 作为 agentList:', agentList.value);
    } else {
        agentList.value = [];
    }
}



const createForm = ref({
    displayName: '',
    username: defaultUserId
});
const createFormRef = ref();
const creating = ref(false);

// 无滑动动画，保留ref以防后续需要
const docListRef = ref<HTMLElement | null>(null);

// 权限控制：基于来源参数判断是否有编辑权限
const hasEditPermission = computed(() => {
    // 如果是创建新应用模式，总是有权限
    if (applicationId === 'create') {
        console.log('权限检查: 创建模式，有权限');
        return true;
    }

    // 基于来源参数判断权限
    // 'my-apps': 我的应用页面进入，有完整权限
    // 'market': 智能体市场进入，只读权限
    const hasPermission = source === 'my-apps';

    console.log('权限检查:', {
        source,
        hasPermission,
        applicationId
    });

    return hasPermission;
});

// 过滤智能体列表：如果是从智能体市场进入，只显示公开的智能体
const filteredAgentList = computed(() => {
    if (source === 'my-apps') {
        // 我的应用：显示所有智能体
        return agentList.value;
    } else {
        // 智能体市场：只显示公开的智能体
        // return agentList.value.filter(agent => agent.isPublic === 'true');
        return agentList.value;
    }
});

// 应用设置弹窗相关
const showAppSettingsModal = ref(false);
// Agent设置弹窗相关
const showAgentSettingsModal = ref(false);
// 新增Agent弹窗相关
const showNewAgentModal = ref(false);
//新增Markdown弹窗相关
const showMarkdown = ref(false);
const markdownImAccount = ref('');
const markdownApplicationId = ref('');

// 当前选中的Agent信息
const currentAgent = ref<any | null>(null);

// 新增Agent表单数据
const newAgentForm = ref({
    field1: appInfo.value?.id?.toString() || '',
    field2: '',
    field3: '',
    field4: ''
});
const newAgentFormRef = ref();
const creatingAgent = ref(false);

// 打开应用设置弹窗
function openAppSettingsModal() {

    showAppSettingsModal.value = true;
}
// 打开Agent设置弹窗
function openAgentSettingsModal(agent: any) {

    currentAgent.value = agent;
    showAgentSettingsModal.value = true;
}

// 打开新增Agent弹窗
function openNewAgentModal() {

    newAgentForm.value = {
        field1: appInfo.value?.id?.toString() || '',
        field2: '',
        field3: '',
        field4: ''
    };
    showNewAgentModal.value = true;
}

//新增Markdown弹窗
function openMarkdown(imAccount: string, applicationId: string) {
    if (!imAccount || !applicationId) {
        message.error('IM账号或应用ID不能为空');
        return;
    }

    // 使用工具函数确保有正确的前后缀
    const realId1 = addPrefixSuffix(imAccount, '@RBT#', 'Bot');

    markdownImAccount.value = realId1;
    markdownApplicationId.value = applicationId;
    showMarkdown.value = true;
}


// 关闭应用设置弹窗
function closeAppSettingsModal() {
    showAppSettingsModal.value = false;
}
// 关闭Agent设置弹窗
function closeAgentSettingsModal() {
    showAgentSettingsModal.value = false;
}

// 关闭新增Agent弹窗
function closeNewAgentModal() {
    showNewAgentModal.value = false;
    // 重置表单
    newAgentForm.value = {
        field1: '',
        field2: '',
        field3: '',
        field4: ''
    };
}

//关闭Markdown弹窗
function closeMarkdown() {
    showMarkdown.value = false;
}

// 应用设置为公共可见性
async function setAppPublic() {
    console.log('===== setAppPublic 开始执行 =====');



    if (!appInfo.value?.application_id) {
        console.error(' 应用信息不存在, appInfo.value:', appInfo.value);
        message.error('应用信息不存在');
        return;
    }

    const currentIsPublic = appInfo.value.isPublic === "true";
    const actionText = currentIsPublic ? '设为私有' : '设为公共可见';



    try {
        console.log(' 准备调用 publicApplication API...');
        console.log('传递参数: marketId =', appInfo.value.id.toString(), ', isPublic =', !currentIsPublic);

        // 调用API，无论是设为公开还是私有
        const res = await marketStore.updateAppPublicStatus(appInfo.value.id.toString(), !currentIsPublic);

        console.log(' API响应结果:');
        console.log('  - res.ok:', res.ok);
        console.log('  - res.data:', res.data);
        console.log('  - 完整响应:', res);

        if (res.ok) {
            console.log(' API调用成功');
            message.success(`${actionText}成功`);

            // 更新本地状态
            // appInfo.value.isPublic = !currentIsPublic ? "true" : "false"; // Store action already updates this if I used the store object
            console.log(' 本地状态已更新为:', appInfo.value.isPublic);
        } else {
            console.error(' API调用失败:', res.data);
            message.error(res.data?.message || `${actionText}失败，请稍后再试`);
            return; // 失败时不继续执行
        }

        console.log(' setAppPublic 执行完成');
        // 建议重新获取应用信息以确保数据同步
        // await getAppInfo(); 

    } catch (error) {
        console.error(' setAppPublic 异常:', error);
        console.error('异常详情:', {
            message: (error as Error).message || '未知错误',
            stack: (error as Error).stack || '无堆栈信息',
            name: (error as Error).name || '未知异常类型'
        });
        message.error(`${actionText}失败，请稍后再试`);
    }

    console.log('===== setAppPublic 结束 =====');
}



/*
// Agent设置为公共可见性
async function setAgentPublic() {
    console.log('===== setAgentPublic 开始执行 =====');

    if (!hasEditPermission.value) {
        message.error('您正在浏览智能体市场，无编辑权限');
        return;
    }

    if (!currentAgent.value?.id) {
        console.error(' Agent信息不存在, currentAgent.value:', currentAgent.value);
        message.error('Agent信息不存在');
        return;
    }

    const currentIsPublic = currentAgent.value.isPublic === "true";
    const actionText = currentIsPublic ? '设为私有' : '设为公共可见';



    try {
        console.log(' 准备调用 publicAgent API...');
        console.log('传递参数: agentId =', currentAgent.value.id, ', isPublic =', !currentIsPublic);

        // 调用API，无论是设为公开还是私有
        const res = await publicAgent(currentAgent.value.id, !currentIsPublic);

        console.log(' API响应结果:');
        console.log('  - res.ok:', res.ok);
        console.log('  - res.data:', res.data);
        console.log('  - 完整响应:', res);

        if (res.ok) {
            console.log(' API调用成功');
            message.success(`Agent ${actionText}成功`);

            // 更新本地状态
            currentAgent.value.isPublic = !currentIsPublic ? "true" : "false";
            console.log(' Agent本地状态已更新为:', currentAgent.value.isPublic);

            // 同时更新agentList中的对应项
            const agentIndex = agentList.value.findIndex(agent => agent.id === currentAgent.value?.id);
            if (agentIndex !== -1) {
                agentList.value[agentIndex].isPublic = !currentIsPublic ? "true" : "false";
                console.log(' agentList中的状态也已更新');
            }
        } else {
            console.error(' API调用失败:', res.data);
            message.error(res.data?.message || `Agent ${actionText}失败，请稍后再试`);
            return; // 失败时不继续执行
        }

        console.log(' setAgentPublic 执行完成');
        // 更新本地状态，建议重新调用API获取最新数据
        // await getAppInfo(); // 重新获取应用信息

    } catch (error) {
        console.error(' setAgentPublic 异常:', error);
        console.error('异常详情:', {
            message: (error as Error).message || '未知错误',
            stack: (error as Error).stack || '无堆栈信息',
            name: (error as Error).name || '未知异常类型'
        });
        message.error(`Agent ${actionText}失败，请稍后再试`);
    }

    console.log('===== setAgentPublic 结束 =====');
}


*/


// 部署/撤销部署Agent
// async function handleDeployAgent() {
//     if (!hasEditPermission.value) {
//         message.error('您正在浏览智能体市场，无编辑权限');
//         return;
//     }

//     if (!currentAgent.value?.id) {
//         message.error('Agent信息不存在');
//         return;
//     }

//     const isRunning = currentAgent.value.status === 'running';
//     const actionText = isRunning ? '撤销部署' : '部署';

//     try {
//         console.log(`开始${actionText}Agent:`, currentAgent.value.id);
//         console.log('当前Agent状态信息:', currentAgent.value.status);

//         let res;
//         if (isRunning) {
//             // 当前状态为running，执行撤销部署
//             res = await deployAgent(currentAgent.value.id, false);
//         } else {
//             // 当前状态为stopped或其他，执行部署
//             res = await deployAgent(currentAgent.value.id, true);
//         }

//         if (res.ok) {
//             console.log(`${actionText}成功:`, res.data);

//             // 更新当前Agent状态
//             currentAgent.value.status = isRunning ? 'stopped' : 'running';
//             console.log('Agent状态已更新为:', currentAgent.value.status);

//             message.success(`Agent${actionText}成功`);

//             // 同时更新agentList中对应的Agent状态
//             const agentIndex = agentList.value.findIndex(agent => agent.id === currentAgent.value?.id);
//             if (agentIndex !== -1) {
//                 agentList.value[agentIndex].status = currentAgent.value.status;
//             }
//         } else {
//             console.error(`${actionText}失败:`, res.data);
//             message.error(res.data?.message || `Agent${actionText}失败，请稍后再试`);
//         }
//     } catch (error) {
//         message.error(`Agent${actionText}失败，请稍后再试`);
//         console.error(`Agent${actionText}失败:`, error);
//     }
// }

// 删除Agent
async function deleteAgent() {


    if (!currentAgent.value?.id) {
        message.error('Agent信息不存在');
        return;
    }

    // 确认删除
    const ok = await openConfirmDialog(`确定要删除Agent "${currentAgent.value.name}" 吗？此操作不可恢复。`, {
        title: '确认删除',
        confirmText: '删除',
        cancelText: '取消',
    })
    if (!ok) return

    try {
        console.log('删除Agent:', currentAgent.value.id);
        const res = await marketStore.deleteAgentAction(currentAgent.value.id.toString(), appInfo.value?.id?.toString() || '');
        console.log('删除Agent API响应:', res);

        if (res.ok) {
            message.success('Agent删除成功');
            // 清空当前选中Agent
            currentAgent.value = null;
            // 关闭弹窗
            closeAgentSettingsModal();
            // 重新拉取Agent列表，保证和后端同步
            await getAppInfo();
        } else {
            message.error(res.data?.message || 'Agent删除失败，请稍后再试');
        }
    } catch (error) {
        message.error('Agent删除失败，请稍后再试');
        console.error('Agent删除失败:', error);
        if (error instanceof Error) {
            console.error('错误详情:', error.message, error.stack);
        }
    }
}

// 创建新Agent
async function handleCreateAgent() {
    if (!hasEditPermission.value) {
        message.error('您正在浏览智能体市场，无编辑权限');
        return;
    }

    if (!newAgentForm.value.field1 || !newAgentForm.value.field2 || !newAgentForm.value.field3) {
        message.warning('请填写完整的Agent信息');
        return;
    }

    creatingAgent.value = true;
    try {

        const author = userInfoManager.getLoginField('username');

        // 构造API参数
        // 使用工具函数构造imAccount，自动加前后缀
        const imAccount = newAgentForm.value.field3 || '';
        const agentData = {
            masket_id: appInfo.value?.id?.toString() || '',
            botNickname: newAgentForm.value.field2,
            botAccount: imAccount,
            author,
        };
        console.log('创建Agent API参数:', agentData);
        // 调用API
        const res = await marketStore.createNewAgent(agentData);
        console.log('创建Agent API响应:', res);
        if (res.ok && !res.data?.error) {
            message.success('Agent创建成功');
            await getAppInfo();
            closeNewAgentModal();
        } else {
            message.error(res.data?.error || res.data?.message || 'Agent创建失败');
        }
    } catch (error) {
        message.error('Agent创建失败，请稍后再试');
        console.error('Agent创建失败:', error);
    } finally {
        creatingAgent.value = false;
    }
}

// 创建应用提交
async function handleCreate() {
    if (!createForm.value.displayName || !createForm.value.username) {
        message.warning('请填写完整的应用信息');
        return;
    }

    creating.value = true;
    try {
        const { ok, data } = await marketStore.createNewApplication({
            displayName: createForm.value.displayName,
            author: createForm.value.username
        });
        console.log('请求参数', {
            displayName: createForm.value.displayName,
            author: createForm.value.username
        });
        console.log('响应内容', data);
        if (ok && data && data.applicationId) {
            message.success('应用创建成功');

            return; // 成功后直接 return，避免后续异常
        } else {
            message.error(data.message || '创建应用失败');
        }
    } catch (error: any) {
        // 优先显示 error.message
        message.error(error?.message || '网络错误，请稍后再试');
        console.error('创建应用异常:', error);
    } finally {
        creating.value = false;
    }
}


// 新增：部署应用相关逻辑
const showDeployModal = ref(false);
const deployForm = ref({
    orgId: '',
    deptId: '',
    deptName: ''
});
const deployLoading = ref(false);

const userOrgOptions = computed(() => {
    return organizationStore.organizationList.map(app => ({
        label: app.application_name,
        value: app.application_id
    }));
});

async function openDeployModal() {
    showDeployModal.value = true;
    // Reset form
    deployForm.value = {
        orgId: '',
        deptId: '',
        deptName: ''
    };
}

async function handleSelectDept() {
    if (!deployForm.value.orgId) {
        message.warning('请先选择所属组织');
        return;
    }
    
    try {
        const result = await selectDepartment({
            appId: deployForm.value.orgId,
            title: '选择部署部门'
        });
        
        if (result) {
            deployForm.value.deptId = result.id;
            deployForm.value.deptName = result.name;
        }
    } catch (e) {
        console.error('选择部门失败:', e);
    }
}

async function handleDeploy() {
    if (!deployForm.value.orgId || !deployForm.value.deptId) {
        message.warning('请选择组织和部门');
        return;
    }
    
    if (!appInfo.value?.id) {
        message.error('应用信息缺失');
        return;
    }

    deployLoading.value = true;
    try {
        console.log('部署应用参数:', {
            account: defaultUserId,
            app_marketid: appInfo.value.id.toString(),
            organization_appid: deployForm.value.orgId,
            organization_department_id: deployForm.value.deptId
        });
        const res = await handleMarketApplicationDeploy({
            account: defaultUserId,
            app_marketid: appInfo.value.id.toString(),
            organization_appid: deployForm.value.orgId,
            organization_department_id: deployForm.value.deptId
        });
        console.log('部署应用响应:', res);

        if (res.ok) {
            message.success('部署成功');
            showDeployModal.value = false;
        } else {
            message.error(res.data?.message || '部署失败');
        }
    } catch (e) {
        console.error('部署异常:', e);
        message.error('部署异常');
    } finally {
        deployLoading.value = false;
    }
}


async function handleeditorAgent(appid: string, agentAccount: string, userAccount: string) {

    if (!appid || !agentAccount || !userAccount) {
        message.warning('应用ID、智能体账号和用户账号不能为空');
        return;
    }

    try {
        const res = await marketStore.editorAgentAction({ appid, agentAccount, userAccount });
        if (res.ok) {
        } else {
            message.error(res.data?.message || '“开发”后端服务启动失败，请稍后再试');
        }
    } catch (error) {
        console.error('编辑智能体异常:', error);
    }
}



const showCopyAppModal = ref(false)
const copyAppForm = ref({
    displayName: '',
    description: '',
    organization_name: ''
})
const copyAppLoading = ref(false)

async function handleCopyApp() {
    if (!copyAppForm.value.displayName) {
        message.error('请输入应用名称')
        return
    }
    copyAppLoading.value = true
    try {
        const res = await marketStore.copyApp({
            displayName: copyAppForm.value.displayName,
            description: copyAppForm.value.description,
            copy_appid: appInfo.value?.application_id || '',
            organization_name: copyAppForm.value.organization_name
        }, defaultUserId)


        if (res && res.ok) {
            message.success('复制成功')
            showCopyAppModal.value = false
            copyAppForm.value.displayName = ''
            copyAppForm.value.description = ''
        } else {
            message.error('复制失败')
        }
    } catch (e) {
        message.error('网络错误')
    } finally {
        copyAppLoading.value = false
    }
}

async function loadMemberList() {
    if (source !== 'my-apps' || !applicationId) return
    loadingMembers.value = true
    try {
        // 构造matrix空间id
        const spaceId = addPrefixSuffix(applicationId, '!', MATRIX_SERVER_URL_TAIL)
        // 移除limit限制，获取所有成员
        const members = await 搜索指定空间内的用户(spaceId, {
            query: ''  // 空查询表示获取所有成员
        })
        memberList.value = members
        console.log('加载成员列表成功:', memberList.value);
    } catch (e) {
        memberList.value = []
    } finally {
        loadingMembers.value = false
    }
}

// 处理成员点击事件
// function handleMemberClick(member: any) {
//     console.log('点击成员:', member)
//     // 这里可以添加具体的点击处理逻辑
//     // 比如显示成员详情、发起私聊等
// }



// 页面挂载时自动测试一次
onMounted(() => {
    getAppInfo();


    if (source === 'my-apps' && applicationId && applicationId !== 'create') {
        loadMemberList()
    }
});

watch(
    () => route.params.applicationId,
    (newVal, oldVal) => {
        if (newVal !== oldVal) {
            window.location.reload(); // 强制刷新页面
        }

        if (source === 'my-apps' && newVal && newVal !== 'create') {
            loadMemberList()
        }


    }
);





// function goBackMarket() {
//     if (window.history.length > 1) {
//         router.back();
//     } else {
//         router.push({ name: 'Application_Market' });
//     }
// }

// 跳转到聊天页面
async function goToTalkPage(agentID: string, applicationID: string, agentName?: string) {
    if (!agentID) return;

    // 使用工具函数格式化Agent用户名
    let finalagentID = removePrefixSuffix(agentID, '@RBT#', 'Bot');
    let finalapplicationID = removePrefixSuffix(applicationID, '@RBT#', 'Bot');
    console.log('对话按钮点击:', { finalagentID, finalapplicationID, agentName });

    try {
        // 1. 获取当前用户ID
        let currentUserId = userInfoManager.getLoginField("username");
        if (!currentUserId) {
            console.error('无法获取当前用户ID');
            message.error('获取用户信息失败');
            return;
        }


        currentUserId = addPrefixSuffix(currentUserId, "@", MATRIX_SERVER_URL_TAIL);
        finalagentID = addPrefixSuffix(finalagentID, '@', MATRIX_SERVER_URL_TAIL);
        finalapplicationID = addPrefixSuffix(finalapplicationID, "!", MATRIX_SERVER_URL_TAIL);

        // 2. 搜索是否已存在与该智能体的房间
        const targetUserIds = [currentUserId, finalagentID];
        console.log('搜索房间参数:', targetUserIds);

        // 导入房间匹配器

        const existingRoomId = await findRoomByUserIds(targetUserIds);

        if (existingRoomId && existingRoomId !== "未匹配到!") {
            console.log('找到已存在的房间:', existingRoomId);
            // 通过emit事件通知父组件
            emit('agent-talk-request', finalagentID, finalapplicationID);
            return;
        }

        console.log('未找到已存在的房间，开始创建新房间...');

        // 3. 如果没有找到房间，自动创建一个新房间

        // 构建房间创建参数
        const roomName = agentName || `智能体-${removePrefixSuffix(agentID, '@RBT#', 'Bot')}`;
        const roomOptions = {
            name: roomName, // 使用智能体名称作为房间名称
            topic: `与智能体 ${roomName} 的私人对话`, // 房间主题也使用智能体名称
            visibility: 'private' as const, // 私有房间
            encryption: false, // 不启用端到端加密
            invites: [], // 先创建房间，稍后再邀请智能体（如果智能体账号存在的话）
            historyVisibility: 'invited' as const, // 历史消息对被邀请者可见
            joinRule: 'invite' as const, // 仅邀请加入
            guestAccess: 'forbidden' as const, // 禁止访客
            belongSpace: finalapplicationID // 使用原始的应用ID作为空间ID
        };

        console.log('创建房间参数:', roomOptions);

        // 调用创建不加密房间的方法
        const newRoom = await roomCreateServiceV2.创建不加密的房间(roomOptions);
        console.log('房间创建成功:', newRoom);

        // 5. 尝试邀请智能体进入房间
        try {
            console.log('尝试邀请智能体进入房间:', finalagentID);
            await inviteManagementServiceV2.邀请用户(newRoom.roomId, finalagentID, `邀请智能体 ${roomName} 加入对话`);
            console.log('智能体邀请成功:', finalagentID);
            message.success('房间创建成功并已邀请智能体，正在跳转...');
        } catch (inviteError) {
            console.warn('邀请智能体失败，但房间创建成功:', inviteError);
            // 邀请失败不影响主流程，用户仍可进入房间
            message.success('房间创建成功，正在跳转...');
        }

        // 6. 创建成功后通知父组件跳转
        emit('agent-talk-request', finalagentID, finalapplicationID);

    } catch (error) {
        console.error('创建房间失败:', error);
        message.error('创建房间失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
}

// 判断是否应该显示开发按钮
function shouldShowDevelopButton(item: any): boolean {
    if (!item.imAccount || !item.application_id) {
        return true; // 如果数据不完整，默认显示
    }

    // 使用工具函数移除前后缀
    const cleanImAccount = removePrefixSuffix(item.imAccount, '@RBT#', 'Bot');

    // 如果去掉前后缀后等同于 application_id，则不显示开发按钮
    const shouldHide = cleanImAccount === item.application_id;

    console.log('开发按钮显示判断:', {
        imAccount: item.imAccount,
        cleanImAccount,
        application_id: item.application_id,
        shouldHide,
        shouldShow: !shouldHide
    });

    return !shouldHide;
}

function goToTalkPageWorkBench(agentID: string, applicationID: string) {

    const userid = userInfoManager.getLoginField('username');

    console.log('点击开发按钮传入参数:', { agentID, applicationID });
    handleeditorAgent(applicationID, agentID, userid);
    if (!agentID) return;

    // 使用工具函数格式化Agent用户名
    const finalagentID = removePrefixSuffix(agentID, '@RBT#', 'Bot');
    const finalapplicationID = removePrefixSuffix(applicationID, '@RBT#', 'Bot');

    console.log('开发按钮点击:', { finalagentID, finalapplicationID });

    // 通过emit事件通知父组件
    emit('agent-develop-request', finalagentID, finalapplicationID);
}

</script>







<style scoped>
.talk-page {
    min-height: 0;
    height: 100%;
    display: flex;
    flex-direction: column;
width: 100%;
    background-color: var(--bg-color-third);
    color: var(--text-color);
    transition: background-color var(--transition-duration) var(--transition-timing), color var(--transition-duration) var(--transition-timing);
}

.talk-header {
    margin: 5px;
    color: var(--text-color-secondary);
    font-size: var(--font-size-sm);
    display: flex;
    align-items: center;
    gap: 12px;
}

.back-link {
    cursor: pointer;
    text-decoration: underline;
    color: var(--color-primary);
    transition: color var(--transition-duration) var(--transition-timing);
}

.back-link:hover {
    color: var(--color-primary-hover);
}

.scroll-body {
    flex: 1 1 0;
    width: 100%;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    scrollbar-width: none;
    -ms-overflow-style: none;
    background: var(--bg-color-third);
    color: var(--text-color);


}

.scroll-body::-webkit-scrollbar {
    display: none;
}

.Tools-body {
    width: 100%;
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: stretch;
}

.Tools-body::before {
    content: "";
    position: absolute;
    inset: 0;

    background-size: cover;
    background-position: center;
    background-attachment: fixed;
    filter: blur(8px);
    opacity: 0.5;
    z-index: 0;
    pointer-events: none;
}

.Tools-body>* {
    position: relative;
    z-index: 1;
}

.main-content {
    min-height: calc(100vh - 640px);
    display: flex;
    align-items: center;
    width: 100%;
    margin-top: 64px;

}

.Docus-page {
    text-align: left;
    margin: 0 auto;
    width: 100%;
    max-width: 800px;
    padding-left: 0;
    padding-right: 0;
}

.Docus-page-h1 {
    margin-bottom: 16px;
    text-align: left;
    color: var(--text-color);
}


:deep(.n-form-item-label) {
    color: var(--text-color-secondary) !important;
    transition: color var(--transition-duration) var(--transition-timing);
}

:deep(.n-input input::placeholder) {
    color: var(--text-color-secondary) !important;
    opacity: 1;
    transition: color var(--transition-duration) var(--transition-timing);
}




.app-info-card {
    background: var(--bg-color-secondary);
    border-radius: var(--border-radius-lg);
    padding: 24px 32px;
    max-width: 800px;
    width: 100%;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 12px;
    box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.04);
    color: var(--text-color);
    transition: background-color var(--transition-duration) var(--transition-timing), color var(--transition-duration) var(--transition-timing);
}

.app-info-row {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    margin-bottom: 0;
}

.app-info-label {
    width: 100px;
    color: var(--text-color-secondary);
    font-weight: 500;
    font-size: var(--font-size-lg);
    flex-shrink: 0;
}

.app-info-value {
    color: var(--text-color);
    font-size: var(--font-size-lg);
    word-break: break-all;
}

.app-info-desc {
    align-items: flex-start;
    margin-top: 8px;
}

.app-info-desc .app-info-label {
    width: 100px;
}

.app-info-desc .app-info-value {
    color: var(--text-color-secondary);
    font-size: calc(var(--font-size-lg) * 0.98);
    line-height: 1.6;
}

.doc-list-wrapper {
    margin-top: -48px;
    padding-bottom: 48px;
    width: 100%;
    max-width: 800px;
    margin: 0 auto;
}

.doc-big-card {
    padding: 14px 16px 10px 16px;
    border-radius: var(--border-radius-lg);
    box-shadow: var(--shadow-md);
    transition: box-shadow 0.2s;


    background: var(--bg-color-third);
    color: var(--text-color);
    margin-top: 24px;
}

.doc-card-header {
    display: flex;
    align-items: center;
    gap: 18px;
    margin-bottom: 10px;
}

.doc-avatar {
    border-radius: 8px;
    background: var(--workspace-bg);
}

.doc-card-title {
    font-size: calc(var(--font-size-lg) * 1.3);
    font-weight: 600;
    color: var(--text-color);
}

.doc-card-desc {
    color: var(--text-color-secondary);
    font-size: calc(var(--font-size-lg) * 1.05);
    margin-bottom: 10px;
}

.doc-card-detail-list {
    margin: 0 0 12px 0;
    padding-left: 18px;
    color: var(--text-color-secondary);
    font-size: calc(var(--font-size-lg) * 0.98);
}

.doc-card-footer {
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    gap: 12px;
}

/* 应用设置弹窗样式 */
.dialog-content-appInfo {
    padding: 16px 0;
}

.settings-section {
    margin-bottom: 20px;
}

.settings-title {
    font-size: calc(var(--font-size-lg) * 1.1);
    font-weight: 600;
    color: var(--text-color);
    margin-bottom: 16px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--border-color);
}

.settings-actions {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.action-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 0;
    border-bottom: 1px solid var(--border-color);
}

.action-item:last-child {
    border-bottom: none;
}

.action-label {
    font-size: var(--font-size-lg);
    color: var(--text-color);
    font-weight: 500;
}

.action-button {
    min-width: 120px;
    height: 36px;
    border-radius: var(--border-radius-md);
    font-size: calc(var(--font-size-lg) * 0.95);
}

/* Agent信息显示样式 */
.agent-info {
    margin-bottom: 20px;
}

.info-row {
    display: flex;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid var(--border-color);
}

.info-row:last-child {
    border-bottom: none;
}

.info-label {
    width: 100px;
    font-size: calc(var(--font-size-lg) * 0.95);
    color: var(--text-color-secondary);
    font-weight: 500;
    flex-shrink: 0;
}

.info-value {
    font-size: calc(var(--font-size-lg) * 0.95);
    color: var(--text-color);
    word-break: break-all;
}




/* 统一弹窗内容区主题适配 */
:deep(.n-modal .modal-content-area),
:deep(.n-modal .modal-content-area .markdown-body),
:deep(.n-modal .modal-content-area .background),
:deep(.n-modal .modal-content-area .ycb-content-card) {
    background: var(--bg-color-secondary) !important;
    color: var(--text-color) !important;
    transition: background-color var(--transition-duration) var(--transition-timing), color var(--transition-duration) var(--transition-timing);
}

/* 修复Modal完整主题适配 - 覆盖所有相关组件 */
:deep(.n-modal),
:deep(.n-modal-mask),
:deep(.n-modal-container),
:deep(.n-modal-body-wrapper),
:deep(.n-card),
:deep(.n-card.n-modal),
:deep(.n-card__header),
:deep(.n-card__header .n-card__header__main),
:deep(.n-card__content),
:deep(.n-card__footer),
:deep(.n-modal .modal-content-area) {
    background: var(--bg-color-secondary) !important;
    background-color: var(--bg-color-secondary) !important;
    color: var(--text-color) !important;
    transition: background-color var(--transition-duration) var(--transition-timing), color var(--transition-duration) var(--transition-timing);
}

/* 特别处理Markdown弹窗的标题 */
:deep(.n-modal .n-card__header__main) {
    color: var(--text-color) !important;
}

/* 确保Markdown内容区域的主题适配 */
:deep(.n-modal .ycb-docu-layout),
:deep(.n-modal .ycb-main-card),
:deep(.n-modal .ycb-content-card) {
    background: var(--bg-color-secondary) !important;
    background-color: var(--bg-color-secondary) !important;
    color: var(--text-color) !important;
}



















.app-market-layout {
    display: flex;
    flex-direction: row;
    height: calc(100% - 35px);
    width: 100%;
    gap: 16px;
    /* 减少间距 */
    padding: 0 16px;
    /* 添加左右内边距，避免太靠近边缘 */
}

.left-content {
    flex: 1;
    /* 改为flex: 1，减少左侧占用空间 */
    min-width: 0;
    height: 100%;
    overflow-y: auto;
    /* 修复：允许垂直滚动 */
    overflow-x: hidden;
    /* 只隐藏横向滚动 */
}

.right-content {
    flex: 0 0 300px;
    /* 稍微减小右侧宽度 */
    height: 100%;
    overflow: hidden;
    /* 改为隐藏，让内部容器处理滚动 */
}

.member-list-section {
    padding: 8px;
    /* 减少内边距 */
    height: 100%;
}

.member-list-card {
    background: var(--bg-color-third);
    border-radius: var(--border-radius-lg);
    padding: 16px;
    box-shadow: var(--shadow-sm);
    border: 1px solid var(--border-color);
    height: 100%;
    display: flex;
    flex-direction: column;
}

.member-list-title {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    margin-bottom: 12px;
    color: var(--text-color);
    flex-shrink: 0;
    /* 标题不收缩 */
}

.member-list-container {
    flex: 1;
    /* 占据剩余空间 */
    overflow-y: auto;
    /* 内容超出时滚动 */
    overflow-x: hidden;
    scrollbar-width: thin;
    scrollbar-color: var(--border-color) transparent;
}

.member-list-container::-webkit-scrollbar {
    width: 6px;
}

.member-list-container::-webkit-scrollbar-track {
    background: transparent;
}

.member-list-container::-webkit-scrollbar-thumb {
    background: var(--border-color);
    border-radius: 3px;
}

.member-list-container::-webkit-scrollbar-thumb:hover {
    background: var(--text-color-secondary);
}

.member-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    /* 减少间距 */
    padding-right: 4px;
    /* 为滚动条留出空间 */
}

.member-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 8px;
    border-radius: var(--border-radius);
    transition: all 0.2s ease;
    cursor: pointer;
    border-bottom: 1px solid var(--border-color);
}

.member-item:hover {
    background: var(--bg-color-tertiary);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.member-item:active {
    transform: translateY(0);
}

.member-item:last-child {
    border-bottom: none;
}

.member-avatar {
    width: 40px;
    height: 40px;
    color: var(--bg-color-hover);
    object-fit: cover;
    background: var(--bg-color-secondary);
    flex-shrink: 0;
    border-radius: 50%;
}

.member-avatar-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: var(--font-weight-semibold);
    color: var(--text-color);

}

.member-info {
    display: flex;
    flex-direction: column;
    min-width: 0;
    flex: 1;
}

.member-name {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    color: var(--text-color);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.member-status {
    font-size: var(--font-size-xs);
    color: var(--text-color-secondary);
    margin-top: 2px;
}





:deep(.n-button) {
    background-color: var(--bg-color-third);
    /* 按钮背景色 */
    color: var(--text-color);
    /* 按钮文字色 */
    border-color: var(--color-primary);
    /* 按钮边框色 */
    transition: background-color 0.2s, color 0.2s;
}

:deep(.n-button:hover) {
    background-color: var(--bg-color-fifth);
    /* 悬停时背景色 */
    color: var(--text-color);
    border-color: var(--color-primary-hover);
}

/* 移动端适配样式 */
@media (max-width: 768px) {
    .talk-page {
        padding: 0;
        background: var(--bg-color-third);
        height: auto;
        /* 改为auto，让内容决定高度 */
        min-height: 100vh;
        /* 确保至少占满视口高度 */
    }

    .talk-header {
        margin: 8px 16px;
        font-size: calc(var(--font-size-sm) + 1px);
        padding: 8px 0;
    }

    .scroll-body {
        padding: 0 8px;
        align-items: stretch;
        justify-content: flex-start;
        overflow-y: auto;
        /* 确保可以垂直滚动 */
        flex: 1;
        /* 让滚动容器占满剩余空间 */
    }

    .main-content {
        min-height: auto;
        margin-top: 0;
        padding: 0;
        width: 100%;
    }

    .Docus-page {
        max-width: 100%;
        padding: 0 8px;
    }

    .Docus-page-h1 {
        margin-bottom: 12px;
        font-size: var(--font-size-xl);
        font-weight: 600;
    }

    /* 移动端应用信息样式 - 类似手机商城app信息 */
    .app-info-card {
        background: transparent;
        border-radius: 0;
        padding: 16px 0;
        margin: 0;
        box-shadow: none;
        border: none;
        gap: 8px;
    }

    .app-info-row {
        padding: 4px 0;
        margin: 0;
    }

    .app-info-label {
        width: 80px;
        font-size: calc(var(--font-size-sm) + 1px);
        font-weight: 500;
        color: var(--text-color-secondary);
    }

    .app-info-value {
        font-size: calc(var(--font-size-sm) + 1px);
        color: var(--text-color);
        flex: 1;
    }

    .app-info-desc {
        margin-top: 4px;
    }

    .app-info-desc .app-info-label {
        width: 80px;
    }

    .app-info-desc .app-info-value {
        font-size: var(--font-size-sm);
        line-height: 1.4;
    }

    /* 移动端智能体列表样式 */
    .doc-list-wrapper {
        margin-top: 16px;
        padding-bottom: 16px;
        width: 100%;
        max-width: 100%;
        margin: 16px 0 0 0;
        padding: 0 4px;
        /* 减少左右边距，让卡片更宽 */
    }

    .doc-big-card {
        padding: 0;
        /* 移除所有内边距 */
        margin-top: 8px;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        background: var(--bg-color-secondary);
        border: 1px solid var(--border-color);
        width: 100%;
        /* 确保卡片占满容器宽度 */
        box-sizing: border-box;
        /* 包含边框和内边距 */
    }

    .doc-card-header {
        gap: 12px;
        margin-bottom: 8px;
        width: 100%;
        padding: 0;
        /* 移除头部内边距 */
    }

    .doc-card-title {
        font-size: var(--font-size-lg);
        font-weight: 600;
        flex: 1;
        /* 让标题占满剩余空间 */
        min-width: 0;
        /* 允许换行 */
        word-break: break-word;
        /* 支持长文本换行 */
    }

    .doc-card-desc {
        font-size: var(--font-size-sm);
        margin-bottom: 6px;
        line-height: 1.4;
        word-break: break-word;
        /* 支持长文本换行 */
        padding: 0;
        /* 移除描述内边距 */
    }

    .doc-card-footer {
        gap: 8px;
        justify-content: flex-start;
        margin-top: 8px;
        flex-wrap: wrap;
        /* 允许按钮换行 */
        padding: 0;
        /* 移除按钮区域内边距 */
    }

    .doc-card-footer .n-button {
        padding: 6px 12px;
        font-size: var(--font-size-sm);
        height: 32px;
        min-width: auto;
        flex: 0 0 auto;
        /* 防止按钮被压缩 */
    }

    /* 移动端按钮样式优化 */
    .app-info-card .n-button {
        margin-top: 8px;
        width: 100%;
        height: 36px;
        font-size: calc(var(--font-size-sm) + 1px);
    }

    /* 移动端空状态卡片 */
    .doc-big-card.empty-card {
        padding: 20px 16px;
        text-align: center;
    }

    .doc-big-card.empty-card .doc-card-desc {
        margin-bottom: 12px;
    }

    /* 移动端表单样式 */
    :deep(.n-form-item) {
        margin-bottom: 12px;
    }

    :deep(.n-input) {
        height: 36px;
    }

    :deep(.n-input input) {
        font-size: calc(var(--font-size-sm) + 1px);
    }

    /* 移动端模态框样式 */
    :deep(.n-modal) {
        --modal-width: 90vw;
        --modal-max-width: 400px;
    }

    :deep(.n-card.n-modal) {
        border-radius: 12px;
    }

    /* 移动端设置弹窗样式 */
    .settings-section {
        margin-bottom: 16px;
    }

    .settings-title {
        font-size: var(--font-size-lg);
        margin-bottom: 12px;
    }

    .settings-actions {
        gap: 12px;
    }

    .action-item {
        padding: 8px 0;
    }

    .action-label {
        font-size: calc(var(--font-size-sm) + 1px);
    }

    .action-button {
        min-width: 80px;
        height: 32px;
        font-size: var(--font-size-sm);
    }

    /* 移动端Agent信息样式 */
    .agent-info {
        margin-bottom: 16px;
    }

    .info-row {
        padding: 6px 0;
    }

    .info-label {
        width: 80px;
        font-size: calc(var(--font-size-sm) + 1px);
    }

    .info-value {
        font-size: calc(var(--font-size-sm) + 1px);
    }

    /* 移动端成员列表样式 */
    .app-market-layout {
        flex-direction: column;
        height: auto;
        gap: 12px;
        padding: 0 8px;
    }

    .left-content {
        flex: none;
        height: auto;
        overflow: visible;
    }

    .right-content {
        flex: none;
        height: auto;
        max-height: 300px;
    }

    .member-list-section {
        padding: 0;
    }

    .member-list-card {
        padding: 12px;
        border-radius: 8px;
    }

    .member-list-title {
        font-size: var(--font-size-lg);
        margin-bottom: 8px;
    }

    .member-list {
        gap: 6px;
    }

    .member-item {
        padding: 8px 12px;
        gap: 10px;
    }

    .member-avatar {
        width: 36px;
        height: 36px;
    }

    .member-name {
        font-size: calc(var(--font-size-sm) + 1px);
    }

    .member-status {
        font-size: var(--font-size-xs);
    }
}
</style>
