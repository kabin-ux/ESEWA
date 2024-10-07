import Item from "../models/itemModel.js";
import Payment from "../models/paymentModel.js";
import PurchasedItem from "../models/purchasedItemModel.js";
import { getEsewaPaymentHash, verifyEsewaPayment } from "../utils/esewa.js";
import path from 'path';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const initializeEsewa = async (req, res) => {
    try {
        const { itemId, totalPrice } = req.body;

        // console.log({itemId, totalPrice })
    
        const itemData = await Item.findOne({
          _id: itemId,
          price: Number(totalPrice),
        });
    
        console.log(itemData);
        if (!itemData) {
          return res.status(400).send({
            success: false,
            message: "item not found",
          });
        }
        const purchasedItemData = await PurchasedItem.create({
          item: itemId,
          paymentMethod: "esewa",
          totalPrice: totalPrice,
        });
        const paymentInitate = await getEsewaPaymentHash({
          amount: totalPrice,
          transaction_uuid: purchasedItemData._id,
        });
    
        res.json({
          success: true,
          payment: paymentInitate,
          purchasedItemData,
        });
      } catch (error) {
        res.json({
          success: false,
          error,
        });
      }
};


export const completePayment = async (req, res) => {
    const { data } = req.query;

    console.log("DATA*****", data)
    try {
      const paymentInfo = await verifyEsewaPayment(data);
      console.log("Payment info****", paymentInfo);
      const purchasedItemData = await PurchasedItem.findById(
        paymentInfo.response.transaction_uuid
      );
      if (!purchasedItemData) {
        res.status(500).json({
          success: false,
          message: "Purchase not found",
        });
      }
      // Create a new payment record
      const paymentData = await Payment.create({
        pidx: paymentInfo.decodedData.transaction_code,
        transactionId: paymentInfo.decodedData.transaction_code,
        productId: paymentInfo.response.transaction_uuid,
        amount: purchasedItemData.totalPrice,
        dataFromVerificationReq: paymentInfo,
        apiQueryFromUser: req.query,
        paymentGateway: "esewa",
        status: "success",
      });
  
      //updating purchased record
      await PurchasedItem.findByIdAndUpdate(
        paymentInfo.response.transaction_uuid,
        {
          $set: {
            status: "completed",
          },
        }
      );
      // Send success response
      res.json({
        success: true,
        message: "Payment Successful",
        paymentData,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "An error occurred",
        error,
      });
    }
};

export const createItem = async (req, res) => {

    try {
    const { name } = new Item(req.body);

    const itemExist = await Item.findOne({ name });
    if (itemExist) {
      return res.status(400).json({ message: "Item already exists" });
    }
    const items = await Item.create(req.body);
    res.status(200).json({
      message: "Item created successfully",
      StatusCode: 200,
      Result:{items},
      IsSuccess: true,
    });
  } catch (err) {
    console.log(err, "Error occured");
  }
};

export const getHomePage = (req, res) => {
    const filePath = path.join(__dirname, '../public', 'index.html'); // Example
    res.sendFile(filePath);
};


