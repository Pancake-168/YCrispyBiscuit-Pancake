
//matrix的服务器地址
export const Login_MATRIX_SERVER_URL = import.meta.env.Login_MATRIX_SERVER_URL;
export const Login_MATRIX_SERVER_URL_TAIL = import.meta.env.Login_MATRIX_SERVER_URL_TAIL;
export const Login_MATRIX_SERVER_URL_ALL = import.meta.env.Login_MATRIX_SERVER_URL_ALL;

/*
// matrix的业务后缀
export const MATRIX_SERVER_URL = 'chat.zy-jn.org.cn';
export const MATRIX_SERVER_URL_TAIL = ':chat.zy-jn.org.cn';
export const MATRIX_SERVER_URL_ALL = 'https://chat.zy-jn.org.cn/';
*/


export const MATRIX_SERVER_URL = import.meta.env.MATRIX_SERVER_URL;
export const MATRIX_SERVER_URL_TAIL = import.meta.env.MATRIX_SERVER_URL_TAIL;
export const MATRIX_SERVER_URL_ALL = import.meta.env.MATRIX_SERVER_URL_ALL;





// NocoBase 目标地址 (局域网)
export const NOCOBASE_URL = import.meta.env.NOCOBASE_URL;

// Matrix 代理目标（用于开发环境代理媒体、API请求等）
export const matrixProxyTarget = import.meta.env.matrixProxyTarget;

// 后端业务基础wss地址
export const VITE_API_WSS_BASE = import.meta.env.VITE_API_WSS_BASE;

// 微信回调链接开头
export const VITE_API_WECHAT_URL = import.meta.env.VITE_API_WECHAT_URL;


// 后端业务基础地址
// 注意：Vite 内置的 import.meta.env.BASE_URL 表示“站点 base path”（例如 './'），不是后端地址。
// 本项目用 VITE_API_BASE 作为后端 host。
// 规则：
// - 开发环境：使用相对路径（例如 /api/...）让 Vite dev server 代理转发，避免 CORS。
// - 生产环境 Web：默认使用相对路径（配合 Nginx 反向代理 /api）。
// - 生产环境 Electron：打包后使用 app:// 加载静态文件，没有 Vite 代理，默认直连后端。
// 可选覆盖：VITE_API_MODE=direct|proxy
const isElectronRuntime = typeof window !== 'undefined' && typeof window.electronAPI !== 'undefined'
const apiMode = (import.meta.env.VITE_API_MODE as unknown as string | undefined) || ''
const useRelativeApi = import.meta.env.DEV || apiMode === 'proxy' || (!isElectronRuntime && apiMode !== 'direct')
export const BASE_URL = useRelativeApi ? '' : (import.meta.env.VITE_API_BASE as unknown as string)
// 微信登录后缀：优先使用显式环境变量，便于“build 产物 + 内测环境”场景
// 例如：VITE_WX_LOGIN_SUFFIX=':dev' 或 ''
const wxLoginSuffixFromEnv = (import.meta.env.VITE_WX_LOGIN_SUFFIX as unknown as string | undefined)
const WX_LOGIN_SUFFIX = wxLoginSuffixFromEnv !== undefined
  ? wxLoginSuffixFromEnv
  : (import.meta.env.DEV ? ':dev' : '')



export const API_URLS = {


  //通过
  //获取智能体市场空间 get
  GetApplicationFromTag: (tag: string) => `${BASE_URL}/api/v2/${tag}/application`,
  //传参固定为 market
  /*
  返回：
  [
  {
    "createdAt": "2025-08-15T07:43:06.827Z",
    "updatedAt": "2025-08-15T07:43:06.827Z",
    "id": 1,
    "createdById": 1,
    "updatedById": 1,
    "application_id": "dXYbunLgXrwIjFOvBF",
    "config": null,
    "application_name": "智能体市场空间",
    "application_tag": "market",
    "author": null,
    "from_market": null,
    "copy_to": null
  }
]
 
              主要是拿到这个application_id
   */


  //通过
  // 组织架构 - 获取部门列表
  DEPARTMENTS: (appid: string) => `${BASE_URL}/api/v2/${appid}/department`,



  // 组织架构 - 分页版 获取部门列表
  DEPARTMENTS_PAGED: (appid: string, page: number, pageSize: number) => `${BASE_URL}/api/v2/${appid}/department?page=${page}&pageSize=${pageSize}`,


  //新版获取部门详细信息
  DEPARTMENT_DETAIL: (appid: string, departmentId: string) => `${BASE_URL}/api/v2/${appid}/department/${departmentId}`,



  //通过
  // Agent - 获取用户 Agent 列表的完整 URL
  getUserAgentsUrl: (appid: string, nocobaseID: string) => `${BASE_URL}/api/v2/${appid}/bot/${nocobaseID}`,

  //token问题
  //智能体市场创建应用post
  createApplication: (appid: string) => `${BASE_URL}/api/v2/${appid}/map/application/create`,

  //通过
  //获取智能体市场的公有应用列表get
  getPublicApplications: (appid: string, page: number = 1) => `${BASE_URL}/api/v2/${appid}/map?page=${page}`,
  getPublicApplications1: (appid: string, page: number = 1) => `${BASE_URL}/api/v2/${appid}/market/app?page=${page}`,


  //搜索指定的公有应用并返回搜索结果
  searchMarketApplications: (appid: string, name: string, page: number = 1) => `${BASE_URL}/api/v2/${appid}/makert/app/search?name=${name}&page=${page}`,

  //通过
  //获取指定用户的应用列表get
  getUserApplications: (appid: string, user: string, page: number = 1) => `${BASE_URL}/api/v2/${appid}/map/market?user=${user}&page=${page}`,


  //通过
  //获取指定应用下的智能体Agent列表get
  getApplicationAgents: (appid: string, marketid: string) => `${BASE_URL}/api/v2/${appid}/map/agents?marketid=${marketid}`,

  //通过
  //获取智能体Agent信息get
  getAgentInfo: (agentId: string) => `${BASE_URL}/api/v1/oc/market/agent/${agentId}`,
  /* 这个好像原本就没调用 */

  //通过
  //公开指定的应用post
  publicApplication: (appid: string, marketid: string) => `${BASE_URL}/api/v2/${appid}/map/${marketid}/state`,

  //公开指定的智能体post
  publicAgent: (agentId: string) => `${BASE_URL}/api/v1/oc/market/agent/${agentId}/public`,
  /* 好像暂无 */



  //部署智能体post
  deployAgent: (appid: string, marketid: string) => `${BASE_URL}/api/v2/${appid}/map/${marketid}/public`,

  //通过
  //创建智能体post
  createAgent: (appid: string) => `${BASE_URL}/api/v2/${appid}/map/agent/create`,

  //通过
  //摧毁(删除)智能体post
  destroyAgent: (appid: string, agentid: string) => `${BASE_URL}/api/v2/${appid}/map/agent/${agentid}/destroy`,

  //通过
  //点击“开发”时调用一次即可post
  editorAgent: (appid: string) => `${BASE_URL}/api/v2/${appid}/editorAgent`,

  //通过
  //获取markdown get
  getMarkdown: (appid: string, account: string) => `${BASE_URL}/api/v2/${appid}/agent/${account}`,

  //复制智能体市场上的应用
  MarketCopyApplication: (appid: string) => `${BASE_URL}/api/v2/${appid}/map/application/copy`,


  //部署应用
  MarketApplicationDeploy: (appid: string) => `${BASE_URL}/api/v2/${appid}/market/application/deploy`,




  //注册时调用后端的api在nocobase里面创建该用户 post
  createNocobaseUser: `${BASE_URL}/api/v2/sso/m/login`,

  //将登录信息传递给后端 post
  updateAccountData: `${BASE_URL}/api/v2/sso/m/updateAccountData`,
  /*
  
  {
    "username": "string",
    "password": "string",
    "access_token": "string",
    "home_server": "string",
    "device_id": "string"
  }
  
  这是参数，获取ycb、密码、access_token、home_server、device_id
  
  */



  //邀请用户进入空间时调用post
  InviteUserToApplication: (appid: string) => `${BASE_URL}/api/v2/${appid}/application/invite`,

  //创建部门
  CreateDepartment: (appid: string) => `${BASE_URL}/api/v2/${appid}/department/create`,

  //加入部门
  JoinDepartment: (appid: string) => `${BASE_URL}/api/v2/${appid}/department/join`,

  //根据用户名获取用户所在的应用get
  GetApplicationByUser: (username: string) => `${BASE_URL}/api/v2/application/user/${username}`,





  //通过用户名获取sessions，其中user_account是全称@ycb10036:chat.zy-jn.org.cn，记得转义特殊符号，bot_account是简称，appid没有特别指定就填root，get类型
  NocobaseSessions: (appid: string, bot_account: string, user_account: string) => `${BASE_URL}/api/v2/${appid}/Sessions/${bot_account}/${user_account}`,


  //任务重做Redo Task，post请求
  RedoTask: (session_id: string) => `${BASE_URL}/api/v2/shayu/${session_id}/redo_task`,





























  //个人通用助手创建任务,后端会自己创建房间,bot_account是全称@ycb10036userbot:chat.zy-jn.org.cn，记得转义特殊符号，post类型
  //已使用
  CreateTask: (bot_account: string) => `${BASE_URL}/api/v2/shayu/${bot_account}/create_task`,

  //返回ws连接地址，bot_account是简称
  // 注意：WebSocket URL 不需要 /test 路径
  //已使用
  GetWsConnection: (bot_account: string) => `${VITE_API_WSS_BASE}/api/v2/ws/shayu/${bot_account}`,





  //对话前调用确保bot启动，post请求
  //已使用
  Instance: () => `${BASE_URL}/api/v2/cc/instance`,









  /**
   * V3版sso-微信登录
   */
  //已使用
  WechatLoginUrl: () => `${VITE_API_WECHAT_URL}/api/auth/wx/login${WX_LOGIN_SUFFIX}`,

  /**
   * V3版sso-新用户注册
   * 
   * 参数如下
   {
  "username": "newuser",
  "password": "newpassword",
  "sub": 123,
  "code": "authorization_code"
  }
   * 
   * 
   */
  //已使用
  Wechatsignup: () => `${BASE_URL}/api/auth/wx/signUp`,


  /**
  * V3版sso-微信登录换matrix accesstoken
  */
  //已使用
  GenerateMatrixToken: () => `${BASE_URL}/api/auth/msyanc`,

  /**
   * V3版sso-微信登录换nocobase token
   */
  //已使用
  GenerateNocobaseToken: (authScope: string) => `${BASE_URL}/api/auth/${authScope}/bdstc`,


  /**
   * V3版sso-账号密码登录接口 (旧)
   */
  //已使用
  Login: () => `${BASE_URL}/api/auth/login`,

  /**
     * V3版sso-账号密码注册
     */
  //已使用
  Register: () => `${BASE_URL}/api/auth/register`,

  /**
     * V3版sso-返回个人信息
     */
  //已使用
  UserInfo: () => `${BASE_URL}/api/auth/userinfo`,
  /**
     * V3版sso-一个更改个人信息的接口
     */
  //已使用
  userdetail: () => `${BASE_URL}/api/auth/userdetail`,
  /**
   * 发送验证码
   */
  SendCode: () => `${BASE_URL}/api/auth/sms/send-code`,
  /**
   * 微信登录需绑定手机号
   */
  BindPhone: () => `${BASE_URL}/api/auth/sms/bind-phone`,
  /**
   * 手机号登录
   */
  SmsLogin: () => `${BASE_URL}/api/auth/sms/login`,
  /**
   * 手机号注册
   */
  SmsRegister: () => `${BASE_URL}/api/auth/sms/register`,
  /**
   * Generate Captcha 
   * Generate a new CAPTCHA image and return captchaId + base64 image.
   */
  GenerateCaptcha: () => `${BASE_URL}/api/auth/captcha/generate`,






















  /*  
   Market
  */
  //V2创建组织
  //已使用
  CreateOrganizationApplicationMarket: () => `${BASE_URL}/api/v2/market/organization`,

  //v2创建应用市场应用
  CreateApplicationMarket: () => `${BASE_URL}/api/v2/market/application`,







  /*
  Organization.Department
  */
  //v2部门管理
  //获取全部部门列表 - 分页查询
  //已使用
  GetDepartmentsV2: (appid: string, page: number, pageSize: number) => `${BASE_URL}/api/v2/organization/${appid}/department?page=${page}&pageSize=${pageSize}`,

  //获取指定部门下的子部门和职位 - 分页查询
  //已使用
  GetDepartmentChildrenV2: (appid: string, departmentId: number, page: number, pageSize: number) => `${BASE_URL}/api/v2/organization/${appid}/department?department_id=${departmentId}&page=${page}&pageSize=${pageSize}`,

  //创建部门 post请求
  //已使用
  CreateDepartmentV2: (appid: string) => `${BASE_URL}/api/v2/organization/${appid}/department`,

  //更新部门信息 put请求
  //已使用
  UpdateDepartmentV2: (appid: string, id: number) => `${BASE_URL}/api/v2/organization/${appid}/department?id=${id}`,

  //删除部门 delete请求（后端暂不支持）
  //已使用
  DeleteDepartmentV2: (appid: string, id: number) => `${BASE_URL}/api/v2/organization/${appid}/department?id=${id}`,




  /*  
    Organization.Post
  */
  //v2组织职位管理

  //获取全部职位列表 - 分页查询
  GetPostsV2: (appid: string, page: number, pageSize: number) => `${BASE_URL}/api/v2/organization/${appid}/post?page=${page}&pageSize=${pageSize}`,

  //获取指定 post 下的人员 - 分页查询
  //已使用
  GetOrganizationPostV2: (appid: string, postId: number, page: number, pageSize: number) => `${BASE_URL}/api/v2/organization/${appid}/post/${postId}?page=${page}&pageSize=${pageSize}`,

  //创建 post请求
  //已使用
  CreateOrganizationPostV2: (appid: string) => `${BASE_URL}/api/v2/organization/${appid}/post`,

  //更新 put请求
  //已使用
  UpdateOrganizationPostV2: (appid: string, postId: number) => `${BASE_URL}/api/v2/organization/${appid}/post/${postId}`,

  //删除 delete请求（后端暂不支持）
  //已使用
  DeleteOrganizationPostV2: (appid: string, postId: number) => `${BASE_URL}/api/v2/organization/${appid}/post/${postId}`,





  /*
  Overview
  */
  //Overview get请求
  //已使用
  GetOverView: (appid: string, page: number, pageSize: number) => `${BASE_URL}/api/v2/organization/${appid}/overview?page=${page}&pageSize=${pageSize}`,

  //Overview Detail get请求
  //已使用
  GetOverViewDetail: (appid: string, atype: string, id: number) => `${BASE_URL}/api/v2/organization/${appid}/overview/${atype}/${id}`,






  /*
    Application  
  */
  //注册bot post请求
  ApplicationRegisterBot: (appid: string) => `${BASE_URL}/api/v2/application/${appid}/bot`,

  //获取bot信息 get请求
  GetApplicationBot: (appid: string, page: number, pageSize: number) => `${BASE_URL}/api/v2/application/${appid}/bot?page=${page}&pageSize=${pageSize}`,


  //获取userbot
  //已使用
  GetUserBot: () => `${BASE_URL}/api/v2/application/userbot`,

  //Bot token post请求
  ApplicationBotToken: (appid: string, bot_id: number) => `${BASE_URL}/api/v2/application/${appid}/bot/${bot_id}/token`,

  //user用户 get请求
  //已使用
  GetApplicationUser: (appid: string, page: number, pageSize: number) => `${BASE_URL}/api/v2/application/${appid}/user?page=${page}&pageSize=${pageSize}`,

  //用户加入应用 post请求
  //已使用
  Acceptinvitation: (appid: string, username: string) => `${BASE_URL}/api/v2/application/${appid}/membership/acceptInvitation/${username}`,

  //后端同步函数 post请求
  //有事没事调一下
  //已使用
  ApplicationSync: (appid: string) => `${BASE_URL}/api/v2/application/${appid}/sync`,



  /*
      Application.Dataset
    */
  //GetDataset获取数据
  GetDataset: (appid: string, page: number, pageSize: number) => `${BASE_URL}/api/v2/application/${appid}/dataset?page=${page}&pageSize=${pageSize}`,

  //创建Dataset post请求
  CreateDataset: (appid: string) => `${BASE_URL}/api/v2/application/${appid}/dataset`,

  //创建asset post请求 asset是dataset内的一个数组
  CreateAsset: (appid: string) => `${BASE_URL}/api/v2/application/${appid}/asset`,





  /*
  IM
  */
  //获取用户信息，能拿到matrix的ID
  GetIMUserInfo: (username: string) => `${BASE_URL}/api/v2/im/user/${username}`,
  // 创建房间，多人群聊可以用这个 post
  CreateRoom: () => `${BASE_URL}/api/v2/im/room`,
  // 后端整合的返回指定房间内的所有的账号的sso信息 get
  getRoomMembersBe:(roomId: string) => `${BASE_URL}/api/v2/im/room/members?room_id=${encodeURIComponent(roomId)}`,
  // 邀请别人加入房间 post
  InviteUsers: () => `${BASE_URL}/api/v2/im/room/invite`,
  // 从房间中踢出用户 post
  KickUsers: () => `${BASE_URL}/api/v2/im/room/kick`,
  // 离开房间 post
  LeaveRoom: () => `${BASE_URL}/api/v2/im/room/leave`,

  /**
   * IM-DM
   */
  // 创建DM房间 CreateDMRoom post，传username
  CreateDMRoom: () => `${BASE_URL}/api/v2/im/room/dm`,
  // 获取DM房间列表 get
  GetDMRooms: (page: number, pageSize: number) => `${BASE_URL}/api/v2/im/room/dm?page=${page}&pageSize=${pageSize}`,

  // 发送私人消息SendPrivateMessage，后端会将双方的bot拉进来，但这个似乎必须附加一条消息，有点反人类，暂时不知道怎么调用  post
  SendPrivateMessage: () => `${BASE_URL}/api/v2/im/room/dm/message/private`,
  // 获取那个privateRoom，意思是主房间，或者说联系人？ get
  GetPrivateRoom: (username: string) => `${BASE_URL}/api/v2/im/room/dm/private/${encodeURIComponent(username)}`,
  // 获取房间内其他成员的信息 post
  GetRoomOtherUser:() => `${BASE_URL}/api/v2/im/room/dm/other_user`,
  // 强制后台某用户接受邀请进入房间 post
  AcceptRoomInvite:()=> `${BASE_URL}/api/v2/im/room/dm/invite/accept`,


  /**
   * shayu
   */
  //secretary唤醒
  Secretary:(appid: string) => `${BASE_URL}/api/v2/cc/${appid}/secretary/instance`,


  


  /**
   * UserConfig
   */
  //获取用户配置 get请求
  GetUserConfig: () => `${BASE_URL}/api/auth/userconfig`,

  //更新用户配置 post请求
  UpdateUserConfig: () => `${BASE_URL}/api/auth/userconfig`,

























  /**
   * Application.AgentSession 
   */
  // 创建AgentSession post请求
  CreateAgentSession: (appid: string) => `${BASE_URL}/api/v2/application/${appid}/agentSession`,
  // 获取AgentSession列表 get请求
  GetAgentSessions: (appid: string, page: number, pageSize: number) => `${BASE_URL}/api/v2/application/${appid}/agentSession/list?page=${page}&pageSize=${pageSize}`,
  // 更新AgentSession put请求
  UpdateAgentSession: (appid: string, roomId: string) => `${BASE_URL}/api/v2/application/${appid}/agentSession/${roomId}`,

























   /**
     * 审批流API
     */

    // GET
    ApprovalPositions: (appid: string) => `${BASE_URL}/api/v2/approval/${appid}/dictionary/positions`,
    ApprovalTypes: (appid: string) => `${BASE_URL}/api/v2/approval/${appid}/dictionary/approval-types`,
  
    // 模板配置
    // 创建/更新模板 POST
    ApprovalTemplatesUpsert: (appid: string) => `${BASE_URL}/api/v2/approval/${appid}/templates`,
    // 获取模板详情 GET
    ApprovalTemplateDetail: (appid: string, id: number | string) => `${BASE_URL}/api/v2/approval/${appid}/templates/${id}`,
    // 获取某类型当前激活模板 GET
    ApprovalTemplateActive: (appid: string, typeCode: string) => `${BASE_URL}/api/v2/approval/${appid}/templates/active?typeCode=${encodeURIComponent(typeCode)}`,
  
    // 业务提交 POST
    ApprovalSubmit: (appid: string) => `${BASE_URL}/api/v2/approval/${appid}/submissions`,
  
    // 待办 GET
    ApprovalTodos: (appid: string, username: string) => `${BASE_URL}/api/v2/approval/${appid}/todos?username=${username}`,
   
    // 审批动作 POST
    ApprovalAction: (appid: string) => `${BASE_URL}/api/v2/approval/${appid}/action`,

    // 创建新的审批类型
    CreateApprovalType: (appid: string) => `${BASE_URL}/api/v2/approval/${appid}/dictionary/approval-types`,

    // 获取当前用户的全部审批请求（规范拼写）
    ListMySubmissions: (appid: string, username: string) => `${BASE_URL}/api/v2/approval/${appid}/submissions?username=${username}`,























}





