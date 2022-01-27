import express, { json } from "express";
import { MongoClient } from "mongodb";
import cors from "cors";

const serve = express();
serve.use(json());
serve.use(cors());

serve.get("/", (req, res) => {
	res.send("ok");
});

serve.get("/participants", async (req, res) => {
	const mongoClient = new MongoClient("mongodb://localhost:27017");

	try {
		await mongoClient.connect();
		const coleçãoParticipates = mongoClient
			.db("back-bate-papo-out")
			.collection("participantes");
		const participantes = await coleçãoParticipates.find().toArray();

		res.send(participantes);
		mongoClient.close();
	} catch (erro) {
		res.send("Erro as pegar participantes no get");
		mongoClient.close();
	}
});

serve.post("/participants", async (req, res) => {
	const mongoClient = new MongoClient("mongodb://localhost:27017");

	try {
		await mongoClient.connect();
		const coleçãoParticipantes = mongoClient
			.db("back-bate-papo-out")
			.collection("participantes");
		const participanteInserido = await coleçãoParticipantes.insertOne({
			...req.body,
			lastStatus: Date.now(),
		});

		console.log(participanteInserido);
		mongoClient.close();
	} catch (erro) {
		console.log(erro);
		res.send(erro);
		mongoClient.close();
	}

	// mongoClient
	// 	.connect()
	// 	.then(() => {
	// 		const db = mongoClient.db("back-bate-papo-out");
	// 		const collection = db.collection("participantes");
	// 		const promise = collection.insertOne({
	// 			...req.body,
	// 			lastStatus: Date.now(),
	// 		});

	// 		promise
	// 			.then((parts) => {})
	// 			.catch((err) => {
	// 				console.log("Erro ao enviar de participantes para para servidor");
	// 			});
	// 	})
	// 	.catch((err) => {
	// 		console.log(err);
	// 		res.send(err);
	// 		mongoClient.close();
	// 	});
});

serve.listen(4000);
