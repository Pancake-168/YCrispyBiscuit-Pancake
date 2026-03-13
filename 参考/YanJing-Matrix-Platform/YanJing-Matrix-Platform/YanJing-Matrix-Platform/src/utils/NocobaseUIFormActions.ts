import { nocoBaseService } from '@/services/NocoBase/client'

const getClient = () => nocoBaseService.getAuthedClient()

export const createNocobaseUIRecord = async (
    collectionName: string,
    data: Record<string, unknown>,
) => {
    const client = getClient()
    if (!client) {
        throw new Error('NocoBase client not ready')
    }
    return client.request({
        url: `${collectionName}:create`,
        data,
    })
}

export const updateNocobaseUIRecord = async (
    collectionName: string,
    id: string | number,
    data: Record<string, unknown>,
) => {
    const client = getClient()
    if (!client) {
        throw new Error('NocoBase client not ready')
    }
    return client.request({
        url: `${collectionName}:update`,
        params: { filterByTk: id },
        data,
    })
}

export const deleteNocobaseUIRecord = async (collectionName: string, id: string | number) => {
    const client = getClient()
    if (!client) {
        throw new Error('NocoBase client not ready')
    }
    return client.request({
        url: `${collectionName}:destroy`,
        params: { filterByTk: id },
    })
}

export const getNocobaseUIRecord = async (collectionName: string, id: string | number) => {
    const client = getClient()
    if (!client) {
        throw new Error('NocoBase client not ready')
    }
    return client.request({
        url: `${collectionName}:get`,
        params: { filterByTk: id },
    })
}
