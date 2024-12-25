import { Router } from "express";
import client from "@repo/db/client";
import { userMiddleware } from "../../middlewares/user.js";
export const spaceRouter = Router();

spaceRouter.post("/", userMiddleware, async (req, res) => {
  const parsedData = req.body;

  if (!parsedData || !parsedData.dimensions || !parsedData.name){
    res.status(400).json({
      message: "Validation Failed",
    });
    return 
  }

  if (!parsedData.mapId) {
    const spaceFind = await client.space.create({
      data: {
        name: parsedData.name,
        width: parseInt(parsedData.dimensions.split("x")[0]),
        height: parseInt(parsedData.dimensions.split("x")[1]),
        creatorId: req.userId,
      },
    });
    res.json({
      spaceId: spaceFind.id,
    });
    return ;
  }

  const map = await client.map.findUnique({
    where: {
      id: parsedData.mapId,
    },
    select: {
      mapElements: true,
      width: true,
      height: true,
    },
  });

  if (!map) {
    res.status(400).json({
      message: "Map Not Found",
    });
  }

  let space = await client.$transaction(async () => {
    const spaceInner = await client.space.create({
      data: {
        name: parsedData.name,
        width: map.width,
        height: map.height,
        creatorId: req.userId,
      },
    });

    await client.spaceElements.createMany({
      data: map.mapElements.map((e) => ({
        spaceId: spaceInner.id,
        elementId: e.elementId,
        x: e.x,
        y: e.y,
      })),
    });
    return spaceInner;
  });

  // console.log("Space Created: ", space)
  res.json({
    spaceId: space.id,
  });
});
spaceRouter.delete("/element", userMiddleware, async (req, res) => {
  const parsedData = req.body;

  if (!parsedData || !parsedData.id) {
      return res.status(400).json({
          message: "Validation Failed"
      });
  }

  const spaceElement = await client.spaceElements.findFirst({
      where: {
          id: parsedData.id,
      },
      include: {
          space: true
      }
  });

  if (!spaceElement?.space.creatorId || spaceElement.space.creatorId !== req.userId) {
      return res.status(403).json({
          message: "Unauthorized"
      });
  }

  await client.spaceElements.delete({
      where: {
          id: parsedData.id
      }
  });

  return res.json({
      message: "Space deleted",
  });
});

spaceRouter.delete("/:spaceId", userMiddleware, async(req, res)=>{
  const space = await client.space.findUnique({
    where: {
      id: req.params.spaceId
    },select:{
      creatorId: true
    }
  })

  if(!space){
    res.status(400).json({
      message:"Space Not Found"
    })
    return ;
  }

  if(space.creatorId!=req.userId){
    res.status(403).json({
      message:"Unauthorized"
    })
    return ;
  }

  await client.space.delete({
    where:{
      id: req.params.spaceId
    }
  })
  res.json({message:"Space Deleted"})
})

spaceRouter.get("/all", userMiddleware, async (req, res) => {
  const spaces = await client.space.findMany({
    where: {
      creatorId: req.userId,
    },
  });

  res.json({
    spaces: spaces.map((s) => ({
      id: s.id,
      name: s.name,
      thumbnail: s.thumbnail,
      dimensions: `${s.width}x${s.height}`,
    })),
  });
});


spaceRouter.post("/element",userMiddleware, async (req, res) => {
  const parsedData = req.body;
  if(!parsedData || !parsedData.spaceId){
    res.status(400).json({message:"Validation Failed"})
    return ;
  }


  const space = await client.space.findUnique({
    where: {
      id:parsedData.spaceId, 
      creatorId: req.userId
    },
    select: {
      width: true, 
      height: true,
    }
  })


  if(!space){
    res.status(400).json({
      message: "Space Not Found"
    })
    return;
  }

  if(req.body.x < 0 || req.body.y < 0 || req.body.x > space?.width || req.body.y > space?.height) {
    res.status(400).json({message: "Point is outside of the boundary"})
    return
}

  await client.spaceElements.create({
    data: {
      spaceId: req.body.spaceId,
      elementId : req.body.elementId,
      x: req.body.x,
      y: req.body.y,
      
    }
  })

  res.json({
    message: "Element Added"
  })
});

spaceRouter.get("/:spaceId", async(req, res) => {
  const space = await client.space.findUnique({
    where: {
      id: req.params.spaceId
    },
    include:{
      elements: {
        include:{
          element: true
        }
      },
    }
  })

  // console.log("Space: " ,space)

  if(!space){
    res.status(400).json({
      message: "Space Not Found"
    })
    return 
  }

  const responseData = {
    "dimensions":`${space.width}x${space.height}`,
    elements: space.elements.map(e=>({
        id: e.id, 
        element:{
          id:e.element.id, 
          imageUrl: e.element.imageUrl, 
          width: e.element.width, 
          height: e.element.height, 
          static: e.element.static, 
        },
        x: e.x, 
        y: e.y
      })
    ),
  }

  // console.log("To Check :", responseData)

  res.json(responseData)
});
