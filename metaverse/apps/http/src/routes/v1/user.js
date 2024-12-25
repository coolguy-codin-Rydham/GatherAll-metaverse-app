import client from "@repo/db/client";
import { userMiddleware } from "../../middlewares/user.js";
import { Router } from "express";
export const userRouter = Router();

userRouter.post("/metadata", userMiddleware, async (req, res) => {
    const parsedData = req.body;
    // console.log("\n\n\n\nUser Id:", req.userId, "\n\n\n")
    if (!parsedData || !parsedData.avatarId) {
        return res.status(400).json({
            message: "Validation failed"
        });
    }
   try{
    const user = await client.user.findMany({
        where:{
            id: req.userId
        }
    });
    // console.log("User: " , user)
    await client.user.update({
        where:{
            id: req.userId,

        },
        data: {
            avatarId: parsedData.avatarId
        }
    })
    res.status(200).json({
        message: "Metadata Updated"
    })
   }catch(e){
    console.log(e);
    res.status(400).json({
        message: "Internal Server Error"
    })
   }
});


userRouter.get("/metadata/bulk", async (req, res) => {
    const userIds = (req.query.ids ?? "")
      .replace(/^\[|\]$/g, "")
      .split(",")
      .filter(Boolean); 
    
    // console.log(userIds); 
    // console.log(req.query);
    const metadata = await client.user.findMany({
        where: {
          id: {
            in: userIds,
          },
        },
        select: {
          id: true, // Include the `id` field
          avatar: {
            select: {
              imageUrl: true,
            },
          },
        },
      });
      
  // console.log(metadata);

  res.status(200).json({
    avatars: metadata.map((m) => ({
      userId: m.id,
      avatarId: m.avatar?.imageUrl,
    })),
  });
});

// /api/v1/user/metadata/bulk?userIds=[1,3,51]
