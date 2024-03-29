<template>
    <el-row>
        <el-col :span="20" :offset="2">
            <el-card>
                <h2>订阅管理</h2>
                <el-alert v-if="isEmpty()" title="您的订阅列表为空 要不要来一发呢" type="info"></el-alert>
                <el-row gutter="10" v-loading="loading" class="spider-list-container">
                    <template v-for="spider in spiderList">
                        <el-col :span="8" class="spider-item">
                            <el-card class="box-card" :key="spider.id">
                                <div slot="header" class="clearfix">
                                    <h3 class="spider-title">{{ spider.name }}</h3>
                                    <span class="spider-detail">
                                        <template v-if="spider.path">每 {{ spider.info.expires }} 秒刷新</template>
                                        <template v-else>
                                            外部爬虫
                                        </template>
                                    </span>
                                    <el-button
                                        style="float: right; padding: 3px 0"
                                        type="text"
                                        @click="handleSubscriptionClick(spider.name)"
                                    >
                                        {{ isInLocalSubscription(spider.name) ? "已订阅" : "订阅" }}
                                    </el-button>
                                </div>
                                <div>
                                    {{ spider.description }}
                                </div>
                            </el-card>
                        </el-col>
                    </template>
                </el-row>
            </el-card>
        </el-col>
    </el-row>
</template>
<style>
.spider-list-container {
    min-height: 300px;
}

.spider-item {
    margin: 1rem 0;
}

.spider-detail {
    font-size: smaller;
    color: #aaa;
}
</style>
<script>
import { getSubscription, subscribe, unsubscribe } from "../utils/subscription";
import axios from "axios";

export default {
    data() {
        return {
            spiderList: [],
            loading: false,
            subscription: []
        };
    },
    methods: {
        isEmpty() {
            return this.subscription.length === 0;
        },
        isInLocalSubscription(name) {
            return this.subscription.includes(name);
        },
        reloadLocalSubscription() {
            let subscription = localStorage.getItem("subscription");
            try {
                subscription = JSON.parse(subscription);
                this.subscription = subscription;
            } catch (e) {
                this.subscription = [];
            }
        },
        async handleSubscriptionClick(spiderName) {
            this.loading = true;
            try {
                if (this.isInLocalSubscription(spiderName)) {
                    await unsubscribe(spiderName);
                    this.reloadLocalSubscription();
                } else {
                    await subscribe(spiderName);
                    this.reloadLocalSubscription();
                }
            } catch (e) {
                this.$message({
                    type: "error",
                    message: e.response.data.error.info
                });
                if (e.response.data.error.code === "user_not_found") {
                    // 未登陆
                    localStorage.removeItem("token");
                    localStorage.removeItem("uid");
                    localStorage.removeItem("subscription");
                    location.href = "../account/login/index.html";
                }
            }
            this.loading = false;
        }
    },
    async mounted() {
        if (!localStorage.getItem("token")) {
            // 未登录
            location.href = "../account/login/index.html";
        }
        this.loading = true;
        try {
            await getSubscription(true);
            this.reloadLocalSubscription();
            const spiderListResponse = await axios.get("https://shiny.kotori.moe/Spider/list");
            this.spiderList = spiderListResponse.data.data;
        } catch (e) {
            this.$message({
                type: "error",
                message: e.response.data.error.info
            });
        }
        this.loading = false;
    }
};
</script>
