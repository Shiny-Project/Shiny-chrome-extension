/**
 * 创建 Chrome 通知
 */
export function showNotification(event) {
    return new Promise((resolve, reject) => {
        const notificationOptions = {
            type: 'basic',
            buttons: [{
                title: '屏蔽此来源'
            }, {
                title: '特别关注此来源'
            }]
        };
        if (!event.data.title) {
            reject();
        }
        notificationOptions.title = event.data.title;
        notificationOptions.message = event.data.content || "";
        notificationOptions.iconUrl = event.data.cover || '../assets/image/kotori.jpg';

        chrome.notifications.create(event.hash, notificationOptions, function (id) {
            resolve(id);
        });
    })
}