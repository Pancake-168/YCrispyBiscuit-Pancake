"""
标准 API 调用模板（Python 脚本版）
=====================================
模仿项目前端的标准 api 调用风格：
- url 集中写在最上面，方便改
- 每个接口一个函数，里面 try/except
- 统一返回 {"ok": True/False, "data": ..., "error": ...}
"""

import httpx

# ================= 配置区：改成你的后端地址和接口 =================
BASE_URL = "https://apiv2.zheshu.tech"          # 后端地址（改成你实际的）
url = f"{BASE_URL}/api/auth/login"             # 接口路径（改成你实际的）


# ================= 通用请求函数（带 try/except） =================
def request_api(method: str, url: str, json_data=None, form_data=None, params=None, headers=None) -> dict:
    """通用接口调用：
    method    请求方式，如 "GET" / "POST"
    url       接口完整地址
    json_data POST 时传的 JSON 请求体（字典）
    form_data POST 时传的表单请求体（字典，登录接口常用）
    params    查询参数（字典），如 {"page": 1}
    headers   请求头（字典），如 {"X-Platform": "web"}
    返回：{"ok": True, "data": ...} 或 {"ok": False, "error": ...}
    """
    try:
        resp = httpx.request(
            method=method,
            url=url,
            json=json_data,
            data=form_data,
            params=params,
            headers=headers,
            timeout=10,                    # 超时 10 秒，防止卡死
        )
        resp.raise_for_status()            # 状态码不是 2xx 会抛异常
        return {"ok": True, "data": resp.json()}
    except httpx.TimeoutException:
        return {"ok": False, "error": "请求超时"}
    except httpx.HTTPStatusError as e:
        return {"ok": False, "error": f"HTTP 错误: 状态码 {e.response.status_code}"}
    except httpx.RequestError as e:
        return {"ok": False, "error": f"网络错误: {e}"}
    except Exception as e:
        return {"ok": False, "error": f"未知错误: {e}"}


# ================= 具体接口函数（按接口一个个写） =================
def get_example():
    """示例：GET 请求"""
    return request_api("GET", url)


def post_example():
    """示例：POST 请求，带请求体"""
    return request_api("POST", url, json_data={"username": "ycb20260129", "password": "@Gyf20021109"})

def login():
    # 登录接口：
    #  - 请求头里带 X-Platform / X-Device-Name（文档默认值：web / 未知）
    #  - 请求体是表单（form），不能是 json
    return request_api(
        "POST",
        url,
        headers={"X-Platform": "web", "X-Device-Name": "未知"},
        form_data={"username": "ycb20260129", "password": "@Gyf20021109"},
    )

# ================= 入口 =================
if __name__ == "__main__":
    result = post_example()
    if result["ok"]:
        print("调用成功，返回的数据：")
        print(result["data"])
    else:
        print("调用失败：", result["error"])




