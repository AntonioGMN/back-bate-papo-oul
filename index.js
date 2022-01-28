import express, { json } from "express";
import { MongoClient } from "mongodb";
import cors from "cors";
import dayjs from "dayjs";

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

		const coleçãoMensagens = mongoClient
			.db("back-bate-papo-out")
			.collection("messages");
		const mensagemInserida = await coleçãoMensagens.insertOne({
			from: req.body.name,
			to: "Todos",
			text: "entra na sala...",
			type: "status",
			time: dayjs().format("HH:mm:ss"),
		});

		mongoClient.close();
		console.log(participanteInserido);
		console.log(mensagemInserida);
		res.sendStatus(201);
	} catch (erro) {
		console.log(erro);
		res.send(erro);
		mongoClient.close();
	}
});

serve.post("/messages", async (req, res) => {
	//dayjs.locale("pt-br");

	if (!req.body.to || !req.body.text) {
		res.sendStatus(422);
		return;
	}

	res.send(dayjs().format("HH:mm:ss"));
});

serve.get("/messages", async (req, res) => {
	const mongoClient = new MongoClient("mongodb://localhost:27017");
	const limit = parseInt(req.query.limit);
	console.log(limit);

	try {
		await mongoClient.connect();
		const coleçãoMesssages = mongoClient
			.db("back-bate-papo-out")
			.collection("messages");
		const messages = await coleçãoMesssages.find().toArray();

		if (limit) {
			res.send(messages.reverse().slice(0, limit));
		} else res.send(messages.reverse());

		mongoClient.close();
	} catch {
		res.send("erro no get messages");
		mongoClient.close();
	}
});

serve.post("/status", async (req, res) => {
	const mongoClient = new MongoClient("mongodb://localhost:27017");
	const user = req.headers.user;

	try {
		await mongoClient.connect();
		const coleçãoParticipates = mongoClient
			.db("back-bate-papo-out")
			.collection("participantes");
		const busca = await coleçãoParticipates.findOne({
			name: user,
		});

		if (!busca) {
			res.sendStatus(404);
			mongoClient.close();
			return;
		}

		await coleçãoParticipates.updateOne(
			{
				name: user,
			},
			{ $set: { lastStatus: Date.now() } }
		);

		res.sendStatus(200);
		mongoClient.close();
	} catch (erro) {
		res.send("Erro no post status");
		mongoClient.close();
	}
});

serve.listen(4000);
