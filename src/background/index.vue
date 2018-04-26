<template>
    <h2>Shiny Now Listening on Events!</h2>
</template>
<style>

</style>
<script>
    import io from "socket.io-client";
    import * as storage from "../utils/storage";
    import {showNotification} from "../utils/notification";
    import {getSubscription} from "../utils/suubscription";

    export default {
        data() {
            return {
                notificationData: {}
            };
        },
        methods: {
            async showNotification(event) {
                const notificationId = await showNotification(event);
                this.notificationData[notificationId] = {
                    url: event.data.link,
                    spiderName: event.spiderName,
                    channel: event.channel
                };
            }
        },
        async mounted() {
            // 安装个提示
            // 更新或安装时的提示
            chrome.runtime.onInstalled.addListener((details) => {
                if (details.reason === "install") {
                    this.showNotification({
                        spiderName: "Shiny",
                        hash: "Shiny",
                        data: {
                            title: "Shiny已安装~",
                            content: "现在您可以收到来自Shiny的推送通知。",
                            link: "https://shiny.kotori.moe"
                        }
                    });
                    chrome.tabs.create({
                        url: '../account/login/index.html#install',
                    });
                } else if (details.reason === "update") {
                    let thisVersion = chrome.runtime.getManifest().version;
                    this.showNotification({
                        spiderName: "Shiny",
                        hash: "Shiny",
                        data: {
                            title: `Shiny已更新至${thisVersion}~`,
                            content: "现在您可以收到来自Shiny的推送通知。",
                            link: "https://shiny.kotori.moe"
                        }
                    });
                    if (!localStorage.getItem('subscription') || localStorage.getItem('subscription') === '[]') {
                        chrome.tabs.create({
                            url: '../account/login/index.html#update',
                        });
                    }
                }
            });

            // 监听通知列表事件
            chrome.notifications.onClicked.addListener((id) => {
                if (this.notificationData[id]) {
                    chrome.tabs.create({
                        url: this.notificationData[id].url
                    });
                }
            });

            chrome.notifications.onClosed.addListener((id) => {
                if (this.notificationData[id]) {
                    delete this.notificationData[id];
                }
            });

            chrome.notifications.onButtonClicked.addListener((id, index) => {
                if (index === 0) {
                    chrome.windows.create({
                        type: 'popup',
                        url: '../popups/block/index.html#' + this.notificationData[id].spiderName +
                        (this.notificationData[id].channel ? `:${this.notificationData[id].channel}` : ''),
                        width: 600,
                        height: 300
                    })
                } else if (index === 1) {
                    chrome.windows.create({
                        type: 'popup',
                        url: '../popups/star/index.html#' + this.notificationData[id].spiderName +
                        (this.notificationData[id].channel ? `:${this.notificationData[id].channel}` : ''),
                        width: 600,
                        height: 300
                    })
                } else {

                }
            });

            const socket = io("http://websocket.shiny.kotori.moe:3737");

            socket.on("event", async (data) => {
                // 尝试按JSON解析
                let event;

                try {
                    event = JSON.parse(data);
                } catch (e) {
                    console.log("无法解析数据");
                    console.log(data);
                    return;
                }
                if (!event.data.title || !event.data.content || !event.data.link) {
                    console.log("事件缺少必要数据");
                    console.log(data);
                    return;
                }

                const subscription = await getSubscription();
                if (!subscription.includes(event.spiderName)) {
                    // 未订阅
                    return ;
                }

                if (localStorage.mute === "true") {
                    // 免打扰
                    if (localStorage.exceptFavorite === "true") {
                        if (await storage.isInList("star", item.spiderName)) {
                            new Audio("../assets/audio/notice.mp3").play();
                            showNotification(event);
                        }
                    } else {
                        return;
                    }
                }

                if (event.level && event.level >= 3) {
                    if (await storage.isInList("block", event.spiderName)) {
                        // 来源被屏蔽
                        return;
                    }
                    if (event.channel) {
                        if (await storage.isInList("block_channel", `${event.spiderName}:${event.channel}`)) {
                            // 频道被屏蔽
                            return;
                        }
                    }
                    if (await storage.isInList("star", event.spiderName)) {
                        // 特别关注 总是发出提示音
                        new Audio("../assets/audio/notice.mp3").play();
                    } else {
                        // 未特别关注 等级为4/5才发出提示音
                        if (event.level === 4) {
                            new Audio("../assets/audio/notice.mp3").play();
                        }
                        if (event.level >= 5) {
                            new Audio("../assets/audio/notice-high.mp3").play();
                        }
                    }
                    this.showNotification(event).then(() => {
                        // pass
                    });
                } else {
                    // 事件等于低于3但是特别关注的时候还是推送
                    if (await storage.isInList("star", event.spiderName)) {
                        this.showNotification(event).then(() => {
                            // pass
                        });
                    }
                }
            });
        }
    };
</script>