"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisClient = void 0;
const redis_1 = require("redis");
let client;
const redisClient = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!client) {
            client = (0, redis_1.createClient)({
                username: "default",
                password: "tEU486Skwbu8K7bYu3MqeZIDxELxJSM8",
                socket: {
                    host: "redis-18680.c80.us-east-1-2.ec2.redns.redis-cloud.com",
                    port: 18680,
                    connectTimeout: 30000
                },
                database: 0,
                disableOfflineQueue: true,
                pingInterval: 3000
            });
            yield client
                .on("connect", () => {
                console.log("Connected to redis server");
            })
                .on("ready", () => {
                console.log("Redis is ready");
            })
                .on("end", () => {
                console.log("Redis is ended");
            })
                .on("error", (err) => {
                console.log("error :", err);
            })
                .on("reconnecting", () => {
                console.log("Reconnecting");
            })
                .connect();
        }
        return client;
    }
    catch (err) {
        console.log(err.message);
    }
});
exports.redisClient = redisClient;
function disconnect() {
    if (client) {
        client.disconnect();
    }
}
process.on('SIGINT', function () {
    disconnect();
});
