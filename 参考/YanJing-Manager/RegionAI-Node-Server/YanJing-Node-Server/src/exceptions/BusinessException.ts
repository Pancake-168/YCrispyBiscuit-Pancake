export class BusinessException extends Error {
  public statusCode: number
  public errorCode: number

  constructor(statusCode: number, message: string, errorCode?: number) {
    super(message)
    this.name = 'BusinessException'
    this.statusCode = statusCode
    // 如果没有专门的业务自定义错误码，默认使用 HTTP 状态码
    this.errorCode = errorCode || statusCode
  }
}
