const https = require('https');
const fs = require('fs');
const sms = require("./client/utils/sms")


const axios = require('axios');

const options = {
    method: 'get',
    url: 'http://localhost:8002/clients',
    headers: {
        'Accept': 'application/json',
        'Authorization':"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2M2QwZWQ5ODNhOGM2YjU5NGY3MmMyZjEiLCJnb29nbGVJZCI6IjEwODQ3OTg2NjQ1MzY2NTM0OTY3NSIsImVtYWlsIjoic2lyYnJhbnNvbjY3QGdtYWlsLmNvbSIsIm5hbWUiOiJTaXIgQnLDpMOxc29uIiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FDZzhvY0wyZ0RMUGdYR3VCVWZHNE0zVHpQcGxUWHpPcTdoQXFMclRWLUxfSFNfWmo4SzM0N25tPXM5Ni1jIiwiYnJhbmQiOiI2NjI3YjdhODFmOTUxNGNhOGNjODRjNzIiLCJpYXQiOjE3MTM4NzkxNzR9._JyZGhZNU4mleiF-2VqBy8IHiD_TWybMLEaT2p44XDQ"
    }
};



if (!fs.existsSync('clients.json')) {
    axios(options)
        .then(response => {
            const responseData = response.data;
            fs.writeFileSync('clients.json', JSON.stringify(responseData));
            console.log('Response saved to clients.json');

            const clients = JSON.parse(fs.readFileSync('clients.json', 'utf8'));
            const filteredClients = clients.filter((client) => client.totalOrders > 2);
            console.log('Clients with more than 2 orders:');
            filteredClients.forEach((client) => console.log(client.name));
            console.log(`Request completed successfully!`);
        })
        .catch(error => {
            console.error(`Error occurred: ${error.message}`);
        });
} else {
    console.log('clients.json already exists, skipping request...');
    const clients = JSON.parse(fs.readFileSync('clients.json', 'utf8'));

    // Filter out clients with undefined totalOrders and totalOrders === 1
    const filteredClients = clients.filter((client) => client.totalOrders !== undefined && client.totalOrders > 1);

    // Sort clients by totalOrders in descending order
    const sortedClients = filteredClients.slice().sort((a, b) => b.totalOrders - a.totalOrders);

    console.log('Clients with their orders (in order of most orders to least):');

    const clientsToBeNotified = sortedClients.map((client) => {
        let message = '';
        let name = client.name.split(' ')[0].charAt(0).toUpperCase() + client.name.split(' ')[0].slice(1).toLowerCase();
        if (client.totalOrders > 10) {
            message = `Hi ${name}, thank you for being one of our most loyal customers! As a token of appreciation, we're offering you an exclusive 25% discount on your next order. Plus, enjoy free delivery along Thika Road! Call/WhatsApp 0701173735 to redeem and get your favorite items cleaned today - duvets, curtains, shoes, suits, and more!`;
        } else if (client.totalOrders > 5) {
            message = `Hi ${name}, we appreciate you! As one of our top customers, we're offering you 20% off your next order. And, don't forget to take advantage of our VIP express wash service - perfect for this rainy season! Call/WhatsApp 0701173735 to place your order and get free delivery along Thika Road. Hurry, offer valid for today and tomorrow! `;
        } else if (client.totalOrders > 2) {
            message = `Hi ${name}, we've missed you! To welcome you back, we're offering 15% off your next order. Plus, enjoy free delivery along Thika Road and get your favorite items cleaned today - duvets, curtains, shoes, suits, and more! Don't let the rain dampen your style - call/WhatsApp 0701173735 to place your order now!`;
        } else {
            message = `Hi ${name}, it's been a while since your last order! To welcome you back, we're offering you 20% off your next order. And, don't forget to take advantage of our pressing service - perfect for this rainy season! Call/WhatsApp 0701173735 to place your order and get free delivery along Thika Road. Offer valid for today, tomorrow, and the day after - don't miss out! `;
        }
        return {
            Name: name, // Use only the first name
            Phone: client.phone,
            Orders: client.totalOrders,
            Message: message
        };
    })

    const testmessages = [["Branson", "+254741147930"], ["Wanjiku", "+254701173735"], ["Wanjiru", "+254713099529"]].map(([name, num]) => {
        const messages = [
            `Hi ${name}, thank you, As a token of appreciation, we're offering you an exclusive 25% discount on your next order. Plus, enjoy free delivery along Thika Road! Call/WhatsApp 0701173735 to redeem and get your favorite items cleaned today - suits, duvets, curtains, shoes, and more!`,
            `Hi ${name}, we appreciate your loyalty! we're offering you 20% off your next order. And, don't forget to take advantage of our VIP express wash service - perfect for this rainy season! Call/WhatsApp 0701173735 to place your order and get free delivery along Thika Road and beyond. Hurry, offer valid for today and tomorrow! `,
            `Hi ${name}, we've missed you! To welcome you, we're offering 15% off your next order. Plus, enjoy free delivery along Thika Road and get your favorite items cleaned today - duvets, curtains, shoes, suits, and more! Don't let the rain dampen your style - call/WhatsApp 0701173735 to place your order now!`,
            `Hi ${name}, To welcome you, we're offering you 20% off your next order. And, don't forget to take advantage of our pressing service - perfect for this rainy season! Call/WhatsApp 0701173735 to place your order and get free delivery along Thika Road. Offer valid for today, tomorrow, and the day after - don't miss out! `
        ]

        messages.map(message => {
            // sms({
            //     phone: num,
            //     message
            // }, console.log)
        })
        // return {
        //     Name: name,
        //     Orders: 2
        //     Message: message
        // };
    })
    console.table(clientsToBeNotified);

    console.log(`Total number of clients: ${sortedClients.length}`);

clientsToBeNotified.map(client => {
  const { Phone, Message, Name } = client;
//   sms({
//     phone: Phone,
//     message: Message
//   }, (err, response) => {
//     const sentData = {
//       Name,
//       Phone,
//       Message,
//       Response: response,
//       Timestamp: new Date().toISOString()
//     };
//     fs.readFile('sent.json', (err, data) => {
//       let sentMessages = [];
//       if (!err && data) {
//         sentMessages = JSON.parse(data);
//       }
//       sentMessages.push(sentData);
//       fs.writeFileSync('sent.json', JSON.stringify(sentMessages));
//     });
//   });
});

}

