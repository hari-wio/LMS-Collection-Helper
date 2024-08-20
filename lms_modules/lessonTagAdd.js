/* 
    This helper script is for adding lesson tags to lessons based on next/prev mappings
    IMPORTANT: Use proper Webflow API Token & the Lessons collection id on line 104, 105
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

// Action 3: Sort lessons based on next-lesson and previous-lesson fields
function sortLessonsByLinks(lessons) {
    const lessonMap = new Map();
    let firstLesson = null;

    // Map lessons by ID and identify the first lesson
    lessons.forEach(lesson => {
        lessonMap.set(lesson.id, lesson);
        if (!lesson.fieldData['previous-lesson']) {
            firstLesson = lesson;
        }
    });

    // Traverse the linked list using next-lesson to order lessons
    const sortedLessons = [];
    let currentLesson = firstLesson;

    while (currentLesson) {
        sortedLessons.push(currentLesson);
        const nextLessonId = currentLesson.fieldData['next-lesson'];
        currentLesson = lessonMap.get(nextLessonId) || null;
    }

    return sortedLessons;
}

// Main function to set Next Lesson & Previous Lesson fields
async function setLessonOrder(collectionId, token) {
    try {
        const items = await listCollectionItems(collectionId, token);

        // Group lessons by Course
        const lessonsByCourse = items.reduce((acc, item) => {
            const courseId = item.fieldData.course;
            if (!acc[courseId]) {
                acc[courseId] = [];
            }
            acc[courseId].push(item);
            return acc;
        }, {});

        for (const courseId in lessonsByCourse) {
                const lessons = lessonsByCourse[courseId];
                const sortedLessons = sortLessonsByLinks(lessons);

            for (let i = 1; i <= sortedLessons.length; i++) {
                const currentLesson = sortedLessons[i];

                const updates = {
                    tag: `Lesson ${i}`
                }

                await updateCollectionItem (collectionId, currentLesson, updates, token)
            }
        }

        console.log(`All ${items.length} lessons updated successfully.`);

    } catch (error) {
        console.error('Error updating lessons:', error);
    }
}

async function run() {
    const token = '0b77fcc12c8b8e31ae0e1c0a5e8a99485c8e9c135130d57dd1180e7430132144'; /* Webflow API Token */
    const collectionId = '664b081d60411f6802869c06'; /* Lessons Collection id */
    await setLessonOrder(collectionId, token);
}

run();