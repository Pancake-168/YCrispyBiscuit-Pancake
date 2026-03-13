export interface SSOCallbackParams {
  state: string
  sub: string
  code: string
  loginToken?: string
  err_msg?: string
}

// 注册参数接口
export interface RegisterParams {
  username: string
  password: string
}



export interface WechatSSOParams {
  state: string;
  sub: string;
  code: string;
  loginToken?: string;
}

export interface WechatNocobaseSession {
  token: string;
}

export interface WechatMatrixSession {
  accessToken: string;
  userId?: string;
  deviceId?: string;
  homeServer?: string;
}

export interface WechatUserApp {
  app_id: string;
  app_tag: string;
}


// 用户个人信息及拥有的应用列表
export interface WechatUserProfile {
  username: string;
  nickname: string | null;
  apps: WechatUserApp[];
}



export interface GetIMUserInfoApiResponse {
    username: string;
    atype: string;
    im: string;
    nickname: string;
}


export interface GetSSOUserInfoApiResponse {
    username: string;
    atype: string;
    im: string;
    nickname: string;
    display_name: string;
  avatar_url: string | null;
}
