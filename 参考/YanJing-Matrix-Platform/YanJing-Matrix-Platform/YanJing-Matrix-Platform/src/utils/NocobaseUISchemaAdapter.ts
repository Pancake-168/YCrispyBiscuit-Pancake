import type {
    NocobaseUIRawSchemaNode,
    NocobaseUISchemaBindings,
    NocobaseUISchemaLayer,
    NocobaseUISchemaNode,
    NocobaseUISchemaNodeType,
    NocobaseUISchemaTree,
} from '@/types/NocobaseUIRenderer'

const fallbackIdPrefix = 'nocobase-ui-node'

const getString = (value: unknown): string | undefined => (typeof value === 'string' ? value : undefined)
const getObject = (value: unknown): Record<string, unknown> | undefined =>
    value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined

const getNodeId = (raw: NocobaseUIRawSchemaNode, index: number, warnings: string[]): string => {
    const id = getString(raw['x-uid']) || getString(raw.id) || getString(raw.uid)
    if (id) {
        return id
    }
    const fallbackId = `${fallbackIdPrefix}-${index}`
    warnings.push(`schema node missing id, fallback to ${fallbackId}`)
    return fallbackId
}

const resolveNodeType = (raw: NocobaseUIRawSchemaNode): NocobaseUISchemaNodeType => {
    const rawType = getString(raw.type)
    if (!rawType) {
        return 'unknown'
    }
    const allowed: NocobaseUISchemaNodeType[] = ['void', 'string', 'number', 'boolean', 'array', 'object', 'unknown']
    return allowed.includes(rawType as NocobaseUISchemaNodeType) ? (rawType as NocobaseUISchemaNodeType) : 'unknown'
}

const resolveLayer = (component?: string, decorator?: string): NocobaseUISchemaLayer => {
    if (component?.startsWith('Grid') || component === 'Grid.Row' || component === 'Grid.Col') {
        return 'layout'
    }
    if (component === 'FormV2' || decorator === 'FormBlockProvider') {
        return 'form'
    }
    if (component === 'CollectionField') {
        return 'field'
    }
    if (component?.startsWith('Action')) {
        return 'action'
    }
    if (component === 'FlowRoute') {
        return 'flow'
    }
    return 'unknown'
}

const resolveBindings = (raw: NocobaseUIRawSchemaNode): NocobaseUISchemaBindings => ({
    collectionField: getString(raw['x-collection-field']),
    dataSource: getString(raw['x-dataSource']) || getString(raw['x-data-source']),
    initializer: getString(raw['x-initializer']),
    toolbar: getString(raw['x-toolbar']),
    settings: getString(raw['x-settings']),
})

const resolveParentId = (raw: NocobaseUIRawSchemaNode): string | undefined =>
    getString(raw.parent) ||
    getString(raw.parentId) ||
    getString(raw['x-parent']) ||
    getString(raw['x-parent-uid'])

const appendChild = (parent: NocobaseUISchemaNode, child: NocobaseUISchemaNode) => {
    if (!parent.children) {
        parent.children = []
    }
    if (!parent.children.find((item) => item.id === child.id)) {
        parent.children.push(child)
    }
}

const appendSlotChild = (
    parent: NocobaseUISchemaNode,
    slotName: string,
    child: NocobaseUISchemaNode,
) => {
    if (!parent.slots) {
        parent.slots = {}
    }
    if (!parent.slots[slotName]) {
        parent.slots[slotName] = []
    }
    if (!parent.slots[slotName].find((item) => item.id === child.id)) {
        parent.slots[slotName].push(child)
    }
}

const resolveChildrenRefs = (raw: NocobaseUIRawSchemaNode): Array<string> => {
    const refs: string[] = []
    if (Array.isArray(raw.children)) {
        raw.children.forEach((item) => {
            if (typeof item === 'string') {
                refs.push(item)
            } else if (item && typeof item === 'object') {
                const itemId = getString((item as Record<string, unknown>)['x-uid']) || getString((item as Record<string, unknown>).id)
                if (itemId) {
                    refs.push(itemId)
                }
            }
        })
    }
    return refs
}

const resolveSlotRefs = (raw: NocobaseUIRawSchemaNode): Record<string, string[]> => {
    const slots: Record<string, string[]> = {}
    const rawSlots = getObject(raw.slots)
    if (!rawSlots) {
        return slots
    }
    Object.entries(rawSlots).forEach(([slotName, slotValue]) => {
        if (!Array.isArray(slotValue)) {
            return
        }
        const refs: string[] = []
        slotValue.forEach((item) => {
            if (typeof item === 'string') {
                refs.push(item)
            } else if (item && typeof item === 'object') {
                const itemId = getString((item as Record<string, unknown>)['x-uid']) || getString((item as Record<string, unknown>).id)
                if (itemId) {
                    refs.push(itemId)
                }
            }
        })
        if (refs.length) {
            slots[slotName] = refs
        }
    })
    return slots
}

const schemaCache = new Map<string, NocobaseUISchemaTree>()

const buildCacheKey = (uiSchemas: NocobaseUIRawSchemaNode[] | NocobaseUIRawSchemaNode): string => {
    try {
        return JSON.stringify(uiSchemas)
    } catch {
        return Array.isArray(uiSchemas) ? String(uiSchemas.length) : 'schema-tree'
    }
}

const normalizeSchemas = (input?: NocobaseUIRawSchemaNode[] | NocobaseUIRawSchemaNode | null) => {
    if (!input) return []
    if (Array.isArray(input)) return input
    const result: NocobaseUIRawSchemaNode[] = []
    let autoId = 0

    const walk = (node: NocobaseUIRawSchemaNode, parentId?: string) => {
        if (!node || typeof node !== 'object') return
        let currentId = getString(node['x-uid']) || getString(node.id) || getString(node.uid)
        if (!currentId) {
            autoId += 1
            currentId = `schema-tree-auto-${autoId}`
        }
        const normalizedNode = parentId
            ? { ...node, 'x-parent-uid': parentId, 'x-uid': currentId }
            : { ...node, 'x-uid': currentId }
        result.push(normalizedNode)

        const properties = getObject(node.properties)
        if (properties) {
            Object.values(properties).forEach((child) => {
                if (child && typeof child === 'object') {
                    walk(child as NocobaseUIRawSchemaNode, currentId)
                }
            })
        }

        const items = node.items
        if (items && typeof items === 'object') {
            if (Array.isArray(items)) {
                items.forEach((child) => {
                    if (child && typeof child === 'object') {
                        walk(child as NocobaseUIRawSchemaNode, currentId)
                    }
                })
            } else {
                walk(items as NocobaseUIRawSchemaNode, currentId)
            }
        }

        const rawSlots = getObject(node.slots)
        if (rawSlots) {
            Object.values(rawSlots).forEach((slotValue) => {
                if (Array.isArray(slotValue)) {
                    slotValue.forEach((child) => {
                        if (child && typeof child === 'object') {
                            walk(child as NocobaseUIRawSchemaNode, currentId)
                        }
                    })
                }
            })
        }

        if (Array.isArray(node.children)) {
            node.children.forEach((child) => {
                if (child && typeof child === 'object') {
                    walk(child as NocobaseUIRawSchemaNode, currentId)
                }
            })
        }
    }

    walk(input)
    return result
}

export const buildNocobaseUISchemaTree = (
    uiSchemasInput: NocobaseUIRawSchemaNode[] | NocobaseUIRawSchemaNode | null | undefined,
): NocobaseUISchemaTree => {
    const uiSchemas = normalizeSchemas(uiSchemasInput)
    const cacheKey = buildCacheKey(uiSchemasInput || [])
    const cached = schemaCache.get(cacheKey)
    if (cached) {
        return cached
    }
    const warnings: string[] = []
    const byId: Record<string, NocobaseUISchemaNode> = {}
    const nodesInOrder: NocobaseUISchemaNode[] = []

    uiSchemas.forEach((raw, index) => {
        const id = getNodeId(raw, index, warnings)
        const component = getString(raw['x-component'])
        const decorator = getString(raw['x-decorator'])
        const node: NocobaseUISchemaNode = {
            id,
            name: getString(raw.name),
            type: resolveNodeType(raw),
            component,
            decorator,
            props: getObject(raw['x-component-props']),
            decoratorProps: getObject(raw['x-decorator-props']),
            useComponentProps: getString(raw['x-use-component-props']),
            useDecoratorProps: getString(raw['x-use-decorator-props']),
            bindings: resolveBindings(raw),
            layout: getObject(raw.layout) || getObject(raw['x-layout']),
            layer: resolveLayer(component, decorator),
            meta: raw,
        }
        byId[id] = node
        nodesInOrder.push(node)
    })

    const roots: NocobaseUISchemaNode[] = []

    uiSchemas.forEach((raw, index) => {
        const nodeId = getNodeId(raw, index, warnings)
        const node = byId[nodeId]
        if (!node) {
            return
        }
        const parentId = resolveParentId(raw)
        if (parentId && byId[parentId]) {
            appendChild(byId[parentId], node)
        } else if (!parentId) {
            roots.push(node)
        }
        const childRefs = resolveChildrenRefs(raw)
        childRefs.forEach((childId) => {
            const child = byId[childId]
            if (child) {
                appendChild(node, child)
            }
        })
        const slotRefs = resolveSlotRefs(raw)
        Object.entries(slotRefs).forEach(([slotName, slotIds]) => {
            slotIds.forEach((slotId) => {
                const child = byId[slotId]
                if (child) {
                    appendSlotChild(node, slotName, child)
                }
            })
        })
    })

    nodesInOrder.forEach((node) => {
        if (!roots.find((item) => item.id === node.id)) {
            const hasParent = nodesInOrder.some((parent) =>
                parent.children?.some((child) => child.id === node.id),
            )
            const hasSlotParent = nodesInOrder.some((parent) =>
                Object.values(parent.slots ?? {}).some((children) =>
                    children.some((child) => child.id === node.id),
                ),
            )
            if (!hasParent && !hasSlotParent) {
                roots.push(node)
            }
        }
    })

    const tree = {
        roots,
        byId,
        warnings,
    }

    schemaCache.set(cacheKey, tree)
    return tree
}
