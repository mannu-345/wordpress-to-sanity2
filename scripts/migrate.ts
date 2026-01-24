import fs from 'fs';
import path from 'path';
import xml2js from 'xml2js';
import { createClient } from '@sanity/client';
import dotenv from 'dotenv';
import { decode } from 'html-entities';
import { Schema } from '@sanity/schema';
import { htmlToBlocks } from '@sanity/block-tools';
import { JSDOM } from 'jsdom';
import axios from 'axios';
import crypto from 'crypto';

dotenv.config();

// Configuration
const PROJECT_ID = 'cvg2jwc7';
const DATASET = 'production';
const API_TOKEN = process.env.SANITY_API_TOKEN;
const XML_FILE = 'WordPress.2025-07-06.xml';

// Initialize Sanity Client
const client = createClient({
    projectId: PROJECT_ID,
    dataset: DATASET,
    useCdn: false,
    apiVersion: '2024-01-01',
    token: API_TOKEN,
});

// Define Schema for Block Tools
const defaultSchema = Schema.compile({
    name: 'default',
    types: [
        {
            type: 'object',
            name: 'post',
            fields: [
                {
                    title: 'Body',
                    name: 'body',
                    type: 'array',
                    of: [
                        { type: 'block' },
                        { type: 'image' },
                        { type: 'speechBubble' },
                        { type: 'linkCard' },
                        { type: 'infoBox' },
                        { type: 'ranking' },
                        { type: 'rawHtml' },
                    ],
                },
            ],
        },
        {
            type: 'object',
            name: 'speechBubble',
            fields: [
                { name: 'iconId', type: 'string' },
                { name: 'name', type: 'string' },
                { name: 'position', type: 'string' },
                {
                    name: 'content',
                    type: 'array',
                    of: [
                        { type: 'block' },
                        { type: 'image' },
                        { type: 'linkCard' },
                        { type: 'rawHtml' },
                    ]
                },
            ],
        },
        {
            type: 'object',
            name: 'linkCard',
            fields: [
                { name: 'internalLink', type: 'reference', to: [{ type: 'post' }] },
                { name: 'url', type: 'url' },
                { name: 'title', type: 'string' },
            ],
        },
        {
            type: 'object',
            name: 'infoBox',
            fields: [
                { name: 'type', type: 'string' },
                { name: 'title', type: 'string' },
                {
                    name: 'content',
                    type: 'array',
                    of: [
                        { type: 'block' },
                        { type: 'image' },
                        { type: 'linkCard' },
                        { type: 'rawHtml' },
                    ]
                },
            ],
        },
        {
            type: 'object',
            name: 'ranking',
            fields: [
                { name: 'rank', type: 'number' },
                { name: 'stars', type: 'number' },
                {
                    name: 'content',
                    type: 'array',
                    of: [
                        { type: 'block' },
                        { type: 'image' },
                        { type: 'linkCard' },
                        { type: 'rawHtml' },
                    ]
                },
            ],
        },
        {
            type: 'object',
            name: 'rawHtml',
            fields: [
                { name: 'html', type: 'text' },
            ],
        },
    ],
});

const blockContentType = defaultSchema.get('post').fields.find((field: any) => field.name === 'body').type;

// Helper to parse XML
const parseXML = async (filePath: string) => {
    const parser = new xml2js.Parser();
    const xml = fs.readFileSync(filePath, 'utf8');
    return await parser.parseStringPromise(xml);
};



// Helper: Pre-process HTML (Shortcode -> HTML Tags)
const preprocessHtml = (html: string) => {
    let processed = html;

    // 0. Strip <p> tags wrapping shortcodes (Fix for wpautop splitting shortcodes)

    // Handle self-closing tags (card) fully wrapped
    processed = processed.replace(/<p(?:\s+[^>]*)?>\s*(\[st-card[^\]]*\])\s*<\/p>/gi, '$1');

    // Generic stripping for ALL [st-...] and [/st-...] tags wrapped in <p>
    // Case 1: <p>[st-...]...[/st-...]</p> or <p>[st-...]</p> (Fully wrapped)
    processed = processed.replace(/<p(?:\s+[^>]*)?>\s*(\[st-[^\]]+\])\s*<\/p>/gi, '$1');
    processed = processed.replace(/<p(?:\s+[^>]*)?>\s*(\[\/st-[^\]]+\])\s*<\/p>/gi, '$1');

    // Case 2: <p>[st-...] Content...</p> -> [st-...] Content...
    // Matches start tag at beginning of p, captures content, removes p tags.
    processed = processed.replace(/<p(?:\s+[^>]*)?>\s*(\[st-[^\]]+\])([\s\S]*?)<\/p>/gi, '$1$2');

    // Case 3: <p>...Content [/st-...]</p> -> ...Content [/st-...]
    // Matches end tag at end of p, captures content, removes p tags.
    processed = processed.replace(/<p(?:\s+[^>]*)?>([\s\S]*?)(\[\/st-[^\]]+\])\s*<\/p>/gi, '$1$2');

    // Case 4: Handle start tags wrapped in <p> (opening only, if not caught above)
    // <p>[st-...] -> [st-...]
    processed = processed.replace(/<p(?:\s+[^>]*)?>\s*(\[st-[^\]]+\])/gi, '$1');

    // Case 5: Handle end tags wrapped in <p> (closing only, if not caught above)
    // [/st-...]</p> -> [/st-...]
    processed = processed.replace(/(\[\/st-[^\]]+\])\s*<\/p>/gi, '$1');

    // 1. Speech Bubble: [st-kaiwa1]Content[/st-kaiwa1]
    processed = processed.replace(/\[st-kaiwa([0-9]+)([^\]]*)\]([\s\S]*?)\[\/st-kaiwa\1\]/g, (match, id, attrs, content) => {
        const nameMatch = attrs.match(/name="([^"]*)"/);
        const name = nameMatch ? nameMatch[1] : '';
        // Check for "r" in attrs for right alignment
        const position = attrs.includes(' r') || attrs.includes('r ') || attrs.includes('r]') ? 'right' : 'left';
        return `<div data-custom-type="speech-bubble" data-iconid="${id}" data-name="${name}" data-position="${position}">${content}</div>`;
    });

    // 2. Link Card: [st-card id=123 ...]
    processed = processed.replace(/\[st-card[^\]]*id="([0-9]+)"[^\]]*\]/g, (match, id) => {
        return `<div data-custom-type="link-card" data-wpid="${id}"></div>`;
    });

    // 3. Info Box: [st-mybox ...], [st-midasibox ...], [st-cmemo ...]

    // Special handling for midasibox-intitle to avoid regex confusion
    processed = processed.replace(/\[st-midasibox-intitle([^\]]*)\]([\s\S]*?)\[\/st-midasibox-intitle\]/g, (match, attrs, content) => {
        const titleMatch = attrs.match(/title="([^"]*)"/);
        const title = titleMatch ? titleMatch[1] : '';
        return `<div data-custom-type="info-box" data-type="midasibox-intitle" data-title="${title}">${content}</div>`;
    });

    // Unified handling for other box types
    processed = processed.replace(/\[st-(midasibox|mybox|cmemo)([^\]]*)\]([\s\S]*?)\[\/st-\1\]/g, (match, type, attrs, content) => {
        const titleMatch = attrs.match(/title="([^"]*)"/);
        const title = titleMatch ? titleMatch[1] : '';
        return `<div data-custom-type="info-box" data-type="${type}" data-title="${title}">${content}</div>`;
    });

    // 4. Ranking: [st-rank ...]Content[/st-rank]
    processed = processed.replace(/\[st-rank[^\]]*rankno="([0-9]+)"[^\]]*star="([0-9]+)"[^\]]*\]([\s\S]*?)\[\/st-rank\]/g, (match, rank, star, content) => {
        return `<div data-custom-type="ranking" data-rank="${rank}" data-stars="${star}">${content}</div>`;
    });

    // 5. Unwrap custom elements from <p> tags (Cleanup for any remaining wrappers)
    // No longer needed for custom tags since we use div, but good to keep for cleanup if needed.
    // We can remove the specific custom tag unwrapping since we use div now.

    return processed;
};

// Main Migration Function
const migrate = async () => {
    console.log('Starting migration (Pass 2: Content)...');

    const result = await parseXML(path.join(process.cwd(), XML_FILE));
    const channel = result.rss.channel[0];
    const items = channel.item;

    // Filter for posts and sort by date descending
    const posts = items.filter((item: any) => item['wp:post_type'][0] === 'post');
    posts.sort((a: any, b: any) => {
        const dateA = new Date(a.pubDate?.[0] || 0).getTime();
        const dateB = new Date(b.pubDate?.[0] || 0).getTime();
        return dateB - dateA;
    });

    const targetPosts = posts.slice(0, 10);
    // const targetPosts = posts.filter((item: any) => item['wp:post_id'][0] === '5792');

    for (const item of targetPosts) {
        const wp_id = parseInt(item['wp:post_id'][0], 10);
        const title = item.title[0];
        const rawContent = item['content:encoded'][0];

        // Categories (Fixing Missing Keys)
        const categories = item.category
            ? item.category
                .filter((c: any) => c.$.domain === 'category')
                .map((c: any) => c._)
            : [];

        const categoryRefs = [];
        for (const catName of categories) {
            const catIdSafe = Buffer.from(catName).toString('hex');
            const catDocId = `category-${catIdSafe}`;
            // We don't create categories here (done in Pass 1), just reference them
            categoryRefs.push({
                _key: crypto.randomUUID(), // Add key!
                _type: 'reference',
                _ref: catDocId
            });
        }

        console.log(`Processing Content: ${title} (ID: ${wp_id})`);

        if (wp_id === 5792) {
            console.log('--- DEBUG: rawContent for 5792 ---');
            console.log(rawContent);
            console.log('--- END DEBUG ---');
        }

        // 1. Preprocess Shortcodes
        const cleanHtml = preprocessHtml(rawContent);

        if (wp_id === 5792) {
            console.log('--- DEBUG: cleanHtml for 5792 ---');
            console.log(cleanHtml);
            console.log('--- END DEBUG ---');
        }

        // 2. Convert to Blocks
        const blocks = htmlToBlocks(cleanHtml, blockContentType as any, {
            parseHtml: (html: any) => new JSDOM(html).window.document,
            rules: [
                // Custom Table Rule (Convert to rawHtml with styles)
                {
                    deserialize(el: any, next: any, block: any) {
                        if (el.tagName && el.tagName.toLowerCase() === 'table') {
                            const rows = Array.from(el.querySelectorAll('tr'));
                            // 外枠なし、縦線ありのデザイン
                            let newHtml = '<div class="overflow-x-auto my-8"><table class="min-w-full border-collapse">';

                            rows.forEach((row: any, rowIndex: number) => {
                                newHtml += '<tr>';
                                const cells = Array.from(row.querySelectorAll('td, th'));
                                cells.forEach((cell: any, cellIndex: number) => {
                                    const bgColor = cell.style.backgroundColor || '';
                                    let cellClass = 'px-6 py-4 text-center text-sm font-medium ';

                                    const isHeader = rowIndex === 0 || bgColor.includes('#99ccff');

                                    if (isHeader) {
                                        // ヘッダー行
                                        cellClass += 'text-gray-900 font-bold';
                                    } else {
                                        // ボディ行
                                        cellClass += 'text-gray-800';
                                    }

                                    // JITカラーが効かないためインラインスタイルで指定
                                    const borderColor = isHeader ? '#7EA8D6' : '#CFE2F3';
                                    const backgroundColor = isHeader ? '#99CCFF' : '#EFF7FF';

                                    // 全てのセルに同じ色のボーダーを適用（外側も内側も同じ色になる）
                                    // border-collapseが効いているので、border: 1px solidでOK
                                    const style = `background-color: ${backgroundColor}; border: 1px solid ${borderColor};`;

                                    const content = cell.innerHTML.replace(/<span[^>]*>/g, '').replace(/<\/span>/g, '');
                                    newHtml += `<td class="${cellClass}" style="${style}">${content}</td>`;
                                });
                                newHtml += '</tr>';
                            });

                            newHtml += '</table></div>';

                            return {
                                _type: 'rawHtml',
                                html: newHtml
                            };
                        }
                        return undefined;
                    }
                },
                // Custom Mark Rules (Span)
                {
                    deserialize(el: any, next: any, block: any) {
                        if (el.tagName && el.tagName.toLowerCase() === 'span') {
                            const className = el.getAttribute('class') || '';
                            const marks = [];

                            if (className.includes('hutoaka')) {
                                marks.push('redBold');
                            }
                            if (className.includes('ymarker') || className.includes('st-marker')) {
                                marks.push('yellowMarker');
                            }
                            if (className.includes('keikou_yellow')) {
                                marks.push('yellowMarker');
                            }

                            if (marks.length > 0) {
                                return {
                                    _type: 'span',
                                    marks: marks,
                                    text: el.textContent || ''
                                };
                            }
                        }
                        return undefined;
                    }
                },
                // Helper to normalize content (wrap inline items in blocks)
                // This is needed because htmlToBlocks might return spans for text directly inside the div
                // but our schema expects an array of blocks.

                // Speech Bubble Rule
                {
                    deserialize(el: any, next: any, block: any) {
                        if (el.tagName && el.tagName.toLowerCase() === 'div' && el.getAttribute('data-custom-type') === 'speech-bubble') {
                            const rawContent = next(Array.from(el.childNodes));
                            const content = [];
                            let currentInline = [];

                            for (const item of rawContent) {
                                if (item._type === 'block' || item._type === 'image' || item._type === 'linkCard' || item._type === 'rawHtml') {
                                    if (currentInline.length > 0) {
                                        content.push({
                                            _type: 'block',
                                            _key: Math.random().toString(36).substring(7),
                                            children: currentInline,
                                            style: 'normal'
                                        });
                                        currentInline = [];
                                    }
                                    // Ensure item has a key
                                    if (!item._key) item._key = Math.random().toString(36).substring(7);
                                    content.push(item);
                                } else {
                                    // Ensure span has a key
                                    if (!item._key) item._key = Math.random().toString(36).substring(7);
                                    currentInline.push(item);
                                }
                            }
                            if (currentInline.length > 0) {
                                content.push({
                                    _type: 'block',
                                    _key: Math.random().toString(36).substring(7),
                                    children: currentInline,
                                    style: 'normal'
                                });
                            }

                            return {
                                _type: 'speechBubble',
                                iconId: el.getAttribute('data-iconid'),
                                name: el.getAttribute('data-name'),
                                position: el.getAttribute('data-position'),
                                content: content
                            };
                        }
                        return undefined;
                    }
                },
                // Link Card Rule
                {
                    deserialize(el: any, next: any, block: any) {
                        if (el.tagName && el.tagName.toLowerCase() === 'div' && el.getAttribute('data-custom-type') === 'link-card') {
                            const refId = el.getAttribute('data-wpid');
                            return {
                                _type: 'linkCard',
                                // We need to map WP ID to Sanity ID. 
                                // Since we created posts with deterministic IDs `post-{wp_id}`, we can reference that.
                                internalLink: {
                                    _type: 'reference',
                                    _ref: `post-${refId}`
                                }
                            };
                        }
                        return undefined;
                    }
                },
                // Info Box Rule
                {
                    deserialize(el: any, next: any, block: any) {
                        if (el.tagName && el.tagName.toLowerCase() === 'div' && el.getAttribute('data-custom-type') === 'info-box') {
                            const rawContent = next(Array.from(el.childNodes));
                            const content = [];
                            let currentInline = [];

                            for (const item of rawContent) {
                                if (item._type === 'block' || item._type === 'image' || item._type === 'linkCard' || item._type === 'rawHtml') {
                                    if (currentInline.length > 0) {
                                        content.push({
                                            _type: 'block',
                                            _key: Math.random().toString(36).substring(7),
                                            children: currentInline,
                                            style: 'normal'
                                        });
                                        currentInline = [];
                                    }
                                    if (!item._key) item._key = Math.random().toString(36).substring(7);
                                    content.push(item);
                                } else {
                                    if (!item._key) item._key = Math.random().toString(36).substring(7);
                                    currentInline.push(item);
                                }
                            }
                            if (currentInline.length > 0) {
                                content.push({
                                    _type: 'block',
                                    _key: Math.random().toString(36).substring(7),
                                    children: currentInline,
                                    style: 'normal'
                                });
                            }

                            return {
                                _type: 'infoBox',
                                type: el.getAttribute('data-type'),
                                title: el.getAttribute('data-title'),
                                content: content
                            };
                        }
                        return undefined;
                    }
                },
                // Ranking Rule
                {
                    deserialize(el: any, next: any, block: any) {
                        if (el.tagName && el.tagName.toLowerCase() === 'div' && el.getAttribute('data-custom-type') === 'ranking') {
                            const rawContent = next(Array.from(el.childNodes));
                            const content = [];
                            let currentInline = [];

                            for (const item of rawContent) {
                                if (item._type === 'block' || item._type === 'image' || item._type === 'linkCard' || item._type === 'rawHtml') {
                                    if (currentInline.length > 0) {
                                        content.push({
                                            _type: 'block',
                                            _key: Math.random().toString(36).substring(7),
                                            children: currentInline,
                                            style: 'normal'
                                        });
                                        currentInline = [];
                                    }
                                    if (!item._key) item._key = Math.random().toString(36).substring(7);
                                    content.push(item);
                                } else {
                                    if (!item._key) item._key = Math.random().toString(36).substring(7);
                                    currentInline.push(item);
                                }
                            }
                            if (currentInline.length > 0) {
                                content.push({
                                    _type: 'block',
                                    _key: Math.random().toString(36).substring(7),
                                    children: currentInline,
                                    style: 'normal'
                                });
                            }

                            return {
                                _type: 'ranking',
                                rank: parseInt(el.getAttribute('data-rank') || '0'),
                                stars: parseInt(el.getAttribute('data-stars') || '0'),
                                content: content
                            };
                        }
                        return undefined;
                    }
                },
                // Image Rule (Download and Upload)
                // Note: htmlToBlocks is synchronous, but we need async for uploads.
                // Strategy: We will return a placeholder or standard image block, 
                // and then post-process the blocks array to upload images.
                {
                    deserialize(el: any, next: any, block: any) {
                        if (el.tagName && el.tagName.toLowerCase() === 'img') {
                            return {
                                _type: 'image',
                                _sanityAsset: undefined, // Placeholder
                                __src: el.getAttribute('src') // Temporary field
                            };
                        }
                        return undefined;
                    }
                }
            ]
        });

        // 3. Post-process blocks to lift custom types out of generic blocks
        const liftedBlocks = liftCustomBlocks(blocks);

        // 4. Upload Images
        const processedBlocks = await uploadImages(liftedBlocks, client);

        // 4.5 Ensure all keys are present
        const finalBlocks = ensureKeys(processedBlocks);

        // 5. Update Sanity Document
        const docId = `post-${wp_id}`;
        try {
            await client.patch(docId)
                .set({
                    body: finalBlocks,
                    categories: categoryRefs // Update categories with keys
                })
                .commit();
            console.log(`  -> Updated Body & Categories: ${docId}`);
        } catch (err) {
            console.error(`  -> Error updating ${docId}:`, err);
        }
    }

    console.log('Pass 2 completed.');
}

// Helper to lift custom blocks out of generic 'block' types
function liftCustomBlocks(blocks: any[]): any[] {
    const newBlocks: any[] = [];
    const customTypes = ['speechBubble', 'infoBox', 'ranking', 'linkCard', 'rawHtml', 'image'];

    for (const block of blocks) {
        // If it's not a generic block, or has no children, just keep it
        if (block._type !== 'block' || !block.children) {
            newBlocks.push(block);
            continue;
        }

        // Check if this block contains any of our custom types
        const hasCustomType = block.children.some((child: any) => customTypes.includes(child._type));

        if (!hasCustomType) {
            newBlocks.push(block);
            continue;
        }

        // If it does, we need to split this block
        let currentSpanBuffer: any[] = [];

        for (const child of block.children) {
            if (customTypes.includes(child._type)) {
                // Flush buffer if not empty
                if (currentSpanBuffer.length > 0) {
                    newBlocks.push({
                        ...block,
                        children: currentSpanBuffer,
                        _key: Math.random().toString(36).substring(7) // Generate new key
                    });
                    currentSpanBuffer = [];
                }
                // Push the custom block itself as a top-level block
                newBlocks.push({
                    ...child,
                    _key: child._key || Math.random().toString(36).substring(7)
                });
            } else {
                // It's a normal span, add to buffer
                currentSpanBuffer.push(child);
            }
        }

        // Flush remaining buffer
        if (currentSpanBuffer.length > 0) {
            newBlocks.push({
                ...block,
                children: currentSpanBuffer,
                _key: Math.random().toString(36).substring(7)
            });
        }
    }

    return newBlocks;
}

// Helper to ensure all blocks have keys (Recursive)
function ensureKeys(blocks: any[]): any[] {
    return blocks.map(block => {
        if (!block._key) {
            block._key = Math.random().toString(36).substring(7);
        }
        if (block.children && Array.isArray(block.children)) {
            block.children = ensureKeys(block.children);
        }
        if (block.content && Array.isArray(block.content)) {
            block.content = ensureKeys(block.content);
        }
        return block;
    });
}

async function uploadImages(blocks: any[], client: any) {
    const processedBlocks = [];
    for (const block of blocks) {
        if (block._type === 'image' && (block as any).__src) {
            const imageAsset = await processImage((block as any).__src);
            if (imageAsset) {
                processedBlocks.push(imageAsset);
            }
        } else if (block._type === 'speechBubble' || block._type === 'infoBox' || block._type === 'ranking') {
            // Recursively process images inside custom blocks if needed
            if (block.content && Array.isArray(block.content)) {
                block.content = await uploadImages(block.content, client);
            }
            processedBlocks.push(block);
        } else {
            processedBlocks.push(block);
        }
    }
    return processedBlocks;
}

// Helper to process a single image
async function processImage(src: string) {
    try {
        // Basic validation
        if (!src || !src.startsWith('http')) return undefined;

        console.log(`    Downloading image: ${src}`);
        const response = await axios.get(src, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data, 'binary');

        const asset = await client.assets.upload('image', buffer, {
            filename: path.basename(src)
        });

        return {
            _type: 'image',
            asset: {
                _type: 'reference',
                _ref: asset._id
            }
        };
    } catch (error) {
        console.error(`    Failed to upload image ${src}:`, error);
        return undefined;
    }
}

migrate().catch(console.error);
