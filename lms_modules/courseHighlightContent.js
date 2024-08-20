/*

    This helper script is for adding dummy content to all course highlight items.

*/

import fetch from 'node-fetch';
import readline from 'readline';

// Helper function to fetch data from Webflow API
async function fetchWebflowAPI(url, method = 'GET', body = null, token) {
    const headers = {
        'authorization': `Bearer ${token}`,
        'accept-version': '2.0.0',
        'Content-Type': 'application/json',
        'accept': 'application/json'
    };

    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(url, options);
    return response.json();
}

// Action 1: List all collection items
async function listCollectionItems(collectionId, token) {
    let items = [];
    let offset = 0;
    let total = 0;

    do {
        const url = `https://api.webflow.com/v2/collections/${collectionId}/items?offset=${offset}&limit=100`;
        const response = await fetchWebflowAPI(url, undefined, undefined, token);
        items = items.concat(response.items);
        total = response.pagination.total; // Total number of items
        offset += 100;
    } while (offset < total);

    return items;
}

// Action 2: Update single collection item 
async function updateHighlightItem(collectionId, item, updates, token) {
    const url = `https://api.webflow.com/v2/collections/${collectionId}/items/${item.id}`;
    await fetchWebflowAPI(url, 'PATCH', { isArchived: false, isDraft: false, fieldData: updates }, token);
    console.log(`Updated item ${item.fieldData.name}`);
}

async function setHighlightContent(coursesCollectionId, highlightsCollectionId, token) {
    try {
        const courseItems = await listCollectionItems(coursesCollectionId, token);
        const highlightItems = await listCollectionItems(highlightsCollectionId, token);

        
        for (let i = 0; i < courseItems.length; i++) {
            const currentHighlightsItem = highlightItems[i];
            console.log(currentHighlightsItem);

            const updates = {
                "highlights-content": '<p>Some highlights content</p>'
            }

            await updateHighlightItem(highlightsCollectionId, currentHighlightsItem, updates, token);
        }
    } catch (error) {
        
    }
}

async function run() {
    const token = '2d1e8a1bfe8603d1d1dd99c869ef9df6abdecf6e65e2bd19370f10ea402a899b';
    const coursesCollectionId = '666aa94389c10434b088ede2';
    const highlightsCollectionId = '666aa94389c10434b088ee1a';
    await setHighlightContent(coursesCollectionId, highlightsCollectionId, token);
}

run();