import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    initialized: false as boolean,
  }),
  actions: {
    setInitialized(v: boolean) {
      this.initialized = v
    },
  },
})
