import { reactive } from 'vue'
import type { InjectionKey } from 'vue'

export interface NocobaseUIFormStore {
    values: Record<string, unknown>
    dirty: boolean
    setValue: (key: string, value: unknown) => void
    getValue: (key: string) => unknown
    reset: () => void
    validate: () => boolean
}

export const NocobaseUIFormStoreKey: InjectionKey<NocobaseUIFormStore> = Symbol('NocobaseUIFormStore')

export const createNocobaseUIFormStore = (initialValues?: Record<string, unknown>): NocobaseUIFormStore => {
    const baseValues = { ...(initialValues ?? {}) }

    const store = reactive({
        values: { ...baseValues },
        dirty: false as boolean,
        setValue(key: string, value: unknown) {
            this.values[key] = value
            this.dirty = true
        },
        getValue(key: string) {
            return this.values[key]
        },
        reset() {
            this.values = { ...baseValues }
            this.dirty = false
        },
        validate() {
            return true
        },
    }) as NocobaseUIFormStore

    return store
}
