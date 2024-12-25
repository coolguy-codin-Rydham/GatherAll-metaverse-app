export class RoomManager{
    static instance
    constructor(){
        this.rooms = new Map();
    }

    static getInstance(){
        if(!this.instance){
            this.instance = new RoomManager();
        }
        return this.instance
    }

    addUser(spaceId, user) {
        if(!this.rooms.has(spaceId)){
            this.rooms.set(spaceId,[user])
            return ;
        }
        this.rooms.set(spaceId,[...(this.rooms.get(spaceId) ?? []),user])
    }

    broadcast(message, user, roomId){
        if(!this.rooms.has(roomId)){
            return;
        }
        this.rooms.get(roomId)?.forEach((u) => {
            if(u.id!==user.id){
                u.send(message);
            }
        });
    }
    removeUser(user,spaceId) {
        if(!this.rooms.has(spaceId)){
            return ;
        }   
        this.rooms.set(spaceId, (this.rooms.get(spaceId)?.filter((u)=>u.id!==user.id ?? [])));

    }
}