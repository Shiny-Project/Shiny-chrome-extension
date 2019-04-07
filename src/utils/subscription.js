import * as storage from './storage';
import axios from 'axios';

/**
 * 获得订阅列表
 * @returns {Promise<*>}
 */
export async function getSubscription(forceRefresh = false) {
    const lastGetSubscriptionTime = localStorage.getItem('lastGetSubscriptionTime');
    if ((lastGetSubscriptionTime && (parseInt(lastGetSubscriptionTime) - new Date().valueOf() < 1000 * 1800)) && !forceRefresh) {
        // get cache
        return JSON.parse(localStorage.getItem('subscription'));
    } else {
        // refresh
        await axios.get(`https://shiny.kotori.moe/User/subscription?token=${storage.getToken()}`).then(response => {
            localStorage.setItem('subscription', JSON.stringify(response.data.data));
            localStorage.setItem('lastGetSubscriptionTime', new Date().valueOf().toString());
        });
        return JSON.parse(localStorage.getItem('subscription'));
    }
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