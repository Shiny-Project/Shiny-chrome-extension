import * as storage from './storage';
import axios from 'axios';

/**
 * 获得订阅列表
 * @returns {Promise<*>}
 */
export async function getSubscription() {
    const response = await axios.get(`https://shiny.kotori.moe/User/subscription?token=${storage.getToken()}`);
    localStorage.setItem('subscription', JSON.stringify(response.data.data));
    return response.data.data;
}

/**
 * 订阅项目
 * @param spiderName
 * @returns {Promise<*>}
 */
export async function subscribe(spiderName) {
    const response = await axios.post('https://shiny.kotori.moe/User/subscribe', {
        token: storage.getToken(),
        spiderName
    });
    localStorage.setItem('subscription', JSON.stringify(response.data.data));
    return response.data.data;
}

/**
 * 取消订阅
 * @param spiderName
 * @returns {Promise<*>}
 */
export async function unsubscribe(spiderName) {
    const response = await axios.post('https://shiny.kotori.moe/User/unsubscribe', {
        token: storage.getToken(),
        spiderName
    });
    localStorage.setItem('subscription', JSON.stringify(response.data.data));
    return response.data.data;
}