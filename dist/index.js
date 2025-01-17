"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.broadcast = exports.ttl = void 0;
const ws_1 = __importStar(require("ws"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const uuid_1 = require("uuid");
const redis_1 = require("./lib/redis");
const service = __importStar(require("./service"));
const app = (0, express_1.default)();
const PORT = 5050;
const server = app.listen(PORT, () => {
    console.log("Server is Listening on " + PORT);
});
app.use(express_1.default.json());
app.use((0, cors_1.default)());
const wss = new ws_1.WebSocketServer({ server });
exports.ttl = 2 * 60 * 60; // 2 hours in secs
app.post("/create", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const client = yield (0, redis_1.redisClient)(); // initializig a redis client connection 
        const { gameId, user } = req.body;
        if (!user) {
            throw new Error("There must be user object with name");
        }
        if (!user.id) {
            user.id = (0, uuid_1.v4)();
        }
        let payload = {
            players: [],
            gameId: gameId,
            reveal: false
        };
        if (!gameId) {
            payload.gameId = (0, uuid_1.v4)();
            payload.organizer = user;
        }
        else {
            payload = yield (client === null || client === void 0 ? void 0 : client.get(`gameId:${gameId}`));
            payload = JSON.parse(payload);
        }
        payload.players.push({ playerId: user.id, name: user.name, number: 0, voted: false });
        const response = yield (client === null || client === void 0 ? void 0 : client.set(`gameId:${payload.gameId}`, JSON.stringify(payload), { EX: exports.ttl }));
        res.json({ user, gameId: payload.gameId });
    }
    catch (err) {
        res.json({ error: { message: err.message } });
    }
}));
let client;
wss.on("connection", function connection(socket, req) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            if (!client) {
                client = yield (0, redis_1.redisClient)();
            }
            const userId = (_a = req.url) === null || _a === void 0 ? void 0 : _a.split("?")[1].split("=")[1];
            if (!userId) {
                throw new Error("Provide UserId , UnAuthorized");
            }
            socket.userId = userId;
            socket.on("error", function error(err) {
                console.log("soc error ", err);
            });
            socket.on("message", function message(data) {
                return __awaiter(this, void 0, void 0, function* () {
                    try {
                        const parsedData = JSON.parse(data);
                        switch (parsedData.message.type) {
                            case "join": {
                                yield service.joinGame({ data: parsedData, socket, client });
                                break;
                            }
                            case "voted": {
                                yield service.voted({ data: parsedData, socket, client });
                                break;
                            }
                            case "reveal": {
                                yield service.reveal({ data: parsedData, socket, client });
                                break;
                            }
                            case "reset": {
                                yield service.reset({ data: parsedData, socket, client });
                                break;
                            }
                        }
                    }
                    catch (err) {
                        socket.send(err.message);
                    }
                });
            });
        }
        catch (err) {
            socket.send(err.message);
        }
    });
});
const broadcast = (data) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        for (const client of wss.clients) {
            if (client.readyState === ws_1.default.OPEN) {
                client.send(JSON.stringify(data));
            }
        }
    }
    catch (err) {
        console.log(err.message);
    }
});
exports.broadcast = broadcast;
