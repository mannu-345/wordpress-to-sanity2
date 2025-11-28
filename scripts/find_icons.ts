
import fs from 'fs';
import xml2js from 'xml2js';

const XML_PATH = 'WordPress.2025-07-06.xml';

async function findIcons() {
    const parser = new xml2js.Parser();
    const xml = fs.readFileSync(XML_PATH, 'utf8');
    const result = await parser.parseStringPromise(xml);
    const posts = result.rss.channel[0].item;

    const iconMap: Record<string, string[]> = {};
    const targetIcons = ['4', '5', '6', '7', '8']; // Focus on missing ones

    for (const post of posts) {
        const content = post['content:encoded']?.[0];
        const slug = post['wp:post_name']?.[0];

        if (!content || !slug) continue;

        for (const id of targetIcons) {
            if (!iconMap[id]) iconMap[id] = [];
            // if (iconMap[id].length >= 3) continue; // Remove limit

            // Check for [st-kaiwa{id}] or [st-kaiwa{id} ]
            if (content.includes(`[st-kaiwa${id}]`) || content.includes(`[st-kaiwa${id} `)) {
                iconMap[id].push(slug);
            }
        }
    }

    console.log('Found slugs for missing icons:');
    for (const [id, urls] of Object.entries(iconMap)) {
        console.log(`Icon ${id}: ${urls.join(', ')}`);
    }
}

findIcons().catch(console.error);
