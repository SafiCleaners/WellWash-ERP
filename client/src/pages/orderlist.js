import axios from "axios";
import m from "mithril";
import moment from "moment";
import { url } from "../constants";
import loader from "../components/loader";
import expensesList from "../pages/expenses";
import stock_levels from "../pages/stock_levels";

// --- Helper Functions ---
const formatCurrency = (number) => {
    return new Intl.NumberFormat('en-US').format(number || 0);
};

// --- Reusable UI Components ---
const StatWidget = {
    view(vnode) {
        const { title, amount, symbol, icon, color } = vnode.attrs;
        return m(`.card.bg-light-${color}.shadow-sm.flex-grow-1.m-2`,
            m(".card-body.p-4", [
                m("div.d-flex.align-items-center", [
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
    oninit(vnode) {
        vnode.state.loading = true;
        vnode.state.jobs = [];
        vnode.state.stores = [];
        vnode.state.expenses = [];
        vnode.state.categories = [];

        const storedDate = localStorage.getItem("businessDate");
        vnode.state.businessDate = storedDate ? moment(storedDate) : moment();
        localStorage.setItem("businessDate", vnode.state.businessDate.toISOString());

        vnode.state.onUpdate = () => {
            // Set loading true and recall the data fetching
            vnode.state.loading = true;
            vnode.state.oncreate(vnode); // Re-run the oncreate logic to fetch all data
        };
    },

    oncreate(vnode) {
        const authHeaders = { authorization: localStorage.getItem('token') };
        const fetchData = (endpoint) => axios.get(`${url}/${endpoint}`, { headers: authHeaders });

        Promise.all([
            fetchData('jobs'),
            fetchData('categories'),
            fetchData('expenses'),
            fetchData('stores')
        ]).then(([jobsRes, categoriesRes, expensesRes, storesRes]) => {
            vnode.state.jobs = jobsRes.data.map(job => {
                const price = Object.keys(job.categoryAmounts || {}).reduce((total, id) => {
                    const amount = job.categoryAmounts[id] || 0;
                    const charge = job.categoryCharges?.[id] || 0;
                    return total + (amount * charge);
                }, 0);
                return { ...job, price };
            });
            vnode.state.categories = categoriesRes.data;
            vnode.state.expenses = expensesRes.data;
            vnode.state.stores = storesRes.data;
        }).catch(error => {
            console.error("Failed to load dashboard data:", error);
        }).finally(() => {
            vnode.state.loading = false;
            m.redraw();
        });
    },

    view(vnode) {
        const { loading, jobs, stores, expenses, categories, businessDate } = vnode.state;
        const storeId = localStorage.getItem("storeId");

        // --- Perform all filtering and calculations once at the top ---
        const filteredJobs = jobs.filter(job =>
            moment(job.businessDate).isSame(businessDate, 'day') &&
            (!storeId || job.storeId === storeId)
        ).sort((a, b) => new Date(b.createdAtDateTime) - new Date(a.createdAtDateTime));

        const calculateStats = () => {
            const totalSales = filteredJobs.reduce((sum, job) => sum + job.price, 0);
            const totalExpenses = expenses.reduce((total, exp) => {
                if ((storeId && exp.storeId !== storeId)) return total;
                if (exp.recurrent || moment(exp.businessDate).isSame(businessDate, 'day')) {
                    return total + (parseInt(exp.cost, 10) || 0);
                }
                return total;
            }, 0);

            return {
                totalSales,
                totalExpenses,
                totalProfit: totalSales - totalExpenses,
                totalJobs: filteredJobs.length
            };
        };

        const stats = calculateStats();
        
        // --- Render Helper for the Job List ---
        const renderJobList = () => {
             if (filteredJobs.length === 0) {
                return m(".text-center.p-10", [
                     m("img", { src: "./undraw_add_information_j2wg.svg", style: { maxWidth: "250px", marginBottom: "1rem" } }),
                     m("h4.text-muted", `No jobs found for ${businessDate.format('MMM D')}`),
                ]);
            }
            return m(".list-group.list-group-flush", filteredJobs.map((job, index) =>
                m("a.list-group-item.list-group-item-action.px-5.py-4", {
                    key: job._id,
                    onclick: () => m.route.set(`/j/${job._id}`)
                },
                    m(".d-flex.w-100.align-items-center", [
                        m("div.flex-grow-1", [
                            m("div.d-flex.justify-content-between.align-items-center", [
                                m("h5.mb-1.fw-bolder.text-dark", `${index + 1}. ${job.clientName || 'N/A'}`),
                                m("small.text-muted", moment(job.createdAtDateTime).fromNow())
                            ]),
                            m("p.mb-1.text-muted", `📞 ${job.phone || 'No phone'}`),
                        ]),
                        m(".ms-4.text-end", { style: { minWidth: "120px" } }, [
                            m("h4.fw-bolder.mb-0", `Ksh ${formatCurrency(job.price)}`),
                            m(`span.badge`, { class: job.paid ? 'bg-success' : 'bg-warning' }, job.paid ? "Paid" : "Unpaid")
                        ])
                    ])
                )
            ));
        };

        if (loading) {
            return m(loader);
        }

        // --- Main Page Layout ---
        return m(".container-fluid.py-5", [
            // Page Header
            m(".d-flex.justify-content-between.align-items-center.mb-5", [
                m("div", [
                    m("h2.fw-bolder", "Daily Dashboard"),
                    m("span.text-muted", `Showing data for ${businessDate.format('dddd, MMMM Do YYYY')}`)
                ])
                // Date picker could go here if needed in the future
            ]),

            // Section 1: Daily Summary Stats
            m(".card.shadow-sm.mb-5", [
                // m(".card-header", m("h3.card-title.fw-bold", "Daily Summary")),
                // m(".card-body", 
                    m(".d-flex.flex-wrap.justify-content-center", [
                        m(StatWidget, { title: "Total Sales", amount: stats.totalSales, symbol: "Ksh", color: "primary", icon: "fa-sack-dollar" }),
                        m(StatWidget, { title: "Total Expenses", amount: stats.totalExpenses, symbol: "Ksh", color: "danger", icon: "fa-receipt" }),
                        m(StatWidget, { title: "Net Profit", amount: stats.totalProfit, symbol: "Ksh", color: "success", icon: "fa-arrow-trend-up" }),
                        m(StatWidget, { title: "Jobs Today", amount: stats.totalJobs, color: "info", icon: "fa-check-to-slot" })
                    ])
                // )
            ]),

            // Section 2: Job Queue
            m(".card.shadow-sm.mb-5", [
                m(".card-header.d-flex.justify-content-between.align-items-center", [
                    m("h3.card-title.fw-bold", "Job Queue"),
                    m("button.btn.btn-sm.btn-primary", { onclick: () => m.route.set("/q-new") }, 
                        m("i.fa.fa-plus.me-1"), "New Job"
                    )
                ]),
                m(".card-body.p-0", renderJobList())
            ]),

            // Section 3: Expenses
            m(".card.shadow-sm.mb-5", [
                m(".card-header", m("h3.card-title.fw-bold", "Expenses")),
                console.log(expensesList),
                m(".card-body",  m(expensesList, {
                    expenses: vnode.state.expenses,
                    stores: vnode.state.stores,
                    brands: vnode.state.brands,
                    businessDate: vnode.state.businessDate,
                    onUpdate: vnode.state.onUpdate // Pass the callback here
                }))
            ]),

            // // Section 4: Stock Levels
            // m(".card.shadow-sm", [
            //     m(".card-header", m("h3.card-title.fw-bold", "Stock Levels")),
            //     m(".card-body", m(stock_levels))
            // ]),
        ]);
    }
};

export default DashboardPage;