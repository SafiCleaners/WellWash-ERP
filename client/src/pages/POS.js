import axios from "axios";

import {
    url
} from "../constants"


import m from "mithril"
import moment from "moment"

import { DateRangePicker } from '../components/daterangepicker';

import loader from "../components/loader"
import expenses from "./expenses"

const detailsString = (job) => {
    const orderItems = ["duvets", "blankets", "curtains", "generalKgs",];
    return Object.keys(job)
        .filter((key) => orderItems.includes(key))
        .map((key) => {
            return `${job[key]} ${key}`;
        })
        .join(", ");
};

const formatCurrency = (number) => {
    try {
        return Intl.NumberFormat('en-US').format(number);
    } catch (error) {
        console.error('Error formatting number:', error);
        return 'N/A';
    }
}




const StatNumber = {
    view(vnode) {
        return m("h3", { "class": "card-title align-items-start flex-column d-flex mr-3", style: { whiteSpace: "nowrap" } },
            [
                m("span", { "class": "fs-6 fw-semibold text-gray-500", style: "align-self: flex-start;" },
                    vnode.attrs.title
                ),
                m("div", { "class": "d-flex align-items-center mb-2" },
                    [
                        m("span", { "class": "fs-3 fw-semibold text-gray-500 align-self-start me-1" },
                            vnode.attrs.symbol
                        ),
                        m("span", { "class": "fs-2hx fw-bold text-gray-800 me-2 lh-1 ls-n2" },
                            vnode.attrs.amount
                        ),
                    ]
                ),

            ]
        )
    }
}


const orders = {

    oninit(vnode) {
        vnode.state.jobs = []
        vnode.state.pricings = []
        vnode.state.stores = []
        vnode.state.expenses = []
        vnode.state.categories = []
        vnode.state.loading = true
        vnode.state.selectedDate = new Date()

        // Retrieve businessDate from localStorage and convert it to a Date object
        const storedBusinessDate = localStorage.getItem("businessDate");
        let selectedDate;

        if (storedBusinessDate) {
            // If businessDate exists in localStorage, parse it as a Date
            selectedDate = new Date(storedBusinessDate);
        } else {
            // If businessDate is not found in localStorage, set a default value (e.g., current date)
            selectedDate = new Date(); // Default to current date/time
            const storageFormattedDate = selectedDate.toISOString(); // Convert to ISO string for storage
            localStorage.setItem("businessDate", storageFormattedDate); // Save to localStorage
        }

    },
    oncreate(vnode) {
        const options = {
            method: 'GET',
            url: url + "/jobs",
            headers: {
                'Content-Type': 'application/json',
                'authorization': localStorage.getItem('token')
            },
        };

        axios.request(options).then(function (response) {
            vnode.state.jobs = response.data.filter((job) => {
                const googleId = localStorage.getItem('googleId')
                const role = localStorage.getItem('role')
                if (role && role === 'OWNER') return true

                if (job.googleId)
                    return true
            })

            vnode.state.jobs.map(job => {
                Object.assign(job, {
                    createdAtAgo: moment(job.createdAt).fromNow(true),
                    timeDroppedOffFromNow: moment(job.dropOffDay).fromNow(true),
                    timePickedUpFromNow: moment(job.pickupDay).fromNow(true),
                })

                if (job.categoryAmounts) {
                    const calculatePrice = () => {
                        return Object.keys(job.categoryAmounts).reduce((total, categoryId) => {
                            const amountValue = job.categoryAmounts[categoryId] || 0;
                            const chargeValue = job.categoryCharges[categoryId] || 0;
                            const subtotal = amountValue * chargeValue;
                            return total + subtotal;
                        }, 0);
                    };

                    job.price = calculatePrice();
                }
            })

            vnode.state.loading = false
            m.redraw()
        }).catch(function (error) {
            vnode.state.loading = false
            console.error(error);
        });

        const optionsPricing = {
            method: 'GET', url: url + "/pricings",
            headers: {
                'Content-Type': 'application/json',
                'authorization': localStorage.getItem('token')
            },
        };

        axios.request(optionsPricing).then(function (response) {
            vnode.state.pricings = response.data
            vnode.state.loading = false
            m.redraw()
        }).catch(function (error) {
            vnode.state.loading = false
            m.redraw()
            console.error(error);
        });

        const optionsStores = {
            method: 'GET', url: url + "/stores",
            headers: {
                'Content-Type': 'application/json',
                'authorization': localStorage.getItem('token')
            },
        };

        axios.request(optionsStores).then(function (response) {
            vnode.state.stores = response.data
            vnode.state.loading = false
            m.redraw()
        }).catch(function (error) {
            vnode.state.loading = false
            m.redraw()
            console.error(error);
        });

        const optionsCategories = {
            method: 'GET', url: url + "/categories",
            headers: {
                'Content-Type': 'application/json',
                'authorization': localStorage.getItem('token')
            },
        };

        axios.request(optionsCategories).then(function (response) {
            vnode.state.categories = response.data
            // console.log(vnode.state.categories)
            vnode.state.loading = false
            m.redraw()
        }).catch(function (error) {
            vnode.state.loading = false
            m.redraw()
            console.error(error);
        });

        const optionsExpenses = {
            method: 'GET', url: url + "/expenses",
            headers: {
                'Content-Type': 'application/json',
                'authorization': localStorage.getItem('token')
            },
        };

        axios.request(optionsExpenses).then(function (response) {
            vnode.state.expenses = response.data

            vnode.state.loading = false
            m.redraw()
        }).catch(function (error) {
            vnode.state.loading = false
            m.redraw()
            console.error(error);
        });
    },
    view(vnode) {
        return [m("h1", "POS")]
    }
}

export default orders