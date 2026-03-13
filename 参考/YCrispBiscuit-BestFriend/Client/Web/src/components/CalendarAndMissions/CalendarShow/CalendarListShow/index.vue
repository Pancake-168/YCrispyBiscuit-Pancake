<template>
  <div class="CalendarEventCreate">
    <div class="title">事件列表</div>
    <div class="List" v-for="newEvent in AllEvent" :key="newEvent.id">
      <div class="session1">
        <div class="display-wrapper">{{ newEvent.title || '-' }}</div>
      </div>
    
      <div class="session3">
        <div class="display-wrapper">{{ labelFor(typeOptions, newEvent.type) }}</div>
      </div>
      <div class="session4">
        <div class="display-wrapper">{{ labelFor(importanceOptions, newEvent.importance) }}</div>
      </div>
      <div class="session5" v-if="showRepeatOf(newEvent)">
        <div class="display-wrapper">{{ labelFor(repeatOptions, newEvent.repeat) }}</div>
        <span v-if="isBirthdayOf(newEvent) || isHolidayOf(newEvent) || isDeadlineOf(newEvent) || isGoalOf(newEvent)"
          class="fixed-value">固定为: {{ isBirthdayOf(newEvent) ? '每年' : (isHolidayOf(newEvent) || isDeadlineOf(newEvent)
            || isGoalOf(newEvent) ? '不重复' : '') }}</span>
      </div>
      <div class="session6" v-if="showWeekdaysOf(newEvent)">
        <div class="display-wrapper">{{ weekdaysLabel(newEvent.weekdays) }}</div>
      </div>
      <div class="session7" v-if="showRangeOf(newEvent)">
        <div class="display-wrapper">{{ newEvent.range ? '是' : '否' }}</div>
      </div>
      <div class="session8" v-if="showDateOf(newEvent)">
        <div>
          <!-- 合并日期框（birthday和deadline） -->
          <div v-if="isSingleDateOf(newEvent)" class="start">
            <div v-if="!hideStartYearOf(newEvent)">{{ newEvent.startYear || '' }} 年</div>
            <div v-if="!hideStartMonthOf(newEvent)">{{ newEvent.startMonth || '' }} 月</div>
            <div v-if="!hideStartDayOf(newEvent)">{{ newEvent.startDay || '' }} 日</div>
          </div>
          <div v-else class="velse">
            <div class="start">
              <div class="newEvent-key-8">开始日期：</div>
              <div class="display-wrapper">{{ newEvent.startYear || '' }}-{{ newEvent.startMonth || '' }}-{{
                newEvent.startDay || '' }}</div>
            </div>
            <div class="end">
              <!-- 结束日期：根据type和range显示 -->
              <div v-if="newEvent.type === 'holiday' && newEvent.range === true" class="newEvent-key-8">
                结束日期：</div>
              <div v-if="newEvent.type === 'holiday' && newEvent.range === true" class="input-wrapper">
                <div class="display-wrapper">{{ newEvent.endYear || '' }}-{{ newEvent.endMonth || '' }}-{{
                  newEvent.endDay || '' }}</div>
              </div>
              <!-- 结束日期：meeting和default根据range显示 -->
              <div v-if="(newEvent.type === 'meeting' || newEvent.type === 'default') && newEvent.range === true"
                class="newEvent-key-8">结束日期：</div>
              <div v-if="(newEvent.type === 'meeting' || newEvent.type === 'default') && newEvent.range === true"
                class="input-wrapper">
                <div class="display-wrapper">{{ newEvent.endYear || '' }}-{{ newEvent.endMonth || '' }}-{{
                  newEvent.endDay || '' }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="session10" v-if="showTimeOf(newEvent)">
        <div v-if="isSingleTimeOf(newEvent)" class="start">
          <div class="newEvent-key-10">时间：</div>
          <div class="input-wrapper">
            <div class="display-wrapper">{{ newEvent.startTimeHour || '00' }}:{{ newEvent.startTimeMinute || '00' }}
            </div>
          </div>
        </div>
        <div v-else class="velse">
          <div class="start">
            <div class="newEvent-key-10">开始时间：</div>
            <div class="display-wrapper">{{ newEvent.startTimeHour || '00' }}:{{ newEvent.startTimeMinute || '00' }}
            </div>
          </div>
        </div>

        <div class="end">
          <div class="newEvent-key-10">结束时间：</div>
          <div class="display-wrapper">{{ newEvent.endTimeHour || '00' }}:{{ newEvent.endTimeMinute || '00' }}</div>
        </div>
      </div>
      <div class="session12">
        <div class="newEvent-key-12">状态：</div>
        <div class="input-wrapper">
          <div class="display-wrapper">{{ labelFor(statusOptions, newEvent.status) }}</div>
        </div>
      </div>


    </div>

  </div>

</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { CalendarEvent } from '@/types/CalendarData';
import { useCalendarStore } from '@/stores/Calendar';



const calendarStore = useCalendarStore();
const AllEvent = calendarStore.events

// 表单编辑相关的脚本状态已移除；该页面仅做只读展示






// 只读展示，移除了表单的本地输入字段与日期/时间计算逻辑

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

// validationErrors removed — list is read-only now

const statusOptions = computed(() => [
  { value: 'normal', label: '正常' },
  { value: 'completed', label: '已完成' },
  { value: 'canceled', label: '已取消' }
]);

// (removed script-level computed/display flags in favor of per-item helper functions)

// Per-item helper functions so template can pass the loop item (newEvent) and get correct visibility
function isBirthdayOf(e: CalendarEvent) { return e.type === 'birthday' }
function isHolidayOf(e: CalendarEvent) { return e.type === 'holiday' }
function isDeadlineOf(e: CalendarEvent) { return e.type === 'deadline' }
function isGoalOf(e: CalendarEvent) { return e.type === 'goal' }

function showRepeatOf(e: CalendarEvent) { return !isBirthdayOf(e) && !isHolidayOf(e) && !isDeadlineOf(e) && !isGoalOf(e) }
function showWeekdaysOf(e: CalendarEvent) { return (e.type === 'meeting' || e.type === 'default') && e.repeat === 'weekly' }
function showRangeOf(e: CalendarEvent) { return !isBirthdayOf(e) && !isDeadlineOf(e) && !isGoalOf(e) && !(e.type === 'meeting' && e.repeat === 'weekly') && !(e.type === 'default' && e.repeat === 'weekly') }
function showDateOf(e: CalendarEvent) { return !isGoalOf(e) && !(e.type === 'meeting' && e.repeat === 'weekly') && !(e.type === 'default' && e.repeat === 'weekly') }
function showTimeOf(e: CalendarEvent) { return !isBirthdayOf(e) && !isGoalOf(e) }

function isSingleDateOf(e: CalendarEvent) {
  const singleTypes = ['birthday', 'deadline'];
  const rangeTypes = ['meeting', 'default', 'holiday'];
  return singleTypes.includes(e.type) || (rangeTypes.includes(e.type) && !e.range);
}
function isSingleTimeOf(e: CalendarEvent) { return e.type === 'deadline' }

function hideStartYearOf(e: CalendarEvent) {
  if (e.type === 'birthday') return true;
  if ((e.type === 'meeting' || e.type === 'default') && (e.repeat === 'yearly' || e.repeat === 'monthly' || e.repeat === 'daily')) return true;
  return false;
}
function hideStartMonthOf(e: CalendarEvent) {
  if ((e.type === 'meeting' || e.type === 'default') && (e.repeat === 'monthly' || e.repeat === 'daily')) return true;
  return false;
}
function hideStartDayOf(e: CalendarEvent) {
  if ((e.type === 'meeting' || e.type === 'default') && e.repeat === 'daily') return true;
  return false;
}

// helpers for rendering labels and weekdays in display mode
function labelFor(options: any, value: any) {
  const opts = (options && (options as any).value) ? (options as any).value : options;
  const found = opts?.find((o: any) => o.value === value);
  return found ? found.label : (value ?? '-');
}

function weekdaysLabel(arr: number[] | undefined) {
  if (!arr || arr.length === 0) return '-';
  const names = ['星期天', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  return arr.map(i => names[i] ?? i).join(', ');
}

// 表单监听器（watch）逻辑已移除 — 页面仅做事件只读展示


</script>



<style scoped>
.CalendarEventCreate {
  width: 100%;
  padding: 1.5rem;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.title {
  font-size: var(--font-size-title);
  font-weight: var(--font-weight-bold);
  color: var(--background-color3);
}

.List {
  width: 100%;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1.5rem;
}

.session1 {
  display: flex;
  align-items: center;
  font-size: var(--font-size-title);

}
</style>