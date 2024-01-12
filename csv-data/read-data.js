require('dotenv').config()
var axios = require("axios");
var { MongoClient, ObjectId } = require('mongodb')
var csv = require('node-csv').createParser();

const { DB_URL } = process.env
const uri = DB_URL;

const headers = {
    Accept: 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7,fr;q=0.6,ar;q=0.5',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Content-Type': 'application/json',
    DNT: '1',
    Origin: 'http://localhost:8181',
    Pragma: 'no-cache',
    Referer: 'http://localhost:8181/',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-site',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    authorization: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2M2QwNGQyYzNhOGM2YjU5NGY0NmY0YTciLCJnb29nbGVJZCI6IjEwNDI4OTIzMTAxOTIzNDQyOTU0NCIsImVtYWlsIjoiZ2l0b21laGJyYW5zb25AZ21haWwuY29tIiwibmFtZSI6IkJyYW5zb24gR2l0b21laCIsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NJZDNzYnRWQlNJT0NPSkllNDhzWEhxTXZ2TjRmRUpfUDlkVVdJbVpNSUQyTTA9czk2LWMiLCJkZWxldGVkIjpmYWxzZSwiaWF0IjoxNzA0OTAyOTkyfQ.AJYmATSLfLLSegn_0VVeC6XtHaCH-yOXeD5r58q5Agg',
    'sec-ch-ua': '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"macOS"'
}

const saveOrder = (order) => {
    const options = {
        method: 'PATCH',
        url: 'http://localhost:8002/jobs/null',
        headers: {
            Accept: 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7,fr;q=0.6,ar;q=0.5',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
            'Content-Type': 'application/json',
            DNT: '1',
            Origin: 'http://localhost:8181',
            Pragma: 'no-cache',
            Referer: 'http://localhost:8181/',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-site',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            authorization: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2M2QwNGQyYzNhOGM2YjU5NGY0NmY0YTciLCJnb29nbGVJZCI6IjEwNDI4OTIzMTAxOTIzNDQyOTU0NCIsImVtYWlsIjoiZ2l0b21laGJyYW5zb25AZ21haWwuY29tIiwibmFtZSI6IkJyYW5zb24gR2l0b21laCIsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NJZDNzYnRWQlNJT0NPSkllNDhzWEhxTXZ2TjRmRUpfUDlkVVdJbVpNSUQyTTA9czk2LWMiLCJkZWxldGVkIjpmYWxzZSwiaWF0IjoxNzA0OTgzNDI4fQ.Ez4H5G7GqzfMk8Fop8rMMJ2xoMZvAqZrYevjtf0b71k',
            'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"macOS"'
        },
        data: order
    };

    return axios.request(options).then(function (response) {
        console.log(response.data);
    }).catch(function (error) {
        console.error(error);
    });
}

const start = async () => {
    const db_client = new MongoClient(uri);

    csv.parseFile('./sales-to-nov-3.csv', async function (err, data) {
        if (err) {
            console.log(err)
        }

        const rows = [
            "Year",
            "Month",
            "Date",
            "Phone number",
            "Name",
            "Appartment Details",
            "Kgs",
            "Kg price",
            "Duvets Count",
            "Duvet price",
            "Item",
            "Item Count",
            "Item price",
            "Item total",
            "Payment amount",
            "Payment code",
            "Washes",
            "Dries",
            "Refered By",
            "Location"
        ]

        const cleanedData = []
        const orderData = []

        // remember the month for each record.
        let year = null
        let month = null

        data.map(dataObject => {
            const rowDetails = {}

            rows.map(row => {
                const rowIndex = rows.indexOf(row)
                if (dataObject[rowIndex] != "") {
                    const rowLabel = row.replace(" ", "_")
                    rowDetails[rowLabel] = dataObject[rowIndex]
                }
            })

            if (rowDetails.Year) {
                year = parseInt(rowDetails.Year);
            } else {
                rowDetails.Year = year
            }

            if (rowDetails.Month) {
                month = rowDetails.Month
            } else {
                rowDetails.Month = month
            }

            if (rowDetails.Phone_number && rowDetails.Phone_number != '-' && rowDetails.Name_ != '-') {
                cleanedData.push(rowDetails)



                // Extract relevant date components
                const monthIndex = new Date(Date.parse(rowDetails.Month + ' 1, 2000')).getMonth(); // Using a trick to get the month index

                // Create a new Date object
                const date = new Date(year, monthIndex, parseInt(rowDetails.Date));

                const order = {
                    // pickupDay: `${monthIndex + 1}/12/${year}`,
                    // dropOffDay: `${monthIndex + 1}/13/${year}`,
                    appartmentName: rowDetails.Appartment_Details,
                    houseNumber: rowDetails.Appartment_Details, // Change this to the correct field in your CSV
                    phone: rowDetails.Phone_number,
                    saved: true,
                    paid: false,
                    charges: {
                        curtainsCharge: rowDetails['Kg price'], // Replace with the correct field in your CSV
                        curtainsAmount: parseInt(rowDetails['Kgs']), // Replace with the correct field in your CSV
                    },
                    googleId: '104289231019234429544', // You may need to dynamically generate this or fetch it from your data
                    clientName: rowDetails.Name_,
                    businessDate: new Date().toISOString(), // Replace this with the correct date field from your CSV or adjust accordingly
                };


                // await saveOrder(order)
                orderData.push(order)
            }
        })

        const phoneNumbers = [...new Set(cleanedData.map(data => {
            return data.Phone_number
        }))]

        const itemNames = [...new Set(cleanedData.map(data => {
            return [data.Item, data.Item_price]
        }))]

        const itemPrices = [...new Set(cleanedData.map(data => {
            return data.Item_price
        }))]

        const duvetPrices = [...new Set(cleanedData.map(data => {
            return data.Duvet_price
        }))]

        const kgPrices = [...new Set(cleanedData.map(data => {
            return data.Kg_price
        }))]

        function calculateSimilarity(str1, str2) {
            const set1 = new Set(str1.toLowerCase());
            const set2 = new Set(str2.toLowerCase());

            const intersection = [...set1].filter(char => set2.has(char));

            return intersection.length;
        }



        console.log(JSON.stringify({
            // cleanedData,
            // length: cleanedData.length,
            // Phone_numbers: phoneNumbers.length,
            // itemPricesLength: itemPrices.length,
            // itemPrices,
            // duvetPricesLength: duvetPrices.length,
            // duvetPrices,
            // kgPricesLength: kgPrices.length,
            // kgPrices,
            itemNamesLength: itemNames.length,
            itemNames: itemNames
        }, null, ''))

        // duvetPrices.map(duvetPrice => {
        //     const options = {
        //         method: 'POST',
        //         url: 'http://localhost:8002/pricings',
        //         headers,
        //         data: {
        //             category: '65a1131bc9e1647caeb38706',
        //             cost: Number(duvetPrice)
        //         }
        //     }
            
        //     console.log(options.data)

        //     axios.request(options).then(function (response) {
        //         console.log(response.data);
        //     }).catch(function (error) {
        //         console.error(error);
        //     });

        //     // cleanup manually after
        // })

        const cleanedItemPricesData = itemNames
            .filter(([itemName, price]) => itemName && price !== null)
            .reduce((acc, [itemName, price]) => {
                const existingItem = acc.find(item => calculateSimilarity(item.itemName, itemName) > 3);


                if (existingItem) {
                    // If the item already exists, add the price to its prices array if it's not already there
                    if (price && !existingItem.prices.includes(Number(price))) {
                        existingItem.prices.push(Number(price));
                    }
                } else {
                    // If the item doesn't exist, create a new object
                    const newItem = {
                        itemName,
                        price: price ? Number(price) : null,
                        prices: price ? [Number(price)] : [],
                    };
                    acc.push(newItem);
                }

                return acc;
            }, []);

        console.log(JSON.stringify(cleanedItemPricesData, null, 2));


    });
}


start()
// .then(console.log)