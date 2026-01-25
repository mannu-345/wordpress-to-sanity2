import Image from 'next/image'

type LinkCardProps = {
    value: {
        url: string
        title?: string
        excerpt?: string
        image?: any // Sanity image object
        imageUrl?: string // Expanded in GROQ
    }
}

export default function LinkCard({ value }: LinkCardProps) {
    return (
        <a href={value.url} target="_blank" rel="noopener noreferrer" className="block my-6 no-underline group">
            <div className="flex border border-gray-200 rounded-lg overflow-hidden bg-white hover:shadow-md transition-shadow h-32">
                <div className="flex-1 p-4 flex flex-col justify-center">
                    <h3 className="font-bold text-gray-800 text-sm line-clamp-2 mb-1 group-hover:text-blue-600">
                        {value.title || value.url}
                    </h3>
                    {value.excerpt && (
                        <p className="text-xs text-gray-500 line-clamp-2">
                            {value.excerpt}
                        </p>
                    )}
                    <span className="text-[10px] text-gray-400 mt-2 block truncate">
                        {value.url}
                    </span>
                </div>
                {value.imageUrl && (
                    <div className="relative w-32 h-32 flex-shrink-0 bg-gray-100">
                        <Image
                            src={value.imageUrl}
                            alt={value.title || 'Link image'}
                            fill
                            className="object-cover"
                        />
                    </div>
                )}
            </div>
        </a>
    )
}
