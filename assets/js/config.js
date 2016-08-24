"use strict";
/**
 * 获取storage列表
 * @param listName
 * @returns {Array}
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
 * @returns {boolean}
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
            var list = data;
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
            var list = data;
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
    new Vue({
        el: '#app',
        data: {
            block: [],
            star: [],
            eventsHistory: []
        },
        ready: function () {
            var self = this;
            ["block", "star"].forEach(function (v) {
                getList(v).then(function (data) {
                    data.forEach((item) => {
                        self[v].push({
                            name: item
                        })
                    })
                });
            });
            getList('eventsHistory').then(function(data){
                self['eventsHistory'] = data
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
            }
        }
    });
});