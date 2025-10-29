import axios from "axios";
import m from "mithril";
import moment from "moment";
import { url } from "../constants";
import loader from "../components/loader";

// --- Helper Functions (No changes needed) ---
const formatCurrency = (number) => {
    try {
        return Intl.NumberFormat('en-US').format(number);
    } catch (error) {
        console.error('Error formatting number:', error);
        return 'N/A';
    }
};

// --- NEW: Redesigned Stat Widget Component ---
const StatWidget = {
    view(vnode) {
        const { title, amount, symbol, icon, color } = vnode.attrs;
        return m(`.card.bg-${color || 'light'}.bg-opacity-75.shadow-sm.flex-grow-1.m-2`,
            m(".card-body.p-4", [
                m("div.d-flex.align-items-center", [
                    icon ? m(`.symbol.symbol-40px.me-3`,
                        m(".symbol-label", { class: `bg-${color} bg-opacity-75` },
                            m(`i.fa.${icon}.fs-2x`, { class: `text-white` })
                        )
                    ) : null,
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

const orders = {
    // --- oninit & oncreate (Logic remains the same) ---
    oninit(vnode) {
        vnode.state.stores = [];
        vnode.state.expenses = [];
        vnode.state.jobs = [];
        vnode.state.pricings = [];
        vnode.state.categories = [];
        vnode.state.loading = true;
        vnode.state.showUnpaid = false;
        vnode.state.stats = {
            totalSales: 0,
            totalPaid: 0,
            totalUnpaid: 0,
            totalUniqueCustomers: 0,
            totalExpenses: 0,
            totalProfit: 0
        };

        const getValueFromLocalStorageOrQueryParams = (key, defaultValue) => {
            let storedValue = localStorage.getItem(key) || new URLSearchParams(window.location.search).get(key);
            if (!storedValue && defaultValue) {
                storedValue = defaultValue;
                localStorage.setItem(key, storedValue);
                // Optionally update URL
            }
            return storedValue;
        };
        
        const defaultStartDate = moment().subtract(3, 'days').format('YYYY-MM-DD');
        const defaultEndDate = moment().format('YYYY-MM-DD');
        
        getValueFromLocalStorageOrQueryParams("businessRangeStartDate", defaultStartDate);
        getValueFromLocalStorageOrQueryParams("businessRangeEndDate", defaultEndDate);
    },

    oncreate(vnode) {
        const fetchData = async (options) => {
            try {
                const response = await axios.request(options);
                return response.data;
            } catch (error) {
                console.error(`Error fetching ${options.url}:`, error);
                return []; // Return empty array on error to prevent crashes
            }
        };

        const authHeaders = {
            'Content-Type': 'application/json',
            'authorization': localStorage.getItem('token')
        };

        Promise.all([
            fetchData({ method: 'GET', url: `${url}/jobs`, headers: authHeaders }),
            fetchData({ method: 'GET', url: `${url}/pricings`, headers: authHeaders }),
            fetchData({ method: 'GET', url: `${url}/categories`, headers: authHeaders }),
            fetchData({ method: 'GET', url: `${url}/expenses`, headers: authHeaders }),
            fetchData({ method: 'GET', url: `${url}/stores`, headers: authHeaders })
        ]).then(([jobs, pricings, categories, expenses, stores]) => {
            vnode.state.pricings = pricings;
            vnode.state.categories = categories;
            vnode.state.expenses = expenses;
            vnode.state.stores = stores;

            vnode.state.jobs = jobs.map(job => {
                const calculatePrice = () => {
                    if (!job.categoryAmounts) return 0;
                    return Object.keys(job.categoryAmounts).reduce((total, categoryId) => {
                        const amount = job.categoryAmounts[categoryId] || 0;
                        const charge = job.categoryCharges?.[categoryId] || 0;
                        return total + (amount * charge);
                    }, 0);
                };
                return { ...job, price: calculatePrice() };
            });

            vnode.state.loading = false;
            m.redraw();
        });
    },

    // --- NEW: Refactored View with Helper Functions ---
    view(vnode) {
        const { loading, stores, expenses, jobs, categories, showUnpaid } = vnode.state;
        const storeId = localStorage.getItem("storeId");
        const startDate = localStorage.getItem("businessRangeStartDate");
        const endDate = localStorage.getItem("businessRangeEndDate");

        // --- Data Processing Logic (Moved to top of view for clarity) ---
        const filteredJobs = jobs.filter(job => {
            const jobDate = moment(job.businessDate);
            const isAfterStart = jobDate.isSameOrAfter(startDate, 'day');
            const isBeforeEnd = jobDate.isSameOrBefore(endDate, 'day');
            const matchesStore = storeId ? job.storeId === storeId : true;
            const matchesUnpaid = showUnpaid ? !job.paid : true;
            return isAfterStart && isBeforeEnd && matchesStore && matchesUnpaid;
        }).sort((a, b) => new Date(b.createdAtDateTime) - new Date(a.createdAtDateTime));

        // --- Stat Calculation Logic ---
        const calculateStats = () => {
            const relevantJobs = jobs.filter(job => {
                const jobDate = moment(job.businessDate);
                const isAfterStart = jobDate.isSameOrAfter(startDate, 'day');
                const isBeforeEnd = jobDate.isSameOrBefore(endDate, 'day');
                 const matchesStore = storeId ? job.storeId === storeId : true;
                return isAfterStart && isBeforeEnd && matchesStore;
            });

            const totalSales = relevantJobs.reduce((sum, job) => sum + (job.price || 0), 0);
            const totalPaid = relevantJobs.filter(j => j.paid).reduce((sum, job) => sum + (job.price || 0), 0);
            const totalUniqueCustomers = new Set(relevantJobs.map(job => job.phone)).size;
            
            const calculateTotalExpenses = () => {
                const start = moment(startDate);
                const end = moment(endDate);
                const daysInRange = end.diff(start, 'days') + 1;
                let total = 0;

                expenses.forEach(exp => {
                    if (storeId && exp.storeId !== storeId) return;
                    
                    if (exp.recurrent) {
                        total += (parseInt(exp.cost, 10) || 0) * daysInRange;
                    } else {
                        const expDate = moment(exp.businessDate);
                        if (expDate.isBetween(start, end, 'day', '[]')) {
                             total += parseInt(exp.cost, 10) || 0;
                        }
                    }
                });
                return total;
            };

            const totalExpenses = calculateTotalExpenses();
            return {
                totalSales,
                totalPaid,
                totalUnpaid: totalSales - totalPaid,
                totalUniqueCustomers,
                totalExpenses,
                totalProfit: totalSales - totalExpenses
            };
        };

        const stats = calculateStats();
        
        // --- Render Helper Functions ---
        const renderStats = (currentStats) => m(".d-flex.flex-wrap.justify-content-center.mb-5", [
            m(StatWidget, { title: "Total Sales", amount: currentStats.totalSales, symbol: "Ksh", color: "primary", icon: "fa-sack-dollar" }),
            m(StatWidget, { title: "Total Expenses", amount: currentStats.totalExpenses, symbol: "Ksh", color: "danger", icon: "fa-receipt" }),
            m(StatWidget, { title: "Net Profit", amount: currentStats.totalProfit, symbol: "Ksh", color: "success", icon: "fa-arrow-trend-up" }),
            m(StatWidget, { title: "Amount Paid", amount: currentStats.totalPaid, symbol: "Ksh", color: "info" }),
            m(StatWidget, { title: "Amount Unpaid", amount: currentStats.totalUnpaid, symbol: "Ksh", color: "warning" }),
            m(StatWidget, { title: "Unique Customers", amount: currentStats.totalUniqueCustomers, icon: "fa-users" }),
        ]);

        const renderToolbar = () => {
            const storeTitle = storeId ? stores.find(s => s._id === storeId)?.title : "All Stores";
            const dateRange = `${moment(startDate).format('MMM D')} - ${moment(endDate).format('MMM D, YYYY')}`;

            return m(".card-header.border-0.pt-7.d-flex.justify-content-between.align-items-center", [
                m("div", [
                    m("h3.card-title.align-items-start.flex-column", [
                        m("span.card-label.fw-bold.fs-3.mb-1", `${storeTitle} Queue`),
                        m("span.text-muted.mt-1.fw-semibold.fs-7", dateRange)
                    ])
                ]),
                m(".d-flex.align-items-center", [
                    m(".form-check.form-switch.me-4", [
                        m("input.form-check-input", {
                            type: "checkbox",
                            checked: showUnpaid,
                            onchange: e => vnode.state.showUnpaid = e.target.checked
                        }),
                        m("label.form-check-label.text-muted", "Show Unpaid Only")
                    ]),
                    m("button.btn.btn-sm.btn-primary", { onclick: () => m.route.set("/q-new") },
                        m("i.fa.fa-plus.me-1"), "New Job"
                    )
                ])
            ]);
        };
        
        const renderJobList = () => {
            if (filteredJobs.length === 0) {
                return m(".text-center.p-10", [
                     m("img", { src: "./undraw_add_information_j2wg.svg", style: { maxWidth: "250px", marginBottom: "1rem" } }),
                     m("h4.text-muted", `No jobs found for ${moment(startDate).format('MMM D')} - ${moment(endDate).format('MMM D')}`),
                     m("button.btn.btn-primary.mt-4", { onclick: () => m.route.set("/q-new") }, "Add the First Job")
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
                            m("p.mb-1.text-muted",
                                [
                                    m("span.me-3", `📞 ${job.phone || 'No phone'}`),
                                    m("span", `📍 ${job.appartmentName || 'No address'}`)
                                ]
                            ),
                            m("div.mt-2",
                                Object.keys(job.categoryAmounts || {})
                                .filter(id => job.categoryAmounts[id] > 0)
                                .map(id => {
                                    const category = categories.find(c => c._id === id);
                                    return m("span.badge.bg-light.text-dark.me-1", `${job.categoryAmounts[id]} ${category?.title || 'item'}`);
                                })
                            )
                        ]),
                        m(".ms-4.text-end", { style: { minWidth: "120px" } }, [
                            m("h4.fw-bolder.mb-0", `Ksh ${formatCurrency(job.price)}`),
                            m(`span.badge`, { class: job.paid ? 'bg-success' : 'bg-warning' },
                                job.paid ? "Paid" : `Unpaid`
                            ),
                             m("div.text-muted.fs-7.mt-1", `Status: ${job.status || 'Pending'}`)
                        ]),
                        m(".ms-4",
                            m("button.btn.btn-icon.btn-light-danger.btn-sm", {
                                title: "Delete Job",
                                onclick: (e) => {
                                    e.stopPropagation(); // Prevent navigation
                                    if (confirm("Are you sure you want to delete this job?")) {
                                        axios.delete(`${url}/jobs/${job._id}`, { headers: { authorization: localStorage.getItem('token') } })
                                        .then(() => {
                                            vnode.state.jobs = vnode.state.jobs.filter(j => j._id !== job._id);
                                            m.redraw();
                                        }).catch(err => console.error("Deletion failed:", err));
                                    }
                                }
                            }, m("i.fa.fa-trash"))
                        )
                    ])
                )
            ));
        };

        // --- Final Component Structure ---
        return m(".card.card-custom.gutter-b", [
            loading ? m(loader) : [
                m(".card-body", renderStats(stats)),
                renderToolbar(),
                m(".card-body.pt-0.pb-4", renderJobList())
            ]
        ]);
    }
};

export default orders;