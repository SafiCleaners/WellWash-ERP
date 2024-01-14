import {
    url,
    operationTimes
} from "../constants"
import axios from "axios";
import m from "mithril"
import moment from "moment"
import dayRangeCalculator from "../dateCalculator";
var equal = require('deep-equal');

import uploader from "../components/uploader"
import incrementableInput from "../components/input";
import {
    oninit,
    oncreate
} from "./order_step_1"

const detailsString = (job) => {
    const orderItems = ["duvets", "blankets", "curtains", "generalKgs",];
    return Object.keys(job)
        .filter((key) => orderItems.includes(key))
        .map((key) => {
            return `${job[key]} ${key}`;
        })
        .join(", ");
};
const input = {

    oninit(vnode) {
        // console.log(vnode.attrs)
        vnode.state.innitialValue = vnode.attrs.innitialValue
        vnode.state.jobs = []
    },
    view(vnode) {
        const orderDetails = vnode.attrs.order
        // console.log(vnode.attrs)
        return m("div", { "class": "col-lg-6" },
            [
                m("label",
                    vnode.attrs.name

                ),

                m("div", { "class": "input-group" },
                    [
                        m("input", {
                            oninput: (e) => {
                                vnode.attrs.innitialValue = e.target.value
                                vnode.attrs.onChange(e.target.value)
                            },
                            value: vnode.attrs.innitialValue,
                            "class": "form-control"
                        }),
                        m("div", { "class": "input-group-append" },
                            m("span", { "class": "input-group-text" },
                                m("i", { "class": "la la-align-center" })
                            )
                        )
                    ]
                )
            ]
        )
    }
}

const order_item = {
    oncreate(vnode) {
        const options = {
            method: 'GET', url: url + "/jobs/" + m.route.param("job"),
            headers: {
                'Content-Type': 'application/json',
                'authorization': localStorage.getItem('token')
            },
        };

        axios.request(options).then(function (response) {
            Object.assign(response.data, {
                createdAtAgo: moment(response.data.createdAt).fromNow(true),
                timeDroppedOffFromNow: moment(response.data.dropOffDay).fromNow(true),
                timePickedUpFromNow: moment(response.data.pickupDay).fromNow(true),
            })

            vnode.state.originalJob = Object.assign({}, response.data)
            localStorage.setItem("activeOrderBeingEditedId", vnode.state.originalJob._id)
            localStorage.setItem("activeOrderBeingEdited", JSON.stringify(vnode.state.originalJob))
            vnode.state = Object.assign(vnode.state, response.data)
            vnode.state.loading = false
            m.redraw()
            console.log("Retrieved order data:", vnode.state.originalJob);
        }).catch(function (error) {
            vnode.state.loading = false
            m.redraw()
            console.error(error);
        });
    },
    oninit: function (vnode) {
        var cost = 0
        var price = 0

        // create an order if there was not one already running
        // cache order in local storage even accross refreshes
        let activeOrderBeingEditedId = localStorage.getItem("activeOrderBeingEditedId")

        // if (!activeOrderBeingEditedId) {
        //     activeOrderBeingEditedId = new ObjectId()
        //     localStorage.setItem("activeOrderBeingEditedId", activeOrderBeingEditedId)
        // }
        vnode.state.id = activeOrderBeingEditedId

        // function to update order on the server
        const updateOrderOnServer = (cb) => {
            if (!vnode.state.originalJob) {
                return;
            }

            var {
                pickupDay,
                dropOffDay,
                pickupTime,
                dropOffTime,
                appartmentName,
                houseNumber,
                moreDetails,
                curtains,
                blankets,
                duvets,
                generalKgs,
                mpesaPhoneNumber,
                phone,
                mpesaConfirmationCode,
                name,
                statusInfo,
                saved,
            } = vnode.state
            const skipSms = vnode.state.skipSms;

            let order = Object.assign({}, vnode.state.originalJob, {
                pickupDay,
                dropOffDay,
                pickupTime,
                dropOffTime,
                appartmentName,
                houseNumber,
                moreDetails,
                curtains,
                blankets,
                duvets,
                generalKgs,
                mpesaPhoneNumber,
                phone,
                mpesaConfirmationCode,
                name,
                statusInfo,
                saved,
                skipSms,

            }, {
                // googleId: localStorage.getItem('googleId'),
                _id: undefined,
                curtainsCharge: vnode.state.curtainsCharge,
                curtainsAmount: vnode.state.curtainsAmount,
                blanketsCharge: vnode.state.blanketsCharge,
                blanketsAmount: vnode.state.blanketsAmount,
                duvetsCharge: vnode.state.duvetsCharge,
                duvetsAmount: vnode.state.duvetsAmount,
                generalKgsCharge: vnode.state.generalKgsCharge,
                generalKgsAmount: vnode.state.generalKgsAmount,
                shoesCharge: vnode.state.shoesCharge,
                shoesAmount: vnode.state.shoesAmount,
                clientName: vnode.state.clientName
            });

            console.log({
                currentOrder: order,
                originalJob: vnode.state.originalJob
            })

            const orderString = JSON.parse(localStorage.getItem("activeOrderBeingEdited"))
            // compare order in state and order in original job
            // if (equal(order, orderString)) {
            //     // console.log("Order has not changed. Not sending request to server.");  
            //     return;
            // } else {
            //     // localStorage.setItem("activeOrderBeingEdited", JSON.stringify(order))
            //     console.log("Order has changed, updating the backend", { orderSentToServer: order }, { orderStringFromOriginalJob: vnode.state.originalJob })
            // }

            // const orderDetailsDiff = _.omit(order, function (v, k) {
            //     console.log("=======>", vnode.state.originalJob[k], v)
            //     return vnode.state.originalJob[k] === v;
            // })
            // console.log({ order, orderString, orderDetailsDiff })

            // order.lastSubmittedAt = new Date()
            // send request to server
            const options = {
                method: 'PATCH',
                url: url + "/jobs/" + m.route.param("job"),
                headers: {
                    'Content-Type': 'application/json',
                    'authorization': localStorage.getItem('token')
                },
                data: order
            };

            console.log(options)
            vnode.state.uploading = true
            console.log("order:", order);
            axios.request(options).then(function (response) {
                console.log("Request succeeded. Response:", response.data);

                //save orderId from server response to local storage
                // const orderIdFromServer = response.data.id;
                // localStorage.setItem("activeOrderBeingEditedId", orderIdFromServer);

                // to ensure order stays the same but we know when it was last submitted
                order.lastSubmittedAt = undefined;
                order.saved = false
                localStorage.removeItem("activeOrderBeingEdited")
                localStorage.removeItem("activeOrderBeingEditedId")
                vnode.state.uploading = false
                cb()
            }).catch(function (error) {
                console.error("Request failed. Error:", error);

                order.id = null
                order.retry_innitial_send = true
                // vnode.state.activeOrderBeingEdited = order
                vnode.state.uploading = false
                vnode.state.saved = false
                // m.route.set("/order2", {
                //     order
                // })
                cb()
            });
        }

        vnode.state.updateOrderOnServer = updateOrderOnServer

        // call updateOrderOnServer function once 
        // updateOrderOnServer();
        // call updateOrderOnServerPeriodically function with a suitable time period 
        // setInterval(updateOrderOnServer, 2000);
        // Or you can call it on certain events like onblur of an input, on click of a button, or on specific route change
        setTimeout(() => {
            // Trigger the print operation
            window.print();
        }, 10000);
    },
    view(vnode) {

        console.log({ state: vnode.state })

        const {
            whites,
            whites_wash_units,
            blacks,
            black_wash_units,
            coloured,
            coloured_wash_units,
            job = {}
        } = vnode.state

        const {
            _id = "",
            paid = "",
            status = "",
            pickupDay = "",
            dropOffDay = "",
            pickupTime = "",
            dropOffTime = "",
            appartmentName = "",
            houseNumber = "",
            moreDetails = "",
            clientName,


            mpesaPhoneNumber,
            phone,
            mpesaConfirmationCode,
            timeDroppedOffFromNow,
            timePickedUpFromNow,

            duvets = 0,
            coat_hoodie = 0,
            blankets = 0,
            furry_blankets = 0,
            bed_sheets = 0,
            curtains = 0,
            shoes = 0,
            towels = 0,
            suits_type1 = 0,
            suits_type2 = 0,
            ironing = 0,
            ironing_trousers = 0,
            generalKgs = 0,
            createdAtAgo,

            curtainsAmount,
            curtainsCharge,
            blanketsAmount,
            blanketsCharge,
            duvetsAmount,
            duvetsCharge,
            generalKgsAmount,
            generalKgsCharge,
            shoesAmount,
            shoesCharge

        } = vnode.state

        const calculatePrice = () => {
            const { categoryAmounts, categoryCharges } = vnode.state;

            return Object.keys(categoryAmounts).reduce((total, categoryId) => {
                const amountValue = categoryAmounts[categoryId];
                const chargeValue = categoryCharges[categoryId];

                const subtotal = (amountValue || 0) * (chargeValue || 0);
                return total + subtotal;
            }, 0);
        }
        
        const orderDetails = vnode.state;
        const items = [
            { name: "Curtains", amount: vnode.state.curtainsAmount, charge: vnode.state.curtainsCharge },
            { name: "Blankets", amount: vnode.state.blanketsAmount, charge: vnode.state.blanketsCharge },
            { name: "Duvets", amount: vnode.state.duvetsAmount, charge: vnode.state.duvetsCharge },
            { name: "General Clothes in Kgs", amount: vnode.state.generalKgsAmount, charge: vnode.state.generalKgsCharge },
            { name: "Shoes in Pairs", amount: vnode.state.shoesAmount, charge: vnode.state.shoesCharge }
        ];

        const totalCost = items.reduce((total, item) => {
            // Provide default values of 0 if item.amount or item.charge is falsy
            const parsedAmount = item.amount || 0;
            const parsedCharge = item.charge || 0;

            // Add the product of parsedAmount and parsedCharge to the total
            if (parsedAmount > 0 && parsedCharge > 0) {
                total += parsedAmount * parsedCharge;
            }

            return total;
        }, 0);

        // ... (other code for rendering the items in the receipt)

        // Render the total cost row in the table footer
        m("tfoot", [
            m("tr", [
                m("th.colspan=4.text-right", "Total Cost:"),
                m("th.text-center", totalCost) // Display total cost calculated using the reduce function
            ])
        ])




        return [

            m("div", { "class": "form-group row", style: { "padding": "10px" } },
                [

                    // m("div", { "class": "col-lg-12" },
                    //     [

                    m("div", {
                        class: "float-right",
                        // style: {
                        //     "padding": "30px"
                        // }
                    }, [


                        m(".container.bootdey", [
                            m(".row.invoice.row-printable", [
                                m(".col-md-10", [
                                    m(".panel.panel-default.plain#dash_0", [
                                        m(".panel-body.p30", [
                                            m(".row", [
                                                m(".col-lg-6", [
                                                    // m(".invoice-logo", [
                                                    //     m("img", { width: "100", src: "https://bootdey.com/img/Content/avatar/avatar7.png", alt: "Invoice logo" })
                                                    // ])
                                                ]),
                                                m(".col-lg-6", [
                                                    m(".invoice-from", [
                                                        m("ul.list-unstyled.text-right", [
                                                            m("li", "WellWash"),

                                                            m("li", "Order No:" + "" + orderDetails.shortId),
                                                        ])
                                                    ])
                                                ]),
                                                m(".col-lg-12", [
                                                    m(".invoice-details.mt25", [
                                                        m(".well", [
                                                            m("ul.list-unstyled.mb0", [

                                                                m("li", m("strong", "Invoice Date: " + orderDetails.pickupDay)),
                                                                m("li", m("strong", "Due Date: " + orderDetails.dropOffDay)),
                                                                // console.log(typeof orderDetails.pickupDay, orderDetails.pickupDay),
                                                                // console.log(typeof orderDetails.dropOffDay, orderDetails.dropOffDay),

                                                            ])
                                                        ])
                                                    ]),
                                                    m(".invoice-to.mt25", [
                                                        m("ul.list-unstyled", [
                                                            m("li", m("strong", "Invoiced To")),
                                                            m("li", orderDetails.clientName),
                                                            m("li", orderDetails.phone),

                                                        ])
                                                    ]),
                                                    // Define an array of items with their quantities and charges

                                                    m(".invoice-items", [
                                                        m(".table-responsive", [
                                                            m("table.table.table-bordered", [
                                                                m("thead", [
                                                                    m("tr", [
                                                                        m("th.per70.text-center", "Description"),
                                                                        m("th.per5.text-center", "Qty"),
                                                                        m("th.per10.text-center", "Amount"),
                                                                        m("th.per15.text-center", "Charge"),
                                                                        //m("th.per25.text-center", "Total")
                                                                    ])
                                                                ]),
                                                                // Iterate through the items array and render items on the receipt
                                                                items.map(item => {
                                                                    if (item.amount > 0) {
                                                                        const totalCost = items.reduce((total, item) => total + (item.amount * item.charge), 0);


                                                                        return m("tr", [
                                                                            m("td", item.name), // Description
                                                                            m("td.text-center", item.amount), // Qty
                                                                            m("td.text-center", item.charge), // Charge
                                                                            m("td.text-center", item.amount * item.charge)
                                                                        ]);
                                                                    }
                                                                }),
                                                                m("tfoot", [
                                                                    m("tr", [
                                                                        m("th.colspan=3.text-right", "Total Cost:"),
                                                                        m("th.text-center", totalCost) // Display total cost
                                                                    ])
                                                                ])

                                                            ])
                                                        ])
                                                    ]),


                                                    m(".invoice-footer.mt25", [
                                                        // Add additional invoice details here if needed
                                                    ])
                                                ])
                                            ])
                                        ])
                                    ])
                                ])
                            ])
                        ]),
                        m("button", {
                            type: "button",
                            class: "btn btn-lg btn-secondary ml-2",
                            onclick() {
                                console.log("button clicked");

                                window.print(); // This line triggers the print functionality
                            }
                        }, [
                            m("i", { class: "flaticon2-print" }),
                            " Print"
                        ]),
                    ]),


                ])

        ]
    }


}

export default order_item