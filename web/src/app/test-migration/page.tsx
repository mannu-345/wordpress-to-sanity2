import { client } from '@/lib/sanity'
import CustomPortableText from '@/components/CustomPortableText'
import SidebarTableOfContents from '@/components/SidebarTableOfContents'

export const revalidate = 0 // Disable cache for testing

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

export default async function TestMigrationPage() {
  const post = await client.fetch(`
    *[_type == "post" && wp_id == 5792][0] {
      title,
      body[] {
        ...,
        _type == 'speechBubble' => {
          ...,
          "iconImageUrl": *[_type=='speechBubbleIcon' && id == ^.iconId][0].image.asset->url
        },
        _type == 'linkCard' => {
            ...,
            "imageUrl": image.asset->url
        }
      }
    }
  `)

  if (!post) {
    return (
      <div className="p-8 text-center text-red-500">
        <h1 className="text-2xl font-bold">Post not found</h1>
        <p>Could not find post with wp_id 5792</p>
      </div>
    )
  }

  const headings = extractHeadings(post.body)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* メインコンテンツ */}
          <main className="flex-1 max-w-3xl bg-white p-8 rounded-lg shadow-sm">
            <h1 className="text-3xl font-bold mb-8 pb-4 border-b">{post.title}</h1>
            <div className="prose prose-lg max-w-none">
              <CustomPortableText value={post.body} />
            </div>
          </main>

          {/* サイドバー目次 - デスクトップのみ表示 */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <SidebarTableOfContents headings={headings} />
          </aside>
        </div>
      </div>
    </div>
  )
}
