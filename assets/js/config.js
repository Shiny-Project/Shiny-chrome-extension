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

let levelChart = {
    1: '一般事件',
    2: '有趣的事件',
    3: '重要事件',
    4: '紧急事件',
    5: '世界毁灭'
};


$(document).ready(function () {
    new Vue({
        el: '#app',
        data: {
            block: [],
            star: [],
            eventsHistory: [],
            isLogin: Cookies.get('uid')
        },
        ready: function () {
            let self = this;
            ["block", "star"].forEach(function (v) {
                getList(v).then(function (data) {
                    data.forEach((item) => {
                        self[v].push({
                            name: item
                        })
                    })
                });
            });
            $.ajax({
                "type": "GET",
                "url": "https://shiny.kotori.moe/Data/recent",
                "success": function (res) {
                    let events = res.data;
                    for (let event of events){
                        try{
                            let data = event.data;
                            self.eventsHistory.push({
                                "title": data.title,
                                "content": data.content.replace(/\n/ig, '<br>'),
                                "link": data.link,
                                "spiderName": event.publisher,
                                "hash": event.hash,
                                "level": levelChart[event.level],
                            })
                        }
                        catch(e){
                            console.log('伤心！出错了')
                        }
                    }
                }
            })
        },
        methods: {
            removeSpiderFromBlockList: function (index) {
                removeBlock(this.block[index].name).then(() => {
                    this.block.splice(index, 1);
                }).catch((e) => { 
                    console.log(e)
                })
            },
            removeSpiderFromStarList: function (index) {
                removeStar(this.star[index].name).then(() => {
                    this.star.splice(index, 1);
                }).catch(() => { })
            },
            login:function () {
                if (!this.email || !this.password){
                    $('#tip').text('好好填，懂吧。');
                    return;
                }
                $.ajax({
                    url: 'https://shiny.kotori.moe/User/login',
                    data: {
                        email: this.email,
                        password: this.password
                    },
                    dataType: 'json',
                    type: 'POST',
                    success: response=>{
                        let token = response.data.token;
                        let uid = response.data.uid;
                        chrome.storage.sync.set({
                            "token": token,
                            "uid": uid
                        }, ()=>{
                            $('#tip').text('登录成功，抓取信息');
                            $.ajax({
                                url: 'https://shiny.kotori.moe/User/info',
                                data:{
                                    'id': uid
                                },
                                dataType: 'json',
                                success: response=>{
                                    let subscriptionList = [];
                                    for (let item of response.data.subscriptions){
                                        subscriptionList.push(item.id);
                                    }
                                    chrome.storage.sync.set({
                                        "subscriptionList": subscriptionList
                                    },()=>{
                                        location.reload();
                                    })
                                }
                            })
                        });
                    },
                    error: e=>{
                        $('#tip').text('不知道什么错了。');
                    }
                })
            }
        }
    });
});