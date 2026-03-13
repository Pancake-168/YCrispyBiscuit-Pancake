export type MissionResourceType = 'document' | 'dataset' | 'code' | 'media' | 'tool'

export interface MissionResource {
  id: string
  type: MissionResourceType
  name: string
  description: string
  preview?: string
}

export interface AssistantMission {
  id: string
  title: string
  subtitle: string
  indicator: string
  lastUpdated?: string
  summary?: string
  resources: MissionResource[]
}

export const assistantMissions: AssistantMission[] = [
  {
    id: 'mission-1',
    title: 'XXXX',
    subtitle: 'XXXXXXXXXXXX',
    indicator: 'analysis',
    lastUpdated: '2025-10-10',
    summary: 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX。',
    resources: [
      {
        id: 'mission-1-doc-1',
        type: 'document',
        name: 'XXXXX.pdf',
        description: 'XXXXXXXXXXXXXXXXXXXXXXXXX。'
      },
      {
        id: 'mission-1-dataset-1',
        type: 'dataset',
        name: 'XXXXX.xlsx',
        description: 'XXXXXXXXXXXXXXXXXXXXXXXX。'
      },
      {
        id: 'mission-1-tool-1',
        type: 'tool',
        name: 'XXXXXXXX',
        description: 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX。'
      }
    ]
  },
  {
    id: 'mission-1',
    title: 'AAAAAAAAAA',
    subtitle: 'AAAAAAAAA',
    indicator: 'analysis',
    lastUpdated: '2025-10-10',
    summary: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA。',
    resources: [
      {
        id: 'mission-1-doc-1',
        type: 'document',
        name: 'XXXXX.pdf',
        description: 'XXXXXXXXXXXXXXXXXXXXXXXXX。'
      },
      {
        id: 'mission-1-dataset-1',
        type: 'dataset',
        name: 'XXXXX.xlsx',
        description: 'XXXXXXXXXXXXXXXXXXXXXXXX。'
      },
      {
        id: 'mission-1-tool-1',
        type: 'tool',
        name: 'XXXXXXXX',
        description: 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX。'
      }
    ]
  },
  {
    id: 'mission-1',
    title: 'BBBBBBBBB',
    subtitle: 'BBB',
    indicator: 'analysis',
    lastUpdated: '2025-10-10',
    summary: 'BBBBBBBBB。',
    resources: [
      {
        id: 'mission-1-doc-1',
        type: 'document',
        name: 'XXXXX.pdf',
        description: 'XXXXXXXXXXXXXXXXXXXXXXXXX。'
      },
      {
        id: 'mission-1-dataset-1',
        type: 'dataset',
        name: 'XXXXX.xlsx',
        description: 'XXXXXXXXXXXXXXXXXXXXXXXX。'
      },
      {
        id: 'mission-1-tool-1',
        type: 'tool',
        name: 'XXXXXXXX',
        description: 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX。'
      }
    ]
  }
]

export const assistantMissionMap: Record<string, AssistantMission> = assistantMissions.reduce(
  (acc, mission) => {
    acc[mission.id] = mission
    return acc
  },
  {} as Record<string, AssistantMission>
)

export function findResourceById(resourceId: string) {
  for (const mission of assistantMissions) {
    const resource = mission.resources.find((item) => item.id === resourceId)
    if (resource) {
      return { mission, resource }
    }
  }
  return null
}
