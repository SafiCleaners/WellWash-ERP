const axios = require('axios');
const { PhoneNumberFormat, PhoneNumberUtil } = require('google-libphonenumber');

// Initialize phone number utilities
const PNF = PhoneNumberFormat;
const phoneUtil = PhoneNumberUtil.getInstance();

// Function to send an SMS
const sendSMS = ({ phone, message }, reply) => {
    let formattedNumber;

    // Attempt to format the phone number
    try {
        const number = phoneUtil.parseAndKeepRawInput(phone, 'KE');
        formattedNumber = phoneUtil.format(number, PNF.E164);
    } catch (error) {
        const errorMsg = `Invalid phone number format: ${error.message}`;
        console.error(errorMsg);
        return reply({ error: errorMsg });
    }

    // Define the request options for sending the SMS
    const options = {
        method: 'POST',
        url: 'https://api.mobilesasa.com/v1/send/message',
        headers: {
            Accept: 'application/json',
            Authorization: 'Bearer QEAVBBLs2GsjN4OaQlRCW9o2nTVnZrTV509hOjG7leCZ3tD3ZSpdPFiPskqA', // Ensure to keep this secure
            'Content-Type': 'application/json'
        },
        data: {
            senderID: 'WELLWASHERS',
            message,
            phone: formattedNumber
        }
    };

    // Send the SMS request
    axios.request(options)
        .then(response => {
            console.log('SMS sent successfully:', response.data);
            reply(response.data);
        })
        .catch(error => {
            const errorMsg = `Error sending SMS: ${error.message}`;
            console.error(errorMsg);
            reply({ error: errorMsg });
        });
};

// Example usage (for testing)
// sendSMS({ phone: "+254711657108", message: "Hello" }, console.log);

// Export the function
module.exports = sendSMS;
