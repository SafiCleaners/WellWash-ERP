require('dotenv').config();

// --- Core and Utility Imports ---
const express = require('express');
const { join } = require("path");
const cors = require('cors');
const moment = require('moment');
const aws = require('aws-sdk');
const morgan = require('morgan');
const multer = require('multer');
const multerS3 = require('multer-s3');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const querystring = require('querystring');
const YAML = require('json-to-pretty-yaml');
// const { v4: uuidv4 } = require("uuid");
const crypto = require('crypto');
const functions = require('@google-cloud/functions-framework');
const DeviceDetector = require("device-detector-js");
const sailsPostgresAdapter = require('sails-postgresql');

// --- Waterline ORM Imports ---
const Waterline = require('waterline');

// --- Environment Variables ---
const {
    JWT_TOKEN = 'shhhhh',
    APP_DB_URL: DB_URL,
    FUNCTIONS_FRAMEWORK,
    NODE_ENV
} = process.env;

if (!DB_URL) {
    throw new Error("Database URL (DB_URL) is not defined in the environment variables.");
}

// =================================================================
// --- 1. WATERLINE MODEL DEFINITIONS
// =================================================================

const baseModel = {
    datastore: 'default',
    primaryKey: 'id',
    attributes: {
        id: { type: 'number', required: true },
        createdAt: { type: 'number', autoCreatedAt: true, },
        updatedAt: { type: 'number', autoUpdatedAt: true, },
        deleted: { type: 'boolean', defaultsTo: false },
        createdBy: { type: 'string' },
        updatedBy: { type: 'string' },
    }
};

const User = Waterline.Collection.extend({ ...baseModel, identity: 'user', attributes: { ...baseModel.attributes, googleId: { type: 'string', required: true, }, email: { type: 'string', required: true }, name: { type: 'string' }, role: { type: 'string', defaultsTo: 'CLIENT' } } });
const Job = Waterline.Collection.extend({ ...baseModel, identity: 'job', attributes: { ...baseModel.attributes, clientName: { type: 'string' }, phone: { type: 'string' }, shortId: { type: 'string' }, orderUrl: { type: 'string' }, statusInfo: { type: 'json' } } });
const Store = Waterline.Collection.extend({ ...baseModel, identity: 'store', attributes: { ...baseModel.attributes, title: { type: 'string', required: true }, phone: { type: 'string' }, email: { type: 'string' }, address: { type: 'string' } } });
const Category = Waterline.Collection.extend({ ...baseModel, identity: 'category', attributes: { ...baseModel.attributes, title: { type: 'string' }, store: { type: 'json' }, storeId: { type: 'string' }, unit: { type: 'string' }, cost: { type: 'number' }, brand: { type: 'string' } } });
const Pricing = Waterline.Collection.extend({ ...baseModel, identity: 'pricing', attributes: { ...baseModel.attributes, title: { type: 'string' }, category: { type: 'string' }, storeId: { type: 'string' }, unit: { type: 'string' }, cost: { type: 'number' } } });
const Expense = Waterline.Collection.extend({ ...baseModel, identity: 'expense', attributes: { ...baseModel.attributes, title: { type: 'string' }, category: { type: 'string' }, storeId: { type: 'string' }, unit: { type: 'string' }, cost: { type: 'number' }, recurrent: { type: 'boolean' }, businessDate: { type: 'string' } } });
const Order = Waterline.Collection.extend({ ...baseModel, identity: 'order', attributes: { ...baseModel.attributes, storeId: { type: 'string' }, storeTitle: { type: 'string' }, clientId: { type: 'string' }, clientTitle: { type: 'string' }, clientSource: { type: 'string' }, totalCost: { type: 'number' }, tasks: { type: 'json' } } });
const Task = Waterline.Collection.extend({ ...baseModel, identity: 'task', attributes: { ...baseModel.attributes, orderId: { type: 'string' }, pricingId: { type: 'string' }, pricingTitle: { type: 'string' }, quantity: { type: 'number' }, cost: { type: 'number' }, total: { type: 'number' }, description: { type: 'string' }, status: { type: 'string', defaultsTo: 'Pending' } } });
const Brand = Waterline.Collection.extend({ ...baseModel, identity: 'brand', attributes: { ...baseModel.attributes, title: { type: 'string' } } });
const CGroup = Waterline.Collection.extend({ ...baseModel, identity: 'cgroup', attributes: { ...baseModel.attributes, title: { type: 'string' } } });
const Client = Waterline.Collection.extend({ ...baseModel, identity: 'client', attributes: { ...baseModel.attributes, name: { type: 'string' }, phone: { type: 'string' } } });
const Track = Waterline.Collection.extend({ ...baseModel, identity: 'track', attributes: { ...baseModel.attributes, shortId: { type: 'string' }, jobId: { type: 'string' }, REFFERAL_CODE: { type: 'string' }, DISCOUNT_CODE: { type: 'string' } } });
const StockAdjustment = Waterline.Collection.extend({ ...baseModel, identity: 'stock_adjustment', attributes: { ...baseModel.attributes, pricingId: { type: 'string' }, quantity: { type: 'number' }, businessDate: { type: 'string' }, reason: { type: 'string' }, cost: { type: 'number' } } });
const ActivityLog = Waterline.Collection.extend({ ...baseModel, identity: 'activitylog', attributes: { ...baseModel.attributes, entity: { type: 'string' }, action: { type: 'string' }, before: { type: 'json' }, after: { type: 'json' }, userId: { type: 'string' }, userTitle: { type: 'string' } } });

const allModels = [User, Job, Store, Category, Pricing, Expense, Order, Task, Brand, CGroup, Client, Track, StockAdjustment, ActivityLog];

// =================================================================
// --- 2. WATERLINE AND SERVER INITIALIZATION
// =================================================================

const waterline = new Waterline();

const sms = (options, callback) => {
    console.log(`-- SMS SIMULATION --\nTO: ${options.phone}\nMESSAGE: ${options.message}\n--------------------`);
    if (callback) callback(null, { status: "success" });
};

const config = {
    adapters: { 'sails-postgresql': sailsPostgresAdapter },
    datastores: { default: { adapter: 'sails-postgresql', url: DB_URL, migrate: 'safe' } }, // Changed migrate to 'safe'
    models: { schema: true }
};

allModels.forEach(model => {
    waterline.registerModel(model);
});

const startServer = (ontology) => {
    const app = express();
    app.models = ontology.collections;
    app.connections = ontology.connections;

    // ... (The rest of your express app setup, middleware, and routes go here as before)
    app.use(express.urlencoded({ extended: true, limit: '3mb' }));
    app.use(express.json());

    // =================================================================
    // --- START: CORS CONFIGURATION ---
    // =================================================================

    // Define the list of domains that are allowed to connect.
    const allowedOrigins = [
        '*', // Your production frontend
    ];

    const corsOptions = {
        origin: (origin, callback) => {
            // The 'origin' is the URL of the site making the request (e.g., https://wellwash.netlify.app)
            // The check '!origin' allows requests from tools like Postman or server-to-server calls.
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true); // Allow the request
            } else {
                callback(new Error('Not allowed by CORS')); // Block the request
            }
        },
        methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'], // Specify allowed methods
        allowedHeaders: ['Content-Type', 'Authorization'], // Specify allowed headers
    };

    // REPLACE your old app.use(cors()); with this:
    app.use(cors(corsOptions));

    // =================================================================
    // --- END: CORS CONFIGURATION ---
    // =================================================================

    app.use(morgan(NODE_ENV === 'development' ? 'tiny' : 'combined'));

    const logActivity = async (req, entity, action, before, after) => {
        try {
            await app.models.activitylog.create({
                entity, action, before, after,
                userId: req.user.id,
                userTitle: req.user.name,
                createdBy: req.user.id
            });
        } catch (error) {
            console.error("Failed to log activity:", error);
        }
    };

    const userAuthMiddleware = (req, res, next) => {
        const token = req.headers.authorization;
        if (!token) return res.status(401).json({ message: "Unauthorized: Token not provided" });

        try {
            const decoded = jwt.verify(token, JWT_TOKEN);
            req.tokenPayload = decoded;
            next();
        } catch (err) {
            return res.status(401).json({ message: "Unauthorized: Invalid token" });
        }
    };

    const userBlockedMiddleware = async (req, res, next) => {
        try {
            const userId = req.tokenPayload.id || req.tokenPayload._id;
            const user = await app.models.user.findOne({ id: userId, deleted: false });
            if (!user) return res.status(403).json({ message: "Forbidden: User is blocked or does not exist." });
            req.user = user;
            next();
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Server error during user validation." });
        }
    };

    const userTrackingMiddleware = (req, res, next) => {
        console.log(`Request from user: ${req.user ? req.user.id : 'Guest'} to ${req.method} ${req.path}`);
        next();
    };

    const importantMiddleWares = [userAuthMiddleware, userBlockedMiddleware, userTrackingMiddleware];

    app.get('/health', (req, res) => res.send({ status: "ok" }));
    app.get("/auth_config.json", (req, res) => {
        try {
            res.sendFile(join(__dirname, "auth_config.json"));
        } catch (e) {
            res.status(404).send({ message: "auth_config.json not found" });
        }
    });

    // --- JOBS Routes ---
    app.get('/jobs', importantMiddleWares, async (req, res) => {
        try {
            const jobs = await app.models.job.find({ where: { deleted: false }, sort: 'createdAt DESC' });
            res.json(jobs.map(j => ({ ...j, phone: j.phone ? j.phone.substring(0, 2) + '**' + j.phone.substring(4) : '' })));
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    app.get('/jobs/:id', importantMiddleWares, async (req, res) => {
        try {
            const job = await app.models.job.findOne({ id: req.params.id, deleted: false });
            if (!job) return res.status(404).json({ message: "Job not found" });
            res.json(job);
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    app.post('/jobs', importantMiddleWares, async (req, res) => {
        try {
            const newJob = await app.models.job.create({ ...req.body, createdBy: req.user.id }).fetch();
            res.status(201).json(newJob);
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    app.patch('/jobs/:id', importantMiddleWares, async (req, res) => {
        try {
            const jobId = req.params.id;
            const jobData = { ...req.body, updatedBy: req.user.id };
            let job = await app.models.job.findOne({ id: jobId, deleted: false });

            if (job) {
                const updatedJob = await app.models.job.updateOne({ id: jobId }).set(jobData).fetch();
                res.json(updatedJob);
            } else {
                jobData.shortId = crypto.randomBytes(2).toString('hex').toUpperCase();
                const newJob = await app.models.job.create({ ...jobData, createdBy: req.user.id }).fetch();
                res.status(201).json(newJob);
            }
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    app.delete('/jobs/:id', importantMiddleWares, async (req, res) => {
        try {
            await app.models.job.updateOne({ id: req.params.id }).set({ deleted: true, updatedBy: req.user.id });
            res.status(204).send();
        } catch (e) { res.status(500).json({ error: e.message }); }
    });


    // --- USERS Routes ---
    app.post('/users', async (req, res) => {
        try {
            const { googleId } = req.body;
            let user = await app.models.user.findOne({ googleId });
            if (user) {
                user = await app.models.user.updateOne({ googleId }).set(req.body).fetch();
            } else {
                user = await app.models.user.create(req.body).fetch();
            }
            const token = jwt.sign(user.toJSON(), JWT_TOKEN, { expiresIn: '7d' });
            res.json({ user, token });
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    app.get('/users', importantMiddleWares, async (req, res) => {
        try {
            const users = await app.models.user.find({ deleted: false });
            res.json(users);
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    app.patch('/users/roles/:id', importantMiddleWares, async (req, res) => {
        try {
            const user = await app.models.user.updateOne({ id: req.params.id }).set({ role: req.body.role, updatedBy: req.user.id }).fetch();
            if (!user) return res.status(404).send({ message: "User not found" });
            res.send(user);
        } catch (e) { res.status(500).json({ error: e.message }) }
    });

    app.delete('/users/:email', importantMiddleWares, async (req, res) => {
        try {
            await app.models.user.updateOne({ email: req.params.email }).set({ deleted: true, updatedBy: req.user.id });
            res.status(204).send();
        } catch (e) { res.status(500).json({ error: e.message }); }
    });


    // --- Generic CRUD Routes Factory ---
    const createCrudRoutes = (entityName) => {
        const router = express.Router();
        const model = app.models[entityName];

        router.get('/', async (req, res) => {
            try {
                const items = await model.find({ deleted: false });
                res.json(items);
            } catch (e) { res.status(500).json({ error: e.message }); }
        });

        router.post('/', async (req, res) => {
            try {
                const newItem = await model.create({ ...req.body, createdBy: req.user.id }).fetch();
                await logActivity(req, entityName, "CREATE", {}, newItem.toJSON());
                res.status(201).json(newItem);
            } catch (e) { res.status(500).json({ error: e.message }); }
        });

        router.patch('/:id', async (req, res) => {
            try {
                const before = await model.findOne({ id: req.params.id });
                const updatedItem = await model.updateOne({ id: req.params.id }).set({ ...req.body, updatedBy: req.user.id }).fetch();
                if (!updatedItem) return res.status(404).json({ message: `${entityName} not found` });
                await logActivity(req, entityName, "UPDATE", before.toJSON(), updatedItem.toJSON());
                res.json(updatedItem);
            } catch (e) { res.status(500).json({ error: e.message }); }
        });

        router.delete('/:id', async (req, res) => {
            try {
                const before = await model.findOne({ id: req.params.id });
                if (!before) return res.status(404).json({ message: `${entityName} not found` });
                await model.updateOne({ id: req.params.id }).set({ deleted: true, updatedBy: req.user.id });
                await logActivity(req, entityName, "DELETE", before.toJSON(), { ...before.toJSON(), deleted: true });
                res.status(204).send();
            } catch (e) { res.status(500).json({ error: e.message }); }
        });
        return router;
    };

    // --- Applying CRUD Routes ---
    app.use('/stores', importantMiddleWares, createCrudRoutes('store'));
    app.use('/categories', importantMiddleWares, createCrudRoutes('category'));
    app.use('/pricings', importantMiddleWares, createCrudRoutes('pricing'));
    app.use('/expenses', importantMiddleWares, createCrudRoutes('expense'));
    app.use('/brands', importantMiddleWares, createCrudRoutes('brand'));
    app.use('/cgroups', importantMiddleWares, createCrudRoutes('cgroup'));
    app.use('/clients', importantMiddleWares, createCrudRoutes('client'));
    app.use('/stock-adjustments', importantMiddleWares, createCrudRoutes('stock_adjustment'));


    // --- ORDERS & TASKS (More Complex Logic) ---
    app.get('/orders', importantMiddleWares, async (req, res) => {
        try {
            const orders = await app.models.order.find({ deleted: false });
            res.json(orders);
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    app.post('/orders', importantMiddleWares, async (req, res) => {
        const { storeId, clientId, tasks, total } = req.body;
        try {
            const [client, store] = await Promise.all([
                app.models.user.findOne({ id: clientId }),
                app.models.store.findOne({ id: storeId })
            ]);

            const newOrderData = {
                ...req.body,
                totalCost: total,
                clientId,
                clientTitle: client ? client.name : 'N/A',
                storeId,
                storeTitle: store ? store.title : 'N/A',
                createdBy: req.user.id
            };

            const newOrder = await app.models.order.create(newOrderData).fetch();
            await logActivity(req, "Order", "CREATE", {}, newOrder.toJSON());

            if (tasks && tasks.length > 0) {
                const taskPromises = tasks.map(task => {
                    return app.models.task.create({
                        ...task,
                        orderId: newOrder.id,
                        clientId,
                        storeId,
                        createdBy: req.user.id
                    }).fetch();
                });
                const createdTasks = await Promise.all(taskPromises);
                for (const task of createdTasks) {
                    await logActivity(req, "Task", "CREATE", {}, task.toJSON());
                }
            }

            res.status(201).json({ message: 'Order created successfully', order: newOrder });

        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    app.delete('/orders/:id', importantMiddleWares, async (req, res) => {
        try {
            await app.models.task.update({ orderId: req.params.id }).set({ deleted: true, updatedBy: req.user.id });
            await app.models.order.updateOne({ id: req.params.id }).set({ deleted: true, updatedBy: req.user.id });
            res.status(204).send();
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    // --- Remaining custom routes
    app.post('/track-refferals', async (req, res) => {
        try {
            const shortId = crypto.randomBytes(2).toString('hex').toUpperCase();
            const deviceDetector = new DeviceDetector();
            const device = deviceDetector.parse(req.headers['user-agent']);

            const newJobData = { ...req.body, shortId, device, deleted: false };
            const newJob = await app.models.job.create(newJobData).fetch();

            const trackData = {
                shortId,
                jobId: newJob.id,
                REFFERAL_CODE: req.body.REFFERAL_CODE,
                DISCOUNT_CODE: req.body.DISCOUNT_CODE
            };
            const newTrack = await app.models.track.create(trackData).fetch();

            const message = YAML.stringify({ newJob, newTrack });
            sms({ phone: "+254711657108", message });

            res.status(201).send(newJob);
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    app.post('/payments', (req, res) => res.status(501).send({ message: "Not Implemented" }));
    app.post('/upload', (req, res) => res.status(501).send({ message: "Not Implemented" }));
    app.use("/billing/confirmation", (req, res) => res.json({ ResponseCode: "00000000", ResponseDesc: "success" }));
    app.use("/billing/validation", (req, res) => res.json({ ResponseCode: "00000000", ResponseDesc: "success" }));
    app.use("/billing/lipaCallback/:txid", (req, res) => res.json({ ResponseCode: "00000000", ResponseDesc: "success" }));


    return app;
};

// =================================================================
// --- 5. ORM INITIALIZATION AND SERVER START
// =================================================================

/**
 * Checks if the database schema is initialized and creates tables if not.
 * @param {object} ontology - The Waterline ontology object.
 */
async function initializeDatabase(ontology) {
    const datastore = ontology.datastores.default;
    const schemaVersionTable = '_schema_version';

    const runQuery = (query, values = []) => {
        return new Promise((resolve, reject) => {
            datastore.sendNativeQuery(query, values, (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });
    };

    const mapTypeToPostgres = (attr) => {
        switch (attr.type) {
            case 'string': return 'VARCHAR(255)';
            case 'number': return attr.autoIncrement ? 'SERIAL' : 'INTEGER';
            case 'boolean': return 'BOOLEAN';
            case 'json': return 'JSON';
            default: return 'VARCHAR(255)';
        }
    };

    try {
        const checkResult = await runQuery(
            `SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = $1
            )`, [schemaVersionTable]
        );

        if (checkResult.rows[0].exists) {
            console.log('Database schema already initialized. Skipping setup.');
            return;
        }

        console.log('Initial database setup required. Creating tables...');

        for (const model of allModels) {
            const tableName = model.identity;
            const attributes = model.attributes;
            const columns = Object.entries(attributes).map(([name, attr]) => {
                let columnDef = `"${name}" ${mapTypeToPostgres(attr)}`;
                if (name === 'id') columnDef += ' PRIMARY KEY';
                if (attr.required) columnDef += ' NOT NULL';
                if (attr.defaultsTo !== undefined) {
                    const defaultValue = typeof attr.defaultsTo === 'string' ? `'${attr.defaultsTo}'` : attr.defaultsTo;
                    columnDef += ` DEFAULT ${defaultValue}`;
                }
                return columnDef;
            });

            const createTableQuery = `CREATE TABLE "${tableName}" (${columns.join(', ')});`;
            console.log(`Creating table: ${tableName}`);
            await runQuery(createTableQuery);
        }

        await runQuery(`CREATE TABLE "${schemaVersionTable}" (version INT NOT NULL, "createdAt" BIGINT);`);
        await runQuery(`INSERT INTO "${schemaVersionTable}" (version, "createdAt") VALUES (1, $1);`, [Date.now()]);

        console.log('✅ Initial database setup complete.');

    } catch (error) {
        console.error('Error during database initialization:', error);
        process.exit(1);
    }
}


console.log('Attempting to initialize Waterline ORM...');
waterline.initialize(config, async (err, ontology) => {
    if (err) {
        console.error('Failed to initialize Waterline ORM:', err);
        process.exit(1);
    }
    console.log('Waterline ORM initialized successfully.');

    // Perform initial database setup if required
    await initializeDatabase(ontology);

    const app = startServer(ontology);

    if (FUNCTIONS_FRAMEWORK === 'true') {
        functions.http('api', app);
    } else {
        const PORT = process.env.PORT || 8002;
        app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
    }
});

process.on('SIGINT', () => {
    console.log("\nShutting down server...");
    waterline.teardown(() => {
        console.log('Waterline connections closed.');
        process.exit(0);
    });
});