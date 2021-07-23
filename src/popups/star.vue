<template>
    <div>
        <div>
            <el-button type="text" class="function-button" @click="addStar">特别关注 {{ name }} 的所有信息</el-button>
        </div>
        <div>
            <el-button type="text" class="function-button" @click="cancel">取消操作</el-button>
        </div>
    </div>
</template>
<style>
body {
    padding: 2rem;
    overflow: hidden;
}
.function-button {
    display: block;
}
</style>
<script>
import * as storage from "../utils/storage";
export default {
    data() {
        return {
            name: ""
        };
    },
    methods: {
        async addStar() {
            await storage.addStar(this.name);
            window.close();
        },
        cancel() {
            window.close();
        }
    },
    mounted() {
        this.name = location.hash.slice(1);
    }
};
</script>
