import type { InjectionKey } from 'vue'
import type { NocobaseUIRenderContext } from '@/types/NocobaseUIRenderer'

export const NocobaseUIRenderContextKey: InjectionKey<NocobaseUIRenderContext> = Symbol('NocobaseUIRenderContext')

export const createNocobaseUIRenderContext = (
    context?: NocobaseUIRenderContext,
): NocobaseUIRenderContext => ({
    mode: context?.mode ?? 'read',
    collections: context?.collections ?? [],
    records: context?.records ?? [],
    record: context?.record,
})
