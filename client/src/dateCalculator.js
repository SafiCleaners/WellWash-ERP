const moment = require('moment')

const nth = function (d) {
    const dString = String(d);
    const last = +dString.slice(-2);
    if (last > 3 && last < 21) return 'th';
    switch (last % 10) {
        case 1: return "st";
        case 2: return "nd";
        case 3: return "rd";
        default: return "th";
    }
}

const dayRangeCalculator = (start=new Date()) => {
    const daysForward = 6
    const days = []

    for (let index = 0; index < daysForward; index++) {
        var new_date = moment(new Date(start), "DD-MM-YYYY").add(index, 'days');

        var day = new_date.format('DD');
        var month = new_date.format('MM');
        var year = new_date.format('YYYY');
        var dayIndex = new_date.day()

        const dayNames = [
            "Mon",
            "Tue",
            "Wed",
            "Thur",
            "Friday",
            "Saturday",
            "Sunday",
        ]

        if(dayNames[dayIndex] === 'Sunday'){
            // do nothing
        } else {
            days.push({
                dayIndex, nth: nth(day), dayName: dayNames[dayIndex], day, month, year, date:new_date
            })
        }

       
    }

    console.log(days)

    return days
}


export default dayRangeCalculator