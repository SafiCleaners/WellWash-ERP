require('dotenv').config()
const MongoClient = require('mongodb').MongoClient;

const migrationName = 'delete_deleted_jobs';
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

    console.log('Running migration...');

    // delete all jobs with deleted flag set to true
    const deletedJobs = await db.collection('jobs').deleteMany({ deleted: true });
    console.log(`Deleted ${deletedJobs.deletedCount} jobs`);

    // insert a record in the migrations collection
    await db.collection(migrationCollection).insertOne({ name: migrationName, timestamp: new Date() });

    console.log('Migration complete');
    client.close();
};

// To run the migration:
up();
