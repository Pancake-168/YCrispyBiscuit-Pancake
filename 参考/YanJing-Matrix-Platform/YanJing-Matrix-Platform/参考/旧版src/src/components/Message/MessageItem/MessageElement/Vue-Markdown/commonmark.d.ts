/*
 * commonmark 类型扩展
 * 基于 Element 的 @types/commonmark 扩展
 */

import type * as commonmark from 'commonmark'

declare module 'commonmark' {
  export type Attr = [key: string, value: string]

  export interface HtmlRenderer {
    // 以下方法在 @types/commonmark 中未公开，但在实际使用中可用
    text: (this: commonmark.HtmlRenderer, node: commonmark.Node) => void
    html_inline: (this: commonmark.HtmlRenderer, node: commonmark.Node) => void
    html_block: (this: commonmark.HtmlRenderer, node: commonmark.Node) => void
    linebreak: (this: commonmark.HtmlRenderer) => void
    link: (this: commonmark.HtmlRenderer, node: commonmark.Node, entering: boolean) => void
    image: (this: commonmark.HtmlRenderer, node: commonmark.Node, entering: boolean) => void
    emph: (this: commonmark.HtmlRenderer, node: commonmark.Node, entering: boolean) => void
    strong: (this: commonmark.HtmlRenderer, node: commonmark.Node, entering: boolean) => void
    paragraph: (this: commonmark.HtmlRenderer, node: commonmark.Node, entering: boolean) => void
    heading: (this: commonmark.HtmlRenderer, node: commonmark.Node, entering: boolean) => void
    code: (this: commonmark.HtmlRenderer, node: commonmark.Node) => void
    code_block: (this: commonmark.HtmlRenderer, node: commonmark.Node) => void
    thematic_break: (this: commonmark.HtmlRenderer, node: commonmark.Node) => void
    block_quote: (this: commonmark.HtmlRenderer, node: commonmark.Node, entering: boolean) => void
    list: (this: commonmark.HtmlRenderer, node: commonmark.Node, entering: boolean) => void
    item: (this: commonmark.HtmlRenderer, node: commonmark.Node, entering: boolean) => void
    custom_inline: (this: commonmark.HtmlRenderer, node: commonmark.Node, entering: boolean) => void
    custom_block: (this: commonmark.HtmlRenderer, node: commonmark.Node, entering: boolean) => void
    esc: (s: string) => string
    out: (this: commonmark.HtmlRenderer, text: string) => void
    tag: (this: commonmark.HtmlRenderer, name: string, attrs?: Attr[], selfClosing?: boolean) => void
    attrs: (this: commonmark.HtmlRenderer, node: commonmark.Node) => Attr[]
    // 继承自基础 Renderer
    lit: (this: commonmark.HtmlRenderer, text: string) => void
    cr: (this: commonmark.HtmlRenderer) => void
  }
}

export {}
