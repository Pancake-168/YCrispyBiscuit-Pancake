// 日历事件数据验证函数

import type { CalendarEvent } from '@/types/CalendarData';

// 验证结果接口
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}

/*
验证逻辑：
1. id：创建时不可选，完全后端生成，所以一般不需要不验证
2. title：必需，非空字符串
3. content：可选，字符串
4.type: 必需，必须是 'default' | 'meeting' | 'birthday' | 'holiday' | 'deadline' | 'goal' 之一


以下为逻辑验证：

当type为 birthday 时，repeat 应该是 yearly，weekdays禁用，range 应该为 false，startYear/startMonth/startDay必填，endYear/endMonth/endDay必填且相同、startTimeHour/startTimeMinute 和 endTimeHour/endTimeMinute 应该为空

当type为 holiday 时，repeat 应该是 none，weekdays禁用，range 可以为 true，如果为true，startYear/startMonth/startDay和endYear/endMonth/endDay必填且不同；如果为false，startYear/startMonth/startDay和endYear/endMonth/endDay必填且相同，startTimeHour/startTimeMinute 和 endTimeHour/endTimeMinute 选填，如果都填写且range为false，则必须endTime > startTime

当type为 deadline 时，repeat 应该是 none，weekdays禁用，range 应该为 false，startYear/startMonth/startDay和endYear/endMonth/endDay必填且相同、startTimeHour/startTimeMinute 和 endTimeHour/endTimeMinute 选填但如果提供endTime必须等于startTime

当type为 meeting 时，repeat 可以是 none、daily、weekly、monthly、yearly 之一
若为weekly，则weekdays必填且非空数组，range 应该为 false，startYear/startMonth/startDay和endYear/endMonth/endDay禁用、startTimeHour/startTimeMinute 和 endTimeHour/endTimeMinute 选填，如果都填写则必须endTime > startTime
若为monthly，则startYear/startMonth/endYear/endMonth禁用，其他同非weekly
若为yearly，则startYear/endYear禁用，其他同非weekly
若为daily，则startYear/startMonth/startDay/endYear/endMonth/endDay禁用，其他同非weekly
若非weekly，则weekdays禁用，range可选，若选则startYear/startMonth/startDay和endYear/endMonth/endDay必填且不为同一天，若不选则startYear/startMonth/startDay和endYear/endMonth/endDay必填且相同，startTimeHour/startTimeMinute 和 endTimeHour/endTimeMinute 选填，如果range为false且都填写则必须endTime > startTime

当type为goal，则repeat为none，下方除了status之外的所有字段禁用，status选填

当type为 default 时，repeat 可以是 none、daily、weekly、monthly、yearly 之一
若为weekly，则weekdays必填且非空数组，range 应该为 false，startYear/startMonth/startDay和endYear/endMonth/endDay禁用，startTimeHour/startTimeMinute 和 endTimeHour/endTimeMinute 选填，如果都填写则必须endTime > startTime
若为monthly，则startYear/startMonth/endYear/endMonth禁用，其他同非weekly
若为yearly，则startYear/endYear禁用，其他同非weekly
若为daily，则startYear/startMonth/startDay/endYear/endMonth/endDay禁用，其他同非weekly
若非weekly，则weekdays禁用，range可选，若选则startYear/startMonth/startDay和endYear/endMonth/endDay必填且不为同一天，若不选则startYear/startMonth/startDay和endYear/endMonth/endDay必填且相同，startTimeHour/startTimeMinute 和 endTimeHour/endTimeMinute 选填，如果range为false且都填写则必须endTime > startTime

*/














// 验证拆分后的日期字段
function validateDateFields(year: number | undefined, month: number | undefined, day: number | undefined, prefix: string): string[] {
    const errors: string[] = [];
    // 年份无限制（去掉1900-2100限制）
    if (month !== undefined && (month < 1 || month > 12)) {
        errors.push(`${prefix}Month: 月份无效 (1-12)`);
    }
    if (day !== undefined && (day < 1 || day > 31)) {
        errors.push(`${prefix}Day: 日无效 (1-31)`);
    }
    // 简单月份天数检查
    if (month && day) {
        const maxDays = new Date(year || 2000, month, 0).getDate();
        if (day > maxDays) {
            errors.push(`${prefix}Day: 该月最多 ${maxDays} 天`);
        }
    }
    return errors;
}



// 验证拆分后的时间字段
function validateTimeFields(hour: number | undefined, minute: number | undefined, prefix: string): string[] {
    const errors: string[] = [];
    if (hour !== undefined && (hour < 0 || hour > 23)) {
        errors.push(`${prefix}Hour: 小时无效 (0-23)`);
    }
    if (minute !== undefined && (minute < 0 || minute > 59)) {
        errors.push(`${prefix}Minute: 分钟无效 (0-59)`);
    }
    return errors;
}

// 验证事件类型
function validateType(event: Partial<CalendarEvent>): ValidationResult {
    const validTypes = ['default', 'meeting', 'birthday', 'holiday', 'deadline', 'goal'];
    if (!event.type || !validTypes.includes(event.type)) {
        return { isValid: false, errors: ['type: 必须是有效的类型 (default, meeting, birthday, holiday, deadline, goal)'] };
    }
    return { isValid: true, errors: [] };
}

// 验证重要性
function validateImportance(event: Partial<CalendarEvent>): ValidationResult {
    const validImportance = ['R', 'SR', 'SSR', 'SP'];
    if (event.importance && !validImportance.includes(event.importance)) {
        return { isValid: false, errors: ['importance: 必须是有效的等级 (R, SR, SSR, SP)'] };
    }
    return { isValid: true, errors: [] };
}

// 验证重复类型
function validateRepeat(event: Partial<CalendarEvent>): ValidationResult {
    const validRepeats = ['none', 'daily', 'weekly', 'monthly', 'yearly'];
    if (!event.repeat || !validRepeats.includes(event.repeat)) {
        return { isValid: false, errors: ['repeat: 必须是有效的重复类型 (none, daily, weekly, monthly, yearly)'] };
    }
    return { isValid: true, errors: [] };
}







export function validateCalendarEvent(event: Partial<CalendarEvent>): ValidationResult {


    let errors: string[] = [];


    // 基础字段验证
    if (!event.title || event.title.trim() === '') {
        errors.push('title: 标题为必填项且不能为空');
    }

    // 类型验证
    const typeValidation = validateType(event);
    if (!typeValidation.isValid) {
        errors.push(...typeValidation.errors);
    }

    // 如果基础验证失败，直接返回
    if (errors.length > 0) {
        return { isValid: false, errors };
    }

    // 重要性验证
    const importanceValidation = validateImportance(event);
    if (!importanceValidation.isValid) {
        errors.push(...importanceValidation.errors);
    }

    // 根据事件类型进行具体验证
    switch (event.type) {
        case 'birthday':
            errors.push(...validateBirthdayEvent(event));
            break;
        case 'holiday':
            errors.push(...validateHolidayEvent(event));
            break;
        case 'deadline':
            errors.push(...validateDeadlineEvent(event));
            break;
        case 'meeting':
            errors.push(...validateMeetingEvent(event));
            break;
        case 'goal':
            errors.push(...validateGoalEvent(event));
            break;
        case 'default':
            errors.push(...validateDefaultEvent(event));
            break;
    }

    return { isValid: errors.length === 0, errors };

}

// 验证birthday事件
function validateBirthdayEvent(event: Partial<CalendarEvent>): string[] {
    const errors: string[] = [];

    // repeat必须为yearly
    if (event.repeat !== 'yearly') {
        errors.push('birthday: repeat必须为yearly');
    }

    // weekdays必须禁用（空数组或undefined）
    if (event.weekdays && event.weekdays.length > 0) {
        errors.push('birthday: weekdays必须禁用');
    }

    // range必须为false
    if (event.range !== false) {
        errors.push('birthday: range必须为false');
    }

    // startYear/startMonth/startDay和endYear/endMonth/endDay必须相同且必填，但对于yearly，startYear/endYear禁用
    const startDateErrors = validateDateFields(event.startYear, event.startMonth, event.startDay, 'start');
    errors.push(...startDateErrors);
    const endDateErrors = validateDateFields(event.endYear, event.endMonth, event.endDay, 'end');
    errors.push(...endDateErrors);
    // 对于yearly，startYear和endYear应该undefined，不比较年份
    if (event.startMonth !== event.endMonth || event.startDay !== event.endDay) {
        errors.push('birthday: start和end日期必须相同');
    }
    // startYear和endYear必须undefined（因为yearly）
    if (event.startYear !== undefined || event.endYear !== undefined) {
        errors.push('birthday: startYear和endYear必须禁用');
    }

    // startTimeHour/startTimeMinute和endTimeHour/endTimeMinute必须为空
    if (event.startTimeHour !== undefined || event.startTimeMinute !== undefined || event.endTimeHour !== undefined || event.endTimeMinute !== undefined) {
        errors.push('birthday: startTime和endTime必须为空');
    }

    return errors;
}

// 验证holiday事件
function validateHolidayEvent(event: Partial<CalendarEvent>): string[] {
    const errors: string[] = [];

    // repeat必须为none
    if (event.repeat !== 'none') {
        errors.push('holiday: repeat必须为none');
    }

    // weekdays必须禁用
    if (event.weekdays && event.weekdays.length > 0) {
        errors.push('holiday: weekdays必须禁用');
    }

    // range可选：如果为true，startYear/startMonth/startDay和endYear/endMonth/endDay必填且不同；如果为false，startYear/startMonth/startDay和endYear/endMonth/endDay必填且相同
    if (event.range === true) {
        // range为true（跨天）：startYear/startMonth/startDay和endYear/endMonth/endDay必填且不同
        const startDateErrors = validateDateFields(event.startYear, event.startMonth, event.startDay, 'start');
        errors.push(...startDateErrors);
        const endDateErrors = validateDateFields(event.endYear, event.endMonth, event.endDay, 'end');
        errors.push(...endDateErrors);
        if (event.startYear === event.endYear && event.startMonth === event.endMonth && event.startDay === event.endDay) {
            errors.push('holiday range=true: start和end日期必须不同');
        }
    } else if (event.range === false) {
        // range为false（非跨天）：startYear/startMonth/startDay和endYear/endMonth/endDay必填且相同
        const startDateErrors = validateDateFields(event.startYear, event.startMonth, event.startDay, 'start');
        errors.push(...startDateErrors);
        const endDateErrors = validateDateFields(event.endYear, event.endMonth, event.endDay, 'end');
        errors.push(...endDateErrors);
        if (event.startYear !== event.endYear || event.startMonth !== event.endMonth || event.startDay !== event.endDay) {
            errors.push('holiday range=false: start和end日期必须相同');
        }
    } else {
        // range未定义或无效，必须明确定义为true或false
        errors.push('holiday: range必须定义为true或false');
    }

    // startTimeHour/startTimeMinute和endTimeHour/endTimeMinute选填，如果都填写且range为false，则必须endTime > startTime
    const startTimeErrors = validateTimeFields(event.startTimeHour, event.startTimeMinute, 'startTime');
    errors.push(...startTimeErrors);
    const endTimeErrors = validateTimeFields(event.endTimeHour, event.endTimeMinute, 'endTime');
    errors.push(...endTimeErrors);
    if (event.startTimeHour !== undefined && event.startTimeMinute !== undefined && event.endTimeHour !== undefined && event.endTimeMinute !== undefined) {
        const startTime = event.startTimeHour * 60 + event.startTimeMinute;
        const endTime = event.endTimeHour * 60 + event.endTimeMinute;
        if (event.range === false && startTime >= endTime) {
            errors.push('holiday: endTime必须晚于startTime');
        }
    }

    return errors;
}

// 验证deadline事件
function validateDeadlineEvent(event: Partial<CalendarEvent>): string[] {
    const errors: string[] = [];

    // repeat必须为none
    if (event.repeat !== 'none') {
        errors.push('deadline: repeat必须为none');
    }

    // weekdays必须禁用
    if (event.weekdays && event.weekdays.length > 0) {
        errors.push('deadline: weekdays必须禁用');
    }

    // range必须为false
    if (event.range !== false) {
        errors.push('deadline: range必须为false');
    }

    // startYear/startMonth/startDay和endYear/endMonth/endDay必须相同且必填
    const startDateErrors = validateDateFields(event.startYear, event.startMonth, event.startDay, 'start');
    errors.push(...startDateErrors);
    const endDateErrors = validateDateFields(event.endYear, event.endMonth, event.endDay, 'end');
    errors.push(...endDateErrors);
    if (event.startYear !== event.endYear || event.startMonth !== event.endMonth || event.startDay !== event.endDay) {
        errors.push('deadline: start和end日期必须相同');
    }

    // startTimeHour/startTimeMinute和endTimeHour/endTimeMinute必须同时提供且相等
    const startTimeErrors = validateTimeFields(event.startTimeHour, event.startTimeMinute, 'startTime');
    errors.push(...startTimeErrors);
    const endTimeErrors = validateTimeFields(event.endTimeHour, event.endTimeMinute, 'endTime');
    errors.push(...endTimeErrors);
    if ((event.startTimeHour === undefined || event.startTimeMinute === undefined) && (event.endTimeHour !== undefined || event.endTimeMinute !== undefined)) {
        errors.push('deadline: startTime和endTime必须同时提供');
    }
    if (event.startTimeHour !== undefined && event.startTimeMinute !== undefined && event.endTimeHour !== undefined && event.endTimeMinute !== undefined) {
        if (event.startTimeHour !== event.endTimeHour || event.startTimeMinute !== event.endTimeMinute) {
            errors.push('deadline: startTime和endTime必须相等');
        }
    }

    return errors;
}

// 验证meeting事件
function validateMeetingEvent(event: Partial<CalendarEvent>): string[] {
    const errors: string[] = [];

    // repeat验证
    const repeatValidation = validateRepeat(event);
    if (!repeatValidation.isValid) {
        errors.push(...repeatValidation.errors);
    }

    if (event.repeat === 'weekly') {
        // weekly情况：weekdays必填且非空
        if (!event.weekdays || event.weekdays.length === 0) {
            errors.push('meeting weekly: weekdays为必填项且不能为空');
        }

        // range必须为false
        if (event.range !== false) {
            errors.push('meeting weekly: range必须为false');
        }

        // startYear/startMonth/startDay和endYear/endMonth/endDay禁用（应该为空）
        if (event.startYear !== undefined || event.startMonth !== undefined || event.startDay !== undefined ||
            event.endYear !== undefined || event.endMonth !== undefined || event.endDay !== undefined) {
            errors.push('meeting weekly: start和end日期必须禁用');
        }

        // startTimeHour/startTimeMinute和endTimeHour/endTimeMinute选填，如果都填写，则必须endTime > startTime
        const startTimeErrors = validateTimeFields(event.startTimeHour, event.startTimeMinute, 'startTime');
        errors.push(...startTimeErrors);
        const endTimeErrors = validateTimeFields(event.endTimeHour, event.endTimeMinute, 'endTime');
        errors.push(...endTimeErrors);
        if (event.startTimeHour !== undefined && event.startTimeMinute !== undefined && event.endTimeHour !== undefined && event.endTimeMinute !== undefined) {
            const startTime = event.startTimeHour * 60 + event.startTimeMinute;
            const endTime = event.endTimeHour * 60 + event.endTimeMinute;
            if (startTime >= endTime) {
                errors.push('meeting weekly: endTime必须晚于startTime');
            }
        }
    } else if (event.repeat === 'monthly') {
        // monthly情况：startYear/startMonth/endYear/endMonth禁用，其他同非weekly
        if (event.startYear !== undefined || event.startMonth !== undefined || event.endYear !== undefined || event.endMonth !== undefined) {
            errors.push('meeting monthly: startYear/startMonth/endYear/endMonth必须禁用');
        }
        // 继续非weekly逻辑
        validateMeetingNonWeekly(event, errors);
    } else if (event.repeat === 'yearly') {
        // yearly情况：startYear/endYear禁用，其他同非weekly
        if (event.startYear !== undefined || event.endYear !== undefined) {
            errors.push('meeting yearly: startYear/endYear必须禁用');
        }
        // 继续非weekly逻辑
        validateMeetingNonWeekly(event, errors);
    } else if (event.repeat === 'daily') {
        // daily情况：startYear/startMonth/startDay/endYear/endMonth/endDay禁用，其他同非weekly
        if (event.startYear !== undefined || event.startMonth !== undefined || event.startDay !== undefined ||
            event.endYear !== undefined || event.endMonth !== undefined || event.endDay !== undefined) {
            errors.push('meeting daily: start和end日期必须禁用');
        }
        // 继续非weekly逻辑
        validateMeetingNonWeekly(event, errors);
    } else {
        // 非weekly情况
        validateMeetingNonWeekly(event, errors);
    }

    return errors;
}

function validateMeetingNonWeekly(event: Partial<CalendarEvent>, errors: string[]) {
    // 非weekly情况：weekdays必须禁用
    if (event.weekdays && event.weekdays.length > 0) {
        errors.push('meeting非weekly: weekdays必须禁用');
    }

    // range可选
    if (event.range === true) {
        // 跨天：startYear/startMonth/startDay和endYear/endMonth/endDay必填且不同
        const startDateErrors = validateDateFields(event.startYear, event.startMonth, event.startDay, 'start');
        errors.push(...startDateErrors);
        const endDateErrors = validateDateFields(event.endYear, event.endMonth, event.endDay, 'end');
        errors.push(...endDateErrors);
        // 根据repeat类型，跳过相应字段的比较
        let datesEqual = true;
        if (event.repeat !== 'yearly' && event.repeat !== 'daily') {
            datesEqual = datesEqual && (event.startYear === event.endYear);
        }
        if (event.repeat !== 'monthly' && event.repeat !== 'daily') {
            datesEqual = datesEqual && (event.startMonth === event.endMonth);
        }
        if (event.repeat !== 'daily') {
            datesEqual = datesEqual && (event.startDay === event.endDay);
        }
        if (datesEqual) {
            errors.push('meeting跨天: start和end日期必须不同');
        }
    } else {
        // 非跨天：startYear/startMonth/startDay和endYear/endMonth/endDay必填且相同
        const startDateErrors = validateDateFields(event.startYear, event.startMonth, event.startDay, 'start');
        errors.push(...startDateErrors);
        const endDateErrors = validateDateFields(event.endYear, event.endMonth, event.endDay, 'end');
        errors.push(...endDateErrors);
        // 根据repeat类型，跳过相应字段的比较
        let datesEqual = true;
        if (event.repeat !== 'yearly' && event.repeat !== 'daily') {
            datesEqual = datesEqual && (event.startYear === event.endYear);
        }
        if (event.repeat !== 'monthly' && event.repeat !== 'daily') {
            datesEqual = datesEqual && (event.startMonth === event.endMonth);
        }
        if (event.repeat !== 'daily') {
            datesEqual = datesEqual && (event.startDay === event.endDay);
        }
        if (!datesEqual) {
            errors.push('meeting非跨天: start和end日期必须相同');
        }
    }

    // startTimeHour/startTimeMinute和endTimeHour/endTimeMinute选填，如果range为false且都填写，则必须endTime > startTime
    const startTimeErrors = validateTimeFields(event.startTimeHour, event.startTimeMinute, 'startTime');
    errors.push(...startTimeErrors);
    const endTimeErrors = validateTimeFields(event.endTimeHour, event.endTimeMinute, 'endTime');
    errors.push(...endTimeErrors);
    if (event.startTimeHour !== undefined && event.startTimeMinute !== undefined && event.endTimeHour !== undefined && event.endTimeMinute !== undefined) {
        const startTime = event.startTimeHour * 60 + event.startTimeMinute;
        const endTime = event.endTimeHour * 60 + event.endTimeMinute;
        if (event.range === false && startTime >= endTime) {
            errors.push('meeting: endTime必须晚于startTime');
        }
    }
}

// 验证goal事件
function validateGoalEvent(event: Partial<CalendarEvent>): string[] {
    const errors: string[] = [];

    // repeat必须为none
    if (event.repeat !== 'none') {
        errors.push('goal: repeat必须为none');
    }

    // 其他字段应该禁用（为空或默认值）
    if (event.weekdays && event.weekdays.length > 0) {
        errors.push('goal: weekdays必须禁用');
    }
    if (event.range !== false && event.range !== undefined) {
        errors.push('goal: range必须禁用');
    }
    if (event.startYear !== undefined || event.startMonth !== undefined || event.startDay !== undefined ||
        event.endYear !== undefined || event.endMonth !== undefined || event.endDay !== undefined) {
        errors.push('goal: start和end日期必须禁用');
    }
    if (event.startTimeHour !== undefined || event.startTimeMinute !== undefined ||
        event.endTimeHour !== undefined || event.endTimeMinute !== undefined) {
        errors.push('goal: startTime和endTime必须禁用');
    }

    // status选填（这里不验证，因为是可选的）

    return errors;
}

// 验证default事件
function validateDefaultEvent(event: Partial<CalendarEvent>): string[] {
    const errors: string[] = [];

    // repeat验证
    const repeatValidation = validateRepeat(event);
    if (!repeatValidation.isValid) {
        errors.push(...repeatValidation.errors);
    }

    if (event.repeat === 'weekly') {
        // weekly情况：weekdays必填且非空
        if (!event.weekdays || event.weekdays.length === 0) {
            errors.push('default weekly: weekdays为必填项且不能为空');
        }

        // range必须为false
        if (event.range !== false) {
            errors.push('default weekly: range必须为false');
        }

        // startYear/startMonth/startDay和endYear/endMonth/endDay禁用
        if (event.startYear !== undefined || event.startMonth !== undefined || event.startDay !== undefined ||
            event.endYear !== undefined || event.endMonth !== undefined || event.endDay !== undefined) {
            errors.push('default weekly: start和end日期必须禁用');
        }

        // startTimeHour/startTimeMinute和endTimeHour/endTimeMinute选填，如果都填写，则必须endTime > startTime
        const startTimeErrors = validateTimeFields(event.startTimeHour, event.startTimeMinute, 'startTime');
        errors.push(...startTimeErrors);
        const endTimeErrors = validateTimeFields(event.endTimeHour, event.endTimeMinute, 'endTime');
        errors.push(...endTimeErrors);
        if (event.startTimeHour !== undefined && event.startTimeMinute !== undefined && event.endTimeHour !== undefined && event.endTimeMinute !== undefined) {
            const startTime = event.startTimeHour * 60 + event.startTimeMinute;
            const endTime = event.endTimeHour * 60 + event.endTimeMinute;
            if (startTime >= endTime) {
                errors.push('default weekly: endTime必须晚于startTime');
            }
        }
    } else if (event.repeat === 'monthly') {
        // monthly情况：startYear/startMonth/endYear/endMonth禁用，其他同非weekly
        if (event.startYear !== undefined || event.startMonth !== undefined || event.endYear !== undefined || event.endMonth !== undefined) {
            errors.push('default monthly: startYear/startMonth/endYear/endMonth必须禁用');
        }
        // 继续非weekly逻辑
        validateDefaultNonWeekly(event, errors);
    } else if (event.repeat === 'yearly') {
        // yearly情况：startYear/endYear禁用，其他同非weekly
        if (event.startYear !== undefined || event.endYear !== undefined) {
            errors.push('default yearly: startYear/endYear必须禁用');
        }
        // 继续非weekly逻辑
        validateDefaultNonWeekly(event, errors);
    } else if (event.repeat === 'daily') {
        // daily情况：startYear/startMonth/startDay/endYear/endMonth/endDay禁用，其他同非weekly
        if (event.startYear !== undefined || event.startMonth !== undefined || event.startDay !== undefined ||
            event.endYear !== undefined || event.endMonth !== undefined || event.endDay !== undefined) {
            errors.push('default daily: start和end日期必须禁用');
        }
        // 继续非weekly逻辑
        validateDefaultNonWeekly(event, errors);
    } else {
        // 非weekly情况
        validateDefaultNonWeekly(event, errors);
    }

    return errors;
}

function validateDefaultNonWeekly(event: Partial<CalendarEvent>, errors: string[]) {
    // 非weekly情况：weekdays必须禁用
    if (event.weekdays && event.weekdays.length > 0) {
        errors.push('default非weekly: weekdays必须禁用');
    }

    // range可选
    if (event.range === true) {
        // 跨天：startYear/startMonth/startDay和endYear/endMonth/endDay必填且不同
        const startDateErrors = validateDateFields(event.startYear, event.startMonth, event.startDay, 'start');
        errors.push(...startDateErrors);
        const endDateErrors = validateDateFields(event.endYear, event.endMonth, event.endDay, 'end');
        errors.push(...endDateErrors);
        // 根据repeat类型，跳过相应字段的比较
        let datesEqual = true;
        if (event.repeat !== 'yearly' && event.repeat !== 'daily') {
            datesEqual = datesEqual && (event.startYear === event.endYear);
        }
        if (event.repeat !== 'monthly' && event.repeat !== 'daily') {
            datesEqual = datesEqual && (event.startMonth === event.endMonth);
        }
        if (event.repeat !== 'daily') {
            datesEqual = datesEqual && (event.startDay === event.endDay);
        }
        if (datesEqual) {
            errors.push('default跨天: start和end日期必须不同');
        }
    } else {
        // 非跨天：startYear/startMonth/startDay和endYear/endMonth/endDay必填且相同
        const startDateErrors = validateDateFields(event.startYear, event.startMonth, event.startDay, 'start');
        errors.push(...startDateErrors);
        const endDateErrors = validateDateFields(event.endYear, event.endMonth, event.endDay, 'end');
        errors.push(...endDateErrors);
        // 根据repeat类型，跳过相应字段的比较
        let datesEqual = true;
        if (event.repeat !== 'yearly' && event.repeat !== 'daily') {
            datesEqual = datesEqual && (event.startYear === event.endYear);
        }
        if (event.repeat !== 'monthly' && event.repeat !== 'daily') {
            datesEqual = datesEqual && (event.startMonth === event.endMonth);
        }
        if (event.repeat !== 'daily') {
            datesEqual = datesEqual && (event.startDay === event.endDay);
        }
        if (!datesEqual) {
            errors.push('default非跨天: start和end日期必须相同');
        }
    }

    // startTimeHour/startTimeMinute和endTimeHour/endTimeMinute选填，如果range为false且都填写，则必须endTime > startTime
    const startTimeErrors = validateTimeFields(event.startTimeHour, event.startTimeMinute, 'startTime');
    errors.push(...startTimeErrors);
    const endTimeErrors = validateTimeFields(event.endTimeHour, event.endTimeMinute, 'endTime');
    errors.push(...endTimeErrors);
    if (event.startTimeHour !== undefined && event.startTimeMinute !== undefined && event.endTimeHour !== undefined && event.endTimeMinute !== undefined) {
        const startTime = event.startTimeHour * 60 + event.startTimeMinute;
        const endTime = event.endTimeHour * 60 + event.endTimeMinute;
        if (event.range === false && startTime >= endTime) {
            errors.push('default: endTime必须晚于startTime');
        }
    }
}