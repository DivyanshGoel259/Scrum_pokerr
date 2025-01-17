import { RedisClientType } from "redis";
import { UserWebSocket } from "./types";
import { broadcast, ttl } from ".";

interface Args {
    data:any
    socket:UserWebSocket,
    client:RedisClientType|undefined
}

export const joinGame = async ({data,socket,client}:Args)=>{

    try {
        console.log(data)
        const gameId = data.message.gameId;
        const gameString = await client?.get(`gameId:${gameId}`);
        const game = gameString?JSON.parse(gameString):null
        broadcast({
            type:"game",
            message:game
        })
    } catch (err:any){
        console.log(err.message)
        socket.send(err.message)
    }

}

export const voted = async ({data,socket,client}:Args)=>{

    try {

        const gameId = data.message.gameId
        const gameString = await client?.get(`gameId:${gameId}`)
        const userId = data.message.userId
        const game = gameString?JSON.parse(gameString):null
        if(!game){
            throw new Error("Provide Valid GameID")
        }
        const playerIdIndex = game.players.findIndex((player:any)=>{
            return player.playerId === userId
        })  

        if(playerIdIndex==-1){
            throw new Error("No user with This id Exists")
        }

        game.players[playerIdIndex].voted = true
        game.players[playerIdIndex].number = data.message.number
        await client?.set(`gameId:${gameId}`,JSON.stringify(game),{EX:ttl})

        broadcast ({
            type:"game",
            message:game
        })
    } catch (err:any){
        socket.send(err.message)
    }

}

export const reveal = async ({data,socket,client}:Args)=>{

    try {
        const gameId = data.message.gameId
        const gameString = await client?.get(`gameId:${gameId}`);
        const game = gameString?JSON.parse(gameString):null
        if(!game){
            throw new Error("No Game Exists with this gameId")
        }
        game.reveal = true;
        broadcast({
            type:"game",
            message:game
        })
    } catch (err:any){
        socket.send(err.message)
    }

}

export const reset = async ({data,socket,client}:Args)=>{

    try {

        const gameId = data.message.gameId 
        const gameString = await client?.get(`gameId:${gameId}`)
        const game = gameString?JSON.parse(gameString):null
        if(!game){
            throw new Error("Provide Valid Game ID")
        }

        game.reveal = false
        game.players.forEach((player:any) => {
            player.number = 0;
            player.voted = false
        });

        await client?.set(`gameId:${gameId}`,JSON.stringify(game),{EX:ttl})

        broadcast({
            type:"game",
            message:game,
            action:"reset"
        })

    } catch (err:any){
        socket.send(err.message);
    }

}