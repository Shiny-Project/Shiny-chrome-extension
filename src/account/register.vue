<template>
    <el-row>
        <el-col :span="8" :offset="8">
            <el-card>
                <h2>注册</h2>
                <el-form v-loading="loading">
                    <el-form-item label="Email">
                        <el-input type="email" v-model="form.email"></el-input>
                    </el-form-item>
                    <el-form-item label="Password">
                        <el-input type="password" v-model="form.password"></el-input>
                    </el-form-item>
                    <el-form-item label="Repeat Password">
                        <el-input type="password" v-model="form.repeatPassword" @keyup.enter.native="handleRegister"></el-input>
                    </el-form-item>
                    <el-form-item>
                        <el-button type="primary" @click="handleRegister">注册</el-button>
                    </el-form-item>
                </el-form>
            </el-card>
        </el-col>
    </el-row>
</template>

<script>
    import axios from 'axios';
    export default {
        data() {
            return {
                form: {
                    email: '',
                    password: '',
                    repeatPassword: ''
                },
                loading: false
            }
        },
        methods: {
            async handleRegister() {
                if (!this.form.email || !this.form.password || !this.form.repeatPassword) {
                    this.$message({
                        type: 'error',
                        message: '请填写全部内容'
                    });
                    return;
                }
                this.loading = true;
                try {
                    await axios.post('https://shiny.kotori.moe/User/create', {
                        email: this.form.email,
                        password: this.form.repeatPassword
                    });
                    location.href = '../login/index.html';
                } catch (e) {
                    this.$message({
                        type: 'error',
                        message: e.response.data.error.info
                    });
                }
                this.loading = false;
            }
        }
    }
</script>