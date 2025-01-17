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
exports.reset = exports.reveal = exports.voted = exports.joinGame = void 0;
const _1 = require(".");
const joinGame = (_a) => __awaiter(void 0, [_a], void 0, function* ({ data, socket, client }) {
    try {
        console.log(data);
        const gameId = data.message.gameId;
        const gameString = yield (client === null || client === void 0 ? void 0 : client.get(`gameId:${gameId}`));
        const game = gameString ? JSON.parse(gameString) : null;
        (0, _1.broadcast)({
            type: "game",
            message: game
        });
    }
    catch (err) {
        console.log(err.message);
        socket.send(err.message);
    }
});
exports.joinGame = joinGame;
const voted = (_a) => __awaiter(void 0, [_a], void 0, function* ({ data, socket, client }) {
    try {
        const gameId = data.message.gameId;
        const gameString = yield (client === null || client === void 0 ? void 0 : client.get(`gameId:${gameId}`));
        const userId = data.message.userId;
        const game = gameString ? JSON.parse(gameString) : null;
        if (!game) {
            throw new Error("Provide Valid GameID");
        }
        const playerIdIndex = game.players.findIndex((player) => {
            player.playerId === userId;
        });
        if (playerIdIndex == -1) {
            throw new Error("No user with This id Exists");
        }
        game.players[playerIdIndex].voted = true;
        game.players[playerIdIndex].number = data.message.number;
        yield (client === null || client === void 0 ? void 0 : client.set(`gameId:${gameId}`, JSON.stringify(game), { EX: _1.ttl }));
        (0, _1.broadcast)({
            type: "game",
            message: game
        });
    }
    catch (err) {
        socket.send(err.message);
    }
});
exports.voted = voted;
const reveal = (_a) => __awaiter(void 0, [_a], void 0, function* ({ data, socket, client }) {
    try {
        const gameId = data.message.gameId;
        const gameString = yield (client === null || client === void 0 ? void 0 : client.get(`gameId:${gameId}`));
        const game = gameString ? JSON.parse(gameString) : null;
        if (!game) {
            throw new Error("No Game Exists with this gameId");
        }
        game.reveal = true;
        (0, _1.broadcast)({
            type: "game",
            message: game
        });
    }
    catch (err) {
        socket.send(err.message);
    }
});
exports.reveal = reveal;
const reset = (_a) => __awaiter(void 0, [_a], void 0, function* ({ data, socket, client }) {
    try {
        const gameId = data.message.gameId;
        const gameString = yield (client === null || client === void 0 ? void 0 : client.get(`gameId:${gameId}`));
        const game = gameString ? JSON.parse(gameString) : null;
        if (!game) {
            throw new Error("Provide Valid Game ID");
        }
        game.reveal = false;
        game.players.forEach((player) => {
            player.number = 0;
            player.voted = false;
        });
        yield (client === null || client === void 0 ? void 0 : client.set(`gameId:${gameId}`, JSON.stringify(game), { EX: _1.ttl }));
        (0, _1.broadcast)({
            type: "game",
            message: game,
            action: "reset"
        });
    }
    catch (err) {
        socket.send(err.message);
    }
});
exports.reset = reset;
