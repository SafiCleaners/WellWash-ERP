const cron = require('node-cron');
const moment = require('moment');
const randomstring = require('randomstring');

cron.schedule('* * * * *', async () => {
    try {
        const twoWeeksAgo = moment().subtract(2, 'weeks').toDate();
        const users = await db.collection('users').find({}).toArray();

        for (let i = 0; i < users.length; i++) {
            const user = users[i];
            const userJobs = await db.collection('jobs').find({
                userId: user._id,
                deleted: false,
            }).sort({ lastSubmittedAt: -1 }).limit(1).toArray();
            
            if(userJobs.length>0){
                const mostRecentJob = userJobs[0];
                if (mostRecentJob.lastSubmittedAt < twoWeeksAgo) {
                    const messages = [
                        "We miss you! It's been a while since your last laundry order. Don't hesitate to schedule your next pickup and get 10% off with the code 'WELCOMEBACK' at wellwash.online?discount=WELCOMEBACK",
                        "It's been too long! We'd love to have you back as a customer. Use code 'COMEBACK' for 15% off your next order at wellwash.online?discount=COMEBACK",
                        "We hope all is well! We'd love to have you back as a customer. Use code 'HELLOAGAIN' for 10% off your next order at wellwash.online?discount=HELLOAGAIN",
                        "We're thinking of you! It's been a while since your last laundry order. Don't hesitate to schedule your next pickup and use code 'LONGLOST' for 12 % off at wellwash.online ? discount = LONGLOST",
                        "Don't forget about us! We'd love to have you back as a customer. Use code 'REMEMBER' for 20% off your next order at wellwash.online?discount=REMEMBER",
                        "It's been too long! We're offering a special discount for our loyal customers. Use code 'WASHMORE' for 15% off at wellwash.online?discount=WASHMORE",
                        "We're missing you! Use code 'BACKTOWASH' for 10% off your next order at wellwash.online?discount=BACKTOWASH",
                        "We hope to see you soon! Use code 'WASHAGAIN' for 12% off your next order at wellwash.online?discount=WASHAGAIN",
                        "We're offering a special deal for our loyal customers. Use code 'WASHWITHUS' for 20% off at wellwash.online?discount=WASHWITHUS",
                        "We'd love to have you back as a customer. Use code 'WASHMORE' for 15% off your next order at wellwash.online?discount=WASHMORE"
                    ];                    const message = messages[Math.floor(Math.random() * messages.length)];
                    const discountCode = generateDiscountCode();
                    message.replace("{{discountCode}}", discountCode);
                    func({ phone: user.phone, message: message }, console.log);
                }
            }

        }
    } catch (err) {
        console.error(err);
    }
});