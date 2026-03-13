import type { Agent_Team } from './Raw_Data';


export function parseRawDataToFlow(rawData: Agent_Team): any {
    const nodes: any[] = [];
    const edges: any[] = [];

    // 防护检查 - 确保数据结构完整
    if (!rawData || !rawData.config || !rawData.config.participants) {
        console.log('[ParseFlow] 数据不完整，返回空结构')
        return { nodes, edges };
    }

    //Team节点位置
    const teamNodePosition = { x: 400, y: 200 };

    // 确保Team节点有有效的ID
    const teamNodeId = rawData.component_type || 'DefaultTeam';

    //Team节点
    nodes.push({
        id: teamNodeId,
        label: "Team",
        type: "customNode",
        position: teamNodePosition,
        data: {
            provider: rawData.provider || '',
            component_type: rawData.component_type || 'DefaultTeam',
            version: rawData.version || 1,
            description: rawData.description || '',
            label: rawData.label || 'Default Team',
            termination: rawData.config.termination_condition?.label || 'Default',
            participants: rawData.config.participants?.map(agent => ({
                name: agent.config?.name || `Agent_${Math.random().toString(36).substr(2, 9)}`,
                label: agent.label || 'Unnamed Agent',
            })) || []
        }
    })


    //Agent节点
    const participants = rawData.config.participants || [];
    const agentCount = participants.length

    //节点在视图中的相对位置
    const verticalGap = 400
    const horizontalGap = 500
    const startY = 200 - ((agentCount - 1) * verticalGap) / 2
    const startX = 400 + horizontalGap

    participants.forEach((agent, index) => {
        //name唯一且不重复
        let Agent_Name = agent.config?.name
        if (!Agent_Name || Agent_Name === "") {
            Agent_Name = `Agent_${index + 1}`;
        };

        nodes.push({
            id: Agent_Name,
            label: agent.label || `Agent ${index + 1}`,
            component_type: agent.component_type || 'DefaultAgent',
            version: agent.version || 1,
            type: "customNode",
            position: {
                x: startX,
                y: startY + index * verticalGap
            },
            data: {
                name: Agent_Name,
                system_message: agent.config?.system_message || '',
                description: agent.config?.description || '',
                model_client: agent.config?.model_client || null,
                workbench: agent.config?.workbench || [],
                model_context: agent.config?.model_context || null,
                tools: agent.config?.workbench?.[0]?.config?.tools?.map(tool => ({
                    name: tool.config?.name || 'Unnamed Tool',
                    label: tool.label || 'Unnamed Tool',
                })) || []
            }
        })

        //连接Team节点和Agent节点
        edges.push({
            id: `e-team-${Agent_Name}`,
            source: teamNodeId,
            target: Agent_Name,
            label: ''
        });

        // Tool节点 - 从Agent的workbench中分离出来
        const agentTools = agent.config?.workbench?.[0]?.config?.tools || [];
        agentTools.forEach((tool, toolIndex) => {
            const toolId = `${Agent_Name}_Tool_${toolIndex}`;
            
            nodes.push({
                id: toolId,
                label: tool.label || `Tool ${toolIndex + 1}`,
                component_type: tool.component_type || 'tool',
                version: tool.version || 1,
                type: "customNode",
                position: {
                    x: startX + horizontalGap,
                    y:   index * verticalGap + toolIndex * 300 + startY
                },
                data: {
                    name: tool.config?.name || `Tool_${toolIndex + 1}`,
                    description: tool.config?.description || '',
                    label: tool.label || `Tool ${toolIndex + 1}`,
                    provider: tool.provider || '',
                    component_type: tool.component_type || 'tool',
                    version: tool.version || 1,
                    source_code: tool.config?.source_code || '',
                    global_imports: tool.config?.global_imports || [],
                    has_cancellation_support: tool.config?.has_cancellation_support || false
                }
            });

            // 连接Agent节点和Tool节点
            edges.push({
                id: `e-${Agent_Name}-${toolId}`,
                source: Agent_Name,
                target: toolId,
                label: ''
            });
        });
    });

    console.log('[ParseFlow] ✅ 解析完成 - 节点:', nodes.length, '边:', edges.length)
    return { nodes, edges }
}