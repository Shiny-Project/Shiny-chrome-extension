/**
 * 获取storage列表
 * @param listName
 * @returns {Promise}
 */
function getList(listName) {
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
 * 判断是否存在于storage列表
 * @param listName
 * @param item
 * @returns {Promise}
 */
function isInList(listName, item) {
    return new Promise(function (resolve, reject) {
        getList(listName).then(function (data) {
            if (data.includes(item)) {
                resolve(data);
            }
            else {
                reject();
            }
        })
    })
}

/**
 * 移除屏蔽
 * @param {*} item 
 */
function removeBlock(item) {
    return new Promise(function (resolve, reject) {
        isInList('block', item).then(function (data) {
            let list = data;
            list.splice(data.indexOf(item), 1);
            chrome.storage.sync.set({
                block: list
            }, resolve);
        }).catch(reject)
    })
}

/**
 * 移除特别关注
 * @param {*} item 
 */
function removeStar(item) {
    return new Promise(function (resolve, reject) {
        isInList('star', item).then(function (data) {
            let list = data;
            list.splice(data.indexOf(item), 1);
            chrome.storage.sync.set({
                star: list
            }, resolve);
        }).catch(reject)
    })
}

/**
 * 添加屏蔽
 * @param {*} item 
 */
function addBlock(item) {
    isInList('block', item).then(() => {
        return false
    }).catch(() => {
        isInList('star', item).then((data) => {
            removeStar(item).then(() => {
                getList('block').then((data) => {
                    data.push(item);
                    chrome.storage.sync.set({
                        'block': data
                    })
                })
            })
        }).catch(() => {
            getList('block').then((data) => {
                data.push(item);
                chrome.storage.sync.set({
                    'block': data
                })
            })
        })
    })
}

/**
 * 添加特别关注
 * @param {*} item 
 */
function addStar(item) {
    isInList('star', item).then(() => {
        return false;
    }).catch(() => {
        isInList('block', item).then((data) => {
            removeBlock(item).then(() => {
                getList('star').then((data) => {
                    data.push(item);
                    chrome.storage.sync.set({
                        'star': data
                    })
                })
            })
        }).catch(() => {
            getList('star').then((data) => {
                data.push(item);
                chrome.storage.sync.set({
                    'star': data
                })
            })
        })
    })
}