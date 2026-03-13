import { addPrefixSuffix, removePrefixSuffix } from './stringUtils'
import { MATRIX_SERVER_URL_TAIL } from '@/apiUrls'

export async function toCanonical(id: string): Promise<string> {
    if (!id) return ''
    const raw = removePrefixSuffix(id, '@', MATRIX_SERVER_URL_TAIL)
    return addPrefixSuffix(raw, '@', MATRIX_SERVER_URL_TAIL)
}