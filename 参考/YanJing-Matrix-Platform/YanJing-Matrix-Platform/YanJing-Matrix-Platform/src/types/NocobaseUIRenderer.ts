export type NocobaseUIRawSchemaNode = Record<string, unknown>

export type NocobaseUISchemaNodeType = 'void' | 'string' | 'number' | 'boolean' | 'array' | 'object' | 'unknown'

export type NocobaseUISchemaLayer = 'layout' | 'form' | 'field' | 'action' | 'flow' | 'unknown'

export interface NocobaseUISchemaBindings {
    collectionField?: string
    dataSource?: string
    initializer?: string
    toolbar?: string
    settings?: string
}

export interface NocobaseUISchemaNode {
    id: string
    name?: string
    type: NocobaseUISchemaNodeType
    component?: string
    decorator?: string
    props?: Record<string, unknown>
    decoratorProps?: Record<string, unknown>
    useComponentProps?: string
    useDecoratorProps?: string
    bindings?: NocobaseUISchemaBindings
    children?: NocobaseUISchemaNode[]
    slots?: Record<string, NocobaseUISchemaNode[]>
    layout?: Record<string, unknown>
    layer?: NocobaseUISchemaLayer
    meta?: NocobaseUIRawSchemaNode
}

export interface NocobaseUISchemaTree {
    roots: NocobaseUISchemaNode[]
    byId: Record<string, NocobaseUISchemaNode>
    warnings: string[]
}

export interface NocobaseUICollectionsMeta {
    name: string
    title?: string
    titleField?: string
    filterTargetKey?: string
    sortable?: boolean | string
    [key: string]: unknown
}

export interface NocobaseUIRecordsList<TRecord extends Record<string, unknown> = Record<string, unknown>> {
    data: TRecord[]
    total?: number
}

export interface NocobaseUIDataBundle {
    collections?: NocobaseUICollectionsMeta[]
    records?: NocobaseUIRecordsList
}

export type NocobaseUIRenderMode = 'read' | 'edit' | 'submit'

export interface NocobaseUIRenderContext {
    mode?: NocobaseUIRenderMode
    collections?: NocobaseUICollectionsMeta[]
    records?: Array<Record<string, unknown>>
    record?: Record<string, unknown>
}
