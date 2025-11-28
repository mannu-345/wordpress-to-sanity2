
import { createClient } from '@sanity/client';
import fs from 'fs';
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

const IMAGE_PATH = '/Users/kimurakousuke/.gemini/antigravity/brain/ee410a02-b408-4f73-853f-7946ffe148e8/uploaded_image_1764336898337.jpg';
const TARGET_ICON_ID = '1'; // Update icon ID 1

async function updateIcon() {
    try {
        console.log(`Updating Icon ${TARGET_ICON_ID} with new image...`);

        if (!fs.existsSync(IMAGE_PATH)) {
            throw new Error(`Image file not found at ${IMAGE_PATH}`);
        }

        const buffer = fs.readFileSync(IMAGE_PATH);

        // Upload asset
        console.log('Uploading asset...');
        const asset = await client.assets.upload('image', buffer, {
            filename: path.basename(IMAGE_PATH)
        });
        console.log(`Uploaded asset: ${asset._id}`);

        // Find document to update
        const doc = await client.fetch(`*[_type == "speechBubbleIcon" && id == $id][0]`, { id: TARGET_ICON_ID });

        if (!doc) {
            throw new Error(`Document with iconId ${TARGET_ICON_ID} not found`);
        }

        // Update document
        await client.patch(doc._id)
            .set({
                image: {
                    _type: 'image',
                    asset: {
                        _type: 'reference',
                        _ref: asset._id
                    }
                }
            })
            .commit();

        console.log(`Updated document ${doc._id} with new image.`);

    } catch (error: any) {
        console.error('Error updating icon:', error.message);
    }
}

updateIcon().catch(console.error);
