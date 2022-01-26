import express, { json } from "express";
import cors from "cors";

const serve = express();
serve.use(json());
serve.use(cors());

serve.get("/", (req, res) => {
	res.send("OK");
});

serve.listen(4000, () => console.log("ouvindo"));
