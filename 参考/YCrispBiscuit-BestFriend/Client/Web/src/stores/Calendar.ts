import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { CalendarEvent } from '@/types/CalendarData'

export const useCalendarStore = defineStore('calendar', () => {
    const events = ref<CalendarEvent[]>([])
    const currentEvent = ref<CalendarEvent | null>(null)
    function setEvents(list: CalendarEvent[]) {
        events.value = list
    }
    function clearEvents() {
        events.value = []
    }
    function setCurrentEvent(event: CalendarEvent | null) {
        currentEvent.value = event
    }
    return { events, currentEvent, setEvents, clearEvents, setCurrentEvent }
})