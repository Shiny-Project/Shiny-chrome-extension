"use strict";

let API_BASE = 'https://shiny.kotori.moe';
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


$(document).ready(function () {
    window.$vm = new Vue({
        el: '#app',
        data: {
            block: [],
            star: [],
            isLogin: !!localStorage.uid,
            isMute: localStorage.mute === 'true',
            exceptFavorite: localStorage.exceptFavorite === 'true',
            onLoading: false
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
            /**
             * 登录
             */
            login:function () {
                if (!this.email || !this.password){
                    $('#tip').text('好好填，懂吧。');
                    return;
                }
                $('#tip').text('通信中');
                $.ajax({
                    url: API_BASE + '/User/login',
                    data: {
                        email: this.email,
                        password: this.password
                    },
                    dataType: 'json',
                    type: 'POST',
                    success: response=>{
                        let token = response.data.token;
                        let uid = response.data.uid;
                        localStorage.uid = uid;
                        chrome.storage.sync.set({
                            "token": token,
                            "uid": uid
                        }, ()=>{
                            $('#tip').text('登录成功，抓取信息');
                            $.ajax({
                                url: API_BASE + '/User/info',
                                data:{
                                    'id': uid
                                },
                                dataType: 'json',
                                success: response=>{
                                    let subscriptionList = [];
                                    for (let item of response.data.subscriptions){
                                        subscriptionList.push(item.name);
                                    }
                                    chrome.storage.sync.set({
                                        "subscriptionList": subscriptionList
                                    },()=>{
                                        chrome.runtime.sendMessage({renew: true}, function(response) {
                                            console.log(response.farewell);
                                        });
                                        location.reload();
                                    })
                                }
                            })
                        });
                    },
                    error: e=>{
                        if (e.responseJSON && e.responseJSON.error && e.responseJSON.error.info){
                            $('#tip').text(e.responseJSON.error.info);
                        }
                        else{
                            $('#tip').text('不知道什么错了。');
                        }

                    }
                })
            },
            renew:function () {
                chrome.runtime.sendMessage({renew: true}, function(response) {
                    // console.log(response.farewell);
                });
            },
            toggleMute:function ($event) {
                localStorage.mute = $event.target.checked;
            },
            toggleExceptFavorite: function ($event) {
                localStorage.exceptFavorite = $event.target.checked;
            },
            logout: function () {
                delete localStorage.uid;
                location.reload();
            }
        }
    });
});