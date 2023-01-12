var request = require("request");
// Require `PhoneNumberFormat`.
const PNF = require('google-libphonenumber').PhoneNumberFormat;

// Get an instance of `PhoneNumberUtil`.
const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();

const func = ({  phone, message  }, reply) => {
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
                'XC8fHuQFlRJoI5qW08SNuAicPApTvHq3mw0CuK41rY3klpieuqd9N12RpMnB',
            senderID: 'WELLWASHERS',
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

// func({ phone: "+254711657108", message:"Hello" }, console.log)

module.exports = func