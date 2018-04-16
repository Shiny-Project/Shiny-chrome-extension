"use strict";

function generateNumberImage(number) {
    let text;
    if (number < 10)
        text = '0' + number;
    else if (number >= 100)
        text = '99';
    else
        text = number;
    let c = document.createElement("canvas");
    let ctx = c.getContext("2d");
    ctx.font = "140px 微软雅黑";
    ctx.fillText(text, 80, 125);
    return c.toDataURL();
}
function countdown(notificationId, seconds) {
    if (seconds <= 0 || !seconds)
        return;
    let progress = 100;
    $('body').timer((i, count) => {
        chrome.notifications.update(notificationId, {
            progress: Math.round(progress -= 100 / seconds / 20), // chrome这个API居然还只要整数
            iconUrl: generateNumberImage(Math.ceil(seconds - i * 0.05))
        });
        if (i == count - 1) // 这轮子根本没法回调 简直愚蠢
            chrome.notifications.clear(notificationId); // 倒数完毕后关闭通知
    }, 0.05, seconds * 20)
}
// ===================================

let notificationList = {};

function showNotification(event){
    let notificationOptions = {
        type: 'basic',
        buttons: [{
            title: '屏蔽此来源'
        }, {
            title: '特别关注此来源'
        }]
    };

    if (event.countdown){
        notificationOptions.type = 'progress';
        notificationOptions.progress = 100;
        notificationOptions.requireInteraction = true;
    }

    notificationOptions.title = event.data.title || "UNKNOWN EVENT";
    notificationOptions.message = event.data.content || "";
    notificationOptions.iconUrl = event.data.cover || './assets/image/kotori.jpg';

    chrome.notifications.create(event.hash , notificationOptions, function (id) {
        notificationList[id] = {
            url: event.data.link,
            spiderName: event.spiderName
        };
        if (event.countdown) {
            countdown(id, event.countdown);
        }
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
        showNotification({
            spiderName: "Shiny",
            hash: "Shiny",
            data: {
                title: "Shiny已安装~",
                content: "现在您可以收到来自Shiny的推送通知。",
                link: "https://shiny.kotori.moe",
            }
        })
    } else if (details.reason == "update") {
        let thisVersion = chrome.runtime.getManifest().version;
        showNotification({
            spiderName: "Shiny",
            hash: "Shiny",
            data: {
                title: `Shiny已更新至${thisVersion}~`,
                content: "现在您可以收到来自Shiny的推送通知。",
                link: "https://shiny.kotori.moe",
            }
        })
    }
});

// 连接Websocket
let socket = io('http://websocket.shiny.kotori.moe:3737');
let levelChart = {
    1: '一般事件',
    2: '有趣的事件',
    3: '重要事件',
    4: '紧急事件',
    5: '世界毁灭'
};

let subscriptionList;

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.renew) {
        renewSubsciption();
    }
});

function renewSubsciption() {
    // 更新登录用户的订阅列表
    chrome.storage.sync.get('uid', data => {
        if (data.uid) {
            $.ajax({
                url: 'https://shiny.kotori.moe/User/info',
                data: {
                    'id': data.uid
                },
                dataType: 'json',
                success: res => {
                    subscriptionList = [];
                    console.log('获得订阅列表:');
                    console.log(res.data.subscriptions);
                    for (let item of res.data.subscriptions) {
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

        // 过滤未订阅内容
        if (subscriptionList !== undefined) {
            if (subscriptionList.indexOf(event.spiderName) === -1) {
                console.log('过滤了一条信息');
                console.log(event);
                return;
            }
        }

        if (event.data.title && event.data.content && event.data.link) {
            if (localStorage.mute === 'true') {
                // 免打扰
                if (localStorage.exceptFavorite === 'true') {
                    isInList('star', item.spiderName).then(() => {
                        new Audio('assets/audio/notice.mp3').play();
                        showNotification(event);
                    }).catch(() => {
                        // 这个事件并不重要
                    });
                }
                return;
            }

            if (event.level && event.level >= 3) {
                isInList('block', event.spiderName).then(() => {
                    // 被屏蔽的来源
                    return false;
                }).catch(() => {
                    isInList('star', event.spiderName).then(() => {
                        // 特别关注
                        new Audio('assets/audio/notice.mp3').play();
                    }).catch(() => {
                        if (event.level == 4) {
                            new Audio('assets/audio/notice.mp3').play();
                        }
                        if (event.level >= 5) {
                            new Audio('assets/audio/notice-high.mp3').play();
                        }
                    });

                    showNotification(event);
                })
            }
            else {
                isInList('star', event.spiderName).then(() => {
                    // 特别关注
                    new Audio('assets/audio/notice.mp3').play();
                    showNotification(event);
                }).catch(() => {
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