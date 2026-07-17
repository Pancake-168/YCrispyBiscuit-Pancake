# 项目统一异常体系。
# 所有业务可预期错误都通过这里的异常类抛出，
# 由 exceptions/handlers.py 的全局 handler 统一捕获并返回 JSON 响应（含 request_id）。


class AppError(Exception):
    """业务异常基类。所有自定义异常继承此类，handler 根据 status_code 设置 HTTP 状态码。"""

    status_code = 400  # 默认 400，子类覆盖为各自的 HTTP 状态码

    def __init__(self, detail: str):
        super().__init__(detail)  # 调用 Exception 基类构造
        self.detail = detail  # 错误描述文本，最终写入响应体的 detail 字段


class BadRequestError(AppError):
    """请求参数不合法（400）。用于参数校验失败、空值、越界等场景。"""

    status_code = 400


class AuthenticationError(AppError):
    """认证失败（401）。用于 token 无效、过期、用户不存在、密码错误等场景。"""

    status_code = 401


class ForbiddenError(AppError):
    """权限不足（403）。"""

    status_code = 403


class NotFoundError(AppError):
    """资源不存在（404）。用于任务不存在、文件过期、数据未找到等场景。"""

    status_code = 404


class ConflictError(AppError):
    """资源冲突（409）。用于用户名/邮箱已被占用、数据唯一性冲突等场景。"""

    status_code = 409


class ExternalServiceError(AppError):
    """外部服务异常（502）。用于上游 API 不可用、第三方服务返回错误等场景。"""

    status_code = 502


class DatabaseError(AppError):
    """数据库操作失败（500）。用于 ORM 层 SQLAlchemy 异常的翻译抛出。"""

    status_code = 500


class ConfigurationError(AppError):
    """配置或依赖缺失（500）。用于缺少必需的库、API 地址未找到、文件缺失等环境问题。"""

    status_code = 500
