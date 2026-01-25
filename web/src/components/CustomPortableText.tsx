import { PortableText, type PortableTextComponents as PortableTextComponentsType } from 'next-sanity'
import LinkCard from './LinkCard'
import Image from 'next/image'
import { urlFor } from '@/lib/sanity'
import TableOfContents from './TableOfContents'

// Define SpeechBubble inline to avoid circular dependency
type SpeechBubbleProps = {
    value: {
        position: 'left' | 'right'
        iconId: string
        name?: string
        content: any[]
        iconImageUrl?: string
    }
}

function SpeechBubble({ value }: SpeechBubbleProps) {
    const isRight = value.position === 'right'
    // 固定のアイコン画像を使用
    const iconSrc = '/nike-icon.jpg'
    const displayName = 'ニケ'

    return (
        <div className="my-[80px]">
            {/* アイコン + 吹き出しを上揃え */}
            <div
                className={`flex items-start gap-4 ${isRight ? 'flex-row-reverse' : 'flex-row'
                    }`}
            >
                {/* Icon + 名前 */}
                <div className="flex-shrink-0 flex flex-col items-center gap-1">
                    <div
                        className="w-16 h-16 rounded-full bg-gray-100"
                        style={{
                            backgroundImage: `url(${iconSrc})`,
                            backgroundSize: 'contain',
                            backgroundPosition: 'center center',
                            backgroundRepeat: 'no-repeat'
                        }}
                        aria-label={displayName}
                    />
                    <span className="text-xs font-bold text-gray-700">
                        {displayName}
                    </span>
                </div>

                {/* Bubble */}
                <div
                    className={`relative p-4 rounded-2xl max-w-[80%] text-base leading-relaxed shadow-sm ${isRight
                        ? 'bg-green-100 text-gray-800'
                        : 'bg-[#E8F4FC] border border-gray-200 text-gray-800'
                        }`}
                >
                    <div className="prose prose-base max-w-none prose-p:my-2 prose-headings:my-2">
                        <PortableText
                            value={value.content}
                            components={PortableTextComponents}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

import { InfoBox } from './InfoBox'
import { sharedMarks } from './PortableTextMarks'

function Ranking({ value }: any) {
    return (
        <div className="border border-gray-200 p-4 rounded-lg my-[50px]">
            <h4 className="font-bold text-lg mb-2">Ranking: {value.title}</h4>
            <PortableText value={value.content} components={PortableTextComponents} />
        </div>
    )
}

// 記事のまとめ用のコンポーネント定義（行間を詰める + チェックマーク）
// メインのコンポーネントに依存しないように独立して定義
const SummaryPortableTextComponents: PortableTextComponentsType = {
    block: {
        normal: ({ children }: any) => <p className="my-2 leading-relaxed">{children}</p>,
    },
    list: {
        bullet: ({ children }: any) => <ul className="space-y-2 my-2">{children}</ul>,
    },
    listItem: {
        bullet: ({ children }: any) => (
            <li className="flex items-start gap-2">
                <div className="flex-shrink-0 mt-1 w-5 h-5 rounded-full bg-[#89C3EB] flex items-center justify-center">
                    <svg width="12" height="12" viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 5L4 8L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
                <span>{children}</span>
            </li>
        ),
    },
    marks: sharedMarks
}

const ArticleSummary = ({ value }: any) => {
    return (
        <div className="my-[60px] border-4 border-[#89C3EB] rounded-lg overflow-hidden bg-[#F9FCFF]">
            {/* Header */}
            <div className="pt-6 pb-2 text-center relative">
                <div className="flex items-center justify-center gap-2 mb-4">
                    <span className="font-bold text-[#89C3EB] text-xl tracking-wider">
                        記事のまとめ
                    </span>
                </div>
                {/* Dotted Line Separator with margin */}
                <div className="border-b-[6px] border-dotted border-[#89C3EB] mx-6"></div>
            </div>

            {/* Content */}
            <div className="p-6">
                <div className="prose prose-lg max-w-none text-gray-800">
                    <PortableText value={value.content || []} components={SummaryPortableTextComponents} />
                </div>
            </div>
        </div>
    )
}

const PortableTextComponents: PortableTextComponentsType = {
    types: {
        speechBubble: SpeechBubble,
        linkCard: LinkCard,
        image: ({ value }: any) => {
            return (
                <div className="relative w-full h-64 mt-0 mb-[80px]">
                    <Image
                        src={urlFor(value).url()}
                        alt={value.alt || 'Image'}
                        fill
                        className="object-contain"
                    />
                </div>
            )
        },
        rawHtml: ({ value }: any) => (
            <div dangerouslySetInnerHTML={{ __html: value.html }} />
        ),
        infoBox: InfoBox,
        ranking: Ranking,
        articleSummary: ArticleSummary,
    },
    block: {
        h2: ({ children }) => {
            const text = typeof children === 'string' ? children : String(children)
            const id = text.toLowerCase().replace(/[^\w\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]+/g, '-')
            return <h2 id={id} className="text-2xl font-bold mt-[100px] mb-6 bg-[#5B9BD5] text-white py-4 px-6 rounded-md">{children}</h2>
        },
        h3: ({ children }) => {
            const text = typeof children === 'string' ? children : String(children)
            const id = text.toLowerCase().replace(/[^\w\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]+/g, '-')
            return (
                <h3 id={id} className="text-xl font-bold mt-[100px] mb-0 pb-3 border-b-2 border-[#5B9BD5] relative pl-8">
                    <span className="absolute left-0 top-1 w-0 h-0 border-l-[12px] border-l-[#5B9BD5] border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent"></span>
                    {children}
                </h3>
            )
        },
        h4: ({ children }) => {
            const text = typeof children === 'string' ? children : String(children)
            const id = text.toLowerCase().replace(/[^\w\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]+/g, '-')
            return <h4 id={id} className="text-lg font-bold mt-[100px] mb-4">{children}</h4>
        },
        normal: ({ children }) => {
            const text = typeof children === 'string' ? children :
                (Array.isArray(children) ? children.map((c: any) => typeof c === 'string' ? c : c?.props?.children || '').join('') : String(children))

            if (text.startsWith('仲介手数料早見表')) {
                return (
                    <div className="mt-[50px] mb-[10px] flex items-center gap-2">
                        <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="flex-shrink-0 text-[#5B9BD5]"
                        >
                            <circle cx="12" cy="12" r="12" fill="currentColor" />
                            <path
                                d="M7 12L10 15L17 8"
                                stroke="white"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                        <span className="text-gray-800 leading-relaxed">{children}</span>
                    </div>
                )
            }
            return <p className="mt-[50px] mb-[50px] leading-relaxed">{children}</p>
        },
    },
    marks: sharedMarks,
}

// 見出しを抽出する関数
function extractHeadings(blocks: any[]) {
    const headings: { level: number; text: string; id: string }[] = []

    blocks?.forEach((block: any) => {
        if (block._type === 'block' && (block.style === 'h2' || block.style === 'h3')) {
            const text = block.children?.map((child: any) => child.text).join('') || ''
            const id = text.toLowerCase().replace(/[^\w\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]+/g, '-')
            headings.push({
                level: block.style === 'h2' ? 2 : 3,
                text,
                id
            })
        }
    })

    return headings
}

// 最初のH2のインデックスを見つける関数
function findFirstH2Index(blocks: any[]): number {
    return blocks?.findIndex((block: any) =>
        block._type === 'block' && block.style === 'h2'
    ) ?? -1
}

// 記事のまとめセクションをグループ化する関数
function processArticleSummary(blocks: any[]) {
    if (!blocks) return []
    const newBlocks: any[] = []
    let i = 0

    while (i < blocks.length) {
        const block = blocks[i]

        // "記事のまとめ" というテキストを持つブロックを見つける
        const isSummaryTitle = block._type === 'block' &&
            block.children?.some((c: any) => c.text === '記事のまとめ')

        if (isSummaryTitle) {
            const summaryContent: any[] = []
            // タイトル以降のブロックをチェック
            let j = i + 1
            while (j < blocks.length) {
                const nextBlock = blocks[j]
                // リスト項目、または空のブロックをまとめに含める
                // 次の見出しや、まとめ以外の明示的なコンテンツが来たら終了
                const isList = nextBlock.listItem
                // 空ブロック判定 (改行用など)
                const isEmpty = nextBlock._type === 'block' &&
                    (!nextBlock.children || nextBlock.children.every((c: any) => !c.text.trim()))

                if (isList || isEmpty) {
                    summaryContent.push(nextBlock)
                    j++
                } else {
                    break
                }
            }

            // まとめの内容があればカスタムブロックを作成
            if (summaryContent.length > 0) {
                newBlocks.push({
                    _type: 'articleSummary',
                    title: '記事のまとめ',
                    content: summaryContent
                })
                i = j // 処理したブロックをスキップ
            } else {
                newBlocks.push(block)
                i++
            }
        } else {
            newBlocks.push(block)
            i++
        }
    }
    return newBlocks
}

// メインのCustomPortableTextコンポーネント
export default function CustomPortableText({ value }: { value: any[] }) {
    // まず記事のまとめを処理
    const processedValue = processArticleSummary(value)

    const headings = extractHeadings(processedValue)
    const firstH2Index = findFirstH2Index(processedValue)

    // 最初のH2が見つからない場合は通常通りレンダリング
    if (firstH2Index === -1) {
        return <PortableText value={processedValue} components={PortableTextComponents} />
    }

    // 最初のH2の前と後に分割
    const beforeFirstH2 = processedValue.slice(0, firstH2Index)
    const fromFirstH2 = processedValue.slice(firstH2Index)

    return (
        <>
            {/* 最初のH2より前のコンテンツ */}
            {beforeFirstH2.length > 0 && (
                <PortableText value={beforeFirstH2} components={PortableTextComponents} />
            )}

            {/* 目次 */}
            <TableOfContents headings={headings} />

            {/* 最初のH2以降のコンテンツ */}
            <PortableText value={fromFirstH2} components={PortableTextComponents} />
        </>
    )
}
