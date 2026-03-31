


// 后端业务基础wss地址
export const VITE_API_WSS_BASE = import.meta.env.VITE_API_WSS_BASE;




const isElectronRuntime = typeof window !== 'undefined' && typeof window.electronAPI !== 'undefined'
const apiMode = (import.meta.env.VITE_API_MODE as unknown as string | undefined) || ''
const useRelativeApi = import.meta.env.DEV || apiMode === 'proxy' || (!isElectronRuntime && apiMode !== 'direct')
export const BASE_URL = useRelativeApi ? '' : (import.meta.env.VITE_API_BASE as unknown as string)



/**
 * 音乐播放器后端接口api
 */
export const API_URLS = {


    // login post
    // 登录
    login: `${BASE_URL}/api/pancake/login`,

    // register post
    // 注册
    register: `${BASE_URL}/api/pancake/register`,

    // getUserInfo get
    // 获取用户信息
    getUserInfo: `${BASE_URL}/api/pancake/userinfo`,

    // getUserConfig get
    // 获取用户配置
    getUserConfig: `${BASE_URL}/api/pancake/user/config`,

    // getUserMusicList get
    // 获取用户音乐列表
    getUserMusicList: `${BASE_URL}/api/pancake/user/musiclist`,

    // getUserMusicListMusics get
    // 获取用户某个指定音乐列表中的音乐
    getUserMusicListMusics: (musicListId: string) => `${BASE_URL}/api/pancake/user/musiclist/${musicListId}`,

    // getMusicDetail get
    // 获取音乐详情
    getMusicDetail: (musicId: string) => `${BASE_URL}/api/pancake/music/${musicId}`,

    // getLyrics get
    // 获取歌词
    getLyrics: (musicId: string) => `${BASE_URL}/api/pancake/music/${musicId}/lyrics`,

    // postMusicPlayRecord post
    // 记录音乐播放信息
    postMusicPlayRecord: `${BASE_URL}/api/pancake/music/playrecord`,

    // uploadMusic(upload to database) post
    // 上传音乐（上传至总曲库）
    uploadMusic: `${BASE_URL}/api/pancake/music/upload`,

    // deleteMusic(delete from database) post
    // 删除音乐（从总曲库删除）
    deleteMusic: `${BASE_URL}/api/pancake/music/delete`,

    // createMusicList post
    // 创建音乐列表
    createMusicList: `${BASE_URL}/api/pancake/musiclist/create`,

    // deleteMusicList post
    // 删除音乐列表
    deleteMusicList: `${BASE_URL}/api/pancake/musiclist/delete`,

    // addMusicToList post
    // 将音乐添加到音乐列表
    addMusicToList: `${BASE_URL}/api/pancake/musiclist/add`,

    // removeMusicFromList post
    // 将音乐从音乐列表中移除
    removeMusicFromList: `${BASE_URL}/api/pancake/musiclist/remove`,

    // search get
    // 搜索, query参数为搜索关键词
    search: (query: string) => `${BASE_URL}/api/pancake/music/search/${query}`,

    // getArtistDetail get
    // 获取歌手详情
    getArtistDetail: (artistId: string) => `${BASE_URL}/api/pancake/artist/${artistId}`,

    // getAlbumDetail get
    // 获取专辑详情
    getAlbumDetail: (albumId: string) => `${BASE_URL}/api/pancake/album/${albumId}`,





}





