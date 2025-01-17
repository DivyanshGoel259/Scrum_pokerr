import WebSocket, { WebSocketServer } from "ws";
import express, { Request, Response } from 'express'
import cors from 'cors'
import { v4 as uuid } from "uuid"
import { redisClient } from "./lib/redis";
import { UserWebSocket } from "./types";
import * as service from "./service"
import { RedisClientType } from "redis";

const app = express()
const PORT = 5050

const server = app.listen(PORT, () => {
    console.log("Server is Listening on " + PORT);
})

app.use(express.json())
app.use(cors())
const wss = new WebSocketServer({ server });

export const ttl = 2 * 60 * 60 // 2 hours in secs

app.post("/create", async (req: Request, res: Response) => {
    try {
        const client = await redisClient();  // initializig a redis client connection 
        const { gameId, user } = req.body;
        if (!user) {
            throw new Error("There must be user object with name")
        }
        if (!user.id) {
            user.id = uuid()
        }
        let payload: any = {
            players: [],
            gameId: gameId,
            reveal: false
        }

        if (!gameId) {
            payload.gameId = uuid()
            payload.organizer = user;
        } else {
            payload = await client?.get(`gameId:${gameId}`);
            payload = JSON.parse(payload);
        }
        payload.players.push({ playerId: user.id, name: user.name, number: 0, voted: false })
        const response = await client?.set(`gameId:${payload.gameId}`, JSON.stringify(payload), { EX: ttl })
        res.json({ user, gameId: payload.gameId })
    } catch (err: any) {
        res.json({ error: { message: err.message } })
    }
})

let client: RedisClientType | undefined;

wss.on("connection", async function connection(socket: UserWebSocket, req) {

    try {
        if (!client) {
            client = await redisClient();
        }
        const userId = req.url?.split("?")[1].split("=")[1];
        if (!userId) {
            throw new Error("Provide UserId , UnAuthorized")
        }
        socket.userId = userId;

        socket.on("error", function error(err: any) {
            console.log("soc error ", err)
        })

        socket.on("message", async function message(data: any) {
            try {
                const parsedData = JSON.parse(data)

                switch (parsedData.message.type) {
                    case "join": {
                        await service.joinGame({ data: parsedData, socket, client })
                        break;
                    }
                    case "voted": {
                        await service.voted({ data: parsedData, socket, client })
                        break;
                    }
                    case "reveal": {
                        await service.reveal({ data: parsedData, socket, client })
                        break;
                    }
                    case "reset": {
                        await service.reset({ data: parsedData, socket, client })
                        break;
                    }
                }
            } catch (err: any) {
                socket.send(err.message)
            }
        })


    } catch (err: any) {
        socket.send(err.message)
    }

})

export const broadcast = async (data: any) => {
    try {
        for (const client of wss.clients as Set<UserWebSocket>) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(data));
            }
        }
    } catch (err: any) {
        console.log(err.message)
    }
}