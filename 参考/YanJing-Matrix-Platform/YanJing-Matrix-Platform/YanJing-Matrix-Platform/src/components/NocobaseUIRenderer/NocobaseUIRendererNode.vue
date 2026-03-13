<script lang="ts">
import { computed, defineComponent, h, inject, resolveComponent } from 'vue'
import type { VNode } from 'vue'
import type { NocobaseUIRenderContext, NocobaseUISchemaNode } from '@/types/NocobaseUIRenderer'
import { getNocobaseUIComponent } from '@/utils/NocobaseUIRendererRegistry'
import { buildNocobaseUIComponentProps, getNocobaseUILabel } from '@/utils/NocobaseUIFieldBinding'
import { NocobaseUIRenderContextKey } from '@/utils/NocobaseUIRenderContext'
import { NocobaseUIFormStoreKey } from '@/utils/NocobaseUIFormStore'
import { buildNocobaseUIActionHandler } from '@/utils/NocobaseUIActionHandler'
import { resolveNocobaseUIAccess } from '@/utils/NocobaseUIAccessControl'

export default defineComponent({
    name: 'NocobaseUIRendererNode',
    props: {
        node: {
            type: Object as () => NocobaseUISchemaNode,
            required: true,
        },
    },
    setup(props) {
        const renderContext = inject<NocobaseUIRenderContext>(NocobaseUIRenderContextKey, {
            mode: 'read',
            collections: [],
            records: [],
        })
        const formStore = inject(NocobaseUIFormStoreKey)

        const access = computed(() => resolveNocobaseUIAccess(props.node, renderContext))
        const isVoidContainer = computed(() =>
            props.node.type === 'void' && !props.node.component && !props.node.decorator,
        )

        const decoratorProps = computed(() => props.node.decoratorProps ?? {})

        const componentProps = computed(() => {
            const baseProps = buildNocobaseUIComponentProps(props.node, renderContext, formStore)
            if (access.value.disabled) {
                baseProps.disabled = true
            }
            if (props.node.component === 'Action' && formStore) {
                const handler = buildNocobaseUIActionHandler(props.node, renderContext, formStore)
                return {
                    ...baseProps,
                    onClick: handler,
                    label: baseProps.label ?? getNocobaseUILabel(props.node),
                }
            }
            return baseProps
        })

        const renderChildren = (): VNode[] => {
            const renderer = resolveComponent('NocobaseUIRendererNode') as any
            return (props.node.children ?? []).map((child) => h(renderer, { node: child }))
        }

        const renderSlots = (): Record<string, () => VNode[]> => {
            const renderer = resolveComponent('NocobaseUIRendererNode') as any
            const slotMap: Record<string, () => VNode[]> = {}
            Object.entries(props.node.slots ?? {}).forEach(([slotName, slotNodes]) => {
                slotMap[slotName] = () =>
                    slotNodes.map((child) => h(renderer, { node: child }))
            })
            return slotMap
        }

        return () => {
            if (access.value.hidden) {
                return null
            }
            const children = renderChildren()
            const slots = renderSlots()
            if (isVoidContainer.value) {
                return h('div', { 'data-nocobase-ui-node': props.node.id }, children)
            }
            const componentName = props.node.component ?? props.node.decorator
            const component = getNocobaseUIComponent(componentName)
            const componentVNode = h(
                component as any,
                {
                    ...componentProps.value,
                    'data-nocobase-ui-node': props.node.id,
                    'data-nocobase-ui-component': props.node.component || props.node.decorator || 'Unknown',
                },
                {
                    ...slots,
                    default: () => children,
                },
            )

            if (props.node.decorator && props.node.component) {
                const decoratorComponent = getNocobaseUIComponent(props.node.decorator)
                return h(
                    decoratorComponent as any,
                    {
                        ...decoratorProps.value,
                        'data-nocobase-ui-decorator': props.node.decorator,
                    },
                    { default: () => [componentVNode] },
                )
            }

            return componentVNode
        }
    },
})
</script>
