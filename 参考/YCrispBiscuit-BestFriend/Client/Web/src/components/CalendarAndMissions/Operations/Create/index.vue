<template>
  <div class="CalendarEventCreate">
    <div class="title">创建新事件</div>
    <div class="session1">
      <div class="newEvent-key-1">标题：</div>
      <div class="input-wrapper">
        <input v-model="newEvent.title" type="text" />
      </div>
    </div>
    <div class="session2">
      <div class="newEvent-key-2">内容：</div>
      <div class="input-wrapper">
        <textarea v-model="newEvent.content"></textarea>
      </div>
    </div>
    <div class="session3">
      <div class="newEvent-key-3">类型：</div>
      <div class="input-wrapper">
        <YCrispBiscuitDropdown v-model="newEvent.type" :options="typeOptions" />
      </div>
    </div>

    <div class="session4">
      <div class="newEvent-key-4">重要性：</div>
      <div class="input-wrapper">
        <YCrispBiscuitDropdown v-model="newEvent.importance" :options="importanceOptions" />
      </div>
    </div>

    <div class="session5" v-if="showRepeat">
      <div class="newEvent-key-5">重复：</div>
      <div class="input-wrapper">
        <YCrispBiscuitDropdown v-model="newEvent.repeat" :options="repeatOptions"
          :disabled="isBirthday || isHoliday || isDeadline || isGoal" />
        <span v-if="isBirthday || isHoliday || isDeadline || isGoal" class="fixed-value">固定为: {{ isBirthday ? '每年' :
          isHoliday || isDeadline || isGoal ? '不重复' : '' }}</span>
      </div>
    </div>

    <div class="session6" v-if="showWeekdays">
      <div class="newEvent-key-6">星期：</div>
      <div class="input-wrapper">
        <label><input type="checkbox" v-model="newEvent.weekdays" :value="0" /> 星期天</label>
        <label><input type="checkbox" v-model="newEvent.weekdays" :value="1" /> 星期一</label>
        <label><input type="checkbox" v-model="newEvent.weekdays" :value="2" /> 星期二</label>
        <label><input type="checkbox" v-model="newEvent.weekdays" :value="3" /> 星期三</label>
        <label><input type="checkbox" v-model="newEvent.weekdays" :value="4" /> 星期四</label>
        <label><input type="checkbox" v-model="newEvent.weekdays" :value="5" /> 星期五</label>
        <label><input type="checkbox" v-model="newEvent.weekdays" :value="6" /> 星期六</label>
      </div>
    </div>

    <div class="session7" v-if="showRange">
      <div class="newEvent-key-7">时间范围：</div>
      <div class="input-wrapper">
        <input type="checkbox" v-model="newEvent.range"
          :disabled="isBirthday || isDeadline || isGoal || (newEvent.type === 'meeting' && newEvent.repeat === 'weekly') || (newEvent.type === 'default' && newEvent.repeat === 'weekly')" />
      </div>
    </div>

    <div class="session8" v-if="showDate">
      <div>
        <!-- 合并日期框（birthday和deadline） -->
        <div v-if="isSingleDate" class="start">
          <div class="newEvent-key-8">日期：</div>
          <div class="input-wrapper">
            <YCrispBiscuitDropdown v-if="!hideStartYear" v-model="singleDateYear" :options="yearOptions" />
            <div v-if="!hideStartYear">年</div>

            <YCrispBiscuitDropdown v-if="!hideStartMonth" v-model="singleDateMonth" :options="monthOptions" />
            <div v-if="!hideStartMonth">月</div>

            <YCrispBiscuitDropdown v-if="!hideStartDay" v-model="singleDateDay" :options="singleDateDayOptions" />
            <div v-if="!hideStartDay">日</div>
          </div>
        </div>
        <!-- 分开日期框（其他情况） -->
        <div v-else class="velse">
          <div class="start">
            <div class="newEvent-key-8">开始日期：</div>
            <div class="input-wrapper">

              <YCrispBiscuitDropdown v-if="!hideStartYear" v-model="startYear" :options="yearOptions" />
              <div v-if="!hideStartYear">年</div>

              <YCrispBiscuitDropdown v-if="!hideStartMonth" v-model="startMonth" :options="monthOptions" />
              <div v-if="!hideStartMonth">月</div>

              <YCrispBiscuitDropdown v-if="!hideStartDay" v-model="startDay" :options="dayOptions" />
              <div v-if="!hideStartDay">日</div>
            </div>
          </div>

          <div class="end">
            <!-- 结束日期：根据type和range显示 -->
            <div v-if="newEvent.type === 'holiday' && newEvent.range === true" class="newEvent-key-8">
              结束日期：</div>
            <div v-if="newEvent.type === 'holiday' && newEvent.range === true" class="input-wrapper">

              <YCrispBiscuitDropdown v-if="!hideEndYear" v-model="endYear" :options="yearOptions" />
              <div v-if="!hideEndYear">年</div>

              <YCrispBiscuitDropdown v-if="!hideEndMonth" v-model="endMonth" :options="monthOptions" />
              <div v-if="!hideEndMonth">月</div>

              <YCrispBiscuitDropdown v-if="!hideEndDay" v-model="endDay" :options="endDayOptions" />
              <div v-if="!hideEndDay">日</div>
            </div>
            <!-- 结束日期：meeting和default根据range显示 -->
            <div v-if="(newEvent.type === 'meeting' || newEvent.type === 'default') && newEvent.range === true"
              class="newEvent-key-8">结束日期：</div>
            <div v-if="(newEvent.type === 'meeting' || newEvent.type === 'default') && newEvent.range === true"
              class="input-wrapper">

              <YCrispBiscuitDropdown v-if="!hideEndYear" v-model="endYear" :options="yearOptions" />
              <div v-if="!hideEndYear">年</div>

              <YCrispBiscuitDropdown v-if="!hideEndMonth" v-model="endMonth" :options="monthOptions" />
              <div v-if="!hideEndMonth">月</div>

              <YCrispBiscuitDropdown v-if="!hideEndDay" v-model="endDay" :options="endDayOptions" />
              <div v-if="!hideEndDay">日</div>
            </div>
          </div>

        </div>
      </div>
    </div>

    <div class="session10" v-if="showTime">
      <div>
        <!-- 合并时间框（deadline） -->
        <div v-if="isSingleTime" class="start">
          <div class="newEvent-key-10">时间：</div>
          <div class="input-wrapper">

            <YCrispBiscuitDropdown v-model="singleTimeHour" :options="hourOptions" />
            <div>时</div>

            <YCrispBiscuitDropdown v-model="singleTimeMinute" :options="minuteOptions" />
            <div>分</div>
          </div>
        </div>
        <!-- 分开时间框（其他情况） -->
        <div v-else class="velse">
          <div class="start">
            <div class="newEvent-key-10">开始时间：</div>
            <div class="input-wrapper">

              <YCrispBiscuitDropdown v-model="startHour" :options="hourOptions" />
              <div>时</div>
              <YCrispBiscuitDropdown v-model="startMinute" :options="minuteOptions" />
              <div>分</div>
            </div>
          </div>

          <div class="end">
            <!-- 结束时间：始终显示（选填） -->
            <div class="newEvent-key-10">结束时间：</div>
            <div class="input-wrapper">

              <YCrispBiscuitDropdown v-model="endHour" :options="hourOptions" />
              <div>时</div>

              <YCrispBiscuitDropdown v-model="endMinute" :options="minuteOptions" />
              <div>分</div>
            </div>
          </div>

        </div>
      </div>
    </div>
    <div class="session12">
      <div class="newEvent-key-12">状态：</div>
      <div class="input-wrapper">
        <YCrispBiscuitDropdown v-model="newEvent.status" :options="statusOptions" />
      </div>
    </div>

    <div class="button-container">
      <button @click="resetForm">重置</button>
      <button @click="submitForm">提交</button>
    </div>

    <!-- 错误显示 -->
    <div v-if="validationErrors.length > 0" class="errors">
      <ul>
        <li v-for="error in validationErrors" :key="error">{{ error }}</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { CalendarEvent } from '@/types/CalendarData';
import { validateCalendarEvent } from '@/utils/CalendarValidation';
import { createOrUpdateCalendarEvent } from '@/services/project/Calendar';
import YCrispBiscuitDropdown from '@/components/YCrispBiscuitDropdown';

const newEvent = ref<Partial<CalendarEvent>>({
  title: '',
  content: '',
  type: 'default',
  importance: 'R',
  repeat: 'none',
  weekdays: [],
  range: false,
  startYear: undefined,
  startMonth: undefined,
  startDay: undefined,
  endYear: undefined,
  endMonth: undefined,
  endDay: undefined,
  startTimeHour: undefined,
  startTimeMinute: undefined,
  endTimeHour: undefined,
  endTimeMinute: undefined,
  status: 'normal',
});

const validationErrors = ref<string[]>([]);

// 日期选择字段
const startYear = ref<number | undefined>(undefined);
const startMonth = ref<number | undefined>(undefined);
const startDay = ref<number | undefined>(undefined);
const endYear = ref<number | undefined>(undefined);
const endMonth = ref<number | undefined>(undefined);
const endDay = ref<number | undefined>(undefined);

// 合并日期字段（用于birthday和deadline）
const singleDateYear = ref<number | undefined>(undefined);
const singleDateMonth = ref<number | undefined>(undefined);
const singleDateDay = ref<number | undefined>(undefined);

// 时间选择字段
const startHour = ref<number | undefined>(undefined);
const startMinute = ref<number | undefined>(undefined);
const endHour = ref<number | undefined>(undefined);
const endMinute = ref<number | undefined>(undefined);

// 合并时间字段（用于deadline）
const singleTimeHour = ref<number | undefined>(undefined);
const singleTimeMinute = ref<number | undefined>(undefined);

// 计算属性：获取指定年月的最大天数
const getMaxDays = (year: number | undefined, month: number | undefined): number => {
  if (!year || !month) return 31;
  const date = new Date(year, month, 0);
  return date.getDate();
};

// 计算属性：开始日期的最大天数
const startMaxDays = computed(() => getMaxDays(startYear.value, startMonth.value));

// 计算属性：结束日期的最大天数
const endMaxDays = computed(() => getMaxDays(endYear.value, endMonth.value));

// 计算属性：合并日期的最大天数
const singleDateMaxDays = computed(() => getMaxDays(singleDateYear.value, singleDateMonth.value));

// 选项数组
const typeOptions = computed(() => [
  { value: 'default', label: '默认' },
  { value: 'meeting', label: '会议' },
  { value: 'birthday', label: '生日' },
  { value: 'holiday', label: '假期' },
  { value: 'deadline', label: '截止日期' },
  { value: 'goal', label: '目标' }
]);

const importanceOptions = computed(() => [
  { value: 'R', label: 'R' },
  { value: 'SR', label: 'SR' },
  { value: 'SSR', label: 'SSR' },
  { value: 'SP', label: 'SP' }
]);

const repeatOptions = computed(() => [
  { value: 'none', label: '不重复' },
  { value: 'daily', label: '每天' },
  { value: 'weekly', label: '每周' },
  { value: 'monthly', label: '每月' },
  { value: 'yearly', label: '每年' }
]);

const yearOptions = computed(() => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 200 }, (_, i) => ({ value: currentYear - 100 + i, label: `${currentYear - 100 + i}` }));
});

const monthOptions = computed(() => Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `${i + 1}` })));

const dayOptions = computed(() => Array.from({ length: startMaxDays.value }, (_, i) => ({ value: i + 1, label: `${i + 1}` })));

const endDayOptions = computed(() => Array.from({ length: endMaxDays.value }, (_, i) => ({ value: i + 1, label: `${i + 1}` })));

const singleDateDayOptions = computed(() => Array.from({ length: singleDateMaxDays.value }, (_, i) => ({ value: i + 1, label: `${i + 1}` })));

const hourOptions = computed(() => Array.from({ length: 24 }, (_, i) => ({ value: i, label: `${i}` })));

const minuteOptions = computed(() => Array.from({ length: 60 }, (_, i) => ({ value: i, label: `${i}` })));

const statusOptions = computed(() => [
  { value: 'normal', label: '正常' },
  { value: 'completed', label: '已完成' },
  { value: 'canceled', label: '已取消' }
]);

// 计算属性：是否使用合并日期（birthday、deadline，或meeting/default/holiday且range=false）
const isSingleDate = computed(() => {
  const singleTypes = ['birthday', 'deadline'];
  const rangeTypes = ['meeting', 'default', 'holiday'];
  return singleTypes.includes(newEvent.value.type!) || (rangeTypes.includes(newEvent.value.type!) && newEvent.value.range === false);
});

// 计算属性：是否使用合并时间（deadline）
const isSingleTime = computed(() => newEvent.value.type === 'deadline');

// 计算属性：事件类型判断
const isBirthday = computed(() => newEvent.value.type === 'birthday');
const isHoliday = computed(() => newEvent.value.type === 'holiday');
const isDeadline = computed(() => newEvent.value.type === 'deadline');
const isGoal = computed(() => newEvent.value.type === 'goal');

// 计算属性：显示判断
const showRepeat = computed(() => !isBirthday.value && !isHoliday.value && !isDeadline.value && !isGoal.value);
const showWeekdays = computed(() => (newEvent.value.type === 'meeting' || newEvent.value.type === 'default') && newEvent.value.repeat === 'weekly');
const showRange = computed(() => !isBirthday.value && !isDeadline.value && !isGoal.value && !(newEvent.value.type === 'meeting' && newEvent.value.repeat === 'weekly') && !(newEvent.value.type === 'default' && newEvent.value.repeat === 'weekly'));
const showDate = computed(() => !isGoal.value && !(newEvent.value.type === 'meeting' && newEvent.value.repeat === 'weekly') && !(newEvent.value.type === 'default' && newEvent.value.repeat === 'weekly'));
const showTime = computed(() => !isBirthday.value && !isGoal.value);

// 计算属性：隐藏字段判断（根据repeat）
const hideStartYear = computed(() => {
  if (newEvent.value.type === 'birthday') return true;
  if ((newEvent.value.type === 'meeting' || newEvent.value.type === 'default') && (newEvent.value.repeat === 'yearly' || newEvent.value.repeat === 'monthly' || newEvent.value.repeat === 'daily')) return true;
  return false;
});
const hideStartMonth = computed(() => {
  if ((newEvent.value.type === 'meeting' || newEvent.value.type === 'default') && (newEvent.value.repeat === 'monthly' || newEvent.value.repeat === 'daily')) return true;
  return false;
});
const hideStartDay = computed(() => {
  if ((newEvent.value.type === 'meeting' || newEvent.value.type === 'default') && newEvent.value.repeat === 'daily') return true;
  return false;
});
const hideEndYear = computed(() => hideStartYear.value);
const hideEndMonth = computed(() => hideStartMonth.value);
const hideEndDay = computed(() => hideStartDay.value);

// 监听合并日期字段变化，设置startDay和endDay
watch([singleDateYear, singleDateMonth], () => {
  const maxDays = getMaxDays(singleDateYear.value, singleDateMonth.value);
  if (singleDateDay.value && singleDateDay.value > maxDays) {
    singleDateDay.value = maxDays;
  }
  newEvent.value.startYear = singleDateYear.value;
  newEvent.value.startMonth = singleDateMonth.value;
  newEvent.value.startDay = singleDateDay.value;
  newEvent.value.endYear = singleDateYear.value;
  newEvent.value.endMonth = singleDateMonth.value;
  newEvent.value.endDay = singleDateDay.value;
});

// 单独监听singleDateDay变化
watch(singleDateDay, () => {
  newEvent.value.startYear = singleDateYear.value;
  newEvent.value.startMonth = singleDateMonth.value;
  newEvent.value.startDay = singleDateDay.value;
  newEvent.value.endYear = singleDateYear.value;
  newEvent.value.endMonth = singleDateMonth.value;
  newEvent.value.endDay = singleDateDay.value;
});

// 监听合并时间字段变化，设置startTime和endTime
watch([singleTimeHour, singleTimeMinute], () => {
  newEvent.value.startTimeHour = singleTimeHour.value;
  newEvent.value.startTimeMinute = singleTimeMinute.value;
  newEvent.value.endTimeHour = singleTimeHour.value;
  newEvent.value.endTimeMinute = singleTimeMinute.value;
});

// 监听分开日期字段变化
watch([startYear, startMonth, startDay], () => {
  newEvent.value.startYear = startYear.value;
  newEvent.value.startMonth = startMonth.value;
  newEvent.value.startDay = startDay.value;
});
watch([endYear, endMonth, endDay], () => {
  newEvent.value.endYear = endYear.value;
  newEvent.value.endMonth = endMonth.value;
  newEvent.value.endDay = endDay.value;
});

// 监听分开时间字段变化
watch([startHour, startMinute], () => {
  newEvent.value.startTimeHour = startHour.value;
  newEvent.value.startTimeMinute = startMinute.value;
});
watch([endHour, endMinute], () => {
  newEvent.value.endTimeHour = endHour.value;
  newEvent.value.endTimeMinute = endMinute.value;
});

// 监听type变化，重置相关字段
watch(() => newEvent.value.type, (newType) => {
  if (newType === 'birthday') {
    newEvent.value.repeat = 'yearly';
    newEvent.value.weekdays = [];
    newEvent.value.range = false;
    newEvent.value.startTimeHour = undefined;
    newEvent.value.startTimeMinute = undefined;
    newEvent.value.endTimeHour = undefined;
    newEvent.value.endTimeMinute = undefined;
  } else if (newType === 'deadline') {
    newEvent.value.repeat = 'none';
    newEvent.value.weekdays = [];
    newEvent.value.range = false;
  } else if (newType === 'holiday') {
    newEvent.value.repeat = 'none';
    newEvent.value.weekdays = [];
  } else if (newType === 'goal') {
    newEvent.value.repeat = 'none';
    newEvent.value.weekdays = [];
    newEvent.value.range = false;
    newEvent.value.startYear = undefined;
    newEvent.value.startMonth = undefined;
    newEvent.value.startDay = undefined;
    newEvent.value.endYear = undefined;
    newEvent.value.endMonth = undefined;
    newEvent.value.endDay = undefined;
    newEvent.value.startTimeHour = undefined;
    newEvent.value.startTimeMinute = undefined;
    newEvent.value.endTimeHour = undefined;
    newEvent.value.endTimeMinute = undefined;
  }
  // 重置合并字段
  singleDateYear.value = undefined;
  singleDateMonth.value = undefined;
  singleDateDay.value = undefined;
  singleTimeHour.value = undefined;
  singleTimeMinute.value = undefined;
});

// 监听repeat变化，设置相关字段
watch(() => newEvent.value.repeat, (newRepeat) => {
  if (newRepeat === 'weekly' && (newEvent.value.type === 'meeting' || newEvent.value.type === 'default')) {
    newEvent.value.range = false;
  }
});

// 重置表单
const resetForm = () => {
  newEvent.value = {
    title: '',
    content: '',
    type: 'default',
    importance: 'R',
    repeat: 'none',
    weekdays: [],
    range: false,
    startYear: undefined,
    startMonth: undefined,
    startDay: undefined,
    endYear: undefined,
    endMonth: undefined,
    endDay: undefined,
    startTimeHour: undefined,
    startTimeMinute: undefined,
    endTimeHour: undefined,
    endTimeMinute: undefined,
    status: 'normal',
  };
  startYear.value = undefined;
  startMonth.value = undefined;
  startDay.value = undefined;
  endYear.value = undefined;
  endMonth.value = undefined;
  endDay.value = undefined;
  singleDateYear.value = undefined;
  singleDateMonth.value = undefined;
  singleDateDay.value = undefined;
  startHour.value = undefined;
  startMinute.value = undefined;
  endHour.value = undefined;
  endMinute.value = undefined;
  singleTimeHour.value = undefined;
  singleTimeMinute.value = undefined;
  validationErrors.value = [];
};

// 提交表单
const submitForm = async () => {
  const validation = validateCalendarEvent(newEvent.value);
  if (!validation.isValid) {
    validationErrors.value = validation.errors;
    return;
  }
  validationErrors.value = [];
  try {
    const event: CalendarEvent = {
      title: newEvent.value.title!,
      content: newEvent.value.content,
      type: newEvent.value.type!,
      importance: newEvent.value.importance!,
      repeat: newEvent.value.repeat!,
      weekdays: newEvent.value.weekdays!,
      range: newEvent.value.range!,
      startYear: newEvent.value.startYear,
      startMonth: newEvent.value.startMonth,
      startDay: newEvent.value.startDay,
      endYear: newEvent.value.endYear,
      endMonth: newEvent.value.endMonth,
      endDay: newEvent.value.endDay,
      startTimeHour: newEvent.value.startTimeHour,
      startTimeMinute: newEvent.value.startTimeMinute,
      endTimeHour: newEvent.value.endTimeHour,
      endTimeMinute: newEvent.value.endTimeMinute,
      status: newEvent.value.status!
    };
    const result = await createOrUpdateCalendarEvent(event);
    console.log('事件创建成功:', result);
    // 重置表单
    resetForm();
    // 可选：刷新事件列表
    // await getCalendarEvents();
  } catch (error) {
    console.error('创建事件失败:', error);
    validationErrors.value = ['创建事件失败，请重试'];
  }
};


</script>

<style scoped>
.CalendarEventCreate {
  display: flex;
  width: 100%;
  flex-wrap: wrap;
  gap: 8px;
  padding: 2rem;
}

.title {
  font-size: var(--font-size-title);
  font-weight: var(--font-weight-bold);
}

.session1,
.session2,
.session3,
.session4,
.session5,
.session6,
.session7,
.session8,
.session10,
.session12 {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  padding: 1rem 0;
  width: 100%;
}

.newEvent-key-1,
.newEvent-key-2,
.newEvent-key-3,
.newEvent-key-4,
.newEvent-key-5,
.newEvent-key-6,
.newEvent-key-7,
.newEvent-key-8,
.newEvent-key-10,
.newEvent-key-12 {
  display: flex;
  font-weight: var(--font-weight-bold);
  color: var(--fg-default);
  font-size: var(--font-size-normal);
  flex-shrink: 0;
  min-width: 150px;
}

.input-wrapper {
  flex: 1;
  gap: 8px;
  display: flex;
  flex-direction: row;
  align-items: center;

}



input[type="text"],
textarea,
select {
  display: flex;
  border: 2px solid var(--border-default);
  border-radius: 10px;
  color: var(--fg-default);
  font-size: var(--font-size-normal);
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
  width: 100%;
  box-sizing: border-box;
  flex: 1;
  padding: 0.5rem 0.5rem;
  white-space: nowrap;
}

textarea {
  resize: vertical;
  min-height: 200px;
  white-space: normal;
}

input[type="checkbox"] {
  appearance: none;
  width: 24px;
  height: 24px;
  border: 2px solid var(--border-default);
  border-radius: 4px;
  background: var(--bg-canvas);
  position: relative;
  cursor: pointer;
}

input[type="checkbox"]:checked {
  background: var(--accent-color);
  border-color: var(--accent-color);
}

input[type="checkbox"]:checked::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: var(--background-color);
  font-size: 12px;
  font-weight: bold;
}

label {
  display: flex;
  align-items: center;
  color: var(--text-color);
  font-size: var(--font-size-small);
  gap: 8px;
}

.fixed-value {
  color: var(--text-color);
  font-style: italic;
}

button {
  border: 2px solid var(--background-color3);
  border-radius: 10px;
  background: var(--background-color);
  color: var(--text-color);
  font-size: var(--font-size-normal);
  font-weight: var(--font-weight-bold);
  cursor: pointer;
  transition: background 0.3s ease, transform 0.2s ease;
  padding: 8px 16px;
}

button:hover {
  background: var(--background-color2);
  transform: scale(1.05);
}

button:active {
  transform: scale(0.95);
}

.errors {
  border: 2px solid var(--background-color3);
  background: #ffdddd;
  border: 1px solid #ffaaaa;
  border-radius: 10px;
  padding: 10px;
  color: #cc0000;
}

.button-container {
  display: flex;
  gap: 10px;
}

.session8 .velse,
.session10 .velse {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  flex: 1;
}

.velse div,
.velse .ycrispbiscuit-dropdown {
  padding-right: 10px;
}

.velse div:last-child,
.velse .ycrispbiscuit-dropdown:last-child {
  padding-right: 0;
}

.start,
.end {
  display: flex !important;
  flex-direction: row !important;
  align-items: center;
  gap: 16px;
  padding: 1rem 0;
}

.ycrispbiscuit-dropdown {
  flex: 1;
}

.input-wrapper ::v-deep(.ycrispbiscuit-dropdown) {
  width: auto !important;
  flex: 1 !important;
}

.ycrispbiscuit-dropdown .dropdown-selected {
  border: 2px solid var(--background-color3);
}

.start .newEvent-key-8,
.end .newEvent-key-8,
.start .newEvent-key-10,
.end .newEvent-key-10 {
  width: 180px;
}
</style>