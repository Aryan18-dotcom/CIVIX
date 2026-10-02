import express from "express";
import { SubmitContactForm } from "../controllers/ContactController.js";

const ContactRouter = express.Router();

ContactRouter.post("/", SubmitContactForm);

export default ContactRouter;