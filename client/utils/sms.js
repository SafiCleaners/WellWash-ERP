var request = require("request");
// Require `PhoneNumberFormat`.
const PNF = require('google-libphonenumber').PhoneNumberFormat;

// Get an instance of `PhoneNumberUtil`.
const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();

const func = ({ schoolId, data: { phone, message } }, reply) => {
    const number = phoneUtil.parseAndKeepRawInput(phone, 'KE');
    const formattedNumber = phoneUtil.format(number, PNF.E164)

    const options = {
        method: 'POST',
        url: 'https://account.mobilesasa.com/api/express-post',
        headers:
        {
            'content-type': 'application/x-www-form-urlencoded',
            accept: 'application/json'
        },
        form:
        {
            api_key:
                '$2y$10$lvLytGxvwzQkFN78K3ke7.2MFU.Mu9FWI35NNFzMeut/VxKgZSGR.',
            senderID: 'SHULEPLUS',
            phone: formattedNumber,
            message,
            username: 'branson'
        }
    }

    request(options, function (error, response, body) {
        if (error) throw new Error({ error, options });
        // console.log(JSON.stringify(JSON.parse(body), null, '\t'))
        reply(JSON.parse(body));
    });

}


// tests

// console.log(makeid())
// func({ data: { password: makeid(), phone: "+254711657108" } }, console.log)

// sms({ data: { phone: "+254719420491", message:"Hello" }}, console.log)

module.exports = func