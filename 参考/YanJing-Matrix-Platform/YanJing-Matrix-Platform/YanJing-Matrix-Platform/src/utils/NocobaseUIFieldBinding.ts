import type { NocobaseUISchemaNode, NocobaseUIRenderContext } from '@/types/NocobaseUIRenderer'
import type { NocobaseUIFormStore } from '@/utils/NocobaseUIFormStore'

export interface NocobaseUIResolvedField {
    collection?: string
    field?: string
}

export const resolveNocobaseUIFieldPath = (path?: string): NocobaseUIResolvedField => {
    if (!path) {
        return {}
    }
    const [collection, field] = path.split('.')
    return {
        collection: collection || undefined,
        field: field || undefined,
    }
}

const resolveRecord = (context: NocobaseUIRenderContext): Record<string, unknown> | undefined => {
    if (context.record) {
        return context.record
    }
    if (context.records && context.records.length === 1) {
        return context.records[0]
    }
    return undefined
}

export const getNocobaseUIFieldValue = (
    node: NocobaseUISchemaNode,
    context: NocobaseUIRenderContext,
): unknown => {
    const fieldPath = node.bindings?.collectionField
    if (!fieldPath) {
        return undefined
    }
    const resolved = resolveNocobaseUIFieldPath(fieldPath)
    if (!resolved.field) {
        return undefined
    }
    const record = resolveRecord(context)
    if (!record) {
        return undefined
    }
    return record[resolved.field]
}

export const getNocobaseUILabel = (node: NocobaseUISchemaNode): string | undefined => {
    const metaTitle = node.meta && typeof node.meta['title'] === 'string' ? (node.meta['title'] as string) : undefined
    const rawLabel = metaTitle || node.name
    if (!rawLabel) {
        return undefined
    }
    const normalized = rawLabel
        .replace(/\{\{\s*t\(["'](.+?)["']\)\s*\}\}/g, '$1')
        .trim()
    return normalized
}

export const isNocobaseUIInputComponent = (component?: string): boolean =>
    Boolean(
        component &&
            ['Input', 'Select', 'DatePicker', 'Checkbox', 'Password', 'TextArea'].includes(component),
    )

export const buildNocobaseUIComponentProps = (
    node: NocobaseUISchemaNode,
    context: NocobaseUIRenderContext,
    store?: NocobaseUIFormStore,
): Record<string, unknown> => {
    const baseProps = { ...(node.props ?? {}) }
    const label = getNocobaseUILabel(node)
    const fieldPath = node.bindings?.collectionField
    const fieldKey = fieldPath ? resolveNocobaseUIFieldPath(fieldPath).field : undefined
    if (label && baseProps.label === undefined && node.component === 'CollectionField') {
        baseProps.label = label
    }
    const fieldValue = getNocobaseUIFieldValue(node, context)
    if (node.component === 'CollectionField' && baseProps.value === undefined) {
        baseProps.value = fieldValue
    }
    if (node.component === 'CollectionField' && fieldKey) {
        baseProps.fieldKey = fieldKey
        if (!baseProps.inputComponent) {
            const lowered = fieldKey.toLowerCase()
            if (lowered.includes('password')) {
                baseProps.inputComponent = 'Password'
            } else if (lowered.includes('email')) {
                baseProps.inputComponent = 'Input'
                baseProps.type = 'email'
            } else if (lowered.includes('phone')) {
                baseProps.inputComponent = 'Input'
                baseProps.type = 'tel'
            }
        }
    }
    if (isNocobaseUIInputComponent(node.component)) {
        const storeValue = fieldKey && store ? store.getValue(fieldKey) : undefined
        if (baseProps.modelValue === undefined) {
            baseProps.modelValue = storeValue ?? fieldValue ?? ''
        }
        if (fieldKey && store) {
            baseProps['onUpdate:modelValue'] = (value: unknown) => store.setValue(fieldKey, value)
        }
        if (context.mode === 'read') {
            baseProps.disabled = true
        }
    }
    return baseProps
}
