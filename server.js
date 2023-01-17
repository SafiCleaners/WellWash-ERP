require('dotenv').config()
const express = require('express');
const cors = require('cors');

const aws = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const axios = require('axios')
aws.config.loadFromPath('./creds.json');
var jwt = require('jsonwebtoken');
var querystring = require('querystring');
const { join } = require("path");
const sms = require("./client/utils/sms")

const app = express();

var { MongoClient, ObjectId } = require('mongodb');
const { error } = require('console');
const { uuid } = require("uuidv4")

// Express body parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

const session = require('express-session');
const MongoDBStore = require('express-mongodb-session')(session);

const {
    JWT_TOKEN = 'shhhhh',
    DB_URL
} = process.env


const store = new MongoDBStore({
    uri: `${DB_URL}/sessions`,
    collection: 'connect_mongodb_session_test'
});

app.use(require('express-session')({
    secret: 'This is a secret',
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
    },
    genid: function (req) {
        return uuid() // use UUIDs for session IDs
    },
    store: store,
    // Boilerplate options, see:
    // * https://www.npmjs.com/package/express-session#resave
    // * https://www.npmjs.com/package/express-session#saveuninitialized
    resave: true,
    saveUninitialized: true
}));

// Catch errors
store.on('error', function (error) {
    console.log(error);
});


const authMiddleware = (req, res, next) => {
    // let token = req.header('authorization');
    // // console.log("TOKEN IS ", token)
    // if (!token) {
    //     return res.send(401)
    // }

    // var decoded = jwt.verify(token, JWT_TOKEN);
    // req.auth = decoded
    next()
}

const fetchAccessTokenFromPaypal = async () => new Promise((resolve, reject) => {
    const options = {
        method: 'POST',
        withCredentials: true,
        url: 'https://api-m.paypal.com/v1/oauth2/token',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: 'Basic QWFWa25NeHE1STY4TlU0ajJ6LUdJTk5keFBoMXc5RlhWcHc4N2x2bUpUb0FycTVBQU9hUllOdC0zZWxMWmo3LWlxMVNIY0pBdEFOQXllVVo6RU1tNUhEbHdiU0wtamo2bTdBcUpPY2Z0TUtydk9Id1JfQkR6bGNsTkZjaTlnbEs1R3JxWmZ6X3Q5U3JsYURkYXZITjhhVTdEOG53SEpqNi0='
        },
        auth: {
            username: "AaVknMxq5I68NU4j2z-GINNdxPh1w9FXVpw87lvmJToArq5AAOaRYNt-3elLZj7-iq1SHcJAtANAyeUZ",
            password: "EMm5HDlwbSL-jj6m7AqJOcftMKrvOHwR_BDzlclNFci9glK5GrqZfz_t9SrlaDdavHN8aU7D8nwHJj6-"
        },
        data: querystring.stringify({ 'grant_type': 'client_credentials' })
    };

    axios.request(options).then(function (response) {
        resolve(response.data.access_token);
    }).catch(function (error) {
        reject(error);
    });
})

const routes = async (client) => {
    const db = await client.db("WellAutoWashers")

    if (app.get('env') === 'production') {
        app.set('trust proxy', 1) // trust first proxy
        // sess.cookie.secure = true // serve secure cookies
    }

    // Routes
    app.use('/health', (req, res) => {
        res.send({ status: "ok" })
    });

    app.get('/activeOrder', function (req, res) {
        res.send(req.session);
    });

    app.get("/api/session", (req, res) => {
        res.json({
            clientID: req.session.clientID,
            activeOrder: req.session.activeOrder,
            // any other session data you want to retrieve
        });
    });

    // Endpoint to serve the configuration file
    app.get("/auth_config.json", (req, res) => {
        res.sendFile(join(__dirname, "auth_config.json"));
    });

    // authMiddleware
    app.get('/jobs', (req, res) => {
        db.collection('jobs').find({
            deleted: false
        }).toArray(function (err, result) {
            if (err) throw err

            res.send(result.map(job => {
                // if (req.auth.role != "Owner") {
                //     delete job.price
                //     delete job.paid
                // }
                return job
            }))
        })
    });

    app.get('/jobs/:id', authMiddleware, (req, res) => {
        db.collection('jobs').findOne({
            _id: ObjectId(req.params.id),
            deleted: false
        }, function (err, result) {
            if (err) throw err

            res.send(result)
        })
    });

    app.post('/jobs', (req, res) => {
        Object.assign(req.body, {
            deleted: false
        })

        db.collection('jobs').insertOne(req.body, function (err, result) {
            if (err) throw err

            res.send(result)
        })
    });

    app.patch('/jobs/:id', async (req, res) => {
        try {
            let jobId = req.params.id;
            // check if id provided is 'null'
            if (jobId === 'null') {
                jobId = new ObjectId();
            }
            // Find the job by its id, if it exists
            const job = await db.collection('jobs').findOne({
                _id: ObjectId(jobId),
                deleted: false
            });
            if (!job) {
                const newJobData = Object.assign(req.body, { _id: ObjectId(jobId), deleted: false });
                const newJob = await db.collection('jobs').insertOne(newJobData);
                return res.status(201).send({ id: jobId });
            }
            // update job
            const updatedJob = await db.collection('jobs').update(
                { _id: ObjectId(jobId) },
                { $set: req.body },
                { upsert: true }
            );

            if (req.body.saved === true) {
                sms
            } else {
                req.session.activeOrder = req.body
            }
            res.status(200).send({ id: jobId });
        } catch (err) {
            console.log(err);
            res.status(500).send({ message: 'Server error' });
        }
    });



    app.delete('/jobs/:id', authMiddleware, (req, res) => {
        db.collection('jobs').updateOne({ _id: ObjectId(req.params.id) }, { $set: { deleted: true } }, function (err, result) {
            if (err) throw err

            res.send(result)
        })
    });

    // user mannagement
    app.post('/users', (req, res) => {

        db.collection('users').findOne({ id: req.body.id }, function (err, result) {
            console.log(result)

            if (!result) {
                // check if error is a "not found error"
                db.collection('users').updateOne({ id: req.body.id }, { $set: req.body, }, { upsert: true }, function (err, result) {
                    if (err) throw err

                    res.send(result)
                })
            } else if (result) {

                db.collection('users').updateOne({ id: req.body.id }, { $set: req.body, }, { upsert: true }, function (err, _) {
                    if (err) throw err

                    var token = jwt.sign(result, JWT_TOKEN);

                    console.log({
                        user: result,
                        token
                    })

                    res.send({
                        user: result,
                        token
                    })
                })
            }
        })
    });

    app.get('/users', authMiddleware, (req, res) => {
        // if (req.auth.role != "Owner")
        //     res.status(401).send([])

        db.collection('users').find({
            // deleted: false
        }).toArray(function (err, result) {
            if (err) throw err

            res.send(result)
        })
    });

    app.get('/users/:email', authMiddleware, (req, res) => {
        db.collection('users').findOne({ email: req.params.email, deleted: false }, function (err, result) {
            if (err) throw err
            res.send(result)
        })
    });

    app.patch('/users/:email', authMiddleware, (req, res) => {
        db.collection('users').updateOne({ email: req.params.email }, { $set: req.body }, function (err, result) {
            if (err) throw err

            res.send(result)
        })
    });

    app.delete('/users/:email', authMiddleware, (req, res) => {
        db.collection('users').findOne({ email: req.params.email }, function (err, result) {
            if (err) throw err

            db.collection('users').updateOne({ email: req.params.email }, { $set: { deleted: !result.deleted } }, function (err, result) {
                if (err) throw err

                res.send(result)
            })
        })


    });

    app.patch('/users/role/:email', authMiddleware, (req, res) => {
        db.collection('user_roles').updateOne(
            { id: req.params.email },
            { $set: req.body },
            { upsert: true },
            function (err, result) {
                if (err) throw err

                res.send(result)
            })
    });

    app.post('/payments', async (req, res) => {
        // find job, find what we billed the client
        // get an access token from paypal
        // send api request to capture the paymant as final
        const paymentData = req.body
        db.collection('payments').insertOne(paymentData, function (err, paymentInsertRes) {
            if (err) throw err
            console.log("inserted payment", paymentInsertRes)

            db.collection('jobs').findOne({ id: req.body.jobID }, async function (err, job) {
                if (err) throw err
                console.log("found job", job)
                const access_token = await fetchAccessTokenFromPaypal()

                console.log("Got access token - ", access_token)
                // capture the transaction
                const options = {
                    method: 'POST',
                    url: `https://api-m.paypal.com/v1/payments/authorization/${paymentData.authorizationID}/capture`,
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${access_token}`
                    },
                    data: { amount: { currency: 'USD', total: 0.01 }, is_final_capture: true }
                };

                axios.request(options).then(function (response) {
                    console.log("CAPTURERED TRANSACTION!!!", response.data);

                    db.collection('payments').updateOne({ _id: paymentInsertRes.insertedId }, { $set: { paypalCaptureInfo: response.data } }, function (err, paymentUpdateRes) {
                        if (err) throw err
                        console.log("updating capture res", paymentUpdateRes)
                    })
                }).catch(function (error) {
                    console.error(error.data);
                });
            })

            res.send(paymentInsertRes)
        })
    });


    // Set S3 endpoint to DigitalOcean Spaces
    const spacesEndpoint = new aws.Endpoint('fra1.digitaloceanspaces.com');
    const s3 = new aws.S3({
        endpoint: spacesEndpoint
    });

    const upload = multer({
        storage: multerS3({
            s3: s3,
            bucket: 'temp-uploads-storage',
            acl: 'public-read',
            key: function (request, file, cb) {
                console.log(file);
                cb(null, file.originalname);
            }
        })
    }).array('upload', 1);


    app.post('/upload', function (request, response, next) {
        upload(request, response, function (error) {
            if (error) {
                console.log(error);
                return response.status(500).send(error)
            }
            console.log('File uploaded successfully.');
            response.send({
                status: "OK"
            })

        });
    });
}

const PORT = process.env.PORT || 8002;

async function main() {
    const { DB_URL = '' } = process.env
    const uri = DB_URL;

    if (DB_URL === '') {
        throw 'Mongo url missing'
    }

    const client = new MongoClient(uri);

    try {
        // Connect to the MongoDB cluster
        await client.connect();

        // Make the appropriate DB calls
        routes(client)
        app.listen(PORT, console.log(`Server started on port ${PORT}`));
    } catch (e) {
        console.error(e);
    } finally {
        // await client.close();
    }
}

main().catch(console.error);