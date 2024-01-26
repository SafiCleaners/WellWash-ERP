require('dotenv').config()

const { NODE_ENV, BUGSNUG_API_KEY } = process.env
const express = require('express');
const cors = require('cors');
const moment = require('moment');
const aws = require('aws-sdk');
const morgan = require('morgan');
const multer = require('multer');
const multerS3 = require('multer-s3');
const axios = require('axios')
aws.config.loadFromPath('./creds.json');
var jwt = require('jsonwebtoken');
var querystring = require('querystring');
const { join } = require("path");
const YAML = require('json-to-pretty-yaml');
const sms = require("./client/utils/sms")
const traderProcess = require('./Trader')


const DeviceDetector = require("device-detector-js");

const app = express();

var { MongoClient, ObjectId } = require('mongodb');
const { error } = require('console');
const { v4: uuidv4 } = require("uuid")
const crypto = require('crypto');

// Express body parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());
app.use(morgan(['development', "test"].includes(NODE_ENV) ? 'tiny' : 'combined'))

const session = require('express-session');
const MongoDBStore = require('express-mongodb-session')(session);

var Bugsnag = require('@bugsnag/js')
var BugsnagPluginExpress = require('@bugsnag/plugin-express')

const bugsnagApiKey = BUGSNUG_API_KEY

if (process.env.NODE_ENV == 'production') {
    Bugsnag.start({
        apiKey: bugsnagApiKey,
        plugins: [BugsnagPluginExpress],
        enabledReleaseStages: ['production'],
        // Additional production-specific configuration
        releaseStage: 'production', // Set the release stage explicitly
        appType: 'node', // Set the application type
        appVersion: '1.0.0', // Set the version of your application
        notifyReleaseStages: ['production'], // Specify which release stages should send notifications
        autoDetectErrors: true, // Enable automatic error detection
        maxBreadcrumbs: 20, // Set the maximum number of breadcrumbs to store
        metaData: {
            // Add any additional metadata specific to your production environment
            environment: 'production',
            datacenter: 'us-east-1'
        },
        // ... other production-specific configuration
    });
} else {
    // If not in production, configure Bugsnag for local development or other environments
    Bugsnag.start({
        apiKey: bugsnagApiKey,
        plugins: [BugsnagPluginExpress],
        enabledReleaseStages: ['development', 'staging'],
        // ... other local/development-specific configuration
    });
}

const {
    JWT_TOKEN = 'shhhhh',
    DB_URL,
    DB_NAME
} = process.env


const store = new MongoDBStore({
    uri: `${DB_URL}`,
    collection: 'connect_mongodb_session_test'
});

app.use(require('express-session')({
    secret: 'This is a secret',
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
    },
    genid: function (req) {
        return uuidv4() // use UUIDs for session IDs
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

const logActivity = (db, entity, action, before, after, userId, userTitle, user, createdAtDateTime, createdAtTimestamp, createdAtFormatted) => {
    db.collection('activity_log').insertOne({
        entity, action, before, after, userId, userTitle, user, createdAtDateTime, createdAtTimestamp, createdAtFormatted,
        deleted: false,
    });
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
    const db = await client.db(DB_NAME || "WellAutoWashers")

    if (app.get('env') === 'production') {
        app.set('trust proxy', 1) // trust first proxy
        // sess.cookie.secure = true // serve secure cookies
    }

    function userAuthMiddleware(req, res, next) {
        // Extract the user ID from the authorization header
        const userId = req.headers.authorization;
        // Check if the user is logged in
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized: User is not logged in" });
        }
        // Increment the login count for the user
        db.collection('user-tracking').updateOne({ userId }, { $inc: { loginCount: 1 } }, { upsert: true })
        // Attach the user ID to the request object
        req.userId = userId;
        next();
    }

    function userTrackingMiddleware(req, res, next) {
        // Extract the user ID from the authorization header
        const userId = req.headers.authorization;
        // Extract other relevant information from the req object
        const { method, url, body, headers } = req;
        // Increment the count of access for the user
        db.collection('user-tracking').updateOne({ userId }, { $inc: { count: 1 } }, { upsert: true })
        // Insert the request information as a new document in the "user-tracking" collection
        db.collection('user-tracking').insertOne({ userId, method, url, body, headers, timestamp: new Date() });
        next();
    }

    function userBlockedMiddleware(req, res, next) {
        // Extract the token from the headers
        const token = req.headers.authorization;
        try {
            // Verify the token
            const decoded = jwt.verify(token, JWT_TOKEN);
            // Extract the user's id from the token
            const { _id: userId } = decoded;
            // Find the user in the database
            db.collection('users').findOne({ _id: ObjectId(userId) }, function (err, user) {
                if (err) throw err;
                // Check if the user is blocked
                if (user?.deleted) {
                    return res.status(403).json({ message: "Forbidden: User is blocked" });
                }
                // Attach the user to the request object
                req.user = user;
                next();
            });
        } catch (err) {
            return res.status(401).json({ message: "Unauthorized: Invalid token" });
        }
    }

    // This must be the first piece of middleware in the stack.
    // It can only capture errors in downstream middleware
    app.use(Bugsnag.getPlugin('express').requestHandler)

    /* all other middleware and application routes go here */
    const importantMiddleWares = [userAuthMiddleware, userBlockedMiddleware, userTrackingMiddleware]

    app.use(userTrackingMiddleware)

    // Routes
    app.use('/health', (req, res) => {
        res.send({ status: "ok" })
    });

    // Endpoint to serve the configuration file
    app.get("/auth_config.json", (req, res) => {
        res.sendFile(join(__dirname, "auth_config.json"));
    });

    // authMiddleware
    app.get('/jobs', importantMiddleWares, (req, res) => {
        db.collection('jobs').find({
            deleted: false
        }).toArray(function (err, result) {
            if (err) throw err;

            res.send(result.map(job => {
                // Masking the job.phone field
                if (job.phone) {
                    const maskedPhoneNumber = job.phone.substring(0, 2) + '**' + job.phone.substring(4);
                    job.phone = maskedPhoneNumber;
                }

                // Additional privacy considerations can be added here

                job.createdAt = job._id.getTimestamp();
                return job;
            }));
        });
    });


    app.get('/jobs/:id', importantMiddleWares, (req, res) => {
        let objectId;
        try {
            objectId = ObjectId(req.params.id);
        } catch (error) {
            // The given id is not a valid BSON ObjectId
            objectId = null;
        }

        db.collection('jobs').findOne({
            $or: [
                { _id: objectId },
                { shortId: req.params.id }
            ],
            deleted: false
        }, function (err, result) {
            if (err) throw err

            if (result) {
                result.createdAt = result._id.getTimestamp();
                res.send(result);
            } else {
                res.status(404).send({ message: "Job not found" });
            }
        });
    });


    app.get('/jobs/shortId/:shortId', importantMiddleWares, (req, res) => {
        db.collection('jobs').findOne({
            shortId: req.params.shortId,
            deleted: false
        }, function (err, result) {
            if (err) throw err

            result.createdAt = result._id.getTimestamp()
            res.send(result)
        })
    });

    app.get('/jobs/findByGoogleId/:googleId', importantMiddleWares, (req, res) => {
        db.collection('jobs').find({
            googleId: req.params.googleId,
            deleted: false
        }).toArray(function (err, result) {
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

    app.post('/track-refferals', async (req, res) => {
        // generate a short ID
        const shortId = crypto.randomBytes(2).toString('hex').toUpperCase();
        // console.log(shortId);
        // console.log(shortId); // output: "9a2b7c"
        const { REFFERAL_CODE, DISCOUNT_CODE } = req.body;

        const deviceDetector = new DeviceDetector();
        const device = deviceDetector.parse(req.headers['user-agent']);

        const newJobData = Object.assign(req.body, {
            _id: new ObjectId(),
            deleted: false,
            shortId,
            device
        });

        const trackData = {
            shortId,
            jobId: newJobData._id,
            timestamp: Date.now().toLocaleString(),
            REFFERAL_CODE,
            DISCOUNT_CODE
        };

        // console.log({ newJobData, trackData })
        db.collection('jobs').insertOne(newJobData);
        db.collection('track').insertOne(trackData)

        delete newJobData._id
        delete newJobData.jobId

        const message = YAML.stringify({ newJobData, trackData })
        // console.log(message.length, message)
        sms({
            phone: "+254711657108",
            message
        }, console.log)
        return res.status(201).send(newJobData);
    });

    app.patch('/jobs/:id', importantMiddleWares, async (req, res) => {
        const deviceDetector = new DeviceDetector();
        const device = deviceDetector.parse(req.headers['user-agent']);

        req.session.activeOrder = req.body;

        try {
            let jobId = req.params.id;
            if (jobId === 'null') {
                jobId = new ObjectId();
            }

            const job = await db.collection('jobs').findOne({
                _id: ObjectId(jobId),
                deleted: false
            });

            if (!job) {
                const shortId = crypto.randomBytes(2).toString('hex').toUpperCase();

                const newJobData = Object.assign(req.body, {
                    _id: ObjectId(jobId),
                    deleted: false,
                    shortId,
                    device
                });

                const updatedJob = await db.collection('jobs').updateOne(
                    { _id: ObjectId(jobId) },
                    { $set: Object.assign(newJobData, { device }) },
                    { upsert: true }
                );

                // console.log(updatedJob)

                res.status(201).send({ id: jobId, jobUrl: newJobData.orderUrl });
            } else {
                const updatedJob = await db.collection('jobs').updateOne(
                    { _id: ObjectId(jobId) },
                    { $set: Object.assign(req.body, { device }) },
                    { upsert: true }
                );

                // console.log(updatedJob)

                const selectedItems = [];
                if (req.body.curtainsAmount > 0) {
                    selectedItems.push(`${req.body.curtainsAmount} Curtains`);
                }

                if (req.body.blanketsAmount > 0) {
                    selectedItems.push(`${req.body.blanketsAmount} Blankets`);
                }

                if (req.body.duvetsAmount > 0) {
                    selectedItems.push(`${req.body.duvetsAmount} Duvets`);
                }

                if (req.body.generalKgsAmount > 0) {
                    selectedItems.push(`${req.body.generalKgsAmount} Kgs of General Clothes`);
                }

                if (req.body.shoesAmount > 0) {
                    selectedItems.push(`${req.body.shoesAmount} Pairs of Shoes`);
                }

                const totalCost = (req.body.curtainsAmount || 0) * (req.body.curtainsCharge || 0) +
                    (req.body.blanketsAmount || 0) * (req.body.blanketsCharge || 0) +
                    (req.body.duvetsAmount || 0) * (req.body.duvetsCharge || 0) +
                    (req.body.generalKgsAmount || 0) * (req.body.generalKgsCharge || 0) +
                    (req.body.shoesAmount || 0) * (req.body.shoesCharge || 0);
                const statusInfo = req.body.statusInfo || [];
                const selectedStatus = statusInfo.length > 0 ? statusInfo[0].status : null;

                // console.log("Received Status:", selectedStatus);
                const customerName = req.body.name
                const pickupTime = req.body.pickupTime
                const dropOffTime = req.body.dropOffTime
                const dropOffDay = req.body.dropOffDay
                const formattedDropOffDay = moment(dropOffDay, 'YYYY-MM-DD').format('Do MMM');

                if (req.body.skipSms) {
                    const statusToMessageMap = {
                        'PICK_UP': `Hi ${customerName}, a quick reminder that we'll pick up your laundry today between ${pickupTime}. Thank you for choosing us!`,
                        'COLLECTED': `Good news, ${customerName}! Your laundry is on its way to us. We'll keep you updated on the progress.
    Order Details:
    ${selectedItems.join('\n')}
    Total Cost: Ksh ${totalCost}
    Payment via Till 8062238.
    Thank you and see you soon!`,
                        'PROCESSING': `Hi there! Your laundry is being processed. We're making sure your clothes come out fresh and clean. Expect your order on ${formattedDropOffDay} between ${dropOffTime}.`,
                        'QUALITY_CHECK': "Your clothes are now going through quality checks and pressing. They'll be ready to go soon.",
                        'DISPATCH': `Your order is on the way! Our delivery personnel will arrive between ${dropOffTime}. We hope you'll be satisfied with our service!`,
                        'DELIVERED': `Your laundry has been delivered! Thanks for choosing us. Your feedback is valuable. Leave a review at [link].`,
                        'BLOCKED': ""
                    };

                    const statusMessage = statusToMessageMap[selectedStatus];
                    if (statusMessage) {

                        // console.log("Sending SMS with status message:", statusMessage);
                        console.log("Phone:", req.body.phone);

                        sms({
                            phone: req.body.phone,
                            message: statusMessage
                        }, (error, response) => {
                            if (error) {
                                console.error("Error sending SMS:", error);
                            } else {
                                console.log("SMS sent successfully:", response);
                            }
                        });
                    }
                    console.log("SMS sent")
                } else {
                    console.log("No sms sent")
                }


                res.status(201).send({ id: jobId, job });
            }
        } catch (err) {
            // console.log(err);
            res.status(500).send({ message: 'Server error' });
        }
    });

    app.get('/jobs-received/:laundryId', importantMiddleWares, (req, res) => {
        const laundryId = req.params.laundryId;
        db.collection('jobs').findOne({ _id: ObjectId(laundryId), deleted: false }, (err, job) => {
            if (err) throw err;
            if (!job) {
                res.status(404).send({ error: "Job not found" });
            } else {
                db.collection('users').findOne({ _id: job.userId }, (err, user) => {
                    if (err) throw err;
                    if (!user) {
                        res.status(404).send({ error: "User not found" });
                    } else {
                        const messages = [
                            "Great news! We've received your laundry order and everything looks good. Your {{duvets}} duvets, {{curtains}} curtains, {{generalLaundry}} kg of general laundry, and {{shoes}} shoes will be cleaned and ready for pickup at {{totalCost}} total cost. We're excited to take care of your laundry needs!",
                            "Your laundry details have been confirmed! Your {{duvets}} duvets, {{curtains}} curtains, {{generalLaundry}} kg of general laundry, and {{shoes}} shoes will be freshly cleaned and cost {{totalCost}} in total. Thanks for choosing us!",
                            "We've got your laundry covered! Your {{duvets}} duvets, {{curtains}} curtains, {{generalLaundry}} kg of general laundry, and {{shoes}} shoes will be cleaned to perfection and the total cost is {{totalCost}}. Looking forward to serving you!",
                            "Your laundry order is confirmed! Your {{duvets}} duvets, {{curtains}} curtains, {{generalLaundry}} kg of general laundry, and {{shoes}} shoes will be expertly cleaned and the total cost is {{totalCost}}. We're excited to provide you with top-notch service!",
                            "We've received your laundry order and are excited to take care of it for you! Your {{duvets}} duvets, {{curtains}} curtains, {{generalLaundry}} kg of general laundry, and {{shoes}} shoes will be cleaned and ready at a total cost of {{totalCost}}. Thanks for choosing us!"
                        ];
                        const message = messages[Math.floor(Math.random() * messages.length)];
                        message.replace("{{duvets}}", job.duvets)
                            .replace("{{curtains}}", job.curtains)
                            .replace("{{generalLaundry}}", job.generalLaundry)
                            .replace("{{shoes}}", job.shoes)
                            .replace("{{totalCost}}", job.totalCost);
                        func({ phone: user.phone, message: message }, console.log);
                        res.send({ message: "SMS sent successfully" });
                    }
                });
            }
        });
    });

    app.get('/jobs-ready/:laundryId', importantMiddleWares, (req, res) => {
        const laundryId = req.params.laundryId;
        db.collection('jobs').findOne({ _id: ObjectId(laundryId), deleted: false }, (err, job) => {
            if (err) throw err;
            if (!job) {
                res.status(404).send({ error: "Job not found" });
            } else {
                db.collection('users').findOne({ _id: job.userId }, (err, user) => {
                    if (err) throw err;
                    if (!user) {
                        res.status(404).send({ error: "User not found" });
                    } else {
                        const messages = [
                            "Great news! Your laundry order with ID of {{orderId}} is ready for delivery. Our bike courier is on the way to bring your fresh and clean laundry to you"
                            , "Your laundry order with ID of {{orderId}} is ready for delivery! Our bike messenger is en route to bring your freshly cleaned laundry to you"
                            , "Your laundry order with ID of {{orderId}} is all set for delivery. Our bike delivery rider is on the way to your location with your freshly cleaned laundry"
                            , "Your laundry order with ID of {{orderId}} is ready for pickup. Our bike courier is en route to bring your freshly cleaned laundry to you"
                            , "Your laundry order with ID of {{orderId}} is ready for pickup. Our bike messenger is on the way to deliver your freshly cleaned laundry to you"];
                        const message = messages[Math.floor(Math.random() * messages.length)];
                        message.replace("{{duvets}}", job.duvets)
                            .replace("{{curtains}}", job.curtains)
                            .replace("{{generalLaundry}}", job.generalLaundry)
                            .replace("{{shoes}}", job.shoes)
                            .replace("{{totalCost}}", job.totalCost);
                        func({ phone: user.phone, message: message }, console.log);
                        res.send({ message: "SMS sent successfully" });
                    }
                });
            }
        });
    });

    app.delete('/jobs/:id', importantMiddleWares, (req, res) => {
        db.collection('jobs').updateOne({ _id: ObjectId(req.params.id) }, { $set: { deleted: true } }, function (err, result) {
            if (err) throw err

            res.send(result)
        })
    });

    // user mannagement
    app.post('/users', (req, res) => {
        const { googleId } = req.body

        db.collection('users').findOne({ googleId }, function (err, result) {
            // console.log(result)

            if (!result) {
                // check if error is a "not found error"
                db.collection('users').updateOne({ googleId }, { $set: req.body, }, { upsert: true }, function (err, result) {
                    if (err) throw err

                    const { upsertedId: id } = result

                    var token = jwt.sign(result, JWT_TOKEN);

                    res.send({
                        user: Object.assign({}, req.body, { id }),
                        token
                    })

                    db.collection('roles').updateOne({ _id: ObjectId(id) }, { $set: { role: 'CLIENT' }, }, { upsert: true }, function (err, result) {
                        if (err) throw err
                    })
                })


            } else if (result) {

                db.collection('roles').findOne({ _id: new ObjectId(result._id) }, function (err, role) {
                    if (err) throw err



                    db.collection('users').updateOne({ googleId }, { $set: req.body, }, { upsert: true }, function (err, _) {
                        if (err) throw err

                        var token = jwt.sign(result, JWT_TOKEN);

                        res.send({
                            user: Object.assign({}, result, {
                                role: role.role
                            }),
                            token
                        })
                    })
                })
            }
        })
    });

    app.patch('/users/roles/:id', importantMiddleWares, (req, res) => {
        db.collection('roles').updateOne({ _id: ObjectId(req.params.id) }, { $set: req.body }, function (err, result) {
            if (err) throw err

            res.send(result)
        })
    });

    app.get('/users', importantMiddleWares, (req, res) => {
        // if (req.auth.role != "Owner")
        //     res.status(401).send([])

        db.collection('users').find({
            // deleted: false
        }).toArray(async function (err, result) {
            if (err) throw err

            const result2 = await Promise.all(result.map(user => new Promise((resolve, reject) => {
                db.collection('roles').findOne({ _id: new ObjectId(user._id) }, function (err, result) {
                    if (err) throw err
                    // res.status(result ? 200 : 404).send(result)
                    user.role = result
                    resolve(user)
                })
            })))

            // console.log(result2)
            res.send(result2)
        })
    });

    app.get('/users/:googleId', (req, res) => {
        // check google if this is a valid user first
        db.collection('users').findOne({ googleId: req.params.googleId, deleted: false }, function (err, result) {
            if (err) throw err
            res.status(result ? 200 : 404).send(result)
        })
    });

    app.patch('/users/:email', importantMiddleWares, (req, res) => {
        db.collection('users').updateOne({ email: req.params.email }, { $set: req.body }, function (err, result) {
            if (err) throw err

            res.send(result)
        })
    });

    app.delete('/users/:email', importantMiddleWares, (req, res) => {
        db.collection('users').findOne({ email: req.params.email }, function (err, result) {
            if (err) throw err

            db.collection('users').updateOne({ email: req.params.email }, { $set: { deleted: !result.deleted } }, function (err, result) {
                if (err) throw err

                res.send(result)
            })
        })


    });

    app.patch('/users/role/:email', importantMiddleWares, (req, res) => {
        db.collection('user_roles').updateOne(
            { id: req.params.email },
            { $set: req.body },
            { upsert: true },
            function (err, result) {
                if (err) throw err

                res.send(result)
            })
    });

    app.post(
        "/otp/send",
        async (req, res) => {
            // console.log(req.body)
            const db = await req.app.locals.db
            const { collections } = db
            const { user } = req.body

            const userSearchingObject = {
                isDeleted: false
            }

            if (validateEmail(user)) {
                Object.assign(userSearchingObject, { email: user })
            } else {
                Object.assign(userSearchingObject, { phone: user })
            }

            const [userInfo] = await collections["users"].find(userSearchingObject)

            if (!userInfo) {
                return res.status(401).send({
                    success: false,
                })
            }

            // generate OTP, send it and save it
            const password = ['development', "test"].includes(NODE_ENV) ? '0000' : makeid()

            const otpSaveInfo = await collections["otp"].create({
                id: new ObjectId().toHexString(),
                user: userInfo.id,
                password
            })

            // console.log({ otpSaveInfo })

            // send sms to phone
            if (!['development', "test"].includes(NODE_ENV)) {
                return sms({
                    // school: schoolId,
                    data: { message: `Shule-Plus Code: ${password}.`, phone: user }
                }, ({ code }) => {
                    res.send({
                        success: true,
                        otp: code
                    })
                })
            }

            return res.send({
                success: true,
                otp: `0000 - for development`
            })
        })


    app.post('/payments', async (req, res) => {
        // find job, find what we billed the client
        // get an access token from paypal
        // send api request to capture the paymant as final
        const paymentData = req.body
        db.collection('payments').insertOne(paymentData, function (err, paymentInsertRes) {
            if (err) throw err
            // console.log("inserted payment", paymentInsertRes)

            db.collection('jobs').findOne({ id: req.body.jobID }, async function (err, job) {
                if (err) throw err
                // console.log("found job", job)
                const access_token = await fetchAccessTokenFromPaypal()

                // console.log("Got access token - ", access_token)
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
                    // console.log("CAPTURERED TRANSACTION!!!", response.data);

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

    app.get('/clients-list', importantMiddleWares, (req, res) => {
        // if (req.auth.role != "Owner")
        //     res.status(401).send([])

        db.collection('users').find({
            deleted: false,
        }).toArray(async function (err, result) {
            if (err) throw err

            const users = await Promise.all(result.map(user => new Promise((resolve, reject) => {
                db.collection('roles').findOne({ _id: new ObjectId(user._id) }, function (err, result) {
                    if (err) throw err
                    // res.status(result ? 200 : 404).send(result)
                    user.role = result.role
                    resolve(user)
                })
            })))

            result3 = users.filter((user) => user.role == "CLIENT");

            // console.log(result3)
            res.send(result3)
        })
    });

    app.get('/stores-list', importantMiddleWares, (req, res) => {
        // if (req.auth.role != "Owner")
        //     res.status(401).send([])

        db.collection('stores').find({
            deleted: false,
        }).toArray(async function (err, result) {
            if (err) throw err

            // console.log(result)
            res.send(result)
        })
    });

    app.get('/pricings-list', importantMiddleWares, (req, res) => {
        // if (req.auth.role != "Owner")
        //     res.status(401).send([])

        // const { store } = req.params;

        db.collection('pricings').find({
            // storeId: store,
            deleted: false,
        }).toArray(async function (err, result) {
            if (err) throw err

            // console.log(result)
            res.send(result)
        })
    });

    app.get('/stores', importantMiddleWares, (req, res) => {
        // if (req.auth.role != "Owner")
        //     res.status(401).send([])

        db.collection('stores').find({
            deleted: false,
        }).toArray(async function (err, result) {
            if (err) throw err

            // console.log(result)
            res.send(result)
        })
    });

    app.post('/stores', async (req, res) => {
        const token = req.headers.authorization;
        // Verify the token
        const decoded = jwt.verify(token, JWT_TOKEN);
        // Extract the user's id from the token
        const { _id: userId, name: userTitle } = decoded;

        // Moment
        const dateTime = moment().format('YYYY-MM-DD HH:mm:ss');
        const timestamp = moment(dateTime).unix();
        const formatted = moment(dateTime).format('MMM Do ddd h:mmA');

        const { title, phone, email, address } = req.body;

        try {
            // Try to find an existing entity by title
            let existingEntity = await db.collection('stores').findOne({ title, deleted: false });

            if (existingEntity) {
                // If the entity already exists, update its fields
                var response = await db.collection('stores').updateOne({ title }, {
                    $set: {
                        email, phone, address,
                        updatedAtDateTime: dateTime,
                        updatedAtTimestamp: timestamp,
                        updatedAtFormatted: formatted
                    }
                });
                let updatedEntity = await db.collection('stores').findOne({ title, deleted: false });
                // Log Activity
                logActivity(db, "Store", "UPDATE", existingEntity, updatedEntity, userId, userTitle, decoded, dateTime, timestamp, formatted);

                res.status(200).json({ message: 'Store updated successfully' });
            } else {
                // If the entity doesn't exist, insert a new one
                var response = await db.collection('stores').insertOne({
                    title, email, phone, address, userId, userTitle,
                    user: decoded,
                    createdAtDateTime: dateTime,
                    createdAtTimestamp: timestamp,
                    createdAtFormatted: formatted,
                    deleted: false
                });
                let newEntity = await db.collection('stores').findOne({ title, deleted: false });
                // Log Activity
                logActivity(db, "Store", "CREATE", {}, newEntity, userId, userTitle, decoded, dateTime, timestamp, formatted);

                res.status(201).json({ message: 'Store created successfully' });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.delete('/stores/:id', importantMiddleWares, async (req, res) => {
        const token = req.headers.authorization;
        // Verify the token
        const decoded = jwt.verify(token, JWT_TOKEN);
        // Extract the user's id from the token
        const { _id: userId, name: userTitle } = decoded;

        const { id } = req.params;

        // Moment
        const dateTime = moment().format('YYYY-MM-DD HH:mm:ss');
        const timestamp = moment(dateTime).unix();
        const formatted = moment(dateTime).format('MMM Do ddd h:mmA');

        try {
            let existingEntity = await db.collection('stores').findOne({ _id: new ObjectId(id), deleted: false });

            let response = await db.collection('stores').updateOne({ _id: new ObjectId(id) }, {
                $set: {
                    deleted: true,
                    deletedAtDateTime: dateTime,
                    deletedAtTimestamp: timestamp,
                    deletedAtFormatted: formatted
                }
            });
            let updatedEntity = await db.collection('stores').findOne({ _id: new ObjectId(id), deleted: true });
            // Log Activity
            logActivity(db, "Store", "DELETE", existingEntity, updatedEntity, userId, userTitle, decoded, dateTime, timestamp, formatted);

            res.status(204).json({ message: 'Store deleted successfully' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.get('/categories', importantMiddleWares, (req, res) => {
        // if (req.auth.role != "Owner")
        //     res.status(401).send([])

        db.collection('categories').find({
            deleted: false,
        }).toArray(async function (err, result) {
            if (err) throw err

            // console.log(result)
            res.send(result)
        })
    });

    app.post('/categories', async (req, res) => {
        const token = req.headers.authorization;
        // Verify the token
        const decoded = jwt.verify(token, JWT_TOKEN);
        // Extract the user's id from the token
        const { _id: userId, name: userTitle } = decoded;

        // Moment
        const dateTime = moment().format('YYYY-MM-DD HH:mm:ss');
        const timestamp = moment(dateTime).unix();
        const formatted = moment(dateTime).format('MMM Do ddd h:mmA');

        const { title, store: storeId, unit, cost } = req.body;

        try {
            // Try to find an existing entity by title
            let existingEntity = await db.collection('categories').findOne({ title, storeId: new ObjectId(storeId), deleted: false });

            // Try to find store
            let storeTitle;
            let store;
            // console.log(storeId);
            let storeEntity = await db.collection('stores').findOne({ _id: new ObjectId(storeId), deleted: false });
            // console.log(storeEntity);
            if (storeEntity) {
                storeTitle = storeEntity.title;
                store = storeEntity;
            }

            if (existingEntity) {
                // If the entity already exists, update its fields
                var response = await db.collection('categories').updateOne({ title }, {
                    $set: {
                        unit, cost, storeId, storeTitle, store,
                        updatedAtDateTime: dateTime,
                        updatedAtTimestamp: timestamp,
                        updatedAtFormatted: formatted
                    }
                });
                let updatedEntity = await db.collection('categories').findOne({ title, deleted: false });
                // Log Activity
                logActivity(db, "Categories", "UPDATE", existingEntity, updatedEntity, userId, userTitle, decoded, dateTime, timestamp, formatted);

                res.status(200).json({ message: 'Pricing Categories updated successfully' });
            } else {
                // If the entity doesn't exist, insert a new one
                var response = await db.collection('categories').insertOne({
                    title, unit, cost, userId, userTitle,
                    storeId, storeTitle, store,
                    user: decoded,
                    createdAtDateTime: dateTime,
                    createdAtTimestamp: timestamp,
                    createdAtFormatted: formatted,
                    deleted: false
                });
                let newEntity = await db.collection('categories').findOne({ title, deleted: false });
                // Log Activity
                logActivity(db, "Pricing", "CREATE", {}, newEntity, userId, userTitle, decoded, dateTime, timestamp, formatted);

                res.status(201).json({ message: 'Pricing Categories created successfully' });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.patch('/categories/:id', importantMiddleWares, async (req, res) => {
        const token = req.headers.authorization;
        // Verify the token
        const decoded = jwt.verify(token, JWT_TOKEN);
        // Extract the user's id from the token
        const { _id: userId, name: userTitle } = decoded;

        const { id } = req.params;
        const { title, unit, cost } = req.body;

        // Moment
        const dateTime = moment().format('YYYY-MM-DD HH:mm:ss');
        const timestamp = moment(dateTime).unix();
        const formatted = moment(dateTime).format('MMM Do ddd h:mmA');

        try {
            let existingEntity = await db.collection('categories').findOne({ _id: new ObjectId(id), deleted: false });

            let response = await db.collection('categories').updateOne(
                { _id: ObjectId(id) },
                {
                    $set: {
                        title, unit, cost,
                        updatedAtDateTime: dateTime,
                        updatedAtTimestamp: timestamp,
                        updatedAtFormatted: formatted
                    }
                },
                { upsert: true });
            let updatedEntity = await db.collection('categories').findOne({ _id: new ObjectId(id), deleted: false });
            // Log Activity
            logActivity(db, "Categories", "UPDATE", existingEntity, updatedEntity, userId, userTitle, decoded, dateTime, timestamp, formatted);

            res.status(200).json({ message: 'Price Categories updated successfully' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.patch('/categories/:id', importantMiddleWares, async (req, res) => {
        const token = req.headers.authorization;
        // Verify the token
        const decoded = jwt.verify(token, JWT_TOKEN);
        // Extract the user's id from the token
        const { _id: userId, name: userTitle } = decoded;

        const { id } = req.params;
        const { title, unit, cost } = req.body;

        // Moment
        const dateTime = moment().format('YYYY-MM-DD HH:mm:ss');
        const timestamp = moment(dateTime).unix();
        const formatted = moment(dateTime).format('MMM Do ddd h:mmA');

        try {
            let existingEntity = await db.collection('categories').findOne({ _id: new ObjectId(id), deleted: false });

            let response = await db.collection('categories').updateOne(
                { _id: ObjectId(id) },
                {
                    $set: {
                        title, unit, cost,
                        updatedAtDateTime: dateTime,
                        updatedAtTimestamp: timestamp,
                        updatedAtFormatted: formatted
                    }
                },
                { upsert: true });
            let updatedEntity = await db.collection('categories').findOne({ _id: new ObjectId(id), deleted: false });
            // Log Activity
            logActivity(db, "Categories", "UPDATE", existingEntity, updatedEntity, userId, userTitle, decoded, dateTime, timestamp, formatted);

            res.status(200).json({ message: 'Category updated successfully' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });


    app.delete('/categories/:id', importantMiddleWares, async (req, res) => {
        const token = req.headers.authorization;
        // Verify the token
        const decoded = jwt.verify(token, JWT_TOKEN);
        // Extract the user's id from the token
        const { _id: userId, name: userTitle } = decoded;

        const { id } = req.params;

        // Moment
        const dateTime = moment().format('YYYY-MM-DD HH:mm:ss');
        const timestamp = moment(dateTime).unix();
        const formatted = moment(dateTime).format('MMM Do ddd h:mmA');

        try {
            let existingEntity = await db.collection('categories').findOne({ _id: new ObjectId(id), deleted: false });

            let response = await db.collection('categories').updateOne({ _id: new ObjectId(id) }, {
                $set: {
                    deleted: true,
                    deletedAtDateTime: dateTime,
                    deletedAtTimestamp: timestamp,
                    deletedAtFormatted: formatted
                }
            });
            let updatedEntity = await db.collection('categories').findOne({ _id: new ObjectId(id), deleted: true });
            // Log Activity
            logActivity(db, "Pricing", "DELETE", existingEntity, updatedEntity, userId, userTitle, decoded, dateTime, timestamp, formatted);

            res.status(204).json({ message: 'Category deleted successfully' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.get('/pricings', importantMiddleWares, (req, res) => {
        // if (req.auth.role != "Owner")
        //     res.status(401).send([])

        db.collection('pricings').find({
            deleted: false,
        }).toArray(async function (err, result) {
            if (err) throw err

            // console.log(result)
            res.send(result)
        })
    });

    app.get('/expenses', importantMiddleWares, (req, res) => {
        // if (req.auth.role != "Owner")
        //     res.status(401).send([])

        db.collection('expenses').find({
            deleted: false,
        }).toArray(async function (err, result) {
            if (err) throw err

            // console.log(result)
            res.send(result)
        })
    });

    app.post('/pricings', async (req, res) => {
        const token = req.headers.authorization;
        // Verify the token
        const decoded = jwt.verify(token, JWT_TOKEN);
        // Extract the user's id from the token
        const { _id: userId, name: userTitle } = decoded;

        // Moment
        const dateTime = moment().format('YYYY-MM-DD HH:mm:ss');
        const timestamp = moment(dateTime).unix();
        const formatted = moment(dateTime).format('MMM Do ddd h:mmA');

        const { title, category, store: storeId, unit, cost } = req.body;

        try {
            // Try to find an existing entity by title
            let existingEntity = await db.collection('pricings').findOne({ title, storeId: new ObjectId(storeId), deleted: false });

            // Try to find store
            let storeTitle;
            let store;
            // console.log(storeId);
            let storeEntity = await db.collection('stores').findOne({ _id: new ObjectId(storeId), deleted: false });
            // console.log(storeEntity);
            if (storeEntity) {
                storeTitle = storeEntity.title;
                store = storeEntity;
            }

            if (existingEntity) {
                // If the entity already exists, update its fields
                var response = await db.collection('pricings').updateOne({ title }, {
                    $set: {
                        unit, cost, storeId, storeTitle, store, category,
                        updatedAtDateTime: dateTime,
                        updatedAtTimestamp: timestamp,
                        updatedAtFormatted: formatted
                    }
                });
                let updatedEntity = await db.collection('pricings').findOne({ title, deleted: false });
                // Log Activity
                logActivity(db, "Pricing", "UPDATE", existingEntity, updatedEntity, userId, userTitle, decoded, dateTime, timestamp, formatted);

                res.status(200).json({ message: 'Pricing updated successfully' });
            } else {
                // If the entity doesn't exist, insert a new one
                var response = await db.collection('pricings').insertOne({
                    title, unit, cost, userId, userTitle,
                    storeId, storeTitle, store, category,
                    user: decoded,
                    createdAtDateTime: dateTime,
                    createdAtTimestamp: timestamp,
                    createdAtFormatted: formatted,
                    deleted: false
                });
                let newEntity = await db.collection('pricings').findOne({ title, deleted: false });
                // Log Activity
                logActivity(db, "Pricing", "CREATE", {}, newEntity, userId, userTitle, decoded, dateTime, timestamp, formatted);

                res.status(201).json({ message: 'Pricing created successfully' });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.post('/expenses', async (req, res) => {
        const token = req.headers.authorization;
        // Verify the token
        const decoded = jwt.verify(token, JWT_TOKEN);
        // Extract the user's id from the token
        const { _id: userId, name: userTitle } = decoded;

        // Moment
        const dateTime = moment().format('YYYY-MM-DD HH:mm:ss');
        const timestamp = moment(dateTime).unix();
        const formatted = moment(dateTime).format('MMM Do ddd h:mmA');

        const { title, category, store: storeId, unit, cost, recurrent, businessDate } = req.body;

        try {
            // Try to find an existing entity by title
            let existingEntity = await db.collection('expenses').findOne({ title, storeId: new ObjectId(storeId), businessDate, deleted: false });

            // Try to find store
            let storeTitle;
            let store;
            // console.log(storeId);
            let storeEntity = await db.collection('stores').findOne({ _id: new ObjectId(storeId), deleted: false });
            // console.log(storeEntity);
            if (storeEntity) {
                storeTitle = storeEntity.title;
                store = storeEntity;
            }

            if (existingEntity) {
                // If the entity already exists, update its fields
                var response = await db.collection('expenses').updateOne({ title }, {
                    $set: {
                        ...req.body,
                        updatedAtDateTime: dateTime,
                        updatedAtTimestamp: timestamp,
                        updatedAtFormatted: formatted
                    }
                });
                let updatedEntity = await db.collection('expenses').findOne({ title, deleted: false });
                // Log Activity
                logActivity(db, "Expenses", "UPDATE", existingEntity, updatedEntity, userId, ...req.body, userTitle, decoded, dateTime, timestamp, formatted);

                res.status(200).json({ message: 'Expenses updated successfully' });
            } else {
                // If the entity doesn't exist, insert a new one
                var response = await db.collection('expenses').insertOne({
                    ...req.body,
                    user: decoded,
                    createdAtDateTime: dateTime,
                    createdAtTimestamp: timestamp,
                    createdAtFormatted: formatted,
                    deleted: false
                });
                let newEntity = await db.collection('expenses').findOne({ title, deleted: false });
                // Log Activity
                logActivity(db, "Pricing", "CREATE", {}, newEntity, userId, ...Object.values(req.body), userTitle, decoded, dateTime, timestamp, formatted);

                res.status(201).json({ message: 'Expense created successfully' });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.patch('/pricings/:id', importantMiddleWares, async (req, res) => {
        const token = req.headers.authorization;
        // Verify the token
        const decoded = jwt.verify(token, JWT_TOKEN);
        // Extract the user's id from the token
        const { _id: userId, name: userTitle } = decoded;

        const { id } = req.params;
        const { title, unit, cost } = req.body;

        // Moment
        const dateTime = moment().format('YYYY-MM-DD HH:mm:ss');
        const timestamp = moment(dateTime).unix();
        const formatted = moment(dateTime).format('MMM Do ddd h:mmA');

        try {
            let existingEntity = await db.collection('pricings').findOne({ _id: new ObjectId(id), deleted: false });

            let response = await db.collection('pricings').updateOne(
                { _id: ObjectId(id) },
                {
                    $set: {
                        title, unit, cost,
                        updatedAtDateTime: dateTime,
                        updatedAtTimestamp: timestamp,
                        updatedAtFormatted: formatted
                    }
                },
                { upsert: true });
            let updatedEntity = await db.collection('pricings').findOne({ _id: new ObjectId(id), deleted: false });
            // Log Activity
            logActivity(db, "Pricing", "UPDATE", existingEntity, updatedEntity, userId, userTitle, decoded, dateTime, timestamp, formatted);

            res.status(200).json({ message: 'Pricing updated successfully' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.patch('/expenses/:id', importantMiddleWares, async (req, res) => {
        const token = req.headers.authorization;
        // Verify the token
        const decoded = jwt.verify(token, JWT_TOKEN);
        // Extract the user's id from the token
        const { _id: userId, name: userTitle } = decoded;

        const { id } = req.params;


        // Moment
        const dateTime = moment().format('YYYY-MM-DD HH:mm:ss');
        const timestamp = moment(dateTime).unix();
        const formatted = moment(dateTime).format('MMM Do ddd h:mmA');

        try {
            let existingEntity = await db.collection('expenses').findOne({ _id: new ObjectId(id), deleted: false });

            let response = await db.collection('expenses').updateOne(
                { _id: ObjectId(id) },
                {
                    $set: {
                        ...req.body,
                        updatedAtDateTime: dateTime,
                        updatedAtTimestamp: timestamp,
                        updatedAtFormatted: formatted
                    }
                },
                { upsert: true });
            let updatedEntity = await db.collection('expenses').findOne({ _id: new ObjectId(id), deleted: false });
            // Log Activity
            logActivity(db, "Pricing", "UPDATE", existingEntity, updatedEntity, ...Object.values(req.body), decoded, dateTime, timestamp, formatted);

            res.status(200).json({ message: 'Expense updated successfully' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.delete('/pricings/:id', importantMiddleWares, async (req, res) => {
        const token = req.headers.authorization;
        // Verify the token
        const decoded = jwt.verify(token, JWT_TOKEN);
        // Extract the user's id from the token
        const { _id: userId, name: userTitle } = decoded;

        const { id } = req.params;

        // Moment
        const dateTime = moment().format('YYYY-MM-DD HH:mm:ss');
        const timestamp = moment(dateTime).unix();
        const formatted = moment(dateTime).format('MMM Do ddd h:mmA');

        try {
            let existingEntity = await db.collection('pricings').findOne({ _id: new ObjectId(id), deleted: false });

            let response = await db.collection('pricings').updateOne({ _id: new ObjectId(id) }, {
                $set: {
                    deleted: true,
                    deletedAtDateTime: dateTime,
                    deletedAtTimestamp: timestamp,
                    deletedAtFormatted: formatted
                }
            });
            let updatedEntity = await db.collection('pricings').findOne({ _id: new ObjectId(id), deleted: true });
            // Log Activity
            logActivity(db, "Pricing", "DELETE", existingEntity, updatedEntity, userId, userTitle, decoded, dateTime, timestamp, formatted);

            res.status(204).json({ message: 'Pricing deleted successfully' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.delete('/expenses/:id', importantMiddleWares, async (req, res) => {
        const token = req.headers.authorization;
        // Verify the token
        const decoded = jwt.verify(token, JWT_TOKEN);
        // Extract the user's id from the token
        const { _id: userId, name: userTitle } = decoded;

        const { id } = req.params;

        // Moment
        const dateTime = moment().format('YYYY-MM-DD HH:mm:ss');
        const timestamp = moment(dateTime).unix();
        const formatted = moment(dateTime).format('MMM Do ddd h:mmA');

        try {
            let existingEntity = await db.collection('expenses').findOne({ _id: new ObjectId(id), deleted: false });

            let response = await db.collection('expenses').updateOne({ _id: new ObjectId(id) }, {
                $set: {
                    deleted: true,
                    deletedAtDateTime: dateTime,
                    deletedAtTimestamp: timestamp,
                    deletedAtFormatted: formatted
                }
            });
            let updatedEntity = await db.collection('expenses').findOne({ _id: new ObjectId(id), deleted: true });
            // Log Activity
            logActivity(db, "Expenses", "DELETE", existingEntity, updatedEntity, userId, userTitle, decoded, dateTime, timestamp, formatted);

            res.status(204).json({ message: 'Expense deleted successfully' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.get('/orders', importantMiddleWares, (req, res) => {
        // if (req.auth.role != "Owner")
        //     res.status(401).send([])

        db.collection('orders').find({
            deleted: false,
        }).toArray(async function (err, result) {
            if (err) throw err

            // console.log(result)
            res.send(result)
        })
    });

    app.post('/orders', async (req, res) => {
        const token = req.headers.authorization;
        // Verify the token
        const decoded = jwt.verify(token, JWT_TOKEN);
        // Extract the user's id from the token
        const { _id: userId, name: userTitle } = decoded;

        // Moment
        const dateTime = moment().format('YYYY-MM-DD HH:mm:ss');
        const timestamp = moment(dateTime).unix();
        const formatted = moment(dateTime).format('MMM Do ddd h:mmA');

        const { storeId, clientId, clientSource, total, tasks } = req.body;
        let tasksCount = 0;
        if (tasks) {
            tasksCount = tasks.length;
        }
        // console.log(req.body);

        try {
            // Try to find client
            let clientTitle;
            // console.log(clientId);
            let clientEntity = await db.collection('users').findOne({ _id: new ObjectId(clientId), deleted: false });
            // console.log(clientEntity);
            if (clientEntity) {
                clientTitle = clientEntity.name;
                client = clientEntity;
            }

            // Try to find store
            let storeTitle;
            let store;
            // console.log(storeId);
            let storeEntity = await db.collection('stores').findOne({ _id: new ObjectId(storeId), deleted: false });
            // console.log(storeEntity);
            if (storeEntity) {
                storeTitle = storeEntity.title;
                store = storeEntity;
            }

            var response = await db.collection('orders').insertOne({
                clientSource, tasks,
                clientId, clientTitle, client,
                storeId, storeTitle, store,
                userId, userTitle, tasksCount,
                totalCost: total,
                user: decoded, progress: 0,
                createdAtDateTime: dateTime,
                createdAtTimestamp: timestamp,
                createdAtFormatted: formatted,
                deleted: false
            }, async (error, result) => {
                if (error) throw error;

                if (result) {
                    const newOrderId = result.insertedId;
                    let newEntity = await db.collection('orders').findOne({ _id: newOrderId, deleted: false });
                    // Log Activity
                    logActivity(db, "Order", "CREATE", {}, newEntity, userId, userTitle, decoded, dateTime, timestamp, formatted);

                    tasks.forEach(async (task) => {
                        let categoryId = task.categoryId;

                        // Try to find pricing
                        let pricingId;
                        let pricingTitle;
                        let pricing;
                        // console.log(categoryId);
                        let pricingEntity = await db.collection('pricings').findOne({ _id: new ObjectId(categoryId), deleted: false });
                        // console.log(pricingEntity);
                        if (pricingEntity) {
                            pricingId = pricingEntity._id;
                            pricingTitle = pricingEntity.title;
                            pricing = clientEntity;
                        }

                        var response = await db.collection('tasks').insertOne({
                            clientSource, tasks,
                            clientId, clientTitle, client,
                            storeId, storeTitle, store,
                            pricingId, pricingTitle, pricing,
                            userId, userTitle,
                            status: "Pending", user: decoded,
                            quantity: task.quantity, description: task.description,
                            cost: task.cost, total: task.total,
                            orderId: newEntity._id, user: decoded,
                            createdAtDateTime: dateTime,
                            createdAtTimestamp: timestamp,
                            createdAtFormatted: formatted,
                            deleted: false
                        }, async (error, result) => {
                            if (error) throw error;

                            if (result) {
                                const newTaskId = result.insertedId;
                                let newTaskEntity = await db.collection('tasks').findOne({ _id: newTaskId, deleted: false });
                                // Log Activity
                                logActivity(db, "Task", "CREATE", {}, newTaskEntity, userId, userTitle, decoded, dateTime, timestamp, formatted);
                            }
                        });
                    });
                }
            });

            res.status(201).json({ message: 'Order created successfully' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.delete('/orders/:id', importantMiddleWares, async (req, res) => {
        const token = req.headers.authorization;
        // Verify the token
        const decoded = jwt.verify(token, JWT_TOKEN);
        // Extract the user's id from the token
        const { _id: userId, name: userTitle } = decoded;

        const { id } = req.params;

        // Moment
        const dateTime = moment().format('YYYY-MM-DD HH:mm:ss');
        const timestamp = moment(dateTime).unix();
        const formatted = moment(dateTime).format('MMM Do ddd h:mmA');

        try {
            let existingEntity = await db.collection('orders').findOne({ _id: new ObjectId(id), deleted: false });

            let response = await db.collection('orders').updateOne({ _id: new ObjectId(id) }, {
                $set: {
                    deleted: true,
                    deletedAtDateTime: dateTime,
                    deletedAtTimestamp: timestamp,
                    deletedAtFormatted: formatted
                }
            });
            let updatedEntity = await db.collection('orders').findOne({ _id: new ObjectId(id), deleted: true });
            // Log Activity
            logActivity(db, "Order", "DELETE", existingEntity, updatedEntity, userId, userTitle, decoded, dateTime, timestamp, formatted);

            res.status(204).json({ message: 'Order deleted successfully' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.get('/tasks', importantMiddleWares, (req, res) => {
        // if (req.auth.role != "Owner")
        //     res.status(401).send([])

        db.collection('tasks').find({
            deleted: false,
        }).toArray(async function (err, result) {
            if (err) throw err

            // console.log(result)
            res.send(result)
        })
    });

    app.delete('/tasks/:id', importantMiddleWares, async (req, res) => {
        const token = req.headers.authorization;
        // Verify the token
        const decoded = jwt.verify(token, JWT_TOKEN);
        // Extract the user's id from the token
        const { _id: userId, name: userTitle } = decoded;

        const { id } = req.params;

        // Moment
        const dateTime = moment().format('YYYY-MM-DD HH:mm:ss');
        const timestamp = moment(dateTime).unix();
        const formatted = moment(dateTime).format('MMM Do ddd h:mmA');

        try {
            let existingEntity = await db.collection('tasks').findOne({ _id: new ObjectId(id), deleted: false });

            let response = await db.collection('tasks').updateOne({ _id: new ObjectId(id) }, {
                $set: {
                    deleted: true,
                    deletedAtDateTime: dateTime,
                    deletedAtTimestamp: timestamp,
                    deletedAtFormatted: formatted
                }
            });
            let updatedEntity = await db.collection('tasks').findOne({ _id: new ObjectId(id), deleted: true });
            // Log Activity
            logActivity(db, "Task", "DELETE", existingEntity, updatedEntity, userId, userTitle, decoded, dateTime, timestamp, formatted);

            res.status(204).json({ message: 'Task deleted successfully' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.post('/status', importantMiddleWares, async (req, res) => {
        const token = req.headers.authorization;
        // Verify the token
        const decoded = jwt.verify(token, JWT_TOKEN);
        // Extract the user's id from the token
        const { _id: userId, name: userTitle } = decoded;

        const { taskId, status } = req.body;

        // Moment
        const dateTime = moment().format('YYYY-MM-DD HH:mm:ss');
        const timestamp = moment(dateTime).unix();
        const formatted = moment(dateTime).format('MMM Do ddd h:mmA');

        try {
            let existingEntity = await db.collection('tasks').findOne({ _id: new ObjectId(taskId), deleted: false });

            let response = await db.collection('tasks').updateOne({ _id: new ObjectId(taskId) }, {
                $set: {
                    status,
                    deletedAtDateTime: dateTime,
                    deletedAtTimestamp: timestamp,
                    deletedAtFormatted: formatted
                }
            });
            let updatedEntity = await db.collection('tasks').findOne({ _id: new ObjectId(taskId), deleted: false });
            // Log Activity
            logActivity(db, "Task", "UPDATE", existingEntity, updatedEntity, userId, userTitle, decoded, dateTime, timestamp, formatted);

            db.collection('statuses').insertOne({
                status,
                taskId: updatedEntity._id,
                orderId: updatedEntity.orderId,
                user: decoded,
                createdAtDateTime: dateTime,
                createdAtTimestamp: timestamp,
                createdAtFormatted: formatted,
                deleted: false
            }, async (error, result) => {
                if (error) throw error;

                if (result) {
                    const newStatusId = result.insertedId;
                    let newStatusEntity = await db.collection('statuses').findOne({ _id: newStatusId, deleted: false });
                    // Log Activity
                    logActivity(db, "Status", "CREATE", {}, newStatusEntity, userId, userTitle, decoded, dateTime, timestamp, formatted);
                }
            });

            res.status(204).json({ message: 'Task status updated successfully' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.get('/brands', importantMiddleWares, (req, res) => {
        // if (req.auth.role != "Owner")
        //     res.status(401).send([])

        db.collection('brands').find({
            deleted: false,
        }).toArray(async function (err, result) {
            if (err) throw err

            // console.log(result)
            res.send(result)
        })
    });

    app.post('/brands', async (req, res) => {
        const token = req.headers.authorization;
        // Verify the token
        const decoded = jwt.verify(token, JWT_TOKEN);
        // Extract the user's id from the token
        const { _id: userId, name: userTitle } = decoded;

        // Moment
        const dateTime = moment().format('YYYY-MM-DD HH:mm:ss');
        const timestamp = moment(dateTime).unix();
        const formatted = moment(dateTime).format('MMM Do ddd h:mmA');

        console.log(req.body)

        const newBrandData = Object.assign(req.body, {
            _id: new ObjectId(),
            deleted: false,
            userId,
            userTitle,
            user: decoded,
            createdAtDateTime: dateTime,
            createdAtTimestamp: timestamp,
            createdAtFormatted: formatted,
        });

        db.collection('brands').insertOne(newBrandData);

        return res.status(201).send(newBrandData);
    });

    app.patch('/brands/:id', importantMiddleWares, async (req, res) => {
        const token = req.headers.authorization;
        // Verify the token
        const decoded = jwt.verify(token, JWT_TOKEN);
        // Extract the user's id from the token
        const { _id: userId, name: userTitle } = decoded;

        const { id } = req.params;

        // Moment
        const dateTime = moment().format('YYYY-MM-DD HH:mm:ss');
        const timestamp = moment(dateTime).unix();
        const formatted = moment(dateTime).format('MMM Do ddd h:mmA');

        const updatedBrandData = Object.assign(req.body, {
            deleted: false,
            userId,
            userTitle,
            user: decoded,
            updatedAtDateTime: dateTime,
            updatedAtTimestamp: timestamp,
            updatedAtFormatted: formatted,
        });

        try {
            let existingEntity = await db.collection('brands').findOne({ _id: new ObjectId(id), deleted: false });

            let response = await db.collection('brands').updateOne(
                { _id: ObjectId(id) },
                {
                    $set: updatedBrandData,
                },
                { upsert: true });
            let updatedEntity = await db.collection('brands').findOne({ _id: new ObjectId(id), deleted: false });
            // Log Activity
            logActivity(db, "Brand", "UPDATE", existingEntity, updatedEntity, userId, userTitle, decoded, dateTime, timestamp, formatted);

            res.status(200).json({ message: 'Brand updated successfully' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.delete('/brands/:id', importantMiddleWares, async (req, res) => {
        const token = req.headers.authorization;
        // Verify the token
        const decoded = jwt.verify(token, JWT_TOKEN);
        // Extract the user's id from the token
        const { _id: userId, name: userTitle } = decoded;

        const { id } = req.params;

        // Moment
        const dateTime = moment().format('YYYY-MM-DD HH:mm:ss');
        const timestamp = moment(dateTime).unix();
        const formatted = moment(dateTime).format('MMM Do ddd h:mmA');

        try {
            let existingEntity = await db.collection('brands').findOne({ _id: new ObjectId(id), deleted: false });

            let response = await db.collection('brands').updateOne({ _id: new ObjectId(id) }, {
                $set: {
                    deleted: true,
                    deletedAtDateTime: dateTime,
                    deletedAtTimestamp: timestamp,
                    deletedAtFormatted: formatted
                }
            });
            let updatedEntity = await db.collection('brands').findOne({ _id: new ObjectId(id), deleted: true });
            // Log Activity
            logActivity(db, "Brand", "DELETE", existingEntity, updatedEntity, userId, userTitle, decoded, dateTime, timestamp, formatted);

            res.status(204).json({ message: 'Brand deleted successfully' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // Client Groups
    app.get('/cgroups', importantMiddleWares, (req, res) => {
        // if (req.auth.role != "Owner")
        //     res.status(401).send([])

        db.collection('cgroups').find({
            deleted: false,
        }).toArray(async function (err, result) {
            if (err) throw err

            // console.log(result)
            res.send(result)
        })
    });

    app.post('/cgroups', importantMiddleWares, async (req, res) => {
        const token = req.headers.authorization;
        // Verify the token
        const decoded = jwt.verify(token, JWT_TOKEN);
        // Extract the user's id from the token
        const { _id: userId, name: userTitle } = decoded;

        // Moment
        const dateTime = moment().format('YYYY-MM-DD HH:mm:ss');
        const timestamp = moment(dateTime).unix();
        const formatted = moment(dateTime).format('MMM Do ddd h:mmA');

        console.log(req.body)

        const newBrandData = Object.assign(req.body, {
            _id: new ObjectId(),
            deleted: false,
            userId,
            userTitle,
            user: decoded,
            createdAtDateTime: dateTime,
            createdAtTimestamp: timestamp,
            createdAtFormatted: formatted,
        });

        db.collection('cgroups').insertOne(newBrandData);

        return res.status(201).send(newBrandData);
    });

    app.patch('/cgroups/:id', importantMiddleWares, async (req, res) => {
        const token = req.headers.authorization;
        // Verify the token
        const decoded = jwt.verify(token, JWT_TOKEN);
        // Extract the user's id from the token
        const { _id: userId, name: userTitle } = decoded;

        const { id } = req.params;

        // Moment
        const dateTime = moment().format('YYYY-MM-DD HH:mm:ss');
        const timestamp = moment(dateTime).unix();
        const formatted = moment(dateTime).format('MMM Do ddd h:mmA');

        const updatedBrandData = Object.assign(req.body, {
            deleted: false,
            userId,
            userTitle,
            user: decoded,
            updatedAtDateTime: dateTime,
            updatedAtTimestamp: timestamp,
            updatedAtFormatted: formatted,
        });

        try {
            let existingEntity = await db.collection('cgroups').findOne({ _id: new ObjectId(id), deleted: false });

            let response = await db.collection('cgroups').updateOne(
                { _id: ObjectId(id) },
                {
                    $set: updatedBrandData,
                },
                { upsert: true });
            let updatedEntity = await db.collection('cgroups').findOne({ _id: new ObjectId(id), deleted: false });
            // Log Activity
            logActivity(db, "Contact Group", "UPDATE", existingEntity, updatedEntity, userId, userTitle, decoded, dateTime, timestamp, formatted);

            res.status(200).json({ message: 'Contact group updated successfully' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.delete('/cgroups/:id', importantMiddleWares, async (req, res) => {
        const token = req.headers.authorization;
        // Verify the token
        const decoded = jwt.verify(token, JWT_TOKEN);
        // Extract the user's id from the token
        const { _id: userId, name: userTitle } = decoded;

        const { id } = req.params;

        // Moment
        const dateTime = moment().format('YYYY-MM-DD HH:mm:ss');
        const timestamp = moment(dateTime).unix();
        const formatted = moment(dateTime).format('MMM Do ddd h:mmA');

        try {
            let existingEntity = await db.collection('cgroups').findOne({ _id: new ObjectId(id), deleted: false });

            let response = await db.collection('cgroups').updateOne({ _id: new ObjectId(id) }, {
                $set: {
                    deleted: true,
                    deletedAtDateTime: dateTime,
                    deletedAtTimestamp: timestamp,
                    deletedAtFormatted: formatted
                }
            });
            let updatedEntity = await db.collection('cgroups').findOne({ _id: new ObjectId(id), deleted: true });
            // Log Activity
            logActivity(db, "Contact Group", "DELETE", existingEntity, updatedEntity, userId, userTitle, decoded, dateTime, timestamp, formatted);

            res.status(204).json({ message: 'Contact Group deleted successfully' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // Clients
    app.get('/clients', importantMiddleWares, (req, res) => {
        // if (req.auth.role != "Owner")
        //     res.status(401).send([])

        db.collection('clients').find({
            deleted: false,
        }).toArray(async function (err, result) {
            if (err) throw err

            // console.log(result)
            res.send(result)
        })
    });

    app.post('/clients', importantMiddleWares, async (req, res) => {
        const token = req.headers.authorization;
        // Verify the token
        const decoded = jwt.verify(token, JWT_TOKEN);
        // Extract the user's id from the token
        const { _id: userId, name: userTitle } = decoded;

        // Moment
        const dateTime = moment().format('YYYY-MM-DD HH:mm:ss');
        const timestamp = moment(dateTime).unix();
        const formatted = moment(dateTime).format('MMM Do ddd h:mmA');

        // console.log(req.body)
        const groupTitles = [];
        // const cgroups = req.body.groups;
        // console.log(cgroups);
        // if (cgroups && cgroups.length) {
        //     cgroups.forEach((cId) => {
        //         console.log(`In for each loop for ${cId}`);
        //         db.collection('cgroups').findOne({ _id: new ObjectId(cId), deleted: false }, (err, cgroupItem) => {
        //             if (err) {console.log(err)}
        //             if (cgroupItem) {
        //                 console.log(`Group ${cgroupItem.title}`);
        //                 groupTitles.push(cgroupItem.title);
        //             }
        //         });
        //     });
        // }
        // console.log(groupTitles);

        let newClientData = Object.assign(req.body, {
            _id: new ObjectId(),
            deleted: false,
            userId,
            userTitle,
            groupTitles,
            user: decoded,
            updatedAtDateTime: dateTime,
            updatedAtTimestamp: timestamp,
            updatedAtFormatted: formatted,
        });

        db.collection('clients').insertOne(newClientData);

        return res.status(201).send(newClientData);
    });

    app.patch('/clients/:id', importantMiddleWares, async (req, res) => {
        const token = req.headers.authorization;
        // Verify the token
        const decoded = jwt.verify(token, JWT_TOKEN);
        // Extract the user's id from the token
        const { _id: userId, name: userTitle } = decoded;

        const { id } = req.params;

        // Moment
        const dateTime = moment().format('YYYY-MM-DD HH:mm:ss');
        const timestamp = moment(dateTime).unix();
        const formatted = moment(dateTime).format('MMM Do ddd h:mmA');

        const updatedBrandData = Object.assign(req.body, {
            deleted: false,
            userId,
            userTitle,
            user: decoded,
            createdAtDateTime: dateTime,
            createdAtTimestamp: timestamp,
            createdAtFormatted: formatted,
        });

        try {
            let existingEntity = await db.collection('clients').findOne({ _id: new ObjectId(id), deleted: false });

            let response = await db.collection('clients').updateOne(
                { _id: ObjectId(id) },
                {
                    $set: updatedBrandData,
                },
                { upsert: true });
            let updatedEntity = await db.collection('clients').findOne({ _id: new ObjectId(id), deleted: false });
            // Log Activity
            logActivity(db, "Client", "UPDATE", existingEntity, updatedEntity, userId, userTitle, decoded, dateTime, timestamp, formatted);

            res.status(200).json({ message: 'Client updated successfully' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.delete('/clients/:id', importantMiddleWares, async (req, res) => {
        const token = req.headers.authorization;
        // Verify the token
        const decoded = jwt.verify(token, JWT_TOKEN);
        // Extract the user's id from the token
        const { _id: userId, name: userTitle } = decoded;

        const { id } = req.params;

        // Moment
        const dateTime = moment().format('YYYY-MM-DD HH:mm:ss');
        const timestamp = moment(dateTime).unix();
        const formatted = moment(dateTime).format('MMM Do ddd h:mmA');

        try {
            let existingEntity = await db.collection('clients').findOne({ _id: new ObjectId(id), deleted: false });

            let response = await db.collection('clients').updateOne({ _id: new ObjectId(id) }, {
                $set: {
                    deleted: true,
                    deletedAtDateTime: dateTime,
                    deletedAtTimestamp: timestamp,
                    deletedAtFormatted: formatted
                }
            });
            let updatedEntity = await db.collection('clients').findOne({ _id: new ObjectId(id), deleted: true });
            // Log Activity
            logActivity(db, "Clients", "DELETE", existingEntity, updatedEntity, userId, userTitle, decoded, dateTime, timestamp, formatted);

            res.status(204).json({ message: 'Clients deleted successfully' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }
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
                // console.log(file);
                cb(null, file.originalname);
            }
        })
    }).array('upload', 1);


    app.post('/upload', function (request, response, next) {
        upload(request, response, function (error) {
            if (error) {
                // console.log(error);
                return response.status(500).send(error)
            }
            // console.log('File uploaded successfully.');
            response.send({
                status: "OK"
            })

        });
    });

    // This handles any errors that Express catches
    app.use(Bugsnag.getPlugin('express').errorHandler)
}

const PORT = process.env.PORT || 8002;

async function main(startUpCompleteCallBack) {
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
        startUpCompleteCallBack()
    } catch (e) {
        console.error(e);
    } finally {
        // await client.close();
    }
}

main(() => {
    // console.log("Starting trader Process...")
    // traderProcess()
}).catch(console.error);