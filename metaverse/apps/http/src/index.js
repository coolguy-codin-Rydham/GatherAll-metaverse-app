import express from "express"
import { router } from "./routes/v1/index.js";
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended:false}))

app.use("/api/v1", router)

app.listen(process.env.PORT || 3000, ()=>{
    console.log(`Server live on http://localhost:${process.env.PORT || 3000}`)
})