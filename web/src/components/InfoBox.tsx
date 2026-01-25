import React from 'react'
import { PortableText } from 'next-sanity'

import { sharedMarks } from './PortableTextMarks'

const InfoBoxComponents: any = {
    block: {
        normal: ({ children, index }: any) => {
            if (index === 0) {
                return (
                    <div className="my-1 flex items-start gap-2">
                        <span className="text-[#5B9BD5] font-bold flex-shrink-0">✓</span>
                        <div className="flex-1">{children}</div>
                    </div>
                )
            }
            return <div className="my-1">{children}</div>
        },
    },
    list: {
        bullet: ({ children }: any) => (
            <ul className="space-y-2 !m-0 !p-0 list-none">
                {children}
            </ul>
        ),
    },
    listItem: {
        bullet: ({ children }: any) => {
            const text = typeof children === 'string' ? children :
                (Array.isArray(children) ? children.map((c: any) => typeof c === 'string' ? c : c?.props?.children || '').join('') : String(children))

            // カスタムリンク先マッピング
            const customLinks: Record<string, string> = {
                'いくらかかるの？': '仲介手数料の具体的な金額',
                '割引してもらえるの？': '仲介手数料は割引してもらえるの？',
            }

            const targetText = customLinks[text] || text
            const id = targetText.toLowerCase().replace(/[^\w\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]+/g, '-')

            return (
                <li className="flex items-start gap-2 py-0.5 !m-0">
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="flex-shrink-0 text-[#5B9BD5] mt-1"
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
                    <a
                        href={`#${id}`}
                        className="text-gray-800 text-base font-bold hover:underline cursor-pointer leading-relaxed"
                    >
                        {children}
                    </a>
                </li>
            )
        },
    },
    marks: sharedMarks
}

const MemoComponents: any = {
    block: {
        normal: ({ children }: any) => <p className="mb-2 leading-relaxed">{children}</p>,
    },
    marks: sharedMarks
}

export function InfoBox({ value }: any) {
    const isMemo = value.type === 'st-cmemo' || value.title === 'ここに注意'
    // 'ポイント'が含まれるか、'Check'の場合はポイントボックスとして扱う
    const isPoint = value.title?.includes('ポイント') || value.title?.includes('Check')

    if (isPoint) {
        return (
            <div className="my-[50px] rounded-lg overflow-hidden">
                <div className="bg-[#FFC107] px-4 py-2">
                    <span className="font-bold text-white text-lg">
                        {value.title || 'ポイント'}
                    </span>
                </div>
                <div className="bg-[#FFFDE7] p-6 text-gray-800 text-sm leading-relaxed [&_p]:!m-0 [&_p]:!p-0">
                    <PortableText value={value.content} components={MemoComponents} />
                </div>
            </div>
        )
    }

    if (isMemo) {
        return (
            <div className="my-[50px] bg-[#FFF5F5] rounded-lg p-6">
                <div className="mb-4">
                    <span className="font-bold text-[#FF5B5B] border-b-2 border-[#FF5B5B] pb-1">
                        {value.title || 'ここに注意'}
                    </span>
                </div>
                <div className="text-gray-800 text-sm leading-relaxed [&_p]:!m-0 [&_p]:!p-0">
                    <PortableText value={value.content} components={MemoComponents} />
                </div>
            </div>
        )
    }

    return (
        <div className="mt-[-25px] mb-[40px] border-2 border-[#FFD54F] rounded-sm p-4 [&_p]:!m-0 [&_p]:!p-0">
            {/* タイトル */}
            {value.title && (
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-[#5B9BD5] font-bold">✓</span>
                    <span className="font-bold text-gray-800 border-b border-gray-300 pb-0.5">
                        {value.title}
                    </span>
                </div>
            )}
            {/* コンテンツ */}
            <div className="text-gray-800 leading-relaxed">
                <PortableText value={value.content} components={InfoBoxComponents} />
            </div>
        </div>
    )
}
