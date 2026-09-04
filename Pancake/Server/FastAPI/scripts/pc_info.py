import asyncio
import platform
import psutil
import time
from datetime import datetime

"""
import os
import sys
import socket

"""


async def SystemInfo() -> None:
    print("—————————————————系统信息—————————————————")
    print("操作系统：", platform.system())
    print("发行版本：", platform.release())
    print("版本号：", platform.version())
    print("架构：", platform.machine())
    print("处理器：", platform.processor())
    print("主机名：", platform.node())

async def SystemTime() -> None:
    # 开机时长 = 当前时间 - 开机时间点（boot_time 返回的是开机时刻的 Unix 时间戳）
    uptime_seconds = time.time() - psutil.boot_time()
    hours = int(uptime_seconds // 3600)
    minutes = int((uptime_seconds % 3600) // 60)
    seconds = int(uptime_seconds % 60)
    print(f"已运行: {hours}时 {minutes}分 {seconds}秒")
    boot = datetime.fromtimestamp(psutil.boot_time())
    print(f"开机时间: {boot}")


async def CpuInfo() -> None:
    print("—————————————————CPU信息—————————————————")
    # 物理核心数/逻辑核心数：前者是真实核心，后者包含超线程
    physical = psutil.cpu_count(logical=False)
    logical = psutil.cpu_count(logical=True)
    print(f"物理核心: {physical}")
    print(f"逻辑核心: {logical}")
    # CPU 当前频率和最大频率，某些环境可能读不到，需要判空
    freq = psutil.cpu_freq()
    if freq:
        print(f"当前频率: {freq.current:.0f} MHz, 最大: {freq.max:.0f} MHz")
    # interval=1 表示采样 1 秒，适合查看实时总使用率
    print(f"CPU 使用率: {psutil.cpu_percent(interval=1)}%")
    # 每个核心的使用率，按逗号拼接输出避免刷屏
    per_core = psutil.cpu_percent(interval=1, percpu=True)
    print("各核心使用率:", ", ".join(f"{p:.0f}%" for p in per_core))


async def MemoryInfo() -> None:
    print("—————————————————内存信息—————————————————")
    # 虚拟内存：总量/可用/已用/使用率
    vm = psutil.virtual_memory()
    print(f"内存总量: {vm.total / 1024**3:.2f} GB")
    print(f"内存可用: {vm.available / 1024**3:.2f} GB")
    print(f"内存已用: {vm.used / 1024**3:.2f} GB")
    print(f"内存使用率: {vm.percent}%")
    # 交换分区/页面文件：Windows 上通常也有该数据
    sm = psutil.swap_memory()
    print(f"交换区: 总 {sm.total / 1024**3:.2f} GB, 使用率 {sm.percent}%")


async def DiskInfo() -> None:
    print("—————————————————磁盘信息—————————————————")
    # 遍历所有磁盘分区，显示容量和占用率
    for part in psutil.disk_partitions():
        # 部分分区（如光驱）可能无法读取，跳过而不是让整个脚本崩溃
        try:
            usage = psutil.disk_usage(part.mountpoint)
        except PermissionError:
            continue
        print(f"{part.device} 挂载于 {part.mountpoint} 文件系统 {part.fstype}")
        print(
            f"总 {usage.total / 1024**3:.2f} GB, "
            f"已用 {usage.used / 1024**3:.2f} GB, "
            f"可用 {usage.free / 1024**3:.2f} GB, "
            f"使用率 {usage.percent}%"
        )


async def NetworkInfo() -> None:
    print("—————————————————网络信息—————————————————")
    # 本机所有网卡的 IPv4 地址，方便快速查看局域网 IP
    print("本机 IPv4 地址:")
    for name, info in psutil.net_if_addrs().items():
        for addr in info:
            if addr.family.name == "AF_INET":
                print(f"  {name}: {addr.address}")
    # 网卡累计收发流量；要算实时速率需要两次采样做差值
    io = psutil.net_io_counters()
    print(
        f"累计发送: {io.bytes_sent / 1024**2:.2f} MB, "
        f"累计接收: {io.bytes_recv / 1024**2:.2f} MB"
    )


async def Main():
    await SystemInfo()
    await SystemTime()
    await CpuInfo()
    await MemoryInfo()
    await DiskInfo()
    await NetworkInfo()


asyncio.run(Main())
