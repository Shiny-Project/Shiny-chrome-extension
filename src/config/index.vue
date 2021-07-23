<template>
    <el-row>
        <el-col :span="20" :offset="2">
            <el-card>
                <h2>设置</h2>
                <h3>屏蔽列表管理</h3>
                <el-table :data="blockList">
                    <el-table-column type="index" width="50"> </el-table-column>
                    <el-table-column
                        property="name"
                        label="Spider Name"
                        width="120"
                    >
                    </el-table-column>
                    <el-table-column label="操作">
                        <template slot-scope="scope">
                            <el-button
                                type="text"
                                @click="handleRemoveBlock(scope.row.name)"
                            >
                                删除
                            </el-button>
                        </template>
                    </el-table-column>
                </el-table>
                <h3>屏蔽子频道管理</h3>
                <el-table :data="blockChannelList">
                    <el-table-column type="index" width="50"> </el-table-column>
                    <el-table-column
                        property="name"
                        label="Spider:Channel"
                        width="120"
                    >
                    </el-table-column>
                    <el-table-column label="操作">
                        <template slot-scope="scope">
                            <el-button
                                type="text"
                                @click="
                                    handleRemoveBlockChannel(scope.row.name)
                                "
                            >
                                删除
                            </el-button>
                        </template>
                    </el-table-column>
                </el-table>
                <h3>特别关注列表管理</h3>
                <el-table :data="starList">
                    <el-table-column type="index" width="50"> </el-table-column>
                    <el-table-column
                        property="name"
                        label="Spider Name"
                        width="120"
                    >
                    </el-table-column>
                    <el-table-column label="操作">
                        <template slot-scope="scope">
                            <el-button
                                type="text"
                                @click="handleRemoveStar(scope.row.name)"
                            >
                                删除
                            </el-button>
                        </template>
                    </el-table-column>
                </el-table>
                <div>
                    <el-form>
                        <h2>其他设置</h2>
                        <el-form-item label="静音">
                            <el-switch
                                v-model="mute"
                                @change="changeMute"
                            ></el-switch>
                        </el-form-item>
                        <el-form-item label="静音时不屏蔽特别关注" v-if="mute">
                            <el-switch
                                v-model="exceptFavorite"
                                @change="changeExceptFavorite"
                            ></el-switch>
                        </el-form-item>
                    </el-form>
                </div>
            </el-card>
        </el-col>
    </el-row>
</template>
<script>
import * as storage from "../utils/storage";

export default {
    data() {
        return {
            blockList: [],
            starList: [],
            blockChannelList: [],
            mute: false,
            exceptFavorite: false,
        };
    },
    methods: {
        async handleRemoveBlock(name) {
            await storage.removeBlock(name);
            const index = this.blockList.findIndex((i) => i.name === name);
            this.blockList = [
                ...this.blockList.slice(0, index),
                ...this.blockList.slice(index + 1),
            ];
        },
        async handleRemoveStar(name) {
            await storage.removeStar(name);
            const index = this.starList.findIndex((i) => i.name === name);
            this.starList = [
                ...this.starList.slice(0, index),
                ...this.starList.slice(index + 1),
            ];
        },
        async handleRemoveBlockChannel(name) {
            const [spiderName, channelName] = name.split(":");
            await storage.removeBlockChannel(spiderName, channelName);
            const index = this.blockChannelList.findIndex(
                (i) => i.name === `${spiderName}:${channelName}`
            );
            this.blockChannelList = [
                ...this.blockChannelList.slice(0, index),
                ...this.blockChannelList.slice(index + 1),
            ];
        },
        changeMute() {
            localStorage.setItem("mute", this.mute.toString());
        },
        changeExceptFavorite() {
            localStorage.setItem(
                "exceptFavorite",
                this.exceptFavorite.toString()
            );
        },
    },
    async mounted() {
        const blockList = await storage.getList("block");
        const starList = await storage.getList("star");
        const blockChannelList = await storage.getList("block_channel");
        this.blockList = blockList.map((i) => {
            return {
                name: i,
            };
        });
        this.starList = starList.map((i) => {
            return {
                name: i,
            };
        });
        this.blockChannelList = blockChannelList.map((i) => {
            return {
                name: i,
            };
        });
        this.mute = localStorage.getItem("mute") === "true";
        this.exceptFavorite = localStorage.getItem("exceptFavorite") === "true";
    },
};
</script>
