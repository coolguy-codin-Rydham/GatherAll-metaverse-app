import { RoomManager } from "./RoomManager.js";
import client from "@repo/db/client";
import jwt from "jsonwebtoken"
import { JWT_SECRET } from "./config.js";
function getRandomString(length) {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

export class User {
  constructor(ws) {
    this.id = getRandomString(10);
    this.x = 0;
    this.y = 0;
    this.ws = ws
    this.initHandlers();
  }

  initHandlers() {
    this.ws.on("message", async (data) => {
      const parsedData = JSON.parse(data.toString());
      console.log("parsedData: ",parsedData)

      switch (parsedData.type) {
        case "join": {
            console.log("User Joined");
          const spaceId = parsedData.payload.spaceId;
          const token = parsedData.payload.token;
          const userId = (jwt.verify(token, JWT_SECRET)).userId
          if(!userId){
            this.ws.close()
            return ;
          }
          console.log("User Joined 1");

          this.userId = userId
          const space = await client.space.findFirst({
            where: {
              id: spaceId,
            },
          });
          console.log("User Joined2");

          if (!space) {
            this.ws.close();
            return;
          }
          console.log("User Joined3");

          this.spaceId = spaceId;
          RoomManager.getInstance().addUser(spaceId, this);
          this.x = Math.floor(Math.random() * space?.width);
          this.y = Math.floor(Math.random() * space?.height);
          this.send({
            type: "space-joined",
            payload: {
              spawn: {
                x: this.x,
                y: this.y,
              },
              users:
                RoomManager.getInstance()
                  .rooms.get(spaceId)
                  ?.filter((u) => u.id!=this.id)?.map((u)=>({id:u.id})) ?? [],
            },
          });
          console.log("User Joined4");

          RoomManager.getInstance().broadcast({
            type: "user-joined",
            payload:{
                userId: this.userId,
                x:this.x,
                y:this.y,
            }
          }, this, this.spaceId)
          console.log("User Joined5");

          break;
        }
        case "move": {
            const moveX = parsedData.payload.x;
            const moveY = parsedData.payload.y;
            const xDisplacement = Math.abs(this.x - moveX);
            const yDisplacement = Math.abs(this.y - moveY);

            if((xDisplacement==1 && yDisplacement==0) || (xDisplacement==0 && yDisplacement==1)) {
                this.x = moveX;
                this.y = moveY
                RoomManager.getInstance().broadcast({
                    type: "movement",
                    payload: {
                        x:this.x,
                        y: this.y,
                    }
                }, this, this.spaceId)

                return ;
            }

            this.send({
                type: "movement-rejected",
                payload:{
                    x: this.x,
                    y: this.y
                }
            })

        }
      }
    });
  }

  destroy(){
    RoomManager.getInstance().broadcast({
        type: "user-left",
        payload:{
           userId: this.userId,
        }
    }, this, this.spaceId)
    RoomManager.getInstance().removeUser(this, this.spaceId)
  }

  send(payload) {
    this.ws.send(JSON.stringify(payload));
  }
}
