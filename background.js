"use strict";
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
// ===================================

let notificationList = {};

function showNotification(hash, title, content, cover, link, spiderName) {
    chrome.notifications.create(hash, {
        type: 'basic',
        title: title,
        message: content,
        iconUrl: cover || './assets/image/kotori.jpg',
        buttons: [{
            title: '屏蔽此来源'
        }, {
            title: '特别关注此来源'
        }
        ]
    }, function (id) {
        notificationList[id] = {
            url: link,
            spiderName: spiderName
        };
    });
}

chrome.notifications.onClicked.addListener(function (id) {
    if (notificationList[id]) {
        chrome.tabs.create({
            url: notificationList[id].url
        });
    }
});

chrome.notifications.onClosed.addListener(function (id) {
    if (notificationList[id]) {
        delete notificationList[id]
    }
});

// 通知按钮事件监听
chrome.notifications.onButtonClicked.addListener(function (id, index) {
    let res = {
        0: addBlock,
        1: addStar
    }[index](notificationList[id].spiderName);
    chrome.notifications.update(id, {
        title: '已加入' + {
            0: '屏蔽',
            1: '特别关注'
        }[index] + '列表'
    })
});

// 更新或安装时的提示
chrome.runtime.onInstalled.addListener(function (details) {
    if (details.reason == "install") {
        showNotification('Shiny', 'Shiny已安装~', '现在您可以收到来自Shiny的推送通知。', '', 'http://api.kotori.moe:1337', 'Shiny')
    } else if (details.reason == "update") {
        let thisVersion = chrome.runtime.getManifest().version;
        showNotification('Shiny', 'Shiny已更新至' + thisVersion + '~', '现在您可以收到来自Shiny的推送通知。', '', 'http://api.kotori.moe:1337', 'Shiny')
    }
});

// 连接Websocket
let socket = io('http://api.kotori.moe:3737');
let levelChart = {
    1: '一般事件',
    2: '有趣的事件',
    3: '重要事件',
    4: '紧急事件',
    5: '世界毁灭'
};

let subscriptionList = undefined;

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.renew){
        renewSubsciption();
    }
});

function renewSubsciption(){
    // 更新登录用户的订阅列表
    chrome.storage.sync.get('uid', data=>{
        if (data.uid){
            $.ajax({
                url: 'https://shiny.kotori.moe/User/info',
                data:{
                    'id': data.uid
                },
                dataType: 'json',
                success: res=>{
                    let subscriptionList = [];
                    console.log('获得订阅列表:');
                    console.log(res.data.subscriptions);
                    for (let item of res.data.subscriptions){
                        subscriptionList.push(item.name);
                    }
                }
            })
        }
    });
}


socket.on('event', function (data) {
    // 尝试按JSON解析
    try {
        let event = JSON.parse(data);
        let item = {};
        ['title', 'content', 'link', 'cover'].forEach(function (key) {
            item[key] = event && event.data && event.data[key] || undefined;
        });
        ["hash", "spiderName"].forEach(function (key) {
            item[key] = event && event[key]
        });



        item.level = levelChart[event && event.level];
        item.hash = item.hash.toString();

        // 过滤未订阅内容
        if (subscriptionList !== undefined){
            if (subscriptionList.indexOf(event.spiderName) === -1){
                console.log('过滤了一条信息');
                console.log(event);
                return;
            }
        }

        if (item.title && item.content && item.link) {
            if (event.level && event.level >= 3) {
                isInList('block', item.spiderName).then(() => {
                    // 被屏蔽的来源
                    return false;
                }).catch(() => {
                    if (event.level == 4) {
                        new Audio('assets/audio/notice.mp3').play();
                    }
                    if (event.level == 5) {
                        new Audio('assets/audio/notice-high.mp3').play();
                    }
                    showNotification(item.hash, item.title, item.content, item.cover, item.link, item.spiderName);
                })
            }
            else {
                isInList('star', item.spiderName).then(() => {
                    new Audio('assets/audio/notice.mp3').play();
                    showNotification(item.hash, item.title, item.content, item.cover, item.link, item.spiderName);
                }).catch(()=> {
                    // 这个事件并不重要
                })
            }
        }
        else {
            console.log('事件缺少必要参数');
            console.log('收到的广播内容:' + data);
        }

    }
    catch (e) {
        console.log(e);
        console.log('收到的广播内容:' + data);
        console.log('无法解析事件');
    }
});