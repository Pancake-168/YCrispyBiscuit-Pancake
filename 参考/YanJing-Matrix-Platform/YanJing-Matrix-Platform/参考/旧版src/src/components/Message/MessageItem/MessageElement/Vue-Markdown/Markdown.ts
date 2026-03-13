/*
 * Markdown 解析和渲染类
 * 基于 Element 的 Markdown.ts 转换为适配本项目的 Vue 版本
 * 
 * Copyright 2024 New Vector Ltd.
 * Copyright 2021 The Matrix.org Foundation C.I.C.
 * Copyright 2016 OpenMarket Ltd
 */

import './commonmark.d.ts' // 导入更好的类型定义
import * as commonmark from 'commonmark'
import { escape } from 'lodash-es'

import { linkify } from './linkify-matrix'

const ALLOWED_HTML_TAGS = ['sub', 'sup', 'del', 's', 'u', 'br', 'br/']

// 这些类型的节点肯定是文本
const TEXT_NODES = ['text', 'softbreak', 'linebreak', 'paragraph', 'document']

function isAllowedHtmlTag(node: commonmark.Node): boolean {
  if (!node.literal) {
    return false
  }

  if (node.literal.match('^<((div|span) data-mx-maths="[^"]*"|/(div|span))>$') != null) {
    return true
  }

  // 正则不能处理带属性的标签，但我们允许的标签实际上不应该有任何属性
  const matches = /^<\/?(.*)>$/.exec(node.literal)
  if (matches && matches.length == 2) {
    const tag = matches[1]
    return ALLOWED_HTML_TAGS.indexOf(tag) > -1
  }

  return false
}

/*
 * 返回 true 如果包含该节点的解析输出
 * 包含多个块级元素（即行），
 * 如果只是单行则返回 false
 */
function isMultiLine(node: commonmark.Node): boolean {
  let par = node
  while (par.parent) {
    par = par.parent
  }
  return par.firstChild != par.lastChild
}

function getTextUntilEndOrLinebreak(node: commonmark.Node): string {
  let currentNode: commonmark.Node | null = node
  let text = ''
  while (currentNode && currentNode.type !== 'softbreak' && currentNode.type !== 'linebreak') {
    const { literal, type } = currentNode
    if (type === 'text' && literal) {
      let n = 0
      let char = literal[n]
      while (char !== ' ' && char !== null && n <= literal.length) {
        if (char === ' ') {
          break
        }
        if (char) {
          text += char
        }
        n += 1
        char = literal[n]
      }
      if (char === ' ') {
        break
      }
    }
    currentNode = currentNode.next
  }
  return text
}

const formattingChangesByNodeType: Record<string, string> = {
  emph: '_',
  strong: '__',
}

/**
 * 返回节点及所有子节点的字面值，包含换行符
 * 增强版：尝试还原链接和图片的 Markdown 语法，以便在表格中重新解析
 */
const innerNodeLiteral = (node: commonmark.Node): string => {
  let literal = ''

  const walker = node.walker()
  let step: commonmark.NodeWalkingStep | null

  while ((step = walker.next())) {
    const currentNode = step.node
    if (step.entering) {
        if ((currentNode.type === 'text' || currentNode.type === 'code') && currentNode.literal) {
            literal += currentNode.literal
        } else if (currentNode.type === 'softbreak' || currentNode.type === 'linebreak') {
            literal += '\n'
        } else if (currentNode.type === 'link') {
            literal += '['
        } else if (currentNode.type === 'image') {
            literal += '!['
        }
    } else {
        // 退出节点时
        if (currentNode.type === 'link') {
            literal += `](${currentNode.destination})`
        } else if (currentNode.type === 'image') {
            literal += `](${currentNode.destination})`
        }
    }
  }

  return literal
}

const emptyItemWithNoSiblings = (node: commonmark.Node): boolean => {
  return !node.prev && !node.next && !node.firstChild
}

/**
 * 封装 commonmark 的类，添加了查看给定消息是否
 * 实际使用了任何 markdown 语法或是否为纯文本的能力
 */
export default class Markdown {
  private input: string
  private parsed: commonmark.Node

  public constructor(input: string) {
    this.input = input

    const parser = new commonmark.Parser()
    this.parsed = parser.parse(this.input)
    this.parsed = this.repairLinks(this.parsed)
  }

  /**
   * 此方法修改解析的 AST，使链接始终正确链接化
   * 而不是有时被错误地强调
   * 例如: https://my_weird-link_domain.domain.com
   * 这个链接会被解析成:
   * <a href="https://my">https://my</a><b>weird-link</b><a href="https://domain.domain.com">domain.domain.com</a>
   * 此方法使链接得到正确修改，不会被强调
   */
  private repairLinks(parsed: commonmark.Node): commonmark.Node {
    const walker = parsed.walker()
    let event: commonmark.NodeWalkingStep | null = null
    let text = ''
    let isInPara = false
    let previousNode: commonmark.Node | null = null
    let shouldUnlinkFormattingNode = false
    
    while ((event = walker.next())) {
      const { node } = event
      if (node.type === 'paragraph') {
        if (event.entering) {
          isInPara = true
        } else {
          isInPara = false
        }
      }
      if (isInPara) {
        // 行结束时清除保存的字符串
        if (
          node.type === 'softbreak' ||
          node.type === 'linebreak' ||
          // 在任何空格处也开始从头计算文本
          (node.type === 'text' && node.literal === ' ')
        ) {
          text = ''
          continue
        }

        // 在空格处分割文本节点，这样我们就不会在不重置的情况下越过它们
        if (node.type === 'text' && node.literal) {
          const [thisPart, ...nextParts] = node.literal.split(/( )/)
          node.literal = thisPart
          text += thisPart

          // 将剩余部分作为兄弟节点添加
          nextParts.reverse().forEach((part: string) => {
            if (part) {
              const nextNode = new commonmark.Node('text')
              nextNode.literal = part
              node.insertAfter(nextNode)
              // 让迭代器知道新插入的节点
              walker.resumeAt(nextNode, true)
            }
          })
        }

        // 我们不应该在前一个节点不是文本节点时这样做，因为无法组合它们
        if ((node.type === 'emph' || node.type === 'strong') && previousNode?.type === 'text') {
          if (event.entering) {
            const foundLinks = linkify.find(text)
            for (const { value } of foundLinks) {
              if (node?.firstChild?.literal) {
                const format = formattingChangesByNodeType[node.type]
                const nonEmphasizedText = `${format}${innerNodeLiteral(node)}${format}`
                const f = getTextUntilEndOrLinebreak(node)
                const newText = value + nonEmphasizedText + f
                const newLinks = linkify.find(newText)
                // 这里应该只找到一个链接，如果找到更多说明算法有问题
                if (newLinks.length === 1) {
                  const emphasisTextNode = new commonmark.Node('text')
                  emphasisTextNode.literal = nonEmphasizedText
                  previousNode.insertAfter(emphasisTextNode)
                  node.firstChild.literal = ''
                  event = node.walker().next()
                  if (event) {
                    // 移除 `em` 开始和结束节点
                    node.unlink()
                    previousNode.insertAfter(event.node)
                    shouldUnlinkFormattingNode = true
                  }
                } else {
                  console.error('Markdown links escaping found too many links for following text: ', text)
                  console.error('Markdown links escaping found too many links for modified text: ', newText)
                }
              }
            }
          } else {
            if (shouldUnlinkFormattingNode) {
              node.unlink()
              shouldUnlinkFormattingNode = false
            }
          }
        }
      }
      previousNode = node
    }
    return parsed
  }

  public isPlainText(): boolean {
    const walker = this.parsed.walker()
    let ev: commonmark.NodeWalkingStep | null

    while ((ev = walker.next())) {
      const node = ev.node

      if (TEXT_NODES.indexOf(node.type) > -1) {
        // 如果是段落，检查是否包含表格特征
        if (node.type === 'paragraph') {
            const text = innerNodeLiteral(node)
            // 检查是否包含表格分隔符行特征 (包含 | 和 -)
            // 只要包含这两个字符，就极有可能是表格，为了保险起见，
            // 我们让它通过 isPlainText 检查（返回 false），交给 toHTML 去处理。
            // toHTML 内部有更严格的表格解析逻辑，如果解析失败会回退到普通段落渲染。
            if (text.includes('|') && text.includes('-')) {
                return false
            }
        }

        // 肯定是文本
        continue
      } else if (node.type == 'list' || node.type == 'item') {
        // 对 `+`, `*`, `-` 和 `2021.` 等输入的特殊处理
        // 否则会被视为单个空项目的列表
        if (node.type == 'list' && node.firstChild && emptyItemWithNoSiblings(node.firstChild)) {
          // 具有单个空项目的列表被视为纯文本
          continue
        }

        if (node.type == 'item' && emptyItemWithNoSiblings(node)) {
          // 没有兄弟项目的空列表项被视为纯文本
          continue
        }

        // 其他都是实际的列表，因此不是纯文本
        return false
      } else if (node.type == 'html_inline' || node.type == 'html_block') {
        // 如果是允许的 html 标签，我们需要渲染它，因此需要使用 HTML
        // 如果不允许，它不是 HTML，因为我们会将其视为文本
        if (isAllowedHtmlTag(node)) {
          return false
        }
      } else {
        return false
      }
    }
    return true
  }

  public toHTML({ externalLinks = false } = {}): string {
    const renderer = new commonmark.HtmlRenderer({
      safe: false,

      // 将软换行设置为硬 HTML 换行: commonmark
      // 为块引用中的多行放置软换行,
      // 所以如果这些只是换行符，那么
      // 块引用最终会在一行上
      softbreak: '<br />',
    })

    // 尝试剥离包装的 <p/> 会导致很多复杂性
    // 比如，这段代码会剥离任何 <p/> 标签（无论它在树中的哪个位置）
    // 只要它不包含 \n
    // 另一方面，<p/> 对于可以嵌套的位置相当有主见和限制
    // 
    // 现在让我们尝试带着 <p/> 发送

    // 辅助函数：检查节点是否在表格内
    const isInTable = (node: commonmark.Node): boolean => {
      let cur: commonmark.Node | null = node.parent
      while (cur) {
        if ((cur as any)._isTable) return true
        cur = cur.parent
      }
      return false
    }

    const realParagraph = renderer.paragraph as any
    renderer.paragraph = (function (node: commonmark.Node, entering: boolean) {
      // 尝试检测并渲染表格
      // 如果段落内容看起来像表格（包含 | 和 -），则尝试将其渲染为 HTML 表格
      if (entering) {
        const text = innerNodeLiteral(node)
        // 简单的表格检测正则：必须包含 |
        if (text.includes('|')) {
           // 尝试解析表格
           try {
             const lines = text.split('\n').map(l => l.trim()).filter(l => l)
             
             // 寻找分隔符行 (只包含 | - : 和空白字符)
             const separatorIndex = lines.findIndex(l => {
                 const trimmed = l.trim()
                 // 必须包含 | 和 -
                 if (!trimmed.includes('|') || !trimmed.includes('-')) return false
                 // 不能包含其他字符 (除了 | - : 和空白)
                 return !/[^|:\-\s]/.test(trimmed)
             })
             
             if (separatorIndex > 0) {
               // 分隔符行的上一行是表头
               const headerLine = lines[separatorIndex - 1]
               if (headerLine.includes('|')) {
                   // 找到了表格！
                   
                   // 1. 渲染表格前的文本（如果有）
                   for (let i = 0; i < separatorIndex - 1; i++) {
                       this.lit(this.esc(lines[i]) + '<br />')
                   }

                   // 2. 渲染表格
                   const parseRow = (row: string) => row.replace(/^\||\|$/g, '').split('|').map(c => c.trim())
                   const headers = parseRow(headerLine)

                   // 辅助函数：渲染行内 Markdown (支持链接、加粗等)
                   const inlineParser = new commonmark.Parser()
                   const inlineRenderer = new commonmark.HtmlRenderer({ safe: false })
                   const renderInline = (text: string) => {
                       if (!text) return ''
                       const node = inlineParser.parse(text)
                       let html = inlineRenderer.render(node)
                       // 强制给链接添加 target="_blank"
                       html = html.replace(/<a href="/g, '<a target="_blank" rel="noopener noreferrer" href="')
                       // 移除外层的 <p> 标签
                       return html.replace(/^<p>|<\/p>\s*$/g, '')
                   }
                   
                   let html = '<table class="markdown-table"><thead><tr>'
                   headers.forEach(h => html += `<th>${renderInline(h)}</th>`)
                   html += '</tr></thead><tbody>'
                   
                   let i = separatorIndex + 1
                   for (; i < lines.length; i++) {
                     const line = lines[i]
                     // 如果行不包含 |，可能表格结束了
                     if (!line.includes('|')) break
                     
                     const row = parseRow(line)
                     html += '<tr>'
                     for (let j = 0; j < headers.length; j++) {
                       const cellText = row[j] || ''
                       // 智能判断是否需要不换行：
                       // 1. 包含日期格式 (YYYY-MM-DD 或 YYYY/MM/DD)
                       // 2. 纯数字或金额 (如 20000, 1,234.56)
                       // 3. 短文本 (小于 10 个字符，如型号、短语)
                       const shouldNoWrap = 
                           /\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(cellText) || 
                           /^[\d,.]+$/.test(cellText) ||
                           (cellText.length < 10 && cellText.length > 0)
                       
                       const className = shouldNoWrap ? ' class="nowrap"' : ''
                       html += `<td${className}>${renderInline(cellText)}</td>`
                     }
                     html += '</tr>'
                   }
                   html += '</tbody></table>'
                   this.lit(html)

                   // 3. 渲染表格后的文本（如果有）
                   for (; i < lines.length; i++) {
                       this.lit('<br />' + this.esc(lines[i]))
                   }
                   
                   // 标记该节点已作为表格渲染
                   ;(node as any)._isTable = true
                   return // 成功渲染表格，跳过默认段落渲染
               }
             }
           } catch (e) {
             // 解析失败，回退到默认渲染
           }
        }
      } else {
        // 如果是退出阶段，且该节点已被渲染为表格，则直接返回
        if ((node as any)._isTable) return
      }

      // 如果只有一个顶级节点，只返回
      // 裸文本: 这是一行文本，因此应该是
      // '内联'的，而不是不必要地包装在自己的 p 标签中
      // 但是，如果我们有多个节点，每个节点都有自己的 p 标签
      // 以将它们保持为单独的段落
      // 但是，如果是块引用，无论如何都添加一个 p 标签
      // 以避免偏离 commonmark 和意外的结果
      if (node.parent?.type === 'block_quote' || isMultiLine(node)) {
        realParagraph.call(this, node, entering)
      }
    }) as any

    const realText = renderer.text as any
    renderer.text = (function (node: commonmark.Node, entering: boolean) {
      if (isInTable(node)) return
      realText.call(this, node, entering)
    }) as any

    const realSoftbreak = renderer.softbreak as any
    renderer.softbreak = (function (node: commonmark.Node, entering: boolean) {
      if (isInTable(node)) return
      realSoftbreak.call(this, node, entering)
    }) as any

    const realLinebreak = renderer.linebreak as any
    renderer.linebreak = (function (node: commonmark.Node, entering: boolean) {
      if (isInTable(node)) return
      realLinebreak.call(this, node, entering)
    }) as any

    const realImage = renderer.image as any
    renderer.image = (function (node: commonmark.Node, entering: boolean) {
      if (isInTable(node)) return
      if (realImage) {
        realImage.call(this, node, entering)
      }
    }) as any

    const realEmph = renderer.emph as any
    renderer.emph = (function (node: commonmark.Node, entering: boolean) {
      if (isInTable(node)) return
      realEmph.call(this, node, entering)
    }) as any

    const realStrong = renderer.strong as any
    renderer.strong = (function (node: commonmark.Node, entering: boolean) {
      if (isInTable(node)) return
      realStrong.call(this, node, entering)
    }) as any

    const realCode = renderer.code as any
    renderer.code = (function (node: commonmark.Node, entering: boolean) {
      if (isInTable(node)) return
      realCode.call(this, node, entering)
    }) as any

    renderer.link = function (node: commonmark.Node, entering: boolean) {
      if (isInTable(node)) return
      const attrs = this.attrs(node)
      if (entering && node.destination) {
        attrs.push(['href', this.esc(node.destination)])
        if (node.title) {
          attrs.push(['title', this.esc(node.title)])
        }
        // 修改链接行为，将它们都视为外部链接
        // 从而在新标签页中打开
        if (externalLinks) {
          attrs.push(['target', '_blank'])
          attrs.push(['rel', 'noreferrer noopener'])
        }
        this.tag('a', attrs)
      } else {
        this.tag('/a')
      }
    }

    renderer.html_inline = function (node: commonmark.Node) {
      if (isInTable(node)) return
      if (node.literal) {
        if (isAllowedHtmlTag(node)) {
          this.lit(node.literal)
        } else {
          this.lit(escape(node.literal))
        }
      }
    }

    renderer.html_block = function (node: commonmark.Node) {
      if (isInTable(node)) return
      renderer.html_inline(node)
    }

    return renderer.render(this.parsed)
  }

  /*
   * 将 markdown 消息渲染为纯文本。也就是说，本质上
   * 只是删除任何转义的反斜杠，否则将是
   * markdown 语法
   * 
   * 注意: 这**不**将任意 MD 渲染为纯文本 - 只有没有格式的 MD
   * 否则它会发出 HTML(!)
   */
  public toPlaintext(): string {
    const renderer = new commonmark.HtmlRenderer({ safe: false })

    renderer.paragraph = function (node: commonmark.Node, entering: boolean) {
      // 与 toHTML 一样，只有在有多个段落时才向段落追加行
      if (isMultiLine(node)) {
        if (!entering && node.next) {
          this.lit('\n\n')
        }
      }
    }

    renderer.html_block = function (node: commonmark.Node) {
      if (node.literal) this.lit(node.literal)
      if (isMultiLine(node) && node.next) this.lit('\n\n')
    }

    // 我们禁用默认的转义函数，因为我们转义整个输出字符串以正确处理反斜杠
    renderer.esc = (input: string) => input

    return escape(renderer.render(this.parsed))
  }
}
