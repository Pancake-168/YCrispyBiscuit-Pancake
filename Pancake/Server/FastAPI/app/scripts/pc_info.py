import os
import sys
import asyncio
import platform
import socket
import psutil
from datetime import datetime



async def SystemInfo() -> None:
    print("———————————————系统信息———————————————")
    print("操作系统：", platform.system())
    print("发行版本：", platform.release())
    print("版本号：", platform.version())
    print("架构：", platform.machine())
    print("处理器：",platform.processor())
    print("主机名：", platform.node())


async def Main():
    await SystemInfo()


asyncio.run(Main())


"""







# 主机名和 IP
print(socket.gethostname())
print(socket.gethostbyname(socket.gethostname()))

# 环境变量（部分）
print(os.environ.get('USERNAME'))       # Windows 用户名
print(os.environ.get('PATH'))


# 核心数与逻辑核数
print(f"物理核心: {psutil.cpu_count(logical=False)}")
print(f"逻辑核心: {psutil.cpu_count(logical=True)}")

# CPU 型号 / 频率（单位 MHz）
freq = psutil.cpu_freq()
print(f"当前频率: {freq.current:.0f} MHz, 最大: {freq.max:.0f} MHz")

# CPU 总使用率（interval 为采样时长，建议 >= 0.1 才有意义）
print(f"CPU 使用率: {psutil.cpu_percent(interval=1)}%")

# 每个核心的使用率
print(psutil.cpu_percent(interval=1, percpu=True))

# 系统负载（Unix 才有，Windows 不可用）
if hasattr(psutil, 'getloadavg'):
    print(psutil.getloadavg())



# 虚拟内存（单位：字节）
vm = psutil.virtual_memory()
print(f"内存总量: {vm.total / 1024**3:.2f} GB")
print(f"内存可用: {vm.available / 1024**3:.2f} GB")
print(f"内存已用: {vm.used / 1024**3:.2f} GB")
print(f"内存使用率: {vm.percent}%")

# 交换分区
sm = psutil.swap_memory()
print(f"交换区: 总 {sm.total / 1024**3:.2f} GB, 使用率 {sm.percent}%")






# 所有磁盘分区
for part in psutil.disk_partitions():
    usage = psutil.disk_usage(part.mountpoint)
    print(f"{part.device} 挂载于 {part.mountpoint} 文件系统 {part.fstype}")
    print(f"  总 {usage.total / 1024**3:.2f} GB, "
          f"已用 {usage.used / 1024**3:.2f} GB, "
          f"使用率 {usage.percent}%")

# 磁盘 I/O 统计（累计值，两次采样相减可得速率）
psutil.disk_io_counters()







# 本机所有网卡及 IP
for name, info in psutil.net_if_addrs().items():
    for addr in info:
        if addr.family.name == 'AF_INET':   # IPv4
            print(f"{name}: {addr.address}")

# 网络 I/O（总收发字节；想算速率需两次采样相减）
io = psutil.net_io_counters()
print(f"发送: {io.bytes_sent / 1024**2:.2f} MB, 接收: {io.bytes_recv / 1024**2:.2f} MB")

# 当前网络连接列表
psutil.net_connections()













# 所有进程 PID 列表
print(psutil.pids())

# 遍历进程并筛选
for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent']):
    try:
        print(proc.info)
    except (psutil.NoSuchProcess, psutil.AccessDenied):
        pass

# 查看某个进程详情
# 默认查看当前进程；也可通过命令行参数指定 PID，例如：python pc_info.py 1234
target_pid = int(sys.argv[1]) if len(sys.argv) > 1 else os.getpid()
print(f"查看 PID: {target_pid}")
try:
    p = psutil.Process(target_pid)
    print(p.name())
    print(p.status())
    print(p.cpu_percent(interval=1))
    print(p.memory_info())            # rss 等
    print(p.create_time())            # 启动时间戳
    print(p.cmdline())                # 启动命令行
except psutil.NoSuchProcess:
    print(f"进程 {target_pid} 不存在")
except psutil.AccessDenied:
    print(f"无权访问进程 {target_pid}")








# 电池（笔记本）
battery = psutil.sensors_battery()
if battery:
    print(f"电量: {battery.percent}%, 充电中: {battery.power_plugged}")

# 温度（部分 Linux 可用，Windows 通常为空）
# print(psutil.sensors_temperatures())








# 开机时长
print(f"已运行: {psutil.boot_time()} 秒")
boot = datetime.fromtimestamp(psutil.boot_time())
print(f"开机时间: {boot}")

# 当前登录用户
for u in psutil.users():
    print(f"用户 {u.name}, 终端 {u.terminal}, 登录时间 {datetime.fromtimestamp(u.started)}")



    """
