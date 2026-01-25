import React from 'react'

export const sharedMarks = {
    link: ({ children, value }: any) => {
        const rel = !value.href.startsWith('/') ? 'noreferrer noopener' : undefined
        return (
            <a href={value.href} rel={rel} className="text-blue-600 hover:underline">
                {children}
            </a>
        )
    },
    // テキストカラー（カスタムマーク）
    textColor: ({ children, value }: any) => {
        const color = value?.color || 'inherit'
        return <span style={{ color }}>{children}</span>
    },
    // 黒太字（デフォルト）
    strong: ({ children }: any) => <strong className="font-bold">{children}</strong>,
    // 赤太字
    redBold: ({ children }: any) => <strong className="text-red-600 font-bold">{children}</strong>,
    // 黄色マーカー太字
    yellowMarker: ({ children }: any) => <span className="font-bold bg-yellow-200 px-1">{children}</span>,
    marker: ({ children }: any) => <span className="font-bold bg-yellow-200 px-1">{children}</span>,
    highlight: ({ children, value }: any) => {
        const color = value?.color || 'yellow'
        const bgColor = color === 'yellow' ? 'bg-yellow-200' : 'bg-gray-100'
        return <span className={`font-bold ${bgColor} px-1`}>{children}</span>
    },
    // イタリック
    em: ({ children }: any) => <em className="italic">{children}</em>,
    underline: ({ children }: any) => <span className="underline">{children}</span>,
    // Handle unknown WordPress marks gracefully
    b697311cd401: ({ children }: any) => <>{children}</>,
    cd9dc7a7343: ({ children }: any) => <>{children}</>,
    '11ceae556ea7': ({ children }: any) => <>{children}</>,
    'e64d9a3ffecc': ({ children }: any) => <>{children}</>,
    '463671c3c34c': ({ children }: any) => <>{children}</>,
    '925f43b30d62': ({ children }: any) => <>{children}</>,
}
