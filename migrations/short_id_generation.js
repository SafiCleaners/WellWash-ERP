require('dotenv').config()
const MongoClient = require('mongodb').MongoClient;
const crypto = require('crypto');
const readline = require('readline');

const migrationName = 'short_id_generation';
const migrationCollection = 'migrations';

const {
    DB_URL,
    DB_NAME
} = process.env


const up = async () => {
    const client = await MongoClient.connect(DB_URL);
    const db = client.db(DB_NAME);

    // check if the migration has already been run
    const migration = await db.collection(migrationCollection).findOne({ name: migrationName });
    if (migration) {
        console.log('Migration already run');
        client.close();
        return;
    }

    // check how many laundry jobs are elligible for the migration
    const cursor = db.collection('jobs').find({ deleted: false });
    const elligibleJobs = await cursor.count();
    console.log(`There are ${elligibleJobs} laundry jobs that are elligible for this migration`);

    // prompt the user for confirmation
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.question('Are you sure you want to generate short IDs for these jobs? This action is irreversible. (yes/no) ', (answer) => {
        if (answer === 'yes') {
            console.log('Running migration...');

            // generate short IDs for all laundry jobs
            cursor.forEach(async (job) => {
                const shortId = crypto.randomBytes(3).toString('hex');
                await db.collection('jobs').updateOne({ _id: job._id }, { $set: { shortId } });
            }, async () => {
                // insert a record in the migrations collection
                await db.collection(migrationCollection).insertOne({ name: migrationName, timestamp: new Date() });
                console.log('Migration complete');
                client.close();
            });
        } else {
            console.log('Migration cancelled');
            client.close();
        }
    });
};


up()