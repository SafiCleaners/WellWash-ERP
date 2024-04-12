import axios from "axios";

import {
    url
} from "../constants"


import m from "mithril"
import moment from "moment"

import { DateRangePicker } from '../components/daterangepicker';

import loader from "../components/loader"
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
        return m("h3", { "class": "card-title align-items-start flex-column d-flex" },
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
        vnode.state.stores = []
        vnode.state.expenses = []
        vnode.state.jobs = []
        vnode.state.pricings = []
        vnode.state.categories = []
        vnode.state.loading = true
        vnode.state.selectedDate = new Date()
        vnode.state.stats = {
            totalSales: 0,
            totalPaid: 0,
            totalUnpaid: 0,
            totalUniqueCustomers: 0,
            totalExpenses: 0
        }
        vnode.state.showUnpaid = false
    },
    oncreate(vnode) {
        const fetchData = async (options) => {
            try {
                const response = await axios.request(options);
                return response.data;
            } catch (error) {
                console.error(error);
                return null;
            }
        };

        const fetchJobs = fetchData({
            method: 'GET',
            url: url + "/jobs",
            headers: {
                'Content-Type': 'application/json',
                'authorization': localStorage.getItem('token')
            },
        });

        const fetchPricings = fetchData({
            method: 'GET',
            url: url + "/pricings",
            headers: {
                'Content-Type': 'application/json',
                'authorization': localStorage.getItem('token')
            },
        });

        const fetchCategories = fetchData({
            method: 'GET',
            url: url + "/categories",
            headers: {
                'Content-Type': 'application/json',
                'authorization': localStorage.getItem('token')
            },
        });

        const fetchExpenses = fetchData({
            method: 'GET',
            url: url + "/expenses",
            headers: {
                'Content-Type': 'application/json',
                'authorization': localStorage.getItem('token')
            },
        });

        const fetchStores = fetchData({
            method: 'GET',
            url: url + "/stores",
            headers: {
                'Content-Type': 'application/json',
                'authorization': localStorage.getItem('token')
            },
        });

        Promise.all([fetchJobs, fetchPricings, fetchCategories, fetchExpenses, fetchStores])
            .then(([jobs, pricings, categories, expenses, stores]) => {
                vnode.state.pricings = pricings
                vnode.state.categories = categories
                vnode.state.expenses = expenses
                vnode.state.stores = stores
                // Process jobs
                vnode.state.jobs = jobs.filter((job) => {
                    const googleId = localStorage.getItem('googleId');
                    const role = localStorage.getItem('role');
                    if (role && role === 'OWNER') return true;

                    return job.googleId ? true : false;
                });

                vnode.state.jobs.forEach(job => {
                    Object.assign(job, {
                        createdAtAgo: moment(job.createdAt).fromNow(true),
                        timeDroppedOffFromNow: moment(job.dropOffDay).fromNow(true),
                        timePickedUpFromNow: moment(job.pickupDay).fromNow(true),
                    });

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
                });



                vnode.state.loading = false;
                m.redraw();
            })
            .catch((error) => {
                vnode.state.loading = false;
                console.error(error);
            });
    },

    view(vnode) {
        const storedStartDate = localStorage.getItem("businessRangeStartDate");
        const storedEndDate = localStorage.getItem("businessRangeEndDate");
        const businessDate = localStorage.getItem("businessDate");

        var jobs = vnode.state.jobs.filter(job => {

            // Assuming storedStartDate and storedEndDate are valid date strings
            const startDate = new Date(storedStartDate);
            const endDate = new Date(storedEndDate);

            const businessDate = new Date(job.businessDate);

            // console.log({ businessDate, startDate, businessDate, endDate })
            // Check if the job's business date is within the stored date range
            return businessDate >= startDate && businessDate <= endDate;
        })
            .filter(job => {
                if (localStorage.getItem("storeId"))
                    return job.storeId == localStorage.getItem("storeId")

                return true
            })
            .sort((a, b) => {
                // Assuming createdAtDateTime is a valid date string
                const dateA = new Date(a.createdAtDateTime);
                const dateB = new Date(b.createdAtDateTime);

                // Compare dates for sorting
                return dateA - dateB;
            })

        // Process stats
        const totalSales = jobs.reduce((total, job) => total + (job.price || 0), 0);
        const totalPaid = jobs.reduce((total, job) => total + (job.paid ? (job.price || 0) : 0), 0);
        const totalUnpaid = jobs.reduce((total, job) => total + (job.paid ? 0 : (job.price || 0)), 0);

        const totalUniqueCustomers = new Set(jobs.map(job => job.phone)).size;



        // Function to calculate total expenses on a business day
        function calculateTotalExpenses(expenses, startDate, endDate, storeId) {
            let totalExpenses = 0;
        
            // Iterate through each expense
            for (const expense of expenses) {
                const expenseDate = new Date(expense.businessDate);

                // console.log(expense.storeId == storeId)
        
                // Check if the expense belongs to the specified store
                if (expense.storeId == storeId) {
                    // console.log(expense)
                    if (expense.recurrent) {
                        // Handle recurrent expenses (add for every day within the range)
                        const daysInRange = calculateDaysInRange(startDate, endDate);
                        // console.log({daysInRange})
                        const dailyExpenseCost = parseInt(expense.cost) || 0;
        
                        // Add total expense amount for recurrent expense within the range
                        totalExpenses += dailyExpenseCost * daysInRange;
                    } else {
                        // Handle non-recurrent expenses (add only for specific business date within the range)
                        if (expenseDate >= startDate && expenseDate <= endDate) {
                            const expenseCost = parseInt(expense.cost) || 0;
        
                            // Add expense amount to the total expenses
                            totalExpenses += expenseCost;
                        }
                    }
                }
            }
        
            // Return the total expenses
            return totalExpenses;
        }

        // Helper function to calculate number of days between two dates (inclusive)
        function calculateDaysInRange(startDate, endDate) {
            const oneDay = 24 * 60 * 60 * 1000; // One day in milliseconds
            const start = new Date(startDate);
            const end = new Date(endDate);
            return Math.round(Math.abs((end - start) / oneDay)) + 1; // Include both start and end dates in the count
        }
        // Calculate total expenses based on whether storeId is available
        const calculateTotal = (storeId) => {
            return calculateTotalExpenses(vnode.state.expenses, storedStartDate, storedEndDate, storeId);
        };

        const storeId = localStorage.getItem("storeId");
        const totalExpensesArray = storeId
            ? [calculateTotal(storeId)]  // Calculate total expenses for the specific store
            : vnode.state.stores.map(store => calculateTotal(store._id));  // Calculate total expenses for all stores

        // Now totalExpensesArray contains the total expenses, either for a specific store or for all stores
        console.log(totalExpensesArray)

        // Calculate the sum total of all expenses
        const totalExpenses = totalExpensesArray.reduce((sum, expenses) => sum + expenses, 0);

        const totalProfit = Number(totalSales) - Number(totalExpenses)



        vnode.state.stats = {
            totalSales,
            totalPaid,
            totalUnpaid,
            totalUniqueCustomers,
            totalExpenses
        };

        const startDate = new Date(localStorage.getItem("businessRangeStartDate"));
        const endDate = new Date(localStorage.getItem("businessRangeEndDate"));
        const selectedBusinessDate = new Date(localStorage.getItem("businessDate"));

        const formattedStartDate = startDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
        const formattedEndDate = endDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
        const formattedSelectedBusinessDate = selectedBusinessDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

        const dateRange = !['/dash'].includes(m.route.get()) ? formattedSelectedBusinessDate : `${formattedStartDate} - ${formattedEndDate}`;

        return m("div", { "class": "card card-custom gutter-b" },
            [
                [
                    m("div", { "class": "tab-content mt-2", "id": "myTabTable5" },
                        [
                            m("div", { "class": "tab-pane fade", "id": "kt_tab_table_5_1", "role": "tabpanel", "aria-labelledby": "kt_tab_table_5_1" },
                                m("div", { "class": "table-responsive" },
                                    m("table", { "class": "table table-borderless table-vertical-center" },
                                        [
                                            m("thead",
                                                m("tr",
                                                    [
                                                        m("th", { "class": "p-0 w-50px" }),
                                                        m("th", { "class": "p-0 min-w-200px" }),
                                                        m("th", { "class": "p-0 min-w-100px" }),
                                                        m("th", { "class": "p-0 min-w-125px" }),
                                                        m("th", { "class": "p-0 min-w-110px" }),
                                                        // m("th", { "class": "p-0 min-w-150px" })
                                                    ]
                                                )
                                            ),

                                        ]
                                    )
                                )
                            ),

                            m("div", { "class": "tab-pane fade show active", "id": "kt_tab_table_5_3", "role": "tabpanel", "aria-labelledby": "kt_tab_table_5_3" },
                                m("div", { "class": "table-responsive" },
                                    !vnode.state.loading ? m("table", { "class": "table table-borderless table-vertical-center" },
                                        [
                                            m("thead",
                                                m("tr",
                                                    [
                                                        m("th", { "class": "p-0 w-50px" }),
                                                        m("th", { "class": "p-0 w-50px" }),
                                                        // m("th", { "class": "p-0 min-w-200px" }),
                                                        m("th", { "class": "p-0 w-50px" }),
                                                        m("th", { "class": "p-0 w-50px" }),
                                                        m("th", { "class": "p-0 w-50px" }),
                                                        m("th", { "class": "p-0 w-50px" }),
                                                        m("th", { "class": "p-0 w-50px" }),
                                                    ]
                                                )
                                            ),
                                            m("tbody", { style: { "overflow-x": "auto" } },
                                                [
                                                    m("tr", {
                                                        // key: id,
                                                        style: { "cursor": "pointer" }
                                                    },
                                                        [
                                                            // m("td", { "class": "pl-0 py-5" },
                                                            //     m("div", { "class": "symbol symbol-45 symbol-light mr-2" },
                                                            //         m("span", { "class": "symbol-label" },
                                                            //             m("img", { "class": "h-50 align-self-center", "src": "assets/media/svg/misc/015-telegram.svg", "alt": "" })
                                                            //         )
                                                            //     )
                                                            // ),


                                                            m("td", { "class": "text-right", style: "white-space: nowrap;", onclick() { m.route.set("/j/" + _id) } },
                                                                [
                                                                    m(StatNumber, {
                                                                        title: "Total Sales",
                                                                        amount: formatCurrency(totalSales),
                                                                        symbol: 'Ksh'
                                                                    })
                                                                ]
                                                            ),

                                                            m("td", { "class": "text-right", style: "white-space: nowrap;", onclick() { m.route.set("/j/" + _id) } },
                                                                [
                                                                    m(StatNumber, {
                                                                        title: "Total Paid",
                                                                        amount: formatCurrency(totalPaid),
                                                                        // symbol: 'Ksh'
                                                                    })
                                                                ]
                                                            ),

                                                            m("td", { "class": "text-right", style: "white-space: nowrap;", onclick() { m.route.set("/j/" + _id) } },
                                                                [
                                                                    m(StatNumber, {
                                                                        title: "Total Unpaid",
                                                                        amount: formatCurrency(totalUnpaid),
                                                                        // symbol: 'Ksh'
                                                                    })
                                                                ]
                                                            ),

                                                            m("td", { "class": "text-right", style: "white-space: nowrap;", onclick() { m.route.set("/j/" + _id) } },
                                                                [
                                                                    m(StatNumber, {
                                                                        title: "Total Expenses",
                                                                        amount: formatCurrency(totalExpenses),
                                                                        // symbol: 'Leads'
                                                                    })
                                                                ]
                                                            ),

                                                            m("td", { "class": "text-right", style: "white-space: nowrap;", onclick() { m.route.set("/j/" + _id) } },
                                                                [
                                                                    m(StatNumber, {
                                                                        title: "Total Profit",
                                                                        amount: formatCurrency(totalProfit),
                                                                        // symbol: 'Leads'
                                                                    })
                                                                ]
                                                            ),


                                                            m("td", { "class": "text-right", style: "white-space: nowrap;", onclick() { m.route.set("/j/" + _id) } },
                                                                [
                                                                    m(StatNumber, {
                                                                        title: "Total Unique Leads",
                                                                        amount: totalUniqueCustomers,
                                                                        symbol: 'Leads'
                                                                    })
                                                                ]
                                                            ),


                                                            // m("td", { "class": "text-right", style: "white-space: nowrap;", onclick() { m.route.set("/j/" + _id) } },
                                                            //     [
                                                            //         m("span", { "class": "text-dark-75 font-weight-bolder d-block font-size-lg" },
                                                            //             " Total Expenses: X"
                                                            //         ),
                                                            //     ]
                                                            // ),

                                                        ]
                                                    )
                                                ]
                                            )
                                        ]
                                    ) : []
                                )
                            )
                        ]
                    )
                ],
                [
                    m("div", { "class": "card-header border-0 pt-7" },
                        [
                            m("h3", { "class": "card-title align-items-start flex-row" },
                                m("h3", { "class": "card-title align-items-start flex-column" }, [
                                    [
                                        m("span", { "class": "card-label fw-bold text-gray-800" },
                                        !localStorage.getItem('storeId') ? " All Stores " : vnode.state.stores?.filter(store => store._id == localStorage.getItem('storeId'))[0]?.title
                                        + "'s Job Queue"
                                        ),
                                        m("span", { "class": "text-gray-500 mt-3 fw-semibold fs-6" },
                                            dateRange
                                            , [m("div", m("label", { "class": "form-check form-switch form-check-custom form-check-solid" },
                                                [
                                                    m("input", {
                                                        "class": "form-check-input", "type": "checkbox", "value": "1", "checked": "checked",
                                                        checked: vnode.state.showUnpaid,
                                                        onchange: (event) => {
                                                            vnode.state.showUnpaid = event.target.checked;
                                                        }
                                                    }),
                                                    m("span", { "class": "form-check-label fw-semibold text-muted" },
                                                        "Show Unpaid only"
                                                    )
                                                ]
                                            ))])
                                    ],


                                ])),

                            m("div", [
                                ,
                                m("button", {
                                    "class": "btn btn-sm btn-info", onclick() {
                                        m.route.set("/q-new")
                                        setTimeout(() => {
                                            location.reload()
                                        }, 1000)
                                    }
                                },
                                    [
                                        m("i", { "class": "flaticon-add-circular-button" }),
                                        "Add"
                                    ]
                                )]
                            )
                        ]
                    ),
                    m("div", { "class": "card-body pt-0 pb-4" }, [
                        m("div", { "class": "tab-pane fade", "id": "kt_tab_table_5_1", "role": "tabpanel", "aria-labelledby": "kt_tab_table_5_1" },
                            m("div", { "class": "table-responsive" },
                                m("table", { "class": "table table-borderless table-vertical-center" },
                                    [
                                        m("thead",
                                            m("tr",
                                                [
                                                    m("th", { "class": "p-0 w-50px" }),
                                                    m("th", { "class": "p-0 min-w-200px" }),
                                                    m("th", { "class": "p-0 min-w-100px" }),
                                                    m("th", { "class": "p-0 min-w-125px" }),
                                                    m("th", { "class": "p-0 min-w-110px" }),
                                                    m("th", { "class": "p-0 min-w-150px" })
                                                ]
                                            )
                                        ),

                                    ]
                                )
                            )
                        ),

                        m("div", { "class": "tab-pane fade show active", "id": "kt_tab_table_5_3", "role": "tabpanel", "aria-labelledby": "kt_tab_table_5_3" },
                            m("div", { "class": "table-responsive" },
                                !vnode.state.loading ? m("table", { "class": "table table-borderless table-vertical-center" },
                                    [
                                        m("thead",
                                            m("tr",
                                                [
                                                    m("th", { "class": "p-0 w-50px" }),
                                                    m("th", { "class": "p-0 min-w-200px" }),
                                                    m("th", { "class": "p-0 min-w-100px" }),
                                                    m("th", { "class": "p-0 min-w-125px" }),
                                                    m("th", { "class": "p-0 min-w-110px" }),
                                                    m("th", { "class": "p-0 min-w-150px" })
                                                ]
                                            )
                                        ),
                                        m("tbody",
                                            [
                                                vnode.state.jobs
                                                    .filter(job => {
                                                        const storedStartDate = localStorage.getItem("businessRangeStartDate");
                                                        const storedEndDate = localStorage.getItem("businessRangeEndDate");

                                                        // Assuming storedStartDate and storedEndDate are valid date strings
                                                        const startDate = new Date(storedStartDate);
                                                        const endDate = new Date(storedEndDate);

                                                        const businessDate = new Date(job.businessDate);

                                                        // console.log({ businessDate, startDate, businessDate, endDate })
                                                        // Check if the job's business date is within the stored date range
                                                        return businessDate >= startDate && businessDate <= endDate;
                                                    })
                                                    .filter(job => {
                                                        if (localStorage.getItem("storeId"))
                                                            return job.storeId == localStorage.getItem("storeId")
                                                        return true
                                                    })
                                                    .filter(job => {
                                                        // Apply filter only if showUnpaid is true
                                                        if (vnode.state.showUnpaid) {
                                                            return job.paid !== vnode.state.showUnpaid;
                                                        }
                                                        // Return true if showUnpaid is false or undefined, meaning no filter applied
                                                        return true;
                                                    })
                                                    .sort((a, b) => {
                                                        if (vnode.state.showUnpaid) {
                                                            // Assuming businessDate is a valid date string
                                                            const dateA = new Date(a.businessDate);
                                                            const dateB = new Date(b.businessDate);

                                                            // Compare dates for sorting
                                                            return dateA - dateB;
                                                        } else {
                                                            // Assuming createdAtDateTime is a valid date string
                                                            const dateA = new Date(a.createdAtDateTime);
                                                            const dateB = new Date(b.createdAtDateTime);

                                                            // Compare business dates for sorting
                                                            const businessDateComparison = dateA - dateB;

                                                            // If business dates are equal, sort by createdAtDateTime
                                                            if (businessDateComparison === 0) {
                                                                const createdAtDateA = new Date(a.createdAtDateTime);
                                                                const createdAtDateB = new Date(b.createdAtDateTime);
                                                                return createdAtDateA - createdAtDateB;
                                                            }

                                                            return businessDateComparison;
                                                        }
                                                    })
                                                    .map(({
                                                        _id,
                                                        paid = "",
                                                        status = "",
                                                        appartmentName = "",
                                                        houseNumber = "",
                                                        moreDetails = "",
                                                        clientName,
                                                        mpesaPhoneNumber,
                                                        phone,
                                                        mpesaConfirmationCode,
                                                        timeDroppedOffFromNow,
                                                        timePickedUpFromNow,
                                                        generalKgs = 0,
                                                        categoryAmounts = {},
                                                        categoryCharges = {},
                                                        businessDate
                                                    }, index) => {
                                                        // console.log({ index })
                                                        const calculatePrice = () => {

                                                            return Object.keys(categoryAmounts).reduce((total, categoryId) => {
                                                                const amountValue = categoryAmounts[categoryId];
                                                                const chargeValue = categoryCharges[categoryId];

                                                                const subtotal = (amountValue || 0) * (chargeValue || 0);
                                                                return total + subtotal;
                                                            }, 0);
                                                        }

                                                        return m("tr", {
                                                            // key: id,
                                                            style: { "cursor": "pointer" }
                                                        },
                                                            [
                                                                // m("td", { "class": "pl-0 py-5" },
                                                                //     m("div", { "class": "symbol symbol-45 symbol-light mr-2" },
                                                                //         m("span", { "class": "symbol-label" },
                                                                //             m("img", { "class": "h-50 align-self-center", "src": "assets/media/svg/misc/015-telegram.svg", "alt": "" })
                                                                //         )
                                                                //     )
                                                                // ),
                                                                m("td", {
                                                                    "class": "pl-0", onclick() { m.route.set("/j/" + _id) }
                                                                },
                                                                    [
                                                                        m("span", { "class": "text-dark-75 font-weight-bolder text-hover-primary mb-1 font-size-lg", style: "white-space: nowrap;" },
                                                                            m("b", (Number(index) + 1) + ". " + clientName + " (" + phone + ")")
                                                                        ),

                                                                        m("div",
                                                                            [
                                                                                // categoryAmounts,
                                                                                [Object.keys(categoryAmounts)
                                                                                    .filter(charge => categoryAmounts[charge] !== 0)
                                                                                    .map(charge => {
                                                                                        const categoryName = vnode.state.categories.find(category => category._id === charge)?.title;
                                                                                        const chargeAmount = categoryCharges[charge];
                                                                                        const numberOfItems = categoryAmounts[charge];

                                                                                        return `${numberOfItems} ${categoryName} @${chargeAmount} `;
                                                                                    })],
                                                                                m("span", { "class": "font-weight-bolder text-dark-75", style: "white-space: nowrap;" },
                                                                                    `${appartmentName}:`, [m("span", { "class": "text-muted font-weight-bold text-hover-primary", },
                                                                                        " House:" + houseNumber
                                                                                    )]
                                                                                )
                                                                            ]
                                                                        )
                                                                    ]
                                                                ),

                                                                m("td", { "class": "text-left", style: "white-space: nowrap;", onclick() { m.route.set("/j/" + _id) } },
                                                                    [
                                                                        m("span", { "class": "text-dark-75 font-weight-bolder d-block font-size-lg" },
                                                                            `KSH ${formatCurrency(calculatePrice())}`
                                                                        ),
                                                                        m("span", { "class": "text-muted font-weight-bold" },
                                                                            paid ? "Paid " : `Not Paid(${moment(businessDate).fromNow()}): ${moment(businessDate).format('Do, MMM, ddd')}`
                                                                        )
                                                                    ]
                                                                ),

                                                                m("td", { "class": "text-left", style: "white-space: nowrap;", onclick() { m.route.set("/j/" + _id) } },
                                                                    [
                                                                        m("span", { "class": "text-dark-75 font-weight-bolder d-block font-size-lg", style: "white-space: nowrap;", },


                                                                        ),
                                                                        m("span", { "class": "text-muted font-weight-bold", style: "white-space: nowrap;", },
                                                                            moreDetails
                                                                        )
                                                                    ]
                                                                ),
                                                                m("td", { "class": "text-right", style: "white-space: nowrap;", onclick() { m.route.set("/j/" + _id) } },
                                                                    [
                                                                        m("span", { "class": "text-dark-75 font-weight-bolder d-block font-size-lg" },
                                                                            " Status " + status ? status : " No Status Updated"
                                                                        ),
                                                                    ]
                                                                ),
                                                                m("td", { "class": "text-right pr-0", style: "white-space: nowrap;" },
                                                                    m('div', { "class": "" },
                                                                        [
                                                                            // m(editPricing, { "pricing": item }),
                                                                            m('a', {
                                                                                href: "javascript:void(0);",
                                                                                "class": "btn btn-icon btn-light btn-hover-danger btn-sm", onclick() {
                                                                                    const options = {
                                                                                        method: 'DELETE',
                                                                                        url: `${url}/jobs/${_id}`,
                                                                                        headers: {
                                                                                            'Content-Type': 'application/json',
                                                                                            'authorization': localStorage.getItem('token')
                                                                                        },
                                                                                    };

                                                                                    axios.request(options).then(function (response) {

                                                                                        vnode.state.jobs = vnode.state.jobs.filter(p => p._id != _id)
                                                                                        m.redraw()
                                                                                    }).catch(function (error) {
                                                                                        console.error(error);
                                                                                    });
                                                                                }
                                                                            },
                                                                                m('icon', { "class": "flaticon2-rubbish-bin-delete-button" })
                                                                            )
                                                                        ])
                                                                )
                                                            ]
                                                        )
                                                    })
                                            ]
                                        )
                                    ]
                                ) : m(loader)
                            )
                        )
                    ])
                ]
            ]
        )
    }
}

export default orders