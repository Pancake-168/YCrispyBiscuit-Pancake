<template>
    <div class="FunctionList" :class="{ 'is-fixed': shouldUseFixedStyle, 'is-collapsed': shouldCollapse }">
        <div class="title">
            <!--img src="@/assets/YanJingAI2/研境LOGO@4x.png" alt="image" />
            <h3 v-show="!shouldCollapse">研境AI</h3-->
            <div class="profile-mark" v-show="shouldCollapse" :title="profileDisplayName">
                {{ profileInitial }}
            </div>
            <div class="profile-text" v-show="!shouldCollapse" :title="profileDisplayName">
                <span class="profile-text__content">{{ profileDisplayName }}</span>
            </div>
        </div>
        <div class="item" :class="{ 'is-active': systemStore.currentFunction === func.id }" v-for="func in functions"
            :key="func.id" @click="switchFunction(func.id)" :title="shouldCollapse ? func.name : undefined">
            <div class="icons">
                <div class="icon" v-if="func.id == 'Message'">
                    <svg class="icon" viewBox="0 0 1024 1024" width="18" height="18" fill="currentColor">
                        <path
                            d="M512 896H224a96.2 96.2 0 0 1-96-96V512a384 384 0 1 1 384 384z m0-704a320 320 0 0 0-320 320V800a32.1 32.1 0 0 0 32 32h288a320 320 0 0 0 0-640z"
                            p-id="10106"></path>
                        <path d="M320 384m32 0l192 0q32 0 32 32l0 0q0 32-32 32l-192 0q-32 0-32-32l0 0q0-32 32-32Z"
                            p-id="10107">
                        </path>
                        <path d="M320 512m32 0l320 0q32 0 32 32l0 0q0 32-32 32l-320 0q-32 0-32-32l0 0q0-32 32-32Z"
                            p-id="10108">
                        </path>
                        <path d="M320 640m32 0l320 0q32 0 32 32l0 0q0 32-32 32l-320 0q-32 0-32-32l0 0q0-32 32-32Z"
                            p-id="10109">
                        </path>
                    </svg>
                </div>

                <div class="icon" v-if="func.id == 'Mission'">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                        class="lucide lucide-layout-list" aria-hidden="true">
                        <rect width="7" height="7" x="3" y="3" rx="1"></rect>
                        <rect width="7" height="7" x="3" y="14" rx="1"></rect>
                        <path d="M14 4h7"></path>
                        <path d="M14 9h7"></path>
                        <path d="M14 15h7"></path>
                        <path d="M14 20h7"></path>
                    </svg>
                </div>

                <div class="icon" v-if="func.id == 'Organization'">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                        class="lucide lucide-network" aria-hidden="true">
                        <rect x="16" y="16" width="6" height="6" rx="1"></rect>
                        <rect x="2" y="16" width="6" height="6" rx="1"></rect>
                        <rect x="9" y="2" width="6" height="6" rx="1"></rect>
                        <path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"></path>
                        <path d="M12 12V8"></path>
                    </svg>
                </div>

                <div class="icon" v-if="func.id == 'SystemMap'">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                        class="lucide lucide-map" aria-hidden="true">
                        <path
                            d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z">
                        </path>
                        <path d="M15 5.764v15"></path>
                        <path d="M9 3.236v15"></path>
                    </svg>
                </div>

                <div class="icon" v-if="func.id == 'Market'">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                        class="lucide lucide-store" aria-hidden="true">
                        <path d="M15 21v-5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5"></path>
                        <path
                            d="M17.774 10.31a1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.451 0 1.12 1.12 0 0 0-1.548 0 2.5 2.5 0 0 1-3.452 0 1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.77-3.248l2.889-4.184A2 2 0 0 1 7 2h10a2 2 0 0 1 1.653.873l2.895 4.192a2.5 2.5 0 0 1-3.774 3.244">
                        </path>
                        <path d="M4 10.95V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8.05"></path>
                    </svg>
                </div>
                <div class="icon" v-if="func.id == 'AISupport'">
                    <svg t="1773383924637" width="18" height="18" viewBox="0 0 1024 1024" version="1.1"
                        fill="currentColor" aria-hidden="true">
                        <path
                            d="M927.616 465.6C923.328 236.704 745.888 51.808 528 51.808h-32c-217.888 0-395.328 184.896-399.616 413.76C58.112 487.744 32 528.672 32 576v64c0 70.592 57.408 128 128 128s128-57.408 128-128v-64a128.064 128.064 0 0 0-126.784-127.872C173.728 262.688 318.912 115.808 496 115.808h32c177.12 0 322.272 146.88 334.784 332.32A128.064 128.064 0 0 0 736 576v64c0 57.792 38.72 106.176 91.392 122.016a337.504 337.504 0 0 1-191.936 124.48A79.712 79.712 0 0 0 560 832a80 80 0 1 0 0 160 79.68 79.68 0 0 0 67.872-38.112 402.432 402.432 0 0 0 278.24-193.6C955.968 742.816 992 695.776 992 640v-64c0-47.328-26.112-88.256-64.384-110.4zM224 576v64c0 35.296-28.704 64-64 64s-64-28.704-64-64v-64c0-35.296 28.704-64 64-64s64 28.704 64 64z m704 64c0 34.304-27.2 62.176-61.12 63.712l-2.496-1.184c-0.224 0.512-0.576 0.928-0.8 1.408A64 64 0 0 1 800 640v-64c0-35.296 28.704-64 64-64s64 28.704 64 64v64z"
                            p-id="1670"></path>
                    </svg>
                </div>
                <div class="icon" v-if="func.id == 'AIAdmin'">
                    <svg t="1773384312817" viewBox="0 0 1024 1024" version="1.1"
                        xmlns="http://www.w3.org/2000/svg" p-id="2693" width="18" height="18" fill="currentColor"
                        aria-hidden="true">
                        <path
                            d="M956.96497373 783.22135977c-3.28732207 17.50931455-14.60263008 28.85922598-28.7208123 28.85922598h-2.35303067c-27.68271065 0.06920684-50.10570703 22.49220234-50.17491299 50.17491386 0.3806376 6.57464414 1.90318623 13.04547715 4.42923311 19.10107002 6.74766035 15.70993857 1.59175547 33.94592402-12.35340967 43.80789024l-1.38413496 0.9342914-58.23750322 32.04273779a37.37165977 37.37165977 0 0 1-15.9521625 3.66795967c-10.93467041 0-21.73092803-4.60225107-28.58239863-12.24960029-7.50893555-8.13179619-27.37128076-24.94904326-41.35104932-24.94904238-13.66833867 0-33.87671719 16.81724707-40.93580919 24.49919883a39.34405283 39.34405283 0 0 1-43.1850287 8.96227733l-57.58003828-32.00813437c-15.15628388-10.51943028-20.45060244-29.41288066-13.56452842-44.77678506 1.21111875-2.83747763 4.39463057-11.83435927 4.39463056-18.96265635 0-27.64810722-22.5960126-50.17491387-50.2441207-50.17491386h-1.97239306c-14.46421641 0-25.71031758-11.38451484-29.06684649-28.92843281-0.51905039-2.66446055-4.94828438-26.99064316-4.94828437-46.5069542 0-19.58551787 4.42923398-43.98090732 4.94828437-46.57616104 3.35652891-17.50931455 14.60263008-28.92843281 28.7208123-28.92843281h2.35303067c27.68271065 0 50.17491387-22.38839209 50.24412071-50.07110362a56.40352383 56.40352383 0 0 0-4.46383741-19.17027685 36.26435127 36.26435127 0 0 1 12.4226165-43.84249365l1.38413584-0.83048116 59.69084502-32.80401211 1.14191192-0.44984443a39.69008701 39.69008701 0 0 1 42.80439111 8.92767393c7.26671162 7.6127458 26.81762607 23.49570059 40.34755195 23.49570146 13.32230449 0 32.76940869-15.53692148 40.03612031-23.11506386 11.31530801-11.17689434 28.20176192-14.53342325 42.90820137-8.54703721l58.61814082 32.42337539c15.22549073 10.51943028 20.5544127 29.4820875 13.63373526 44.8459919a59.06798438 59.06798438 0 0 0-4.32542373 18.99725976c0.06920684 27.64810722 22.49220234 50.0365002 50.17491299 50.07110362h2.00699648c14.42961299 0 25.71031758 11.38451484 29.06684649 28.96303623 0.48444785 2.62985713 4.94828438 26.95603974 4.94828524 46.57616102 0 20.58901612-4.94828438 46.33393711-4.87907841 46.54155763z m-43.70407998-77.30396983a95.74757666 95.74757666 0 0 1-83.29035586-94.88249209c0.17301709-9.89656875 1.90318623-19.65472471 5.12130146-28.99763965l-41.48946299-23.04585615a170.87153291 170.87153291 0 0 1-17.12867695 13.84135488c-18.1321752 12.73404727-35.43387011 19.17027685-51.6974625 19.17027774-16.50581631 0-34.01513086-6.43623047-52.21651376-19.51631103a149.83267237 149.83267237 0 0 1-17.16328038-14.22199336l-43.39265009 23.84173476c2.4222375 7.19750479 5.15590488 17.82074531 5.15590488 28.96303623a95.85138604 95.85138604 0 0 1-83.35956269 94.95169893 226.82521231 226.82521231 0 0 0-2.87208106 30.65860195c0.27682734 10.24260292 1.21111875 20.45060244 2.87208106 30.58939512a95.71297324 95.71297324 0 0 1 83.35956269 94.95169892c0 11.07308408-2.83747763 21.76553144-5.19050831 28.99763965l40.13993145 22.42299551c5.43273223-5.1905083 11.14229092-10.03498242 17.16328037-14.49881982 18.40900253-13.42611474 36.29895469-20.34679219 52.97778809-20.34679219 16.92105732 0 34.94942227 7.05909112 53.53144189 20.79663662 6.05559287 4.53304424 11.83435927 9.48132862 17.26709151 14.77564628l42.00851338-23.1496664a95.02090489 95.02090489 0 0 1-5.08669805-28.96303623 95.67836982 95.67836982 0 0 1 83.29035586-94.95169893c1.17651533-7.92417568 2.87208106-20.72742979 2.87208193-30.69320537 0-10.00037901-1.69556573-22.73442627-2.87208193-30.69320537z m-190.73387724 118.9664499a88.75769151 88.75769151 0 0 1-88.61927872-88.58467529 88.65388125 88.65388125 0 0 1 177.23855655 0 88.75769151 88.75769151 0 0 1-88.61927783 88.58467529z m0-129.76270752c-23.04585703 0-42.00851338 18.20138203-42.97740909 41.21263565a42.9774082 42.9774082 0 0 0 85.92021387 0 43.01201162 43.01201162 0 0 0-42.94280478-41.21263565z m-128.58619219-225.61409355l-14.42961299 11.21149776c-29.37827724 26.12555859-85.43576602 34.84561201-122.4959959 37.71769394l-4.74066387-0.10381026a344.64975029 344.64975029 0 0 0-31.21225664 1.48794522h-0.44984443l0.06920683 0.06920684c-167.65341768 15.81374883-299.28470801 156.30350625-299.284708 326.93281611v50.14030957h367.38417656a298.76565674 298.76565674 0 0 0 35.81450771 58.61814082H91.77644902A29.4820875 29.4820875 0 0 1 62.15594785 926.30637178v-79.4839834c0-159.10638047 96.47424756-300.18439599 245.85707637-359.42539746l16.92105732-6.6784544-14.36040615-11.21149775c-56.12669648-43.77328682-88.23864112-109.06988115-88.23864112-179.31475986 0-125.74871455 103.11809766-228.03633106 229.87031046-228.03633106 126.78681622 0 229.90491386 102.28761651 229.9741207 228.03633106 0 70.24487871-32.2503583 135.54147305-88.23864111 179.31475986zM452.23994815 120.80869209c-94.08661347 0-170.62930898 76.02364511-170.62930899 169.38358682 0 93.42914941 76.5426955 169.45279365 170.62930899 169.45279453 94.1212169 0 170.6639124-75.9890417 170.6639124-169.45279453 0-93.42914941-76.5426955-169.38358682-170.6639124-169.38358682z"
                            p-id="2694"></path>
                    </svg>
                </div>

                <!--div class="icon" v-if="func.id == 'Registration'">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                        class="lucide lucide-building2 lucide-building-2 mr-1" aria-hidden="true">
                        <path d="M10 12h4"></path>
                        <path d="M10 8h4"></path>
                        <path d="M14 21v-3a2 2 0 0 0-4 0v3"></path>
                        <path d="M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2"></path>
                        <path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"></path>
                    </svg>
                </div>

                <div class="icon" v-if="func.id == 'Recharge'">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                        class="lucide lucide-coins mr-1" aria-hidden="true">
                        <path d="M13.744 17.736a6 6 0 1 1-7.48-7.48"></path>
                        <path d="M15 6h1v4"></path>
                        <path d="m6.134 14.768.866-.5 2 3.464"></path>
                        <circle cx="16" cy="8" r="6"></circle>
                    </svg>
                </div-->
            </div>
            <div class="itemName" v-show="!shouldCollapse">
                {{ func.name }}
            </div>
        </div>




        <div class="bottom" :class="{ 'is-active': systemStore.currentFunction === 'Settings' }"
            @click="switchFunction('Settings')" :title="shouldCollapse ? '设置' : undefined">
            <div class="icons">
                <div class="icon">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"
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
import { SYSTEM_FUNCTIONS, type SystemFunctionId, useSystemStore } from '@/stores/System'
import { computed } from 'vue'
import { useAppStore } from '@/stores/app'
import { useWechatStore } from '@/stores/WeChat'

const props = withDefaults(defineProps<{
    mobileCompact?: boolean
}>(), {
    mobileCompact: false
})

const systemStore = useSystemStore()
const appStore = useAppStore()
const wechatStore = useWechatStore()

const functions = SYSTEM_FUNCTIONS.filter(func => func.id !== 'Settings' && func.id !== 'Registration' && func.id !== 'Recharge')
const isCollapsed = computed(() => appStore.functionListMode === 'fixed' && appStore.functionListCollapsed)
const shouldUseFixedStyle = computed(() => appStore.functionListMode === 'fixed' || props.mobileCompact)
const shouldCollapse = computed(() => isCollapsed.value || props.mobileCompact)
const profileDisplayName = computed(() => wechatStore.userProfile?.nickname || wechatStore.userProfile?.username || '未登录')
const profileInitial = computed(() => profileDisplayName.value.trim().slice(0, 1) || '未')

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
    width: max-content;
    min-width: 100%;
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
    padding: var(--space-sm) var(--space-xs);
    margin-bottom: var(--space-sm);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: var(--radius-sm);
    transition: background-color 0.2s ease, transform 0.2s ease;


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





.title img {
    width: 20px;
    height: 20px;
    margin-right: 0;
    object-fit: contain;
    margin-left: 0.5rem;
    display: block;
}

.profile-mark {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;

    color: var(--text-color);
    font-size: var(--font-sm);
    font-weight: 700;
    text-transform: uppercase;
    flex-shrink: 0;
}

.profile-text {
    min-width: max-content;
    flex: 0 0 auto;
    font-size: var(--font-md);
    white-space: nowrap;
}

.profile-text__content {
    display: block;
    padding-right: var(--space-xs);
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
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
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

.bottom {
    margin-bottom: 1rem;
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

.itemName {
    font-size: var(--font-sm);
    white-space: nowrap;
    overflow: visible;
    text-overflow: clip;
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
