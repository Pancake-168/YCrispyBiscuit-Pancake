import type { NocobaseUIRenderContext, NocobaseUISchemaNode } from '@/types/NocobaseUIRenderer'

export interface NocobaseUIAccessResult {
    hidden: boolean
    disabled: boolean
}

const normalizeStringArray = (value: unknown): string[] => {
    if (Array.isArray(value)) {
        return value.filter((item) => typeof item === 'string') as string[]
    }
    if (typeof value === 'string') {
        return [value]
    }
    return []
}

const extractAcl = (node: NocobaseUISchemaNode): string[] => {
    const metaAcl = node.meta?.['x-acl']
    return normalizeStringArray(metaAcl)
}

export const resolveNocobaseUIAccess = (
    node: NocobaseUISchemaNode,
    context: NocobaseUIRenderContext,
): NocobaseUIAccessResult => {
    const acl = extractAcl(node)
    if (!acl.length) {
        return { hidden: false, disabled: false }
    }
    if (context.mode === 'read') {
        return { hidden: false, disabled: true }
    }
    return { hidden: false, disabled: false }
}
