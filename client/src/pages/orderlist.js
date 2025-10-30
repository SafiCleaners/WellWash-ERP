import axios from "axios";
import m from "mithril";
import moment from "moment";
import { url } from "../constants";
import loader from "../components/loader";
import expensesList from "../pages/expenses";
// import stock_levels from "../pages/stock_levels"; // Uncomment when ready to use

// --- Helper Functions ---
const formatCurrency = (number) => {
    // Provides a fallback for null/undefined values
    return new Intl.NumberFormat('en-US').format(number || 0);
};

// --- Reusable UI Components ---
const StatWidget = {
    view({ attrs: { title, amount, symbol, icon, color } }) {
        return m(`.card.bg-light-${color}.shadow-sm.flex-grow-1.m-2`,
            m(".card-body.p-4", [
                m(".d-flex.align-items-center", [
                    m(`.symbol.symbol-40px.me-3`,
                        m(".symbol-label", { class: `bg-${color}` },
                            m(`i.fa.${icon}.fs-2x.text-white`)
                        )
                    ),
                    m("div", [
                        m("div.fs-4.fw-bold.text-gray-900.lh-1",
                            (symbol ? `${symbol} ` : '') + formatCurrency(amount)
                        ),
                        m("div.fw-semibold.text-gray-600", title)
                    ])
                ])
            ])
        );
    }
};

const DashboardPage = {
    // --- Data Fetching and State Management ---
    fetchData(vnode) {
        vnode.state.loading = true;
        const authHeaders = { authorization: localStorage.getItem('token') };
        const get = (endpoint) => axios.get(`${url}/${endpoint}`, { headers: authHeaders });

        Promise.all([
            get('jobs'),
            get('categories'),
            get('expenses'),
            get('stores')
        ]).then(([jobsRes, categoriesRes, expensesRes, storesRes]) => {
            // Pre-process jobs to calculate price and create a category map for quick lookups
            const categoryMap = new Map(categoriesRes.data.map(cat => [cat._id, cat.title]));

            vnode.state.jobs = jobsRes.data.map(job => {
                const price = Object.keys(job.categoryAmounts || {}).reduce((total, id) => {
                    const amount = job.categoryAmounts[id] || 0;
                    const charge = job.categoryCharges?.[id] || 0;
                    return total + (amount * charge);
                }, 0);
                return { ...job, price, categoryMap }; // Attach map for later use
            });

            vnode.state.categories = categoriesRes.data;
            vnode.state.expenses = expensesRes.data;
            vnode.state.stores = storesRes.data;

        }).catch(error => {
            console.error("Failed to load dashboard data:", error);
            // Optionally set an error state to show a message to the user
        }).finally(() => {
            vnode.state.loading = false;
            m.redraw();
        });
    },

    oninit(vnode) {
        vnode.state.loading = true;
        vnode.state.jobs = [];
        vnode.state.stores = [];
        vnode.state.expenses = [];
        vnode.state.categories = [];

        // --- CRITICAL FIX: Synchronize date with URL and LocalStorage ---
        // Priority: 1. URL Query Param, 2. LocalStorage, 3. Today's Date
        const queryParams = m.parseQueryString(window.location.search);
        const dateFromURL = queryParams.businessDate;
        const dateFromStorage = localStorage.getItem("businessDate");

        const initialDate = dateFromURL || dateFromStorage || moment().format('YYYY-MM-DD');
        vnode.state.businessDate = moment(initialDate);

        // Ensure localStorage is in sync with the determined date
        localStorage.setItem("businessDate", vnode.state.businessDate.format('YYYY-MM-DD'));

        // This function will be passed down to child components like expensesList
        vnode.state.onUpdate = () => DashboardPage.fetchData(vnode);

        // Initial data load
        DashboardPage.fetchData(vnode);
    },

    view(vnode) {
        const { loading, jobs, stores, expenses, businessDate } = vnode.state;

        if (loading) {
            return m(loader);
        }

        const storeId = localStorage.getItem("storeId");

        // --- Perform all filtering and calculations once at the top for efficiency ---
        const filteredJobs = jobs
            .filter(job =>
                moment(job.businessDate).isSame(businessDate, 'day') &&
                (!storeId || job.storeId === storeId)
            )
            .sort((a, b) => new Date(b.createdAtDateTime) - new Date(a.createdAtDateTime));

        const filteredExpenses = expenses.filter(exp =>
            (!storeId || exp.storeId === storeId) &&
            (exp.recurrent || moment(exp.businessDate).isSame(businessDate, 'day'))
        );

        const calculateStats = () => {
            const totalSales = filteredJobs.reduce((sum, job) => sum + job.price, 0);
            const totalExpenses = filteredExpenses.reduce((total, exp) => total + (parseInt(exp.cost, 10) || 0), 0);
            return {
                totalSales,
                totalExpenses,
                totalProfit: totalSales - totalExpenses,
                totalJobs: filteredJobs.length
            };
        };

        const stats = calculateStats();

        // --- Render Helper for the NEW Job List Design ---
        const renderJobList = () => {
            if (filteredJobs.length === 0) {
                return m(".text-center.p-10", [
                    m("img.img-fluid.mb-4", { src: "./undraw_add_information_j2wg.svg", style: { maxWidth: "250px" } }),
                    m("h4.fw-bold.text-gray-700", `No Jobs Found`),
                    m("p.text-muted", `There are no jobs recorded for ${businessDate.format('MMM D, YYYY')}`)
                ]);
            }
            return filteredJobs.map((job, index) =>
                m(".job-card.bg-light.rounded.p-3.mb-3.shadow-sm", {
                    key: job._id,
                    onclick: () => m.route.set(`/j/${job._id}`)
                },
                    m(".d-flex", [
                        // Column 1: Job Number
                        m(".me-4.text-center", [
                            m("div.fw-bolder.fs-2.text-primary", index + 1),
                            m("div.text-muted.small", "JOB")
                        ]),

                        // Column 2: Job Details (takes up most space)
                        m(".flex-grow-1", [
                            m(".d-flex.justify-content-between.align-items-start", [
                                m("div", [
                                    m("h5.fw-bolder.text-dark.mb-1", job.clientName || 'N/A'),
                                    m("div.text-muted.d-flex.align-items-center",
                                        m("i.fa.fa-phone.me-2.small"),
                                        m("span", job.phone || 'No phone')
                                    )
                                ]),
                                m("small.text-muted.text-nowrap", moment(job.createdAtDateTime).fromNow())
                            ]),
                            m("hr.my-2"),
                            // Job Items Breakdown
                            m("div.small", Object.keys(job.categoryAmounts).map(catId =>
                                m(".d-flex.justify-content-between.py-1", [
                                    m("span.text-gray-700", `${job.categoryAmounts[catId]} x ${job.categoryMap.get(catId) || 'Unknown Item'}`),
                                    m("span.fw-semibold.text-gray-600", `Ksh ${formatCurrency(job.categoryAmounts[catId] * (job.categoryCharges?.[catId] || 0))}`)
                                ])
                            ))
                        ]),

                        // Column 3: Price and Status
                        m(".ms-4.text-end", { style: { minWidth: "100px" } }, [
                            m("h4.fw-bolder.mb-1", `Ksh ${formatCurrency(job.price)}`),
                            m(`span.badge.fs-7`, { class: job.paid ? 'bg-success text-white' : 'bg-warning text-dark' }, job.paid ? "Paid" : "Unpaid")
                        ])
                    ])
                )
            );
        };

        // --- Main Page Layout ---
        return m(".container-xxl.py-4.py-lg-5", [
            // Page Header
            m(".d-flex.justify-content-between.align-items-center.mb-5", [
                m("div", [
                    m("h1.fw-bolder", "Daily Dashboard"),
                    m("span.text-muted.fs-5", `Showing data for ${businessDate.format('dddd, MMMM Do YYYY')}`)
                ])
            ]),

            // Section 1: Daily Summary Stats
            m(".d-flex.flex-wrap.justify-content-center.mb-5", [
                m(StatWidget, { title: "Total Sales", amount: stats.totalSales, symbol: "Ksh", color: "primary", icon: "fa-sack-dollar" }),
                m(StatWidget, { title: "Total Expenses", amount: stats.totalExpenses, symbol: "Ksh", color: "danger", icon: "fa-receipt" }),
                m(StatWidget, { title: "Net Profit", amount: stats.totalProfit, symbol: "Ksh", color: "success", icon: "fa-arrow-trend-up" }),
                m(StatWidget, { title: "Jobs Today", amount: stats.totalJobs, color: "info", icon: "fa-check-to-slot" })
            ]),

            // Section 2: Job Queue
            m(".card.shadow-sm.mb-5", [
                m(".card-header.border-0.pt-4.d-flex.justify-content-between.align-items-center", [
                    m("h3.card-title.align-items-start.flex-column", [
                        m("span.card-label.fw-bolder.text-dark", "Job Queue"),
                        m("span.text-muted.mt-1.fw-semibold.fs-7", `${stats.totalJobs} jobs for today`)
                    ]),
                    m("button.btn.btn-primary", { onclick: () => m.route.set("/q-new") },
                        m("i.fa.fa-plus.me-1"), "New Job"
                    )
                ]),
                m(".card-body.pt-2", renderJobList())
            ]),

            // Section 3: Expenses
            m(expensesList, {
                expenses: filteredExpenses, // Pass pre-filtered expenses
                stores: vnode.state.stores,
                onUpdate: vnode.state.onUpdate
            })
        ]);
    }
};

export default DashboardPage;