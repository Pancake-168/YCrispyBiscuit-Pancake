/*
 * 基于 Element 的 linkify-matrix.ts 转换为适配本项目的 Vue 版本
 * 支持 Matrix 用户ID、房间别名的自动链接化
 * 
 * Copyright 2024 New Vector Ltd.
 * Copyright 2019 The Matrix.org Foundation C.I.C.
 * Copyright 2015, 2016 OpenMarket Ltd
 */

import * as linkifyjs from 'linkifyjs'
import { type EventListeners, type Opts, registerCustomProtocol, registerPlugin } from 'linkifyjs'
import linkifyStringLib from 'linkify-string'
import linkifyHtmlLib from 'linkify-html'

// 导出类型常量
export const Type = {
  URL: 'url',
  UserId: 'userid',
  RoomAlias: 'roomalias',
} as const

export type LinkifyType = (typeof Type)[keyof typeof Type]

type LinkifyStateLike = {
  ta: (inputs: string | string[], next?: LinkifyStateLike) => void
  tt: (token: string, next?: LinkifyStateLike) => LinkifyStateLike
}

type LinkifyParserLike = {
  start: { tt: (token: string) => LinkifyStateLike }
}

type LinkifyScannerLike = {
  tokens: {
    DOT: string
    NUM: string
    COLON: string
    SYM: string
    SLASH: string
    EQUALS: string
    HYPHEN: string
    UNDERSCORE: string
    POUND: string
    AT: string
    groups: { domain: string }
  }
}

/**
 * Matrix 不透明 ID 的 linkify 解析器
 * 用于识别 @user:server 和 #room:server 格式
 */
function matrixOpaqueIdLinkifyParser({
  scanner,
  parser,
  token,
  name,
}: {
  scanner: LinkifyScannerLike
  parser: LinkifyParserLike
  token: '#' | '+' | '@'
  name: string
}): void {
  const {
    DOT,
    NUM,
    COLON,
    SYM,
    SLASH,
    EQUALS,
    HYPHEN,
    UNDERSCORE,
  } = scanner.tokens

  const { domain } = scanner.tokens.groups

  const additionalLocalpartTokens = [DOT, SYM, SLASH, EQUALS, UNDERSCORE, HYPHEN]
  const additionalDomainpartTokens = [HYPHEN]

  const matrixToken = linkifyjs.createTokenClass(name, { isLink: true })
  const matrixTokenState = new linkifyjs.State(matrixToken) as unknown as LinkifyStateLike

  const matrixTokenWithPort = linkifyjs.createTokenClass(name, { isLink: true })
  const matrixTokenWithPortState = new linkifyjs.State(matrixTokenWithPort) as unknown as LinkifyStateLike

  const INITIAL_STATE = parser.start.tt(token)

  // Localpart
  const LOCALPART_STATE = new linkifyjs.State() as unknown as LinkifyStateLike
  INITIAL_STATE.ta(domain, LOCALPART_STATE)
  INITIAL_STATE.ta(additionalLocalpartTokens, LOCALPART_STATE)
  LOCALPART_STATE.ta(domain, LOCALPART_STATE)
  LOCALPART_STATE.ta(additionalLocalpartTokens, LOCALPART_STATE)

  // Domainpart
  const DOMAINPART_STATE_DOT = LOCALPART_STATE.tt(COLON)
  DOMAINPART_STATE_DOT.ta(domain, matrixTokenState)
  DOMAINPART_STATE_DOT.ta(additionalDomainpartTokens, matrixTokenState)
  matrixTokenState.ta(domain, matrixTokenState)
  matrixTokenState.ta(additionalDomainpartTokens, matrixTokenState)
  matrixTokenState.tt(DOT, DOMAINPART_STATE_DOT)

  // Port suffixes
  matrixTokenState.tt(COLON).tt(NUM, matrixTokenWithPortState)
}

/**
 * 处理用户点击事件
 */
function onUserClick(event: MouseEvent, userId: string): void {
  event.preventDefault()
  // 触发自定义事件，在 Vue 组件中监听
  const customEvent = new CustomEvent('mention-user-click', {
    detail: { userId },
    bubbles: true,
  })
  ;(event.target as Element)?.dispatchEvent(customEvent)
}

/**
 * 处理房间别名点击事件
 */
function onAliasClick(event: MouseEvent, roomAlias: string): void {
  event.preventDefault()
  // 触发自定义事件，在 Vue 组件中监听
  const customEvent = new CustomEvent('room-alias-click', {
    detail: { roomAlias },
    bubbles: true,
  })
  ;(event.target as Element)?.dispatchEvent(customEvent)
}

const escapeRegExp = function (s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// 认识 Element URL 模式
export const ELEMENT_URL_PATTERN =
  '^(?:vector://|https?://)?(?:' +
  escapeRegExp(window.location.host + window.location.pathname) +
  '|' +
  '(?:www\\.)?(?:riot|vector)\\.im/(?:app|beta|staging|develop)/|' +
  '(?:app|beta|staging|develop)\\.element\\.io/' +
  ')(#.*)'

// 允许的 URL schemes
const PERMITTED_URL_SCHEMES = [
  'bitcoin',
  'ftp',
  'ftps',
  'geo',
  'http',
  'https',
  'im',
  'magnet',
  'mailto',
  'matrix',
  'mxc',
  'news',
  'openpgp4fpr',
  'sip',
  'sms',
  'smsto',
  'tel',
  'urn',
  'xmpp',
]

/**
 * Linkify 选项配置
 */
export const options: Opts = {
  events: function (href: string, type: string): EventListeners {
    const linkType = type as LinkifyType

    switch (linkType) {
      case Type.URL: {
        // 对于 URL，不做特殊处理
        return {}
      }
      case Type.UserId:
        return {
          click: function (e: MouseEvent) {
            onUserClick(e, href)
          },
        }
      case Type.RoomAlias:
        return {
          click: function (e: MouseEvent) {
            onAliasClick(e, href)
          },
        }
    }

    return {}
  },

  formatHref: function (href: string, type: LinkifyType | string): string {
    if (type === 'url' && href.startsWith('mxc://')) {
      // MXC URL 处理 - 暂时保持原样
      return href
    }

    // 其他类型转换为 matrix.to 链接
    if (type === Type.RoomAlias || type === Type.UserId) {
      return `https://matrix.to/#/${href}`
    }

    return href
  },

  attributes: {
    rel: 'noreferrer noopener',
  },

  ignoreTags: ['a', 'pre', 'code'],

  className: 'linkified',

  target: function (_href: string, type: LinkifyType | string): string {
    if (type === Type.URL) {
      return '_blank'
    }
    return ''
  },
}

// 注册 Matrix 房间别名插件
registerPlugin(Type.RoomAlias, (args) => {
  const { scanner, parser } = args as unknown as { scanner: LinkifyScannerLike; parser: LinkifyParserLike }
  const token = scanner.tokens.POUND as '#'
  matrixOpaqueIdLinkifyParser({
    scanner,
    parser,
    token,
    name: Type.RoomAlias,
  })
})

// 注册 Matrix 用户ID插件
registerPlugin(Type.UserId, (args) => {
  const { scanner, parser } = args as unknown as { scanner: LinkifyScannerLike; parser: LinkifyParserLike }
  const token = scanner.tokens.AT as '@'
  matrixOpaqueIdLinkifyParser({
    scanner,
    parser,
    token,
    name: Type.UserId,
  })
})

// 注册自定义协议
const linkifySupportedProtocols = ['file', 'mailto', 'http', 'https', 'ftp', 'ftps']
const optionalSlashProtocols = [
  'bitcoin',
  'geo',
  'im',
  'magnet',
  'mailto',
  'matrix',
  'news',
  'openpgp4fpr',
  'sip',
  'sms',
  'smsto',
  'tel',
  'urn',
  'xmpp',
]

PERMITTED_URL_SCHEMES.forEach((scheme) => {
  if (!linkifySupportedProtocols.includes(scheme)) {
    registerCustomProtocol(scheme, optionalSlashProtocols.includes(scheme))
  }
})

registerCustomProtocol('mxc', false)

export const linkify = linkifyjs

/**
 * 将字符串中的链接、用户ID、房间别名转换为可点击的链接
 * @param str 要处理的字符串
 * @param customOptions 自定义选项
 * @returns 处理后的 HTML 字符串
 */
export function linkifyString(str: string, customOptions = options): string {
  return linkifyStringLib(str, customOptions)
}

/**
 * 将 HTML 字符串中的链接、用户ID、房间别名转换为可点击的链接
 * @param str 要处理的 HTML 字符串
 * @param customOptions 自定义选项
 * @returns 处理后的 HTML 字符串
 */
export function linkifyHtml(str: string, customOptions = options): string {
  return linkifyHtmlLib(str, customOptions)
}
