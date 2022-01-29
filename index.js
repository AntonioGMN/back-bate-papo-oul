import express, { json } from "express";
import { MongoClient } from "mongodb";
import cors from "cors";
import dotenv from "dotenv";
import dayjs from "dayjs";
import joi from "joi";

const serve = express();
serve.use(json());
serve.use(cors());
dotenv.config();

const messageSchema = joi.object({
	from: joi.string().required(),
	to: joi.string().required(),
	text: joi.string().required(),
	type: joi.string().required(),
	time: joi.string(),
});

const participantsSchema = joi.object({
	name: joi.string().required(),
});

serve.post("/participants", async (req, res) => {
	const mongoClient = new MongoClient(process.env.MONGO_URI);
	const name = req.body.name;

	const validation = participantsSchema.validate(req.body, {
		abortEarly: false,
	});

	if (validation.error) {
		console.log(validation.error.details.map((erro) => erro.message));
		res.sendStatus(422);
		return;
	}

	try {
		await mongoClient.connect();

		const coleçãoParticipantes = mongoClient
			.db("back-bate-papo-out")
			.collection("participantes");

		const busca_partipante = await coleçãoParticipantes.findOne({
			name: name,
		});

		if (busca_partipante) {
			res.sendStatus(409);
			mongoClient.close();
			return;
		}

		const participanteInserido = await coleçãoParticipantes.insertOne({
			name,
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

		res.sendStatus(201);
		mongoClient.close();
	} catch (erro) {
		console.log(erro.message);
		res.send(erro);
		mongoClient.close();
	}
});

serve.get("/participants", async (req, res) => {
	const mongoClient = new MongoClient(process.env.MONGO_URI);

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
	const mongoClient = new MongoClient(process.env.MONGO_URI);
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
	const mongoClient = new MongoClient(process.env.MONGO_URI);
	const limit = parseInt(req.query.limit);
	const user = req.headers.user;

	try {
		await mongoClient.connect();
		const coleçãoMesssages = mongoClient
			.db("back-bate-papo-out")
			.collection("messages");
		const messages = await coleçãoMesssages
			.find(
				{
					type: { $in: ["message", "status"] },
				},
				// {
				// 	$and: [{ from: { $regex: "user" } }, { type: "private_message" }],
				// }
				{
					to: user,
					type: "private_message",
				}
			)
			.toArray();

		if (limit < messages.length && limit) {
			res.send(messages.slice(messages.length - limit, messages.length));
		} else res.send(messages);

		mongoClient.close();
	} catch {
		res.send("erro no get messages");
		mongoClient.close();
	}
});

serve.post("/status", async (req, res) => {
	const mongoClient = new MongoClient(process.env.MONGO_URI);
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

serve.listen(5000);
