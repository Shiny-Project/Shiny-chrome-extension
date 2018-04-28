<template>
    <el-row>
        <el-col :span="8" :offset="8">
            <el-card>
                <h2>注册</h2>
                <el-form>
                    <el-form-item label="Email">
                        <el-input type="email" v-model="form.email"></el-input>
                    </el-form-item>
                    <el-form-item label="Password">
                        <el-input type="password" v-model="form.password"></el-input>
                    </el-form-item>
                    <el-form-item label="Repeat Password">
                        <el-input type="password" v-model="form.repeatPassword"></el-input>
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
    export default {
        data() {
            return {
                form: {
                    email: '',
                    password: '',
                    repeatPassword: ''
                }
            }
        },
        methods: {
            handleRegister() {
                
            }
        }
    }
</script>