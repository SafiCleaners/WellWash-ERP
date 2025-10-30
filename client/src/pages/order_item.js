import axios from "axios";
import m from "mithril";
import moment from "moment";
import { url, operationTimes } from "../constants";
import loader from "../components/loader";
import dayRangeCalculator from "../dateCalculator";
import incrementableInput from "../components/input";

// --- Main Component ---
const order_item = {
    oninit: function (vnode) {
        vnode.state.isLoading = true;
        vnode.state.isSaving = false;
        vnode.state.job = null;
        vnode.state.originalJob = null;
        vnode.state.pricings = [];
        vnode.state.categories = [];
    },

    oncreate: function (vnode) {
        const jobId = m.route.param("job");
        const headers = { 'authorization': localStorage.getItem('token') };

        Promise.all([
            axios.get(`${url}/jobs/${jobId}`, { headers }),
            axios.get(`${url}/pricings`, { headers }),
            axios.get(`${url}/categories`, { headers })
        ]).then(([jobRes, pricingsRes, categoriesRes]) => {
            vnode.state.job = jobRes.data;
            vnode.state.originalJob = JSON.parse(JSON.stringify(jobRes.data)); // Deep copy for comparison
            vnode.state.pricings = pricingsRes.data;
            vnode.state.categories = categoriesRes.data;
        }).catch(error => {
            console.error("Failed to load order data:", error);
            // Optionally set an error state to show a message
        }).finally(() => {
            vnode.state.isLoading = false;
            m.redraw();
        });
    },

    // --- Core Logic ---
    calculatePrice: (job) => {
        if (!job || !job.categoryAmounts) return 0;
        return Object.keys(job.categoryAmounts).reduce((total, id) => {
            const amount = job.categoryAmounts[id] || 0;
            const charge = job.categoryCharges?.[id] || 0;
            return total + (amount * charge);
        }, 0);
    },

    updateOrderOnServer: (vnode) => {
        if (!vnode.state.job) return;

        vnode.state.isSaving = true;
        
        // Construct a clean payload with only the fields that can be edited
        const payload = {
            clientName: vnode.state.job.clientName,
            phone: vnode.state.job.phone,
            appartmentName: vnode.state.job.appartmentName,
            houseNumber: vnode.state.job.houseNumber,
            pickupDay: vnode.state.job.pickupDay,
            pickupTime: vnode.state.job.pickupTime,
            dropOffDay: vnode.state.job.dropOffDay,
            dropOffTime: vnode.state.job.dropOffTime,
            categoryAmounts: vnode.state.job.categoryAmounts,
            categoryCharges: vnode.state.job.categoryCharges,
            statusInfo: vnode.state.job.statusInfo,
            moreDetails: vnode.state.job.moreDetails,
            mpesaConfirmationCode: vnode.state.job.mpesaConfirmationCode,
            paid: vnode.state.job.paid,
            skipSms: vnode.state.job.skipSms,
            businessDate: localStorage.getItem("businessDate"), // Always use the globally set date
            storeId: localStorage.getItem("storeId")
        };

        axios.patch(`${url}/jobs/${vnode.state.job._id}`, payload, {
            headers: { 'authorization': localStorage.getItem('token') }
        }).then(() => {
            // Success: navigate back to the job queue
            m.route.set("/j");
        }).catch(error => {
            console.error("Failed to save order:", error);
            // Optionally show an error message to the user
        }).finally(() => {
            vnode.state.isSaving = false;
            m.redraw();
        });
    },

    // --- Render Helper for the Header ---
    renderHeaderCard(vnode) {
        const { job } = vnode.state;
        const totalPrice = this.calculatePrice(job);
        const currentStatus = job.statusInfo && job.statusInfo.length > 0 ? job.statusInfo[0].status.replace("_", " ") : "N/A";

        return m(".card.shadow-sm.mb-5",
            m(".card-body.p-4",
                m(".d-flex.flex-wrap.align-items-center.justify-content-between", [
                    // Client Info
                    m(".me-4.mb-2", [
                        m("h4.fw-bolder.text-gray-800.mb-1", job.clientName),
                        m(".text-muted.d-flex.align-items-center", [
                            m("i.fa.fa-phone.me-2.small"),
                            m("span", job.phone)
                        ])
                    ]),
                    // Price and Payment Status
                    m(".me-4.mb-2", [
                        m("h4.fw-bolder.text-gray-800.mb-1", `Ksh ${new Intl.NumberFormat().format(totalPrice)}`),
                        m(`span.badge.fs-7`, { class: job.paid ? 'bg-success text-white' : 'bg-warning text-dark' }, job.paid ? "Paid" : "Unpaid")
                    ]),
                    // Current Status
                    m(".me-4.mb-2", [
                         m("h4.fw-bolder.text-gray-800.mb-1", currentStatus),
                         m(".text-muted.small", "Current Status")
                    ]),
                    // Created Date
                    m(".mb-2", [
                        m("h4.fw-bolder.text-gray-800.mb-1", moment(job.createdAt).format("MMM D, YYYY")),
                        m(".text-muted.small", "Date Created")
                    ])
                ])
            )
        );
    },

    // --- Render Helper for Form Sections ---
    renderCustomerCard(vnode) {
        const { job } = vnode.state;
        return m(".card.shadow-sm.mb-5", [
            m(".card-header", m("h3.card-title.fw-bold", "Customer Details")),
            m(".card-body",
                m(".row.g-3", [
                    m(".col-md-6", [
                        m("label.form-label", "Customer Name"),
                        m("input.form-control", { value: job.clientName, oninput: e => job.clientName = e.target.value })
                    ]),
                    m(".col-md-6", [
                        m("label.form-label", "Phone Number"),
                        m("input.form-control", { value: job.phone, oninput: e => job.phone = e.target.value })
                    ]),
                    m(".col-md-6", [
                        m("label.form-label", "Apartment Name"),
                        m("input.form-control", { value: job.appartmentName, oninput: e => job.appartmentName = e.target.value })
                    ]),
                    m(".col-md-6", [
                        m("label.form-label", "House Number"),
                        m("input.form-control", { value: job.houseNumber, oninput: e => job.houseNumber = e.target.value })
                    ]),
                ])
            )
        ]);
    },
    
    renderScheduleCard(vnode) {
        const { job } = vnode.state;
        return m(".card.shadow-sm.mb-5", [
             m(".card-header", m("h3.card-title.fw-bold", "Pickup & Drop-off Schedule")),
             m(".card-body.row.g-4", [
                 m(".col-lg-6", [
                     m("label.form-label.fw-bold", "Pickup Date"),
                     m(".btn-group.w-100", dayRangeCalculator().map(({ date, dayName, day, nth }) => 
                         m(`label.btn.btn-outline-primary`, { class: job.pickupDay === date.format('L') ? 'active' : '' }, [
                            m("input.btn-check", { type: "radio", name: "pickupDay", checked: job.pickupDay === date.format('L'), onchange: () => job.pickupDay = date.format('L') }),
                            `${dayName} ${day}${nth}`
                         ])
                     ))
                 ]),
                 m(".col-lg-6", [
                    m("label.form-label.fw-bold", "Pickup Time"),
                    m("select.form-select", { onchange: e => job.pickupTime = e.target.value },
                        operationTimes.map(time => m("option", { selected: job.pickupTime === time }, time))
                    )
                 ]),
                 m(".col-lg-6", [
                    m("label.form-label.fw-bold", "Drop-off Date"),
                    m(".btn-group.w-100", dayRangeCalculator(job.pickupDay).map(({ date, dayName, day, nth }) => 
                         m(`label.btn.btn-outline-primary`, { class: job.dropOffDay === date.format('L') ? 'active' : '' }, [
                            m("input.btn-check", { type: "radio", name: "dropOffDay", checked: job.dropOffDay === date.format('L'), onchange: () => job.dropOffDay = date.format('L') }),
                            `${dayName} ${day}${nth}`
                         ])
                     ))
                 ]),
                 m(".col-lg-6", [
                    m("label.form-label.fw-bold", "Drop-off Time"),
                    m("select.form-select", { onchange: e => job.dropOffTime = e.target.value },
                        operationTimes.map(time => m("option", { selected: job.dropOffTime === time }, time))
                    )
                 ])
             ])
        ]);
    },
    
    renderItemsCard(vnode) {
        const { job, categories, pricings } = vnode.state;
        const brandId = localStorage.getItem('brand');
        const totalPrice = this.calculatePrice(job);

        return m(".card.shadow-sm.mb-5", [
            m(".card-header", m("h3.card-title.fw-bold", "Order Items & Pricing")),
            m(".card-body", [
                m(".row.g-3", categories
                    .filter(cat => cat.brand === brandId)
                    .map(category => m(incrementableInput, {
                        name: category.title,
                        charge: job.categoryCharges?.[category._id] || 0,
                        amount: job.categoryAmounts?.[category._id] || 0,
                        pricing: pricings
                            .filter(p => p.category === category._id)
                            .map(p => ({ amount: p.cost, label: p.cost })),
                        onChange: ({ amountValue, chargeValue }) => {
                            job.categoryAmounts[category._id] = amountValue;
                            job.categoryCharges[category._id] = chargeValue;
                        },
                        pickerSize: 12, pickerSizeMD: 6, pickerSizeLG: 4 // Adjust layout
                    }))
                ),
                m("hr.my-4"),
                m(".text-end", [
                    m("span.text-muted.me-2", "Total Estimated Cost:"),
                    m("span.fw-bolder.fs-3", `Ksh ${new Intl.NumberFormat().format(totalPrice)}`)
                ])
            ])
        ]);
    },
    
    renderStatusCard(vnode) {
        const { job } = vnode.state;
        const statuses = ["PICK_UP", "COLLECTED", "PROCESSING", "QUALITY_CHECK", "DISPATCH", "DELIVERED", "BLOCKED"];
        const currentStatus = job.statusInfo && job.statusInfo[0] ? job.statusInfo[0].status : null;
        
        return m(".card.shadow-sm.mb-5", [
             m(".card-header", m("h3.card-title.fw-bold", "Update Order Status")),
             m(".card-body", 
                m(".btn-group.w-100.flex-wrap", statuses.map(status =>
                    m(`label.btn.btn-outline-primary.m-1`, { class: currentStatus === status ? 'active' : '' }, [
                        m("input.btn-check", {
                            type: "radio", name: "status",
                            checked: currentStatus === status,
                            onchange: () => {
                                job.statusInfo = [{ status, createdAt: new Date() }, ...(job.statusInfo || [])];
                            }
                        }),
                        status.replace("_", " ")
                    ])
                ))
             )
        ]);
    },
    
    renderPaymentCard(vnode) {
        const { job } = vnode.state;
        return m(".card.shadow-sm.mb-5", [
            m(".card-header", m("h3.card-title.fw-bold", "Payment & Options")),
            m(".card-body", [
                m(".row.g-4", [
                    m(".col-12", [
                        m("label.form-label", "Mpesa Confirmation Code"),
                        m("textarea.form-control", {
                            rows: 2,
                            value: job.mpesaConfirmationCode,
                            oninput: e => job.mpesaConfirmationCode = e.target.value
                        })
                    ]),
                     m(".col-12", [
                        m("label.form-label", "More Details / Special Instructions"),
                        m("textarea.form-control", {
                            rows: 3,
                            value: job.moreDetails,
                            oninput: e => job.moreDetails = e.target.value
                        })
                    ]),
                    m(".col-md-6.d-flex.align-items-center", 
                        m(".form-check.form-switch.form-check-custom.form-check-solid", [
                            m("input.form-check-input", {
                                type: "checkbox", id: "paidSwitch",
                                checked: job.paid,
                                onchange: e => job.paid = e.target.checked
                            }),
                            m("label.form-check-label.ms-3", { for: "paidSwitch" },
                                m("span.fw-bold.fs-6", "Mark as Paid")
                            )
                        ])
                    ),
                    m(".col-md-6.d-flex.align-items-center", 
                        m(".form-check.form-switch.form-check-custom.form-check-solid", [
                            m("input.form-check-input", {
                                type: "checkbox", id: "smsSwitch",
                                checked: job.skipSms,
                                onchange: e => job.skipSms = e.target.checked
                            }),
                            m("label.form-check-label.ms-3", { for: "smsSwitch" },
                                 m("span.fw-bold.fs-6", "Send Status SMS")
                            )
                        ])
                    )
                ])
            ])
        ]);
    },

    // --- Main View ---
    view(vnode) {
        if (vnode.state.isLoading) {
            return m(loader);
        }
        if (!vnode.state.job) {
            return m(".container.py-5", m(".alert.alert-danger", "Could not load order details."));
        }

        return m(".container-xxl.py-5", [
            this.renderHeaderCard(vnode),
            this.renderCustomerCard(vnode),
            this.renderScheduleCard(vnode),
            this.renderItemsCard(vnode),
            this.renderStatusCard(vnode),
            this.renderPaymentCard(vnode),

            // --- Action Buttons ---
            m(".d-flex.justify-content-end.align-items-center.mt-5", [
                m("button.btn.btn-light.me-3", { onclick: () => m.route.set("/j") }, "Cancel"),
                m("button.btn.btn-info.ms-2", {
                    onclick: () => m.route.set(`/j/${vnode.state.job._id}/print`)
                }, "Print Order"),
                m("button.btn.btn-primary.ms-2", {
                    onclick: () => this.updateOrderOnServer(vnode),
                    disabled: vnode.state.isSaving
                },
                    vnode.state.isSaving
                    ? [m("span.spinner-border.spinner-border-sm.me-2"), "Saving..."]
                    : "Save My Order"
                )
            ])
        ]);
    }
};

export default order_item;