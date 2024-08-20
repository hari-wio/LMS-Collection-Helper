/*
    This helper script is for removing any preceding expressions that is used as an identifyer
*/

import fetch from 'node-fetch';

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

// Action 1: Get Collection Details and identify reference fields
async function getCollectionDetails(collectionId, token) {
    const url = `https://api.webflow.com/v2/collections/${collectionId}`;
    const collection = await fetchWebflowAPI(url, undefined, undefined, token);
    // Return objects containing both type and slug for each relevant field
    return collection.fields
}


// Action 2: Update single collection item 
async function updateCollectionItem(collectionId, item, updates, token) {
    const url = `https://api.webflow.com/v2/collections/${collectionId}/items/${item.id}`;
    await fetchWebflowAPI(url, 'PATCH', { isArchived: false, isDraft: false, fieldData: updates }, token);
    console.log(`Updated item ${item.fieldData.name}`);
}

async function setLessonTitle(coursesCollectionId, lessonsCollectionId, token) {
    const lessonItems = await listCollectionItems(lessonsCollectionId, token);
    const courseItems = await listCollectionItems(coursesCollectionId, token);

    // Group lessons by Course
    const lessonsByCourse = lessonItems.reduce((acc, item) => {
        const courseId = item.fieldData.course;
        if (!acc[courseId]) {
            acc[courseId] = [];
        }
        acc[courseId].push(item);
        return acc;
    }, {});

    for (const courseId in lessonsByCourse) {
        const lessons = lessonsByCourse[courseId];
        const course = courseItems.find(c => c.id === courseId);
        const courseTitleExp = `epic-pass-1a240:`;

        for (let i = 0; i < lessons.length; i++) {
            const currentLesson = lessons[i];
            if (currentLesson.fieldData.name.startsWith(courseTitleExp)) {
                // console.log(currentLesson.fieldData.name);
                const updatedTitle = currentLesson.fieldData.name.substring(courseTitleExp.length).trim();
                const updates = {
                    name: updatedTitle
                }

                await updateCollectionItem(lessonsCollectionId, currentLesson, updates, token);
            }
        }

    }
}


async function run() {
    const token = '2d1e8a1bfe8603d1d1dd99c869ef9df6abdecf6e65e2bd19370f10ea402a899b';
    const coursesCollectionId = '666aa94389c10434b088ede2';
    const lessonsCollectionId = '666aa94389c10434b088edf8';
    await setLessonTitle(coursesCollectionId, lessonsCollectionId, token);
}

run();
