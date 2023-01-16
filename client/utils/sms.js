const axios = require("axios");
// Require `PhoneNumberFormat`.
const PNF = require('google-libphonenumber').PhoneNumberFormat;

// Get an instance of `PhoneNumberUtil`.
const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();

const func = ({ phone, message }, reply) => {
    const number = phoneUtil.parseAndKeepRawInput(phone, 'KE');
    const formattedNumber = phoneUtil.format(number, PNF.E164)

    const options = {
        method: 'POST',
        url: 'https://api.mobilesasa.com/v1/send/message',
        headers: {
            Accept: 'application/json',
            Authorization: 'Bearer XC8fHuQFlRJoI5qW08SNuAicPApTvHq3mw0CuK41rY3klpieuqd9N12RpMnB',
            'Content-Type': 'application/json'
        },
        data: {
            senderID: 'WELLWASHERS',
            message,
            phone: formattedNumber
        }
    };

    axios.request(options).then(function (response) {
        reply(JSON.parse(response));
    }).catch(console.log);

}


// tests

// console.log(makeid())
// func({ data: { password: makeid(), phone: "+254711657108" } }, console.log)

// func({ phone: "+254711657108", message:"Hello" }, console.log)

module.exports = func