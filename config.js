import {config} from 'dotenv';

config();

export let PORT = process.env.PORT;
export let MONGODB_URL = process.env.MONGODB_URL;

export let ESEWA_SECRET_KEY = process.env.ESEWA_SECRET_KEY;
export let ESEWA_PRODUCT_CODE = process.env.ESEWA_PRODUCT_CODE;
export let ESEWA_GATEWAY_URL = process.env.ESEWA_GATEWAY_URL;