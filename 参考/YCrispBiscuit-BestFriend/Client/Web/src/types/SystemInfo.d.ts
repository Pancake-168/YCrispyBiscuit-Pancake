export interface SystemInfo {
    "系统信息": {
        "操作系统": string;
        "操作系统版本": string;
        "主机名": string;
    };
    "CPU信息": {
        "CPU型号": string;
        "CPU核心数": string;
        "CPU逻辑核心数": string;
    };
    "内存信息": {
        "总内存": string;
        "可用内存": string;
        "内存使用率": string;
    };
    "开机信息": {
        "开机时间": string;
        "开机时长": string;
    };
    "GPU信息": Array<{
        "GPU型号": string;
        "驱动版本": string;
        "显存"?: string; // 可选，因为不是所有GPU都有
    }>;
    "磁盘信息": Array<{
        "盘符": string;
        "总大小": string;
        "可用空间": string;
        "使用率": string;
    }>;
    "网络信息": Array<{
        "网卡名称": string;
        "MAC地址": string;
        "链路速度": string;
    }>;
}