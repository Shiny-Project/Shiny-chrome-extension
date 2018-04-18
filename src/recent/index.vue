<template>
    <el-row>
        <el-col :lg="4" :sm="1">
            <div class="grid-content"></div>
        </el-col>
        <el-col :lg="16" :sm="22" class="events-container">
            <h2>最近事件</h2>
            <div>
                <el-button type="text" @click="openConfigPage">设置页</el-button>
                <el-button type="text" @click="openRecentPage" class="hidden-lg-only">新窗口打开本页</el-button>
                <el-button type="text" @click="openSubscriptionPage">管理订阅</el-button>
            </div>
            <div v-loading="loading" style="min-height: 300px">
                <template v-for="event in events">
                    <el-card class="event">
                        <div slot="header" class="clearfix">
                            <a :href="event.data.link" target="_blank" class="event-title">{{ event.data.title }}</a>
                            <span class="event-detail">
                            {{ event.createdAt }} / Level.{{ event.level }} / {{ event.publisher }}
                        </span>
                        </div>
                        <div v-html="event.data.content.replace(/\n/ig, '<br>')">
                        </div>
                    </el-card>
                </template>
            </div>
        </el-col>
        <el-col :lg="4" :sm="1">
            <div class="grid-content"></div>
        </el-col>
    </el-row>
</template>
<style>
    body {
        overflow-x: hidden;
    }

    .events-container {
        min-height: 300px;
        min-width: 600px;
    }

    .event {
        margin: 1rem 0;
    }

    .event-title {
        display: block;
        font-size: larger;
        text-decoration: none;
        color: #209fff;
    }

    .event-title:hover {
        color: #22c0ff;
    }

    .event-detail {
        color: #aaa;
    }

    .grid-content {
        min-height: 1px;
    }
</style>
<script>
    import axios from 'axios';

    export default {
        data() {
            return {
                events: [],
                loading: false
            }
        },
        methods: {
            openConfigPage() {
                chrome.tabs.create({
                    url: './config/index.html'
                })
            },
            openRecentPage() {
                chrome.tabs.create({
                    url: './recent/index.html'
                })
            },
            openSubscriptionPage() {
                chrome.tabs.create({
                    url: './subscription/index.html'
                })
            },
            /**
             * 获取最近页面
             * @param page
             * @returns {Promise<any>}
             */
            fetchRecentEvents(page = 1) {
                return new Promise(async (resolve, reject) => {
                    this.loading = true;
                    try {
                        const response = await axios.get(`https://shiny.kotori.moe/Data/recent?page=${page}`);
                        resolve(response.data.data);
                    } catch (e) {
                        reject(e);
                    }
                    this.loading = false;
                })
            }
        },
        async mounted() {
            const result = await this.fetchRecentEvents();
            this.events = this.events.concat(result.events);
        }
    }
</script>