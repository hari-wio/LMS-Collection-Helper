/* 
    This helper script is for mapping lessons & adding lesson count on LMS Courses Collection
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
async function updateCourseItem(collectionId, item, updates, token) {
    const url = `https://api.webflow.com/v2/collections/${collectionId}/items/${item.id}`;
    await fetchWebflowAPI(url, 'PATCH', { isArchived: false, isDraft: false, fieldData: updates }, token);
    console.log(`Updated item ${item.fieldData.name}`);
}

// Main function to set Next Lesson & Previous Lesson fields
async function setLessonsAndCount(coursesCollectionId, lessonsCollectionId, token) {
    try {
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
            lessons.sort((a, b) => {
                const tagA = parseInt(a.fieldData.tag.replace('Lesson ', ''), 10);
                const tagB = parseInt(b.fieldData.tag.replace('Lesson ', ''), 10);
                return tagA - tagB;
            });

            const lessonIds = lessons.map(lesson => lesson.id);

            const updates = {
                "lessons-2": lessonIds,
                "lesson-count": lessonIds.length ? lessonIds.length : null
            }

            await updateCourseItem(coursesCollectionId, course, updates, token)
        }

    } catch (error) {
        console.error('Error updating lessons:', error);
    }
}

async function run() {
    const token = '2d1e8a1bfe8603d1d1dd99c869ef9df6abdecf6e65e2bd19370f10ea402a899b';
    const coursesCollectionId = '666aa94389c10434b088ede2';
    const lessonsCollectionId = '666aa94389c10434b088edf8';
    await setLessonsAndCount(coursesCollectionId, lessonsCollectionId, token);
}

run();