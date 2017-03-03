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

let levelChart = {
    1: '一般事件',
    2: '有趣的事件',
    3: '重要事件',
    4: '紧急事件',
    5: '世界毁灭'
};

let diffTime = date => {
    let diff = Math.round((new Date() - new Date(date)) / 1000);
    if (diff < 60){
        return `${diff}秒前`;
    }
    else if (diff < 3600){
        return `${Math.round(diff / 60)}分前`;
    }
    else if (diff < 86400){
        return `${Math.round(diff / 3600)}小时前`;
    }
    else{
        return '很久以前';
    }
};


$(document).ready(function () {
    new Vue({
        el: '#app',
        data: {
            eventsHistory: [],
            isLogin: !!localStorage.uid,
            onLoading: false
        },
        ready: function () {
            let self = this;
            let page = 1;
            this.fetchRecent(page);
            $(document).scroll(function(){
                if ($(document).height() - $(document).scrollTop() < 800){
                    if (!self.onLoading){
                        self.fetchRecent(++page);
                    }
                }
            })
        },
        methods: {
            /**
             * 抓取最近列表
             * @param page
             */
            fetchRecent:function (page = 1) {
                let self = this;
                this.onLoading = true;
                $.ajax({
                    "type": "GET",
                    "url": API_BASE + "/Data/recent?page=" + page,
                    "success": function (res) {
                        let events = res.data;
                        for (let event of events){
                            try{
                                let data = event.data;
                                self.eventsHistory.push({
                                    "id": event.id,
                                    "title": data.title,
                                    "content": data.content.replace(/\n/ig, '<br>'),
                                    "link": data.link,
                                    "spiderName": event.publisher,
                                    "hash": event.hash,
                                    "level": levelChart[event.level],
                                    "createdAt": event.createdAt + `  (${diffTime(event.createdAt)})`
                                })
                            }
                            catch(e){
                                console.log('伤心！出错了', e)
                            }
                        }
                        self.onLoading = false;
                    }
                })
            },
            /**
             * 给事件评分
             * @param $event
             */
            rate: function ($event) {
                let eventId = $($event.target).parent().data('eventid');
                let score = $($event.target).data('score');
                $($event.target).parent().fadeOut('fast');

                $.ajax({
                    url: API_BASE + "/Data/rate",
                    type: "POST",
                    data: {
                        'eventId': eventId,
                        'score': score
                    },
                    success: function(data){
                        // not important.
                    }
                })
            }
        }
    });
});