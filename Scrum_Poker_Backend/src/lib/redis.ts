import {RedisClientType , createClient} from 'redis'

let client :RedisClientType|undefined;

export const redisClient = async ()=>{
    try {
        if(!client){
            client = createClient({
                username:"default",
                password:"tEU486Skwbu8K7bYu3MqeZIDxELxJSM8",
                socket:{
                    host:"redis-18680.c80.us-east-1-2.ec2.redns.redis-cloud.com",
                    port:18680,
                    connectTimeout:30000
                },
                database:0,
                disableOfflineQueue:true,
                pingInterval:3000

            });

            await client
            .on("connect",()=>{
                console.log("Connected to redis server")
            })
            .on("ready",()=>{
                console.log("Redis is ready")
            })
            .on("end",()=>{
                console.log("Redis is ended")
            })
            .on("error",(err)=>{
                console.log("error :",err)
            })
            .on("reconnecting",()=>{
                console.log("Reconnecting")
            })
            .connect()
        }
        return client;
    }catch(err:any){
        console.log(err.message);
    }
}

function disconnect() {
    if(client) {
      client.disconnect()
    }
  }
  
  process.on('SIGINT', function() {
    disconnect()
  });