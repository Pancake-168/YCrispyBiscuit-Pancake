import type { NocobaseUIRenderContext, NocobaseUISchemaNode } from '@/types/NocobaseUIRenderer'
import type { NocobaseUIFormStore } from '@/utils/NocobaseUIFormStore'
import {
    createNocobaseUIRecord,
    updateNocobaseUIRecord,
    deleteNocobaseUIRecord,
} from '@/utils/NocobaseUIFormActions'
import { resolveNocobaseUIFieldPath } from '@/utils/NocobaseUIFieldBinding'

const resolveCollectionFromNode = (node: NocobaseUISchemaNode): string | undefined => {
    const fieldPath = node.bindings?.collectionField
    if (!fieldPath) {
        return undefined
    }
    return resolveNocobaseUIFieldPath(fieldPath).collection
}

const resolveActionType = (node: NocobaseUISchemaNode): 'create' | 'update' | 'delete' | 'cancel' | 'unknown' => {
    const useProps = node.useComponentProps || (node.meta?.['x-use-component-props'] as string | undefined)
    if (!useProps) {
        return 'unknown'
    }
    if (useProps.includes('Create')) return 'create'
    if (useProps.includes('Update')) return 'update'
    if (useProps.includes('Cancel')) return 'cancel'
    return 'unknown'
}

export const buildNocobaseUIActionHandler = (
    node: NocobaseUISchemaNode,
    context: NocobaseUIRenderContext,
    store: NocobaseUIFormStore,
) => {
    const actionType = resolveActionType(node)
    return async () => {
        if (actionType === 'cancel') {
            store.reset()
            return
        }
        if (!store.validate()) {
            return
        }
        const collectionName = resolveCollectionFromNode(node)
        if (!collectionName) {
            return
        }
        if (actionType === 'create') {
            await createNocobaseUIRecord(collectionName, store.values)
            store.dirty = false
            return
        }
        if (actionType === 'update') {
            const recordId = context.record?.id ?? store.values.id
            if (recordId === undefined || recordId === null) {
                return
            }
            await updateNocobaseUIRecord(collectionName, recordId as string | number, store.values)
            store.dirty = false
            return
        }
        if (actionType === 'delete') {
            const recordId = context.record?.id ?? store.values.id
            if (recordId === undefined || recordId === null) {
                return
            }
            await deleteNocobaseUIRecord(collectionName, recordId as string | number)
            store.dirty = false
        }
    }
}
