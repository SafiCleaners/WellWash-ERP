const https = require('https');
const fs = require('fs');
const axios = require('axios');
const sms = require("./client/utils/sms");
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const isTestMode = false//process.env.TEST_MODE;  // Toggle test mode
const API_URL = 'http://localhost:8002/clients';  // API URL for real data

// JWT Authorization token (Consider moving this to environment variables for security)
const AUTH_TOKEN = process.env.AUTH_TOKEN;

const log = (message) => {
    console.log(`[${new Date().toISOString()}] ${message}`);
};

// Options for real data request
const requestOptions = {
    method: 'get',
    url: API_URL,
    headers: {
        'Accept': 'application/json',
        'Authorization': AUTH_TOKEN
    }
};

// Mock test data for testing
const testData = [
    { name: "Branson", phone: "+254741147930", totalOrders: 12 },
    { name: "Phyliss", phone: "+254743214479", totalOrders: 12 },
    // { name: "Branson", phone: "+254701173735", totalOrders: 7 },
    // { name: "Millen", phone: "+254707850005", totalOrders: 3 },
    // { name: "Phyliss", phone: "+254707288107", totalOrders: 3 },
    // { name: "Leen", phone: "+254791757442", totalOrders: 3 }
];

const exclude = ["724413412","728805002"]

// Function to fetch clients (real or test data)
async function fetchClients() {
    if (isTestMode == true) {
        log("Running in test mode. Using mock test data.");
        return testData;  // Return mock data
    } else {
        try {
            log("Fetching real client data...");
            const response = await axios(requestOptions);
            return response.data;  // Return real API data
        } catch (error) {
            log(`Error fetching clients: ${error.message}`);
            throw new Error('Failed to fetch client data');
        }
    }
}

// Function to filter and sort clients
function processClients(clients) {
    log("Processing client data...");

    // Filter clients with more than 0 orders and not in exclude list (when not in test mode)
    const filteredClients = clients.filter(client => {
        const hasOrders = client.totalOrders !== undefined && client.totalOrders > 0;
        
        // If in test mode, just check orders
        if (isTestMode) {
            return hasOrders;
        }
        
        // If not in test mode, also check if phone is not in exclude list
        const phoneLast9Digits = client.phone.slice(-9); // Get last 9 digits
        const isExcluded = exclude.includes(phoneLast9Digits);
        
        return hasOrders && !isExcluded;
    });

    const sortedClients = filteredClients.sort((a, b) => b.totalOrders - a.totalOrders);

    log(`Found ${sortedClients.length} clients with more than 1 order.`);
    return sortedClients;
}

const GENERIC_NAMES = ["New", "Oop", "Ku", "Temple", "Wa"]; // Add any other generic names you want to exclude

// Then modify your createMessages function like this:
function createMessages(clients) {
    return clients.map(client => {
        let message = '';
        let firstName = client.name.split(' ')[0];
        firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();

        // Check if the name is in our generic names list
        const isGenericName = GENERIC_NAMES.some(genericName => 
            firstName.toLowerCase() === genericName.toLowerCase()
        );

        // Condensed laundry offer with a free duvet wash and 20% discount for today's orders
        const laundryOffer = `we're reaching out to request you to take advantage of our LaundryFactory Weekend Endmonth GIFT!

- per kg laundry 30% off for you
- duvets get a 30% cut
- shoes 40% off
- curtains 35% off
- for every 7kgs laundry = claim a FREE duvet wash!
- free stain removal & ironing
- refer a friend with code ENDMONTH = enjoy 40% each off as friends
- affordable monthly plans available for singles, families and businesses.

Valid for 27th-2nd ,5 days!

We Pick,Wash, Iron & Deliver 
On time all around Nairobi, Kiambu and Thika road

Call/WhatsApp: 0701173735
WellWash Drycleaners,  OJ, Opp Shell
Terms and Conditions are applied.`;

        // Customize the greeting based on whether name is generic
        const greeting = isGenericName ? "Good afternoon!" : `Good afternoon ${firstName}!`;

        // Customize the message based on total orders
        if (client.totalOrders > 10) {
            message = `${greeting}, ${laundryOffer}`;
        } else if (client.totalOrders > 5) {
            message = `${greeting}, ${laundryOffer}`;
        } else {
            message = `${greeting}, ${laundryOffer}`;
        }

        // Calculate the number of characters in the message
        const charCount = message.length;
        const messageCount = Math.ceil(charCount / 160);
        const cost = messageCount * 0.8;

        return {
            Name: firstName,
            Phone: client.phone,
            Orders: client.totalOrders,
            Message: message,
            Characters: charCount,
            MessageCount: messageCount,
            Cost: cost.toFixed(2),
            IsGenericName: isGenericName // Added this for debugging
        };
    });
}



// Function to send messages (updated to respect test mode)
function sendMessages(clientsToBeNotified) {
    clientsToBeNotified.forEach(client => {
        const { Phone, Message, Name } = client;

        // In test mode, only send to numbers in testData
        if (isTestMode) {
            const isTestNumber = testData.some(testClient => testClient.phone === Phone);
            
            if (isTestNumber) {
                log(`[TEST MODE] Sending message to ${Name} (${Phone})`);
                sms({
                    phone: Phone,
                    message: Message
                }, (response) => saveSentMessage(Name, Phone, Message, response));
            } else {
                log(`[TEST MODE] Would send to ${Name} (${Phone}) - but skipping as not in testData`);
            }
        } else {
            // In production mode, send to all valid numbers
            log(`Sending message to ${Name} (${Phone})`);
            sms({
                phone: Phone,
                message: Message
            }, (response) => saveSentMessage(Name, Phone, Message, response));
        }
    });
}

function saveSentMessage(Name, Phone, Message, Response) {
    const sentData = { Name, Phone, Message, Response, Timestamp: new Date().toISOString() };
    const sentDataString = JSON.stringify(sentData); // Convert the object to a JSON string

    // Append the new message to sent.json
    fs.appendFile('sent.json', sentDataString + '\n', (err) => {
        if (err) {
            log(`Error saving message to sent.json: ${err.message}`);
        } else {
            log(`Saved message to ${Name} in sent.json`);
        }
    });
}



// Main function to control the flow
// Main function to control the flow (updated to show test mode behavior)
async function main() {
    log(`Starting client notification process... [${isTestMode ? 'TEST MODE' : 'PRODUCTION MODE'}]`);

    try {
        const clients = await fetchClients();
        const sortedClients = processClients(clients);
        const clientsToBeNotified = createMessages(sortedClients);

        // Log all messages that would be sent
        console.log("\n=== MESSAGES TO BE SENT ===");
        console.table(clientsToBeNotified);

        // Calculate total cost of messages
        const totalCost = clientsToBeNotified.reduce((acc, client) => acc + parseFloat(client.Cost), 0);
        
        // Log summary
        log(`Total number of clients processed: ${clientsToBeNotified.length}`);
        if (isTestMode) {
            const testRecipients = clientsToBeNotified.filter(client => 
                testData.some(testClient => testClient.phone === client.Phone)
            ).length;
            log(`[TEST MODE] Would send to ${testRecipients} test recipients (out of ${clientsToBeNotified.length} total)`);
        }
        log(`Total cost of messages: KSH ${totalCost.toFixed(2)}`);

        // Send messages to clients (will respect test mode in sendMessages function)
        sendMessages(clientsToBeNotified);
        
    } catch (error) {
        log(`Error during process: ${error.message}`);
    }
}

// Start the process
main();
