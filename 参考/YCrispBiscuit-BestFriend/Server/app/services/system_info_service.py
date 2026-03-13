import platform
import subprocess
import time
from datetime import datetime, timedelta


class SystemInfoService:
    """业务逻辑层：获取系统信息（仅用系统命令）"""

    def get_system_info(self):
        try:
            system = platform.system()
            
            # CPU 信息
            cpu_info = self._get_cpu_info(system)
            
            # 内存信息
            memory_info = self._get_memory_info(system)
            
            # 开机时长
            uptime_info = self._get_uptime_info(system)
            
            # GPU 信息
            gpu_info = self._get_gpu_info(system)
            
            # 磁盘信息
            disk_info = self._get_disk_info(system)
            
            # 网络信息
            network_info = self._get_network_info(system)
            
            # 系统信息
            system_info = {
                "操作系统": system,
                "操作系统版本": platform.version(),
                "主机名": platform.node()
            }
            
            return {
                "系统信息": system_info,
                "CPU信息": cpu_info,
                "内存信息": memory_info,
                "开机信息": uptime_info,
                "GPU信息": gpu_info,
                "磁盘信息": disk_info,
                "网络信息": network_info
            }
        except Exception as e:
            raise ValueError(f"Failed to get system info: {str(e)}")
    
    def _get_cpu_info(self, system):
        if system == "Windows":
            result = subprocess.run(["powershell.exe", "-Command", "Get-WmiObject Win32_Processor | Select-Object Name,NumberOfCores,NumberOfLogicalProcessors | ConvertTo-Json"], capture_output=True, text=True)
            import json
            data = json.loads(result.stdout.strip())
            if isinstance(data, list):
                cpu = data[0]  # Take first CPU
            else:
                cpu = data
            name = cpu.get('Name', '')
            cores = cpu.get('NumberOfCores', 0)
            logical = cpu.get('NumberOfLogicalProcessors', 0)
            return {
                "CPU型号": name,
                "CPU核心数": str(cores),
                "CPU逻辑核心数": str(logical)
            }
        elif system == "Linux":
            with open('/proc/cpuinfo', 'r') as f:
                for line in f:
                    if line.startswith('model name'):
                        name = line.split(':')[1].strip()
                    elif line.startswith('cpu cores'):
                        cores = line.split(':')[1].strip()
                    elif line.startswith('siblings'):
                        logical = line.split(':')[1].strip()
                return {
                    "CPU型号": name,
                    "CPU核心数": cores,
                    "CPU逻辑核心数": logical
                }
    
    def _get_memory_info(self, system):
        if system == "Windows":
            # 总内存和可用内存
            result = subprocess.run(["powershell.exe", "-Command", "Get-WmiObject Win32_OperatingSystem | Select-Object TotalVisibleMemorySize,FreePhysicalMemory | ConvertTo-Json"], capture_output=True, text=True)
            import json
            data = json.loads(result.stdout.strip())
            total_kb = int(data['TotalVisibleMemorySize'])
            free_kb = int(data['FreePhysicalMemory'])
            total_gb = total_kb / (1024**2)
            available_gb = free_kb / (1024**2)
            used_percent = ((total_gb - available_gb) / total_gb) * 100
            return {
                "总内存": f"{total_gb:.2f} GB",
                "可用内存": f"{available_gb:.2f} GB",
                "内存使用率": f"{used_percent:.1f}%"
            }
        elif system == "Linux":
            with open('/proc/meminfo', 'r') as f:
                for line in f:
                    if line.startswith('MemTotal'):
                        total = int(line.split()[1]) / (1024**2)
                    elif line.startswith('MemAvailable'):
                        available = int(line.split()[1]) / (1024**2)
                used_percent = ((total - available) / total) * 100
                return {
                    "总内存": f"{total:.2f} GB",
                    "可用内存": f"{available:.2f} GB",
                    "内存使用率": f"{used_percent:.1f}%"
                }
    
    def _get_uptime_info(self, system):
        if system == "Windows":
            result = subprocess.run(["powershell.exe", "-Command", "(Get-Date) - (Get-CimInstance Win32_OperatingSystem).LastBootUpTime | Select-Object TotalSeconds | ConvertTo-Json"], capture_output=True, text=True)
            import json
            data = json.loads(result.stdout.strip())
            uptime_seconds = float(data['TotalSeconds'])
            boot_time = datetime.now() - timedelta(seconds=uptime_seconds)
            return {
                "开机时间": boot_time.strftime("%Y-%m-%d %H:%M:%S"),
                "开机时长": f"{uptime_seconds // 3600:.0f}小时 {uptime_seconds % 3600 // 60:.0f}分钟"
            }
        elif system == "Linux":
            with open('/proc/uptime', 'r') as f:
                uptime_seconds = float(f.read().split()[0])
            boot_time = datetime.fromtimestamp(time.time() - uptime_seconds)
            return {
                "开机时间": boot_time.strftime("%Y-%m-%d %H:%M:%S"),
                "开机时长": f"{uptime_seconds // 3600:.0f}小时 {uptime_seconds % 3600 // 60:.0f}分钟"
            }
    
    def _get_gpu_info(self, system):
        if system == "Windows":
            gpu_list = []
            # 基本信息
            result = subprocess.run(["powershell.exe", "-Command", "Get-WmiObject Win32_VideoController | Select-Object Name,AdapterRAM,DriverVersion | ConvertTo-Json"], capture_output=True, text=True)
            import json
            data = json.loads(result.stdout.strip())
            if isinstance(data, list):
                gpus = data
            else:
                gpus = [data]
            for gpu in gpus:
                gpu_info = {"GPU型号": gpu.get('Name', '')}
                ram = gpu.get('AdapterRAM')
                if ram:
                    ram_gb = int(ram) / (1024**3)
                    gpu_info["显存"] = f"{ram_gb:.2f} GB"
                gpu_info["驱动版本"] = gpu.get('DriverVersion', '')
                gpu_list.append(gpu_info)
            
            # 尝试用nvidia-smi获取实时信息（如果有NVIDIA GPU）
            nvidia_result = subprocess.run(["nvidia-smi", "--query-gpu=name,utilization.gpu,memory.used,memory.total,temperature.gpu", "--format=csv,noheader,nounits"], capture_output=True, text=True)
            if nvidia_result.returncode == 0:
                nvidia_lines = nvidia_result.stdout.strip().split('\n')
                for i, line in enumerate(nvidia_lines):
                    parts = [p.strip() for p in line.split(',')]
                    if len(parts) >= 5 and i < len(gpu_list):
                        gpu_list[i]["GPU使用率"] = f"{parts[1]}%"
                        gpu_list[i]["显存使用"] = f"{parts[2]} MB / {parts[3]} MB"
                        gpu_list[i]["温度"] = f"{parts[4]}°C"
            
            return gpu_list if gpu_list else [{"GPU型号": "未检测到GPU"}]
        elif system == "Linux":
            result = subprocess.run(["lspci"], capture_output=True, text=True)
            gpus = [line for line in result.stdout.split('\n') if 'VGA' in line or '3D' in line]
            return [{"GPU型号": gpu.split(': ')[-1] if ': ' in gpu else gpu} for gpu in gpus]
    
    def _get_disk_info(self, system):
        if system == "Windows":
            result = subprocess.run(["powershell", "-Command", "Get-WmiObject Win32_LogicalDisk | Where-Object {$_.DriveType -eq 3} | Select-Object DeviceID,Size,FreeSpace | ConvertTo-Json"], capture_output=True, text=True)
            import json
            data = json.loads(result.stdout.strip())
            if isinstance(data, list):
                disks_data = data
            else:
                disks_data = [data]
            disks = []
            for disk in disks_data:
                drive = disk.get('DeviceID', '')
                size_bytes = disk.get('Size')
                free_bytes = disk.get('FreeSpace')
                if size_bytes and free_bytes:
                    size_gb = int(size_bytes) / (1024**3)
                    free_gb = int(free_bytes) / (1024**3)
                    used_gb = size_gb - free_gb
                    usage = (used_gb / size_gb) * 100
                    disks.append({
                        "盘符": drive,
                        "总大小": f"{size_gb:.2f} GB",
                        "可用空间": f"{free_gb:.2f} GB",
                        "使用率": f"{usage:.1f}%"
                    })
            return disks
        elif system == "Linux":
            result = subprocess.run(["df", "-h"], capture_output=True, text=True)
            lines = result.stdout.strip().split('\n')[1:]  # 跳过标题
            disks = []
            for line in lines:
                parts = line.split()
                if len(parts) >= 6 and parts[0].startswith('/'):
                    mount = parts[5]
                    size = parts[1]
                    used = parts[2]
                    avail = parts[3]
                    usage = parts[4]
                    disks.append({
                        "挂载点": mount,
                        "总大小": size,
                        "已用": used,
                        "可用": avail,
                        "使用率": usage
                    })
            return disks
    
    def _get_network_info(self, system):
        if system == "Windows":
            result = subprocess.run(["powershell.exe", "-Command", "Get-NetAdapter | Where-Object {$_.Status -eq 'Up'} | Select-Object Name,MacAddress,LinkSpeed | ConvertTo-Json"], capture_output=True, text=True)
            import json
            data = json.loads(result.stdout.strip())
            networks = []
            if isinstance(data, list):
                for item in data:
                    networks.append({
                        "网卡名称": item.get('Name', ''),
                        "MAC地址": item.get('MacAddress', ''),
                        "链路速度": item.get('LinkSpeed', '')
                    })
            else:
                networks.append({
                    "网卡名称": data.get('Name', ''),
                    "MAC地址": data.get('MacAddress', ''),
                    "链路速度": data.get('LinkSpeed', '')
                })
            return networks
        elif system == "Linux":
            result = subprocess.run(["ip", "link"], capture_output=True, text=True)
            lines = result.stdout.strip().split('\n')
            networks = []
            for line in lines:
                if 'state UP' in line:
                    parts = line.split()
                    if len(parts) >= 2:
                        name = parts[1].strip(':')
                        networks.append({"网卡名称": name})
            return networks