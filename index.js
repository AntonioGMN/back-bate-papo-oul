import express, { json } from "express";
import { MongoClient } from "mongodb";
import cors from "cors";
import dayjs from "dayjs";
import joi from "joi";

const serve = express();
serve.use(json());
serve.use(cors());

const messageSchema = joi.object({
	from: joi.string().required(),
	to: joi.string().required(),
	text: joi.string().required(),
	type: joi.string().required(),
	time: joi.string(),
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

serve.post("/messages", async (req, res) => {
	const mongoClient = new MongoClient("mongodb://localhost:27017");
	const from = req.headers.user;
	const type = req.body.type;
	let message, destinatario, valida;

	try {
		await mongoClient.connect();
		const coleçãoParticipates = mongoClient
			.db("back-bate-papo-out")
			.collection("participantes");
		destinatario = await coleçãoParticipates.findOne({
			name: from,
		});
	} catch (erro) {
		mongoClient.close();
	}

	if ((type === "private_message" || type === "message") && destinatario) {
		message = {
			from: from,
			...req.body,
			time: dayjs().format("HH:mm:ss"),
		};
	} else {
		res.sendStatus(422);
		return;
	}

	valida = messageSchema.validate(message, { abortEarly: false });

	if (valida.error) {
		res.sendStatus(422);
		console.log(validation.error);
	}

	try {
		const coleçãoMessages = mongoClient
			.db("back-bate-papo-out")
			.collection("messages");
		await coleçãoMessages.insertOne({ ...message });

		res.sendStatus(201);
		mongoClient.close();
	} catch (erro) {
		res.sendStatus(500);
		mongoClient.close();
	}
});

serve.get("/messages", async (req, res) => {
	const mongoClient = new MongoClient("mongodb://localhost:27017");
	const limit = parseInt(req.query.limit);

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
