'use client'

import { useState, useEffect } from 'react'

type Heading = {
    level: number
    text: string
    id: string
}

export default function SidebarTableOfContents({ headings }: { headings: Heading[] }) {
    const [activeId, setActiveId] = useState<string>('')

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id)
                    }
                })
            },
            {
                rootMargin: '-20% 0% -35% 0%',
                threshold: 0
            }
        )

        // 見出し要素を監視
        headings.forEach((heading) => {
            const element = document.getElementById(heading.id)
            if (element) {
                observer.observe(element)
            }
        })

        return () => observer.disconnect()
    }, [headings])

    if (headings.length === 0) return null

    return (
        <nav className="sticky top-8 bg-white border border-gray-200 shadow-lg rounded-lg overflow-hidden">
            {/* ヘッダー */}
            <div className="bg-[#5B9BD5] text-white font-bold text-center py-3 px-4">
                この記事の目次
            </div>

            {/* 目次リスト */}
            <div className="p-4 max-h-[70vh] overflow-y-auto">
                <ul className="space-y-2">
                    {headings.map((heading, index) => {
                        const isActive = activeId === heading.id
                        const isH2 = heading.level === 2

                        return (
                            <li
                                key={index}
                                className={`${isH2 ? '' : 'ml-4'}`}
                            >
                                <a
                                    href={`#${heading.id}`}
                                    className={`block text-sm leading-relaxed transition-colors duration-200 ${isActive
                                        ? 'text-[#5B9BD5] font-bold'
                                        : 'text-gray-600 hover:text-[#5B9BD5]'
                                        } ${isH2 ? 'font-semibold' : ''}`}
                                >
                                    {isH2 ? (
                                        <span>『{heading.text}』</span>
                                    ) : (
                                        <span className="flex items-start gap-1">
                                            <span className="text-[#5B9BD5]">›</span>
                                            <span>{heading.text}</span>
                                        </span>
                                    )}
                                </a>
                            </li>
                        )
                    })}
                </ul>
            </div>
        </nav>
    )
}
