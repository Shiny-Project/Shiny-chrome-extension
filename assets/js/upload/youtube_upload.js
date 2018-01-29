$(() => {
    window.$vm = new Vue({
        el: "#app",
        data(){
            return {
                event: {
                    title: "载入中",
                    content: "",
                    link: ""
                },
                form: {
                    title: "",
                    description: "",
                    tags: "",
                    tid: 0,
                    serverFileName: "",
                    source: ""
                },
                isLoaded: false,
                showPanel: false,
                manualSubmit: false,
                tidMap: [
                    {
                        tid: 152,
                        name: "官方延伸"
                    },
                    {
                        tid: 29,
                        name: "三次元音乐"
                    },
                    {
                        tid: 54,
                        name: "OP/ED/OST"
                    },
                    {
                        tid: 166,
                        name: "广告"
                    },
                    {
                        tid: 137,
                        name: "明星"
                    }
                ],
                log: [],
                progress: 0,
                startTime: new Date()
            }
        },
        async created(){
            let eventId = location.hash.slice(1);
            if (isNaN(parseInt(eventId))){
                this.event.title = "请合理打开网页";
                return false;
            }
            $.ajax({
                "url": `http://shiny.kotori.moe/Data/info?id=${eventId}`,
                "dataType": "json",
                "success": response => {
                    if (response.data && (response.data.publisher === "YouTubeRSS")){
                        this.event.title = response.data.data.title.slice(0, 70) + "...",
                        this.event.link = response.data.data.link,
                        this.event.content = response.data.data.content
                        this.form.title = this.event.title;
                        this.form.description = this.event.content.slice(0, 150) + "..."
                        this.form.tags = Array.from(response.data.keywords.filter(k => k.score > 90), k => k.keyword).join(',');
                        this.form.source = response.data.data.link;
                        this.isLoaded = true;
                        suggestTitle(response.data).then(res => {
                            console.log("建议的标题:")
                            console.log(res.join("\r\n"));
                        })
                    }
                    else{
                        this.event.title = "该事件竟然不是YouTube视频"
                    }
                }
            })
        },
        methods: {
            async start(){
                let ytbInfo, gid, videoId;
                videoId = this.event.link.match(/\?v\=([0-9a-zA-Z_\-]+)/)[1];
                this.showPanel = true;
                this.startTime = new Date();

                this.log.push("正在查询远程服务器视频下载状态");


                // this.log.push("正在解析视频地址");
                // try{
                //     ytbInfo = await parseYouTube(this.event.link);
                //     console.info(ytbInfo);
                // }
                // catch(e){
                //     this.log.push("解析视频地址失败");
                //     return;
                // }

                // this.log.push("正在建立与下载服务器的连接");
                // let aria2 = new Aria2({
                //     host: "us1.shiny.kotori.moe",
                //     secret: "nRpDrFFf3R5tI9Xc"
                // });

                // this.log.push("发送远程下载指令");
                // try{
                //     gid = await aria2.addUri([
                //         ytbInfo.data.url
                //     ], {
                //         header: `Cookie: ${ytbInfo.data.cookies}`,
                //         "max-tries": 1,
                //         "out": `${videoId}.mp4`
                //     });
                // }
                // catch(e){
                //     this.log.push("建立下载任务失败");
                //     return;
                // }
                let isFinished = true;
                // while(1){
                //     let response = await aria2.tellStatus(gid);
                //     if (response.status === "error"){
                //         this.log.push("远程下载失败，正在移除任务");
                //         await aria2.removeDownloadResult(gid);
                //         this.log.push("移除任务成功");
                //         break;
                //     }
                //     if (response.totalLength !== 0){
                //         this.progress = response.completedLength / response.totalLength * 100;
                //         if (response.status === "complete"){
                //             this.log.push("远程下载完成");
                //             isFinished = true;
                //             break;
                //         }
                //     }
                //     console.log(response);
                //     await sleep(1000);
                // }
                if (isFinished){

                    this.log.push("正在确认文件大小");
                    let fileSize;
                    try{
                        fileSize = await getFileSize(videoId);
                    }
                    catch(e){
                        return this.log.push("确认文件大小失败");
                    }
                    this.log.push(`文件大小 ${fileSize} 字节`);
                    this.progress = 0;

                    this.log.push("正在获取上传Token");
                    let prepareResult = await prepareUpload(`${ytbInfo.data.title}.mp4`, fileSize);
                    let uploadToken = prepareResult.uploadToken;
                    let serverFileName = this.form.serverFileName = prepareResult.fileName;

                    this.log.push("通知B站服务器上传开始");
                    startUpload(serverFileName, fileSize);
                    
                    this.log.push("正引导远程上传");
                    let jobId = await createUploadJob(uploadToken, videoId);
                    this.log.push("远程上传任务创建完成");

                    while(true){
                        let status = await checkUploadJob(jobId);
                        if (status.status === "error"){
                            this.log.push("远程上传发生错误");
                            return;
                        }
                        if (status.status === "complete"){
                            this.log.push("远程上传完成");
                            this.progress = 100;
                            
                            this.log.push("通知B站服务器上传完成");
                            finishUpload(serverFileName, fileSize);

                            break;
                        }
                        if (status.now_chunk && status.total_chunk){
                            this.progress = status.now_chunk / status.total_chunk * 100;
                            this.log.push(`分块 ${status.now_chunk}/${status.total_chunk} 完成`);
                        }
                        await sleep(1000);
                    }

                    if (this.form.title && this.form.description && this.form.tags && this.form.tid){
                        this.submit();
                    }
                    else{
                        this.manualSubmit = true;
                        this.log.push("前序工作已经全部完成，等待信息填写完成");
                    }
                }
            },
            async submit(){
                for (let v of Object.values(this.form)){
                    if (!v){
                        return this.log.push("信息尚未填写完毕");
                    }
                }
                try{
                    let response = await submitVideo(this.form.serverFileName, this.form.source, this.form.tid, this.form.title, 
                    `${this.form.description}\r\nUpload by ShinyCloud in ${((new Date() - this.startTime)/1000).toFixed(2)} s`, this.form.tags.split(','));
                    this.log.push(`稿件提交成功 <a href="http://acg.tv/${response}" target="_blank">${response}</a>`);
                }
                catch(e){
                    this.log.push("稿件提交失败");
                }
            },
            setTid($event){
                if ($event.clientX && $event.clientY){
                    this.form.tid = +$($event.target).data('tid');
                }
            }
        },
        filters: {
            transform(text){
                return text.replace(/\n/ig, "<br>");
            },
            logTransform(log){
                return log.join("<br>");
            }
        }
    })
})