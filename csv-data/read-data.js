require('dotenv').config()
var { MongoClient, ObjectId } = require('mongodb')
var csv = require('node-csv').createParser();

const { DB_URL } = process.env
const uri = DB_URL;

const start = async () => {
    const db_client = new MongoClient(uri);

    // Connect to the MongoDB cluster
    await db_client.connect();

    const db = await db_client.db("WellAutoWashers")

    csv.parseFile('./sales-to-oct-5.csv', function (err, data) {
        const rows = [
            "Month",
            "Date",
            "Phone number",
            "Name ",
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
            "Dries"
        ]

        const cleanedData = []

        // remember the month for each record.
        let month = null
        data.map(data => {
            const rowDetails = {}

            rows.map(row => {
                const rowIndex = rows.indexOf(row)
                if (data[rowIndex] != "") {
                    const rowLabel = row.replace(" ", "_")
                    rowDetails[rowLabel] = data[rowIndex]
                }
            })

            if (rowDetails.Month) {
                month = rowDetails.Month
            } else {
                rowDetails.Month = month
            }

            if (rowDetails.Phone_number && rowDetails.Phone_number !== '-' && rowDetails.Name_ !== '-') {
                cleanedData.push(rowDetails)
            }
        })

        const phoneNumbers = [...new Set(cleanedData.map(data => {
            return data.Phone_number
        }))]

        db.collection('done-sales-1').insertMany(cleanedData, function (err, result) {
            if (err) throw err
        })

        console.log({ cleanedData, length: cleanedData.length, Phone_numbers: phoneNumbers.length })

    });
}


start().then(console.log)