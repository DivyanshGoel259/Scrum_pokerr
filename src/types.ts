import WebSocket from "ws"

export interface UserWebSocket extends WebSocket{
    userId:string| undefined
}