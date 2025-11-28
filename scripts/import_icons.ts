
import { createClient } from '@sanity/client';
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const PROJECT_ID = process.env.SANITY_PROJECT_ID || 'cvg2jwc7';
const DATASET = process.env.SANITY_DATASET || 'production';
const API_TOKEN = process.env.SANITY_API_TOKEN;

if (!API_TOKEN) {
    console.error('Error: SANITY_API_TOKEN is missing in .env');
    process.exit(1);
}

const client = createClient({
    projectId: PROJECT_ID,
    dataset: DATASET,
    useCdn: false,
    apiVersion: '2024-01-01',
    token: API_TOKEN,
});

const icons = [
    {
        id: '1',
        name: 'こうすけ',
        url: 'https://kosukehome.net/wp-content/uploads/2021/02/3C7CA60C-CBE9-4EA2-A98A-24E01971342E-300x300.jpeg'
    },
    {
        id: '2',
        name: '赤ちゃん',
        url: 'https://kosukehome.net/wp-content/uploads/2020/05/a30cbb26fb203ca28c11225037febb0e-300x300.png'
    },
    {
        id: '3',
        name: '疑問', // Inferred from context (questioning face)
        url: 'https://kosukehome.net/wp-content/uploads/2020/06/186c01be10f842148881dd68e4a94da6-300x300.png'
    },
    {
        id: '5',
        name: '困った', // Inferred from filename (komatta_man)
        url: 'https://kosukehome.net/wp-content/uploads/2022/07/komatta_man2-270x300.png'
    }
];

async function importIcons() {
    console.log('Starting icon import...');

    for (const icon of icons) {
        try {
            console.log(`Processing Icon ${icon.id} (${icon.name})...`);

            // Check if already exists
            const existing = await client.fetch(`*[_type == "speechBubbleIcon" && id == $id][0]`, { id: icon.id });
            if (existing) {
                console.log(`  Icon ${icon.id} already exists. Skipping.`);
                continue;
            }

            // Download image
            console.log(`  Downloading: ${icon.url}`);
            const response = await axios.get(icon.url, { responseType: 'arraybuffer' });
            const buffer = Buffer.from(response.data, 'binary');

            // Upload asset
            const asset = await client.assets.upload('image', buffer, {
                filename: path.basename(icon.url)
            });
            console.log(`  Uploaded asset: ${asset._id}`);

            // Create document
            const doc = {
                _type: 'speechBubbleIcon',
                id: icon.id,
                name: icon.name,
                image: {
                    _type: 'image',
                    asset: {
                        _type: 'reference',
                        _ref: asset._id
                    }
                }
            };

            const created = await client.create(doc);
            console.log(`  Created document: ${created._id}`);

        } catch (error: any) {
            console.error(`  Error processing Icon ${icon.id}:`, error.message);
        }
    }

    console.log('Icon import completed.');
}

importIcons().catch(console.error);
