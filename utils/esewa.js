import axios from "axios";  // Importing Axios for making HTTP requests
import crypto from 'crypto';  // Importing the crypto module to perform cryptographic operations
import { ESEWA_GATEWAY_URL, ESEWA_PRODUCT_CODE, ESEWA_SECRET_KEY } from "../config.js";  // Importing necessary environment variables from the config file

// Function to generate the eSewa payment hash (signature) that will be used to authenticate the payment
export const getEsewaPaymentHash = async ({amount, transaction_uuid}) => {
    try {
        // Constructing the data string to be signed, consisting of total_amount, transaction_uuid, and product_code
        const data = `total_amount=${amount},transaction_uuid=${transaction_uuid},product_code=${ESEWA_PRODUCT_CODE}`;
    
        // Using the secret key provided by eSewa to generate an HMAC SHA-256 hash
        const secretKey = ESEWA_SECRET_KEY;
        const hash = crypto
          .createHmac("sha256", secretKey)  // Creating the HMAC hash using SHA-256 and the secret key
          .update(data)  // Updating the hash with the data string
          .digest("base64");  // Converting the hash output to base64 encoding
    
        // Returning the generated hash (signature) and the signed field names (to ensure integrity)
        return {
          signature: hash,
          signed_field_names: "total_amount,transaction_uuid,product_code",  // Fields included in the signature
        };
      } catch (error) {
        // Handling any errors that occur during the signature generation process
        throw error;
      }
};

// Function to verify the eSewa payment by checking the hash and comparing it with eSewa's response
export const verifyEsewaPayment = async (encodedData) => {

    try{
      console.log("Encoded data:", encodedData);

      // Decoding the base64-encoded response received from eSewa
      let decodedData = atob(encodedData);  // Decode base64 encoded data from eSewa
      decodedData = await JSON.parse(decodedData);  // Parsing the decoded data to convert it into an object
      
      console.log("Decoded data", decodedData);
      // Preparing headers for the API request to eSewa's payment verification endpoint
      let headersList = {
        Accept: "application/json",
        "Content-Type": "application/json",
      };
  
      // Constructing the data string to be signed again, based on the decoded data received from eSewa
      const data = `transaction_code=${decodedData.transaction_code},status=${decodedData.status},total_amount=${decodedData.total_amount},transaction_uuid=${decodedData.transaction_uuid},product_code=${process.env.ESEWA_PRODUCT_CODE},signed_field_names=${decodedData.signed_field_names}`;
  
      // Regenerating the HMAC hash using the same secret key and data string to verify its integrity
      const secretKey = ESEWA_SECRET_KEY;
      const hash = crypto
        .createHmac("sha256", secretKey)  // Recreate the hash using the same method as before
        .update(data)  // Update the hash with the new data string
        .digest("base64");  // Convert the hash output to base64 encoding
  
      // Logging both the newly generated hash and the signature received from eSewa to compare them
      console.log(hash);  // Log the newly created hash
      console.log(decodedData.signature);  // Log the signature received from eSewa
      
      // Prepare request options for verifying the transaction via eSewa's API
      let reqOptions = {
        url: `${ESEWA_GATEWAY_URL}/api/epay/transaction/status/?product_code=${ESEWA_PRODUCT_CODE}&total_amount=${decodedData.total_amount}&transaction_uuid=${decodedData.transaction_uuid}`,  // eSewa API endpoint for verifying the payment status
        method: "GET",  // Making a GET request to eSewa's verification API
        headers: headersList,  // Adding headers to the request
      };

      // Comparing the hashes to verify the integrity of the transaction
      if (hash !== decodedData.signature) {
        throw { message: "Invalid Info", decodedData };  // Throw an error if the hashes do not match
      }

      // Sending the request to eSewa to check the payment status
      let response = await axios.request(reqOptions);

      // Validating the response received from eSewa by comparing transaction status, UUID, and total amount
      if (
        response.data.status !== "COMPLETE" ||  // Check if the transaction status is "COMPLETE"
        response.data.transaction_uuid !== decodedData.transaction_uuid ||  // Ensure the UUIDs match
        Number(response.data.total_amount) !== Number(decodedData.total_amount)  // Ensure the total amounts match
      ) {
        throw { message: "Invalid Info", decodedData };  // Throw an error if any of the values do not match
      }

      // Return the validated response and decoded data
      return { response: response.data, decodedData };
    } catch (error) {
      // Handle any errors that occur during the verification process
      throw error;
    }
};




// getEsewaPaymentHash: 
// This function generates a cryptographic HMAC SHA-256 hash using the total amount, transaction UUID, and product code. 
// This hash is sent to eSewa as a signature to validate the authenticity of the request.

// verifyEsewaPayment: This function verifies the payment by decoding the base64-encoded data received from eSewa.
//  It regenerates the hash and compares it with the signature sent by eSewa.
//   If they match, it sends a request to eSewa’s payment verification API to confirm the transaction status, total amount, and transaction UUID.