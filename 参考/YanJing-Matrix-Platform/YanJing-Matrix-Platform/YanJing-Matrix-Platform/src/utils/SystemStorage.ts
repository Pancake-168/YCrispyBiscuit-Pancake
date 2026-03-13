


//此存储适配storage.ts，完成对electron和web双端的存储适配
import { getAllKeys, getSetting, removeSetting, setSetting } from '@/utils/storage'
import type { MatrixLoginConfigLite  } from '@/types/matrix'



class SystemStorage {

    //新版存储不再设置过分复杂的多级存储，所有都在顶层存储



    // 存储-1：AutoLoginCompleted，标记自动登录流程是否完成
    private readonly keyAutoLoginCompleted = 'YanJing-AutoLogin-Completed'


    // 存储0：username,也就是sso登录的用户名，也就是输入的那个账号
    private readonly keyUsername = 'YanJing-SSO-Username'


    // 存储1：matrix的登录配置字段，永久存储，记录上次登录的用户的信息，序列化存储
    /*
       matrix_login_config{
       1.服务器地址
       2.matrixid（去除前后缀的）
       3.设备名
       }
    }
    */
    private readonly keyMatrixLoginConfig = 'YanJing-Matrix-LoginConfig'


    // 存储2：loginToken，SSO登录凭证，用来换取accesstoken和nocobase的token，只在退出时或登录业务报错时清除
    /**
     * YanJing-SSO-LoginToken
     */
    private readonly keySSOLoginToken = 'YanJing-SSO-LoginToken'


    //存储3：accesstoken，matrix的登录凭证，登录兑换后存储，只在退出时或者登录业务报错时清除，预示着登录态失效，可能是过期
    /**
     * YanJing-Matrix-AccessToken
     */
    private readonly keyMatrixAccessToken = 'YanJing-Matrix-AccessToken'


    //存储4：在1的基础上存储一份非序列化的完整登录信息，方便业务使用
    /**
       matrix_login_config_raw{
       1.服务器地址
       2.matrixid（去除前后缀的）
       3.设备名
       }
     */
    private readonly keyMatrixLoginConfigRaw = 'YanJing-Matrix-LoginConfig-Raw'


    //存储5：自由字段存储，供业务使用，命名规则参考旧版需要区分不同用户，username就是用户名，key是业务自定义的字段名
    /**
     * YanJing_System + _ username _ + key：
     */

    private userFieldKey(username: string, key: string): string {
        return `YanJing_System_${username}_${key}`
    }


    // 存储6：userconfig（用户配置 JSON）
    private readonly keyUserConfig = 'YanJing-UserConfig'

    // 存储7：room display cache（按用户隔离的房间展示信息缓存）
    private readonly keyRoomDisplayCache = 'RoomDisplayCache'

    // 存储8：room classification cache（按用户隔离的房间分类缓存）
    private readonly keyRoomClassificationCache = 'RoomClassificationCache'






    // =====================
    // 存储-1：AutoLoginCompleted
    // =====================
    public async getAutoLoginCompleted(): Promise<boolean | null> {
        const v = await getSetting<boolean>(this.keyAutoLoginCompleted)
        return v ?? null
    }
    public async setAutoLoginCompleted(completed: boolean): Promise<boolean> {
        return await setSetting(this.keyAutoLoginCompleted, completed)
    }
    public async clearAutoLoginCompleted(): Promise<boolean> {
        return await removeSetting(this.keyAutoLoginCompleted)
    }






    // =====================
    // 存储0：username
    // =====================

    public async getUsername(): Promise<string | null> {
        const v = await getSetting<string>(this.keyUsername)
        return v ?? null
    }

    public async setUsername(username: string): Promise<boolean> {
        return await setSetting(this.keyUsername, username)
    }

    public async clearUsername(): Promise<boolean> {
        return await removeSetting(this.keyUsername)
    }




    // =====================
    // 存储1：matrix_login_config（永久）
    // =====================

    public async getMatrixLoginConfig(): Promise<string | null> {
        const v = await getSetting<string>(this.keyMatrixLoginConfig)
        return v ?? null
    }

    public async setMatrixLoginConfig(config: string): Promise<boolean> {
        return await setSetting(this.keyMatrixLoginConfig, config)
    }

    public async clearMatrixLoginConfig(): Promise<boolean> {
        return await removeSetting(this.keyMatrixLoginConfig)
    }




    // =====================
    // 存储2：loginToken（兑换用，退出/错误清除）
    // =====================

    public async getLoginToken(): Promise<string | null> {
        const v = await getSetting<string>(this.keySSOLoginToken)
        return v ?? null
    }

    public async setLoginToken(token: string): Promise<boolean> {
        return await setSetting(this.keySSOLoginToken, token)
    }

    public async clearLoginToken(): Promise<boolean> {
        return await removeSetting(this.keySSOLoginToken)
    }




    // =====================
    // 存储3：accessToken（登录态，退出/错误清除）
    // =====================

    public async getMatrixAccessToken(): Promise<string | null> {
        const v = await getSetting<string>(this.keyMatrixAccessToken)
        return v ?? null
    }

    public async setMatrixAccessToken(token: string): Promise<boolean> {
        return await setSetting(this.keyMatrixAccessToken, token)
    }

    public async clearMatrixAccessToken(): Promise<boolean> {
        return await removeSetting(this.keyMatrixAccessToken)
    }



    // =====================
    // 存储4：matrix_login_config_raw（完整对象）
    // =====================

    public async getMatrixLoginConfigRaw(): Promise<MatrixLoginConfigLite | null> {
        const v = await getSetting<MatrixLoginConfigLite>(this.keyMatrixLoginConfigRaw)
        return v ?? null
    }

    public async setMatrixLoginConfigRaw(config: MatrixLoginConfigLite): Promise<boolean> {
        return await setSetting(this.keyMatrixLoginConfigRaw, config)
    }

    public async clearMatrixLoginConfigRaw(): Promise<boolean> {
        return await removeSetting(this.keyMatrixLoginConfigRaw)
    }



    // =====================
    // 存储5：自由字段（按用户隔离）
    // =====================

    public async getUserField<T = unknown>(username: string, key: string): Promise<T | null> {
        const v = await getSetting<T>(this.userFieldKey(username, key))
        return v ?? null
    }

    public async setUserField(username: string, key: string, value: unknown): Promise<boolean> {
        return await setSetting(this.userFieldKey(username, key), value)
    }

    public async removeUserField(username: string, key: string): Promise<boolean> {
        return await removeSetting(this.userFieldKey(username, key))
    }

    public async listUserFieldKeys(username: string): Promise<string[]> {
        const prefix = `YanJing_System_${username}_`
        const keys = await getAllKeys()
        return keys.filter(k => k.startsWith(prefix)).map(k => k.substring(prefix.length))
    }

    public async clearAllUserFields(username: string): Promise<void> {
        const keys = await this.listUserFieldKeys(username)
        await Promise.all(keys.map(k => this.removeUserField(username, k)))
    }


    // =====================
    // 存储6：userconfig
    // =====================

    public async getUserConfig<T = unknown>(): Promise<T | null> {
        const v = await getSetting<T>(this.keyUserConfig)
        return v ?? null
    }

    public async setUserConfig(config: unknown): Promise<boolean> {
        return await setSetting(this.keyUserConfig, config)
    }

    public async clearUserConfig(): Promise<boolean> {
        return await removeSetting(this.keyUserConfig)
    }


    // =====================
    // 存储7：room display cache
    // =====================

    public async getRoomDisplayCache<T = unknown>(username: string): Promise<T | null> {
        return await this.getUserField<T>(username, this.keyRoomDisplayCache)
    }

    public async setRoomDisplayCache(username: string, value: unknown): Promise<boolean> {
        return await this.setUserField(username, this.keyRoomDisplayCache, value)
    }

    public async clearRoomDisplayCache(username: string): Promise<boolean> {
        return await this.removeUserField(username, this.keyRoomDisplayCache)
    }

    // =====================
    // 存储8：room classification cache
    // =====================

    public async getRoomClassificationCache<T = unknown>(username: string): Promise<T | null> {
        return await this.getUserField<T>(username, this.keyRoomClassificationCache)
    }

    public async setRoomClassificationCache(username: string, value: unknown): Promise<boolean> {
        return await this.setUserField(username, this.keyRoomClassificationCache, value)
    }

    public async clearRoomClassificationCache(username: string): Promise<boolean> {
        return await this.removeUserField(username, this.keyRoomClassificationCache)
    }

}




export const SystemStorageManager = new SystemStorage();