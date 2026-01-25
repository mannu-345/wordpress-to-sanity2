'use client'

import { useState, useEffect } from 'react'

type Heading = {
    level: number
    text: string
    id: string
}

export default function TableOfContents({ headings }: { headings: Heading[] }) {
    const [isOpen, setIsOpen] = useState(true)
    const [showBackButton, setShowBackButton] = useState(false)

    // スクロール位置を監視して「目次へ」ボタンの表示/非表示を制御
    useEffect(() => {
        const handleScroll = () => {
            // 目次の位置を取得
            const tocElement = document.getElementById('table-of-contents')
            if (tocElement) {
                const tocRect = tocElement.getBoundingClientRect()
                // 目次が画面外に出たらボタンを表示
                setShowBackButton(tocRect.bottom < 0)
            }
        }

        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    // 目次へスムーズスクロール
    const scrollToToc = () => {
        const tocElement = document.getElementById('table-of-contents')
        if (tocElement) {
            tocElement.scrollIntoView({ behavior: 'smooth' })
        }
    }

    if (headings.length === 0) return null

    // H2見出しのみをカウント
    let h2Counter = 0

    return (
        <>
            {/* 固定表示のボタン群 - 右下配置 */}
            {showBackButton && (
                <div className="fixed right-6 bottom-8 z-50 flex flex-col items-center gap-3">
                    {/* トップへ戻るボタン */}
                    <button
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        className="flex items-center justify-center w-20 h-20 bg-[#7DC4E8] rounded-full shadow-lg hover:shadow-xl hover:bg-[#5BB5E0] transition-all duration-300"
                        aria-label="トップへ戻る"
                    >
                        <svg
                            className="w-8 h-8 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            strokeWidth={3}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                        </svg>
                    </button>

                    {/* 目次へ戻るボタン */}
                    <button
                        onClick={scrollToToc}
                        className="flex flex-col items-center justify-center w-20 h-20 bg-[#7DC4E8] rounded-full shadow-lg hover:shadow-xl hover:bg-[#5BB5E0] transition-all duration-300"
                        aria-label="目次へ戻る"
                    >
                        <svg
                            className="w-8 h-8 text-white mb-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            strokeWidth={2.5}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
                        </svg>
                        <span className="text-xs font-bold text-white">目次へ</span>
                    </button>
                </div>
            )}

            <div id="table-of-contents" className="bg-white border border-gray-200 rounded-lg my-[100px] shadow-lg overflow-hidden">
                {/* ヘッダー */}
                <div className="relative flex items-center justify-center px-4 py-2 bg-[#5B9BD5]">
                    <h2 className="text-base font-bold text-white">目次</h2>
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="absolute right-4 text-sm text-white/80 hover:text-white font-medium"
                    >
                        {isOpen ? '閉じる' : '開く'}
                    </button>
                </div>

                {/* コンテンツ */}
                {isOpen && (
                    <div className="p-6">
                        <ul className="space-y-3">
                            {headings.map((heading, index) => {
                                // H2の場合はカウンターを増やす
                                if (heading.level === 2) {
                                    h2Counter++
                                }

                                const isH2 = heading.level === 2
                                const displayNumber = isH2 ? String(h2Counter).padStart(2, '0') : null

                                return (
                                    <li
                                        key={index}
                                        className={`flex items-start gap-3 ${isH2 ? '' : 'ml-6'}`}
                                    >
                                        {isH2 ? (
                                            <span className="text-[#5B9BD5] font-bold text-lg flex-shrink-0">
                                                {displayNumber}
                                            </span>
                                        ) : (
                                            <span className="text-[#5B9BD5] text-lg flex-shrink-0">•</span>
                                        )}
                                        <a
                                            href={`#${heading.id}`}
                                            className="text-gray-700 hover:text-[#5B9BD5] hover:underline text-base leading-relaxed"
                                        >
                                            {heading.text}
                                        </a>
                                    </li>
                                )
                            })}
                        </ul>
                    </div>
                )}
            </div>
        </>
    )
}
