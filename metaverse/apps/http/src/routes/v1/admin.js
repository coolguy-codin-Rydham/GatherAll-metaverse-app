import { Router } from "express";
import client from "@repo/db/client";
import { adminMiddleware } from "../../middlewares/admin.js";
export const adminRouter = Router();

adminRouter.use(adminMiddleware);

adminRouter.post("/element", async (req, res) => {
  // console.log("userId", req.userId)
  const parsedData = req.body;
  if (!parsedData || !parsedData.width || !parsedData.height || !parsedData.static || !parsedData.imageUrl) {
    res.status(400).json({
      message: "Validation Failed",
    });
  }

  // console.log("ParsedData", [parsedData.width, parsedData.height, parsedData.static, parsedData.imageUrl]);

  const data= {
    width: parsedData.width,
    height: parsedData.height,
    static: parsedData.static,
    imageUrl: parsedData.imageUrl,
  }

  // console.log("Element create data: ", data)

  const element = await client.element.create({
    data: {
      width: parsedData.width,
      height: parsedData.height,
      static: parsedData.static,
      imageUrl: parsedData.imageUrl,
    },
  });

  // console.log("Element in DB return: ", element)

  res.json({
    id: element.id,
  });
});

adminRouter.put("/element/:elementId", async (req, res) => {
  const parsedData = req.body;

  if (!parsedData) {
    res.status(400).json({
      message: "Validation Failed",
    });
  }

  client.element.update({
    where: {
      id: req.params.elementId,
    },
    data: {
      imageUrl: parsedData.imageUrl,
    },
  });
  res.json({
    message: "Element Updated",
  });
});

adminRouter.post("/avatar", async (req, res) => {
  const parsedData = req.body;
  if (!parsedData) {
    res.status(400).json({
      message: "Validation Failed",
    });
    return;
  }
  const avatar = await client.avatar.create({
    data: {
      name: parsedData.name,
      imageUrl: parsedData.imageUrl,
    },
  });
  // console.log("\n\nAvatar Added", avatar, "\n\n");
  res.json({
    id: avatar.id,
  });
});

adminRouter.post("/map", async (req, res) => {
  const parsedData = req.body;
  if (!parsedData) {
    res.status(400).json({
      message: "Validation Failed",
    });
  }

  const map = await client.map.create({
    data: {
      name: parsedData.name,
      width: parseInt(parsedData.dimensions.split("x")[0]),
      height: parseInt(parsedData.dimensions.split("x")[1]),
      thumbnail: parsedData.thumbnail,
      mapElements: {
        create: parsedData.defaultElements.map((e) => ({
          elementId: e.elementId,
          x: e.x,
          y: e.y,
        })),
      },
    },
  });
  // console.log("Created Map: ", map)
  res.json({
    id: map.id,
  });
});
