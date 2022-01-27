import express, { json } from "express";
import { MongoClient } from "mongodb";
import cors from "cors";

const serve = express();
serve.use(json());
serve.use(cors());

serve.get("/", (req, res) => {
	res.send("ok");
});

serve.get("/participants", (req, res) => {
	const mongoClient = new MongoClient("mongodb://localhost:27017");

	mongoClient
		.connect()
		.then((conectado) => {
			const db = conectado.db("back-bate-papo-out");
			const collection = db.collection("participantes");
			const promise = collection.find().toArray();

			promise
				.then((participantes) => {
					res.send(participantes);
					mongoClient.close();
				})
				.catch(() => {
					res.send("Erro as pegar participantes no get");
					mongoClient.close();
				});
		})
		.catch((err) => {
			console.log(err);
			mongoClient.close();
			res.send(err);
		});
});

serve.post("/participants", (req, res) => {
	const mongoClient = new MongoClient("mongodb://localhost:27017");

	mongoClient
		.connect()
		.then((conectado) => {
			const db = conectado.db("back-bate-papo-out");
			db
				.collection("participantes")
				.insertOne({
					...req.body,
					lastStatus: Date.now(),
				})
				.then((parts) => {
					console.log(parts);
					res.send("Envio de participantes por servidor feito");
					mongoClient.close();
				})
				.catch((err) => {
					console.log("Erro ao enviar de participantes para para servidor");
					console.log(err);
					res.send(err);
					mongoClient.close();
				});
		})
		.catch((err) => {
			console.log(err);
			res.send(err);
			mongoClient.close();
		});
});

serve.listen(4000);
