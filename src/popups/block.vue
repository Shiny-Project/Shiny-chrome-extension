<template>
    <div>
        <div>
            <el-button type="text" class="function-button" @click="addBlock">屏蔽 {{ name }} 的所有信息</el-button>
        </div>
        <div>
            <el-button type="text" class="function-button" @click="cancel">取消操作</el-button>
        </div>
    </div>
</template>
<style>
    body {
        padding: 2rem;
    }
    .function-button{
        display: block;
    }
</style>
<script>
    import * as storage from '../utils/storage';
    export default {
        data() {
            return {
                name: ''
            }
        },
        methods: {
            async addBlock(){
                await storage.addBlock(this.name);
                window.close();
            },
            cancel(){
                window.close();
            }
        },
        mounted(){
            this.name = location.hash.slice(1);
        }
    }
</script>