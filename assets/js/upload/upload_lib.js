/**
 * Google 翻译
 * @param {string} text 
 */
let translate = function(text){
    return new Promise(async (resolve, reject) => {
        $.ajax({
            url: "https://translation.googleapis.com/language/translate/v2",
            type: "POST",
            dataType: "json",
            data: {
                key: "AIzaSyDmQhZp0shSMadvHg3LQVlsH7rG6cqw2vU",
                target: "zh",
                q: text
            },
            success: res => {
                resolve(res.data.translations[0].translatedText);
            },
            error: e => {
                reject(e);
            }
        })
    })
}
/**
 * 给出建议的标题
 * @param {object} event 
 */
let suggestTitle = function(event){
    return new Promise(async (resolve, reject) => {
        let keywords = event.keywords.filter(keyword => keyword.score >= 50).sort((a, b) => {
            return b.score - a.score;
        });
        let suggestTitle = [];
        let guessingArtist = [];
        let guessingTitle = [];
        let guessingType = [""];
        for (let keyword of keywords){
            if (event.data.title.includes(keyword.keyword)){
                if (keyword.score >= 80){
                    if (event.data.title.includes(`【${keyword.keyword}】`) || keyword.score === 100){
                        guessingArtist.push(keyword.keyword);
                        break;
                    }
                    guessingArtist.push(keyword.keyword);
                }
            }
        }
        let titleGuessingRegExp = /[「『](.+)[」』]/ig;
        if (event.data.title.match(titleGuessingRegExp) !== null){
            guessingTitle.push(event.data.title.match(titleGuessingRegExp)[0])
        }
        else{
            let t = event.data.title;
            for (let artist of guessingArtist.slice(0, 3)){
                t = t.replace(artist, "");
            }
            t = t.replace(/[「『」』\[\]\/]/ig, "");
            guessingTitle.push(t);
        }
        if (event.data.title.includes("MV") || event.data.title.includes("Music Video") || event.data.title.includes("Music Clip")){
            guessingType.push("MV");
        }
        else if (event.data.title.includes("試聴動画")){
            guessingType.push("试听动画");
        }
        else{

        }
        for (let i of guessingArtist){
            for (let j of guessingTitle){
                for (let k of guessingType){
                    let translated = await translate(j);
                    suggestTitle.push(`【${i}】 ${j} ${k}`);
                    suggestTitle.push(`【${i}】 ${translated} ${k}`);
                }
            }
        }
        resolve(suggestTitle);
    })
}
/**
 * 解析 YouTube 地址
 * @param {string} url 
 */
let parseYouTube = function(url){
    let videoId = url.match(/\?v\=([0-9a-zA-Z_\-]+)/)[1];
    return new Promise((resolve, reject) => {
        $.ajax({
            url: "https://shiny.kotori.moe/Tool/parseYouTube",
            type: "POST",
            data: {
                "videoId": videoId
            },
            success: res => {
                resolve(res);
            },
            error: e => {
                reject(e);
            }
        })
    })
}
/**
 * 获得文件大小
 * @param {string} videoId 
 */
let getFileSize = function(videoId){
    return new Promise((resolve, reject) => {
        $.ajax({
            url: "http://us1.shiny.kotori.moe:1337/Upload/prepare",
            type: "GET",
            dataType: "json",
            data: {
                "fileName": videoId,
                "api_key": "PaYnj6aYcwS7HD5BSe00xUVQhckYBHxp"
            },
            success: res => {
                resolve(res.data.size);
            },
            error: e => {
                reject(e);
            }
        })
    })
}
/**
 * 准备上传，获得token和服务器文件名
 * @param {*} name 
 * @param {*} fileSize 
 */
let prepareUpload = function(name, fileSize){
    return new Promise((resolve, reject) => {
        $.ajax({
            url: "https://member.bilibili.com/preupload",
            type: "GET",
            dataType: "json",
            data: {
                name: name,
                size: fileSize,
                r: "qn",
                profile: "ugcfr/web3",
                ssl: "1"
            },
            success: res => {
                if (res.uptoken && res.bili_filename){
                    resolve({
                        uploadToken: res.uptoken,
                        fileName: res.bili_filename
                    })
                }
                else{
                    reject()
                }
            },
            error: e => {
                reject(e);
            }
        })
    })
}
/**
 * 创建远程上传任务
 * @param {string} uploadToken 
 * @param {string} fileName 
 */
let createUploadJob = function(uploadToken, fileName){
    return new Promise((resolve, reject) => {
        $.ajax({
            type: "POST",
            dataType: "json",
            url: "http://us1.shiny.kotori.moe:1337/Upload/create",
            data: {
                "api_key": "PaYnj6aYcwS7HD5BSe00xUVQhckYBHxp",
                "fileName": fileName,
                "uploadToken": uploadToken
            },
            success: res => {
                resolve(res.data.jobId);
            },
            error: e => {
                reject(e);
            }
        })
    })
}
/**
 * 获得远程上传任务信息
 * @param {string} jobId 
 */
let checkUploadJob = function(jobId){
    return new Promise((resolve, reject) => {
        $.ajax({
            type: "GET",
            dataType: "json",
            url: "http://us1.shiny.kotori.moe:1337/Upload/check",
            data: {
                "jobId": jobId
            },
            success: res => {
                resolve(res.data);
            },
            error: e => {
                reject(e);
            }
        })
    })
}
/**
 * 获取B站cookie里的一个叫fts的蜜汁玩意
 */
let getFts = function(){
    return new Promise((resolve, reject) => {
        try{
            chrome.cookies.get({url: "https://www.bilibili.com", name: "fts"}, res => {
                resolve(res.value);
            })
        }
        catch(e){
            reject(e);
        }
    })
}
let getMid = function(){
    return new Promise((resolve, reject) => {
        try{
            chrome.cookies.get({url: "https://www.bilibili.com", name: "DedeUserID"}, res => {
                resolve(res.value);
            })
        }
        catch(e){
            reject(e);
        }
    })
}
let getCsrfToken = function(){
    return new Promise((resolve, reject) => {
        try{
            chrome.cookies.get({url: "https://www.bilibili.com", name: "bili_jct"}, res => {
                resolve(res.value);
            })
        }
        catch(e){
            reject(e);
        }
    })
}
let startUpload = function(serverFileName, fileSize){
    return new Promise(async (resolve, reject) => {
        $.ajax({
            url: "https://data.bilibili.com/v/web/web_ugc_upload",
            type: "GET",
            data: {
                mid: await getMid(),
                fts: await getFts(),
                url: "https%3A%2F%2Fmember.bilibili.com%2Fvideo%2Fresubmit.html",
                proid: "1",
                ptype: "1",
                eventid: "start",
                filename: serverFileName,
                filesize: (fileSize / 1024 / 1024).toFixed(0),
                ver: "v3_2.0.3",
                cdn: "http://upcdn-os.acgvideo.com/",
                _: new Date().valueOf()
            },
            success: () => {
                resolve();
            },
            e: e => {
                reject(e);
            }
        })
    })
}
let finishUpload = function(serverFileName, fileSize){
    return new Promise((resolve, reject) => {
        $.ajax({
            url: "https://data.bilibili.com/v/web/web_ugc_upload",
            type: "GET",
            data: {
                mid: getMid(),
                fts: getFts(),
                url: "https%3A%2F%2Fmember.bilibili.com%2Fvideo%2Fresubmit.html",
                proid: "1",
                ptype: "1",
                eventid: "success",
                filename: serverFileName,
                filesize: (fileSize / 1024 / 1024).toFixed(0),
                ver: "v3_2.0.3",
                cdn: "http://upcdn-os.acgvideo.com/",
                _: new Date().valueOf()
            },
            success: () => {
                resolve();
            },
            e: e => {
                reject(e);
            }
        })
    })
}
/**
 * 提交投稿
 * @param {string} serverFileName 服务器文件名
 * @param {string} source 来源
 * @param {integer} tid 分区ID
 * @param {string} title 标题
 * @param {string} description 简介
 * @param {array} tags 标签
 */
let submitVideo = function(serverFileName, source, tid, title, description, tags){
    return new Promise(async (resolve, reject) => {
        $.ajax({
            url: "https://member.bilibili.com/x/vu/web/add",
            type: "POST",
            contentType: "application/json; charset=utf-8",
            data: JSON.stringify({
                copyright: 2,
                cover: "",
                csrf: await getCsrfToken(),
                desc: description,
                mission_id: 0,
                no_reprint: 0,
                source: source,
                tag: tags.join(','),
                tid: tid,
                title: title,
                videos: [
                    {
                        desc: "",
                        filename: serverFileName,
                        title: ""
                    }
                ]
            }),
            success: res => {
                if (res.code === 0){
                    resolve(res.data.aid);
                }
                else{
                    reject(res);
                }
            },
            e: e => {
                reject(e);
            }
        })
    })
}
let sleep = function(t){
    return new Promise((resolve) => {
        setTimeout(resolve, t);
    })
}