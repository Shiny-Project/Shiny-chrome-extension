/**
 * 获取storage列表
 * @param listName
 * @returns {Promise}
 */
export function getList(listName) {
    return new Promise(function (resolve, reject) {
        chrome.storage.sync.get(listName, function (data) {
            if (Object.keys(data).length !== 0) {
                resolve(data[listName]);
            }
            else {
                resolve([]);
            }
        })
    })
}

/**
 * 设置列表内容
 * @param {*} listName 
 * @param {*} list 
 */
export function setList(listName, list) {
    return new Promise((resolve, reject) => {
        const payload = {};
        payload[listName] = list;
        chrome.storage.sync.set(payload, resolve);
    })
}

/**
 * 判断是否存在于storage列表
 * @param listName
 * @param item
 * @returns {Promise}
 */
export function isInList(listName, item) {
    return new Promise(async (resolve, reject) => {
        const list = await getList(listName);
        resolve(list.includes(item));
    })
}



/**
 * 移除屏蔽
 * @param {*} item 
 */
export function removeBlock(item) {
    return new Promise(async (resolve, reject) => {
        const blockList = await getList('block');
        const index = blockList.findIndex(i => i === item);
        if (index < 0) {
            reject("黑名单中不存在该项目");
        }
        await setList('block', [
            ...blockList.slice(0, index),
            ...blockList.slice(index + 1)
        ]);
        resolve();
    });
}

/**
 * 移除特别关注
 * @param {*} item 
 */
export function removeStar(item) {
    return new Promise(async (resolve, reject) => {
        const blockList = await getList('star');
        const index = blockList.findIndex(i => i === item);
        if (index < 0) {
            reject("特别关注名单中不存在该项目");
        }
        await setList('star', [
            ...blockList.slice(0, index),
            ...blockList.slice(index + 1)
        ]);
        resolve();
    });
}

/**
 * 添加屏蔽
 * @param {*} item 
 */
export function addBlock(item) {
    return new Promise(async (resolve, reject) => {
        if (await isInList('block', item)) {
            resolve();
        }
        // 黑名单与特别关注名单互斥
        if (await isInList('star', item)) {
            await removeStar(item);
        }
        const blockList = await getList('block');
        await setList('block', [
            ...blockList,
            item
        ]);
        resolve();
    });
}

/**
 * 添加特别关注
 * @param {*} item 
 */
export function addStar(item) {
    return new Promise(async (resolve, reject) => {
        if (await isInList('star', item)) {
            resolve();
        }
        // 黑名单与特别关注名单互斥
        if (await isInList('block', item)) {
            await removeStar(item);
        }
        const blockList = await getList('star');
        await setList('star', [
            ...blockList,
            item
        ]);
        resolve();
    });
}