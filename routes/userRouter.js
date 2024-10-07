import { Router } from "express";
import { completePayment, createItem, getHomePage, initializeEsewa } from "../controllers/userController.js";

const userRouter = Router();

// Define user routes here
userRouter.get('/', getHomePage);

userRouter.post('/create-item', createItem);

userRouter.post('/initialize-esewa', initializeEsewa);

userRouter.get('/complete-payment', completePayment);

export default userRouter;