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

    async function writeToCollection(data) {
        try {
            // Connect to the MongoDB server
            await db_client.connect();

            console.log('Connected to the MongoDB server');

            // Access the specific database
            const database = db_client.db("WellAutoWashers");

            // Access the specific collection
            const collection = database.collection('clients'); // Update with your collection name

            // Insert the data into the collection
            const result = await collection.insertMany(data);
            console.log(`${result.insertedCount} documents inserted into the collection`);

        } catch (error) {
            console.error('Error occurred:', error);
        } finally {
            // Close the connection
            await db_client.close();
            console.log('Connection closed');
        }
    }


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
                const businessDate = new Date(year, monthIndex, parseInt(rowDetails.Date));


                // Format the date as 'YYYY-MM-DD'
                const formattedBusinessDate = `${businessDate.getFullYear()}-${(businessDate.getMonth() + 1).toString().padStart(2, '0')}-${businessDate.getDate().toString().padStart(2, '0')}`;


                // console.log(rowDetails)

                const order = {
                    appartmentName: rowDetails.Appartment_Details,
                    houseNumber: rowDetails.Appartment_Details,
                    phone: rowDetails.Phone_number,
                    // saved: true,
                    // paid: false,
                    charges: {
                        kgsCharge: rowDetails['Kg_price'],
                        kgsAmount: parseInt(rowDetails['Kgs']),
                        duvetsCharge: rowDetails['Duvet_price'],
                        duvetsAmount: rowDetails['Duvets_Count'],
                        item: rowDetails['Item'],
                        itemCount: rowDetails['Item_Count'],
                        itemAmount: rowDetails['Item_Price'],
                        paymentAmount: rowDetails['Payment_amount']
                    },
                    // googleId: '104289231019234429544',
                    name: rowDetails.Name,
                    storeId: "65a3ec51c82212d0b6883303",
                    deleted: false,
                    businessDate: formattedBusinessDate
                };


                // await saveOrder(order)
                if (rowDetails.Name)
                    orderData.push(order)
            }
        })

        // Initialize statistics object
        const stats = {
            totalOrders: orderData.length,
            totalRevenue: orderData.reduce((total, order) => total + order.charges.paymentAmount || 0, 0),
            uniqueCustomers: new Set(orderData.map(order => order.phone)).size,
            phoneStats: {}
        };

        // Group orders by phone number
        const ordersByPhone = {};
        orderData.forEach(order => {
            const phoneNumber = order.phone;
            if (!ordersByPhone[phoneNumber]) {
                ordersByPhone[phoneNumber] = [];
            }
            ordersByPhone[phoneNumber].push(order);
        });


        for (const phoneNumber in ordersByPhone) {
            const orders = ordersByPhone[phoneNumber];
            const totalOrders = orders.length;
            let totalAmount = 0;

            const chargeDetails = {
                duvets: 0,
                items: [], // Initialize items as an array
                kgs: 0
            };

            let mostRecentBusinessDate = null;

            orders.forEach(order => {
                // Add individual order charges to the total amount
                totalAmount += parseFloat(order.charges.paymentAmount || 0);

                // Update charge details based on the order
                chargeDetails.duvets += parseFloat(order.charges.duvetsCharge || 0) * (parseInt(order.charges.duvetsAmount) || 0);

                // Check if kgsAmount is valid and numeric before performing calculations
                const kgsAmount = parseInt(order.charges.kgsAmount);
                if (!isNaN(kgsAmount)) {
                    chargeDetails.kgs += parseFloat(order.charges.kgsCharge || 0) * kgsAmount;
                }

                // Update the most recent business date
                if (!mostRecentBusinessDate || new Date(order.businessDate) > new Date(mostRecentBusinessDate)) {
                    mostRecentBusinessDate = order.businessDate;
                }
            });

            chargeDetails.items = [...new Set(chargeDetails.items)]
            // Update overall statistics
            stats.totalOrders += totalOrders;
            stats.totalRevenue += totalAmount;

            // Update stats per phone number
            stats.phoneStats[phoneNumber] = {
                totalOrders,
                totalAmount,
                averageOrderValue: totalAmount / totalOrders,
                chargeDetails,
                mostRecentBusinessDate
            };
        }



        // // Calculate average order value (AOV) for all orders
        // stats.averageOrderValue = stats.totalRevenue / stats.totalOrders;

        // // Calculate customer retention rate
        // // This assumes you have data for previous months to compare against the current month
        // const previousMonthUniqueCustomers = 1000; // Example: Previous month's unique customers
        // stats.customerRetentionRate = (stats.uniqueCustomers / previousMonthUniqueCustomers) * 100;

        // // Calculate churn rate
        // stats.churnRate = 100 - stats.customerRetentionRate;

        // console.log(JSON.stringify(stats, null, '\t'))

        const uniquePhoneNumbersSet = new Set();
        const uniqueOrderData = [];

        for (const order of orderData) {
            if (!uniquePhoneNumbersSet.has(order.phone)) {
                uniquePhoneNumbersSet.add(order.phone);

                Object.assign(order, stats.phoneStats[order.phone])
                const {
                    name,
                    phone,
                } = order

                const {
                    totalOrders,
                    totalAmount,
                    averageOrderValue,
                    mostRecentBusinessDate
                } = stats.phoneStats[order.phone]

                const {
                    duvets,
                    items,
                    kgs
                } = stats.phoneStats[order.phone].chargeDetails
                uniqueOrderData.push({
                    name,
                    phone,
                    totalOrders,
                    totalAmount,
                    averageOrderValue,
                    mostRecentBusinessDate,
                    duvets,
                    items,
                    kgs,
                    deleted:false
                });
            }
        }

        // console.log(uniqueOrderData);
        writeToCollection(uniqueOrderData)

    });
}


start()
// .then(console.log)