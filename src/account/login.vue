<template>
    <el-row>
        <el-col :span="8" :offset="8">
            <el-card>
                <h2>登录</h2>
                <el-alert title="首次安装，请登录设置订阅" v-if="mode === 'install'"></el-alert>
                    <el-alert title="当前订阅列表为空，真的不要订阅一下吗" v-if="mode === 'update'">
                </el-alert>
                <el-form v-loading="loading">
                    <el-form-item label="Email">
                        <el-input type="email" v-model="form.email"></el-input>
                    </el-form-item>
                    <el-form-item label="Password">
                        <el-input type="password" v-model="form.password" @keyup.enter.native="handleSubmit"></el-input>
                    </el-form-item>
                    <el-form-item>
                        <el-button @click="handleSubmit">登录</el-button>
                        <el-button type="text" @click="jumpToRegister">注册</el-button>
                    </el-form-item>
                </el-form>
            </el-card>
        </el-col>
    </el-row>
</template>
<script>
    import axios from 'axios';
    import { showNotification } from "../utils/notification";
    import {getSubscription} from "../utils/subscription";
    import {getToken} from "../utils/storage";

    export default {
        data() {
            return {
                loading: false,
                form: {
                    email: '',
                    password: ''
                }
            }
        },
        computed: {
          mode() {
              return location.hash.slice(1);
          }
        },
        methods: {
            async handleSubmit() {
                if (!this.form.email || !this.form.password) {
                    this.$message({
                        type: 'error',
                        message: '请填写全部内容'
                    });
                    return;
                }
                this.loading = true;
                try {
                    const loginResponse = await axios.post('https://shiny.kotori.moe/User/login', {
                        email: this.form.email,
                        password: this.form.password
                    });
                    localStorage.setItem('uid', loginResponse.data.data.uid);
                    localStorage.setItem('token', loginResponse.data.data.token);
                    const subscription = await getSubscription();
                    if (subscription.length === 0) {
                        chrome.tabs.create({
                            url: '../../../subscription/index.html'
                        })
                    }
                    showNotification({
                        spiderName: "Shiny",
                        hash: "Shiny",
                        data: {
                            title: "登陆成功~",
                            content: "现在您可以收到来自Shiny的推送通知。",
                            link: "https://shiny.kotori.moe",
                            cover: "../../../assets/image/kotori.jpg"
                        }
                    });
                    window.close();
                } catch (e) {
                    this.$message({
                        type: 'error',
                        message: e.response.data.error.info
                    });
                }
                this.loading = false;
            },
            jumpToRegister() {
                location.href = '../register/index.html'
            }
        },
        mounted() {
            if (this.mode === 'update') {
                if (getToken()) {
                    location.href = '../../../subscription/index.html';
                }
            }
        }
    }
</script>