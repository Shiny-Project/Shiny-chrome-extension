<template>
    <div>
        <div>
            <el-button type="text" class="function-button" @click="addBlock">屏蔽 {{ name }} 的所有信息</el-button>
        </div>
        <div v-if="isChannelBlock()">
            <el-button type="text" class="function-button" @click="addBlockChannel">
                屏蔽 {{ `${name}:${channel}` }} 的所有信息
            </el-button>
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
            name: "",
            channel: ""
        };
    },
    methods: {
        async addBlock() {
            await storage.addBlock(this.name);
            window.close();
        },
        async addBlockChannel() {
            await storage.addBlockChannel(this.name, this.channel);
            window.close();
        },
        cancel() {
            window.close();
        },
        isChannelBlock() {
            return location.hash.includes(":");
        }
    },
    mounted() {
        if (location.hash.includes(":")) {
            this.name = location.hash.slice(1).split(":")[0];
            this.channel = decodeURI(location.hash.slice(1).split(":")[1]);
        } else {
            this.name = location.hash.slice(1);
        }
    }
};
</script>
