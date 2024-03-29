import Vue from "vue";
import Element from "element-ui";
import "element-ui/lib/theme-chalk/index.css";
import star from "./star.vue";

Vue.use(Element);
new Vue({
    el: "#app",
    render: (h) => h(star)
});
