import type { NocobaseUISchemaTree } from '@/types/NocobaseUIRenderer'
import { getNocobaseUIComponent } from '@/utils/NocobaseUIRendererRegistry'

export interface NocobaseUIDebugSnapshot {
    warnings: string[]
    unknownComponents: string[]
    nodeCount: number
}

export const buildNocobaseUIDebugSnapshot = (tree: NocobaseUISchemaTree): NocobaseUIDebugSnapshot => {
    const unknownComponents = new Set<string>()
    Object.values(tree.byId).forEach((node) => {
        const componentName = node.component ?? node.decorator
        if (!componentName) {
            return
        }
        const component = getNocobaseUIComponent(componentName)
        if (componentName && component && (component as any).name === 'NocobaseUIUnknown') {
            unknownComponents.add(componentName)
        }
    })
    return {
        warnings: tree.warnings,
        unknownComponents: Array.from(unknownComponents),
        nodeCount: Object.keys(tree.byId).length,
    }
}
