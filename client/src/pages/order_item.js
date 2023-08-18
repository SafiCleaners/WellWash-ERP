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
} from "../pages/order_step_1"


const input = {
    oninit(vnode) {
        // console.log(vnode.attrs)
        vnode.state.innitialValue = vnode.attrs.innitialValue
    },
    view(vnode) {
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
            return (duvets * 600) +
                (coat_hoodie * 50) +
                (blankets * 500) +
                (furry_blankets * 600) +
                (bed_sheets * 200) +
                (curtains * 200) +
                (towels * 70) +
                (suits_type1 * 350) +
                (suits_type2 * 400) +
                (ironing * 50) +
                (ironing_trousers * 70) +
                (generalKgs * 91)
        }

        return [
            m("div", { "class": "card-body pt-0 pb-4" },
                // content id
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
                                        m("tbody",
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
                                                        m("td", {
                                                            "class": "pl-0", onclick() { m.route.set("/j/" + _id) }
                                                        },
                                                            [
                                                                m("span", { "class": "text-dark-75 font-weight-bolder text-hover-primary mb-1 font-size-lg", style: "white-space: nowrap;" },
                                                                    clientName + " (" + phone + ")"
                                                                ),
                                                                m("div",
                                                                    [
                                                                        m("span", { "class": "font-weight-bolder text-dark-75", style: "white-space: nowrap;" },
                                                                            `${appartmentName}:`, [m("span", { "class": "text-muted font-weight-bold text-hover-primary", },
                                                                                " House:" + houseNumber
                                                                            )]
                                                                        )
                                                                    ]
                                                                )
                                                            ]
                                                        ),

                                                        m("td", { "class": "text-right", style: "white-space: nowrap;", onclick() { m.route.set("/j/" + _id) } },
                                                            [
                                                                m("span", { "class": "text-dark-75 font-weight-bolder d-block font-size-lg" },
                                                                    `KSH ${calculatePrice()}`
                                                                ),
                                                                m("span", { "class": "text-muted font-weight-bold" },
                                                                    paid ? "Paid " : " Not Paid"
                                                                )
                                                            ]
                                                        ),

                                                        m("td", { "class": "text-right", style: "white-space: nowrap;", onclick() { m.route.set("/j/" + _id) } },
                                                            [
                                                                m("span", { "class": "text-dark-75 font-weight-bolder d-block font-size-lg", style: "white-space: nowrap;", },

                                                                    "Was Requested ", createdAtAgo + " ago"
                                                                ),
                                                                m("span", { "class": "text-muted font-weight-bold", style: "white-space: nowrap;", },
                                                                    "To be Dropped Off in ", timeDroppedOffFromNow,
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
                                                        // m("td", { "class": "text-right font-weight-bold", style: "white-space: nowrap;", onclick() { m.route.set("/j/" + _id) } },
                                                        //     m("span", { "class": "text-muted font-weight-500" },
                                                        //         timeLimit === timeTypeDay ? `${days} days ` : `${hrs} hrs`
                                                        //     )
                                                        // ),
                                                        // m("td", { "class": "text-right", style: "white-space: nowrap;", onclick() { m.route.set("/j/" + _id) } },
                                                        //     m("span", { "class": "label label-lg label-light-info label-inline" },
                                                        //         academicLevel
                                                        //     )
                                                        // ),



                                                        // m("td", { "class": "text-right pr-0", style: "white-space: nowrap;" },
                                                        //     [

                                                        // m(m.route.Link, { "class": "btn btn-icon btn-light btn-hover-primary btn-sm mx-3" },
                                                        //     m("span", { "class": "svg-icon svg-icon-md svg-icon-primary" },
                                                        //         m("svg", { "xmlns": "http://www.w3.org/2000/svg", "xmlns:xlink": "http://www.w3.org/1999/xlink", "width": "24px", "height": "24px", "viewBox": "0 0 24 24", "version": "1.1" },
                                                        //             m("g", { "stroke": "none", "stroke-width": "1", "fill": "none", "fill-rule": "evenodd" },
                                                        //                 [
                                                        //                     m("rect", { "x": "0", "y": "0", "width": "24", "height": "24" }),
                                                        //                     m("path", { "d": "M12.2674799,18.2323597 L12.0084872,5.45852451 C12.0004303,5.06114792 12.1504154,4.6768183 12.4255037,4.38993949 L15.0030167,1.70195304 L17.5910752,4.40093695 C17.8599071,4.6812911 18.0095067,5.05499603 18.0083938,5.44341307 L17.9718262,18.2062508 C17.9694575,19.0329966 17.2985816,19.701953 16.4718324,19.701953 L13.7671717,19.701953 C12.9505952,19.701953 12.2840328,19.0487684 12.2674799,18.2323597 Z", "fill": "#000000", "fill-rule": "nonzero", "transform": "translate(14.701953, 10.701953) rotate(-135.000000) translate(-14.701953, -10.701953)" }),
                                                        //                     m("path", { "d": "M12.9,2 C13.4522847,2 13.9,2.44771525 13.9,3 C13.9,3.55228475 13.4522847,4 12.9,4 L6,4 C4.8954305,4 4,4.8954305 4,6 L4,18 C4,19.1045695 4.8954305,20 6,20 L18,20 C19.1045695,20 20,19.1045695 20,18 L20,13 C20,12.4477153 20.4477153,12 21,12 C21.5522847,12 22,12.4477153 22,13 L22,18 C22,20.209139 20.209139,22 18,22 L6,22 C3.790861,22 2,20.209139 2,18 L2,6 C2,3.790861 3.790861,2 6,2 L12.9,2 Z", "fill": "#000000", "fill-rule": "nonzero", "opacity": "0.3" })
                                                        //                 ]
                                                        //             )
                                                        //         )
                                                        //     )
                                                        // ),
                                                        // m(m.route.Link, {
                                                        //     "class": "btn btn-icon btn-light btn-hover-primary btn-sm", onclick() {
                                                        //         const options = { 
                                                        //             method: 'DELETE', 
                                                        //             url: `${url}/jobs/${_id}`,
                                                        //             headers: { 
                                                        //                 'Content-Type': 'application/json',
                                                        //                 'authorization': localStorage.getItem('token')
                                                        //             },
                                                        //         };

                                                        //         axios.request(options).then(function (response) {
                                                        //             console.log(response.data);
                                                        //             location.reload()
                                                        //         }).catch(function (error) {
                                                        //             console.error(error);
                                                        //         });
                                                        //     }
                                                        // },
                                                        //     m("span", { "class": "svg-icon svg-icon-md svg-icon-primary" },
                                                        //         m("svg", { "xmlns": "http://www.w3.org/2000/svg", "xmlns:xlink": "http://www.w3.org/1999/xlink", "width": "24px", "height": "24px", "viewBox": "0 0 24 24", "version": "1.1" },
                                                        //             m("g", { "stroke": "none", "stroke-width": "1", "fill": "none", "fill-rule": "evenodd" },
                                                        //                 [
                                                        //                     m("rect", { "x": "0", "y": "0", "width": "24", "height": "24" }),
                                                        //                     m("path", { "d": "M6,8 L6,20.5 C6,21.3284271 6.67157288,22 7.5,22 L16.5,22 C17.3284271,22 18,21.3284271 18,20.5 L18,8 L6,8 Z", "fill": "#000000", "fill-rule": "nonzero" }),
                                                        //                     m("path", { "d": "M14,4.5 L14,4 C14,3.44771525 13.5522847,3 13,3 L11,3 C10.4477153,3 10,3.44771525 10,4 L10,4.5 L5.5,4.5 C5.22385763,4.5 5,4.72385763 5,5 L5,5.5 C5,5.77614237 5.22385763,6 5.5,6 L18.5,6 C18.7761424,6 19,5.77614237 19,5.5 L19,5 C19,4.72385763 18.7761424,4.5 18.5,4.5 L14,4.5 Z", "fill": "#000000", "opacity": "0.3" })
                                                        //                 ]
                                                        //             )
                                                        //         )
                                                        //     )
                                                        // )
                                                        //     ]
                                                        // )
                                                    ]
                                                )
                                            ]
                                        )
                                    ]
                                )
                            )
                        )
                    ]
                )
            ),

            m("div", { "class": "bs-stepper" },
                [
                    m("div", { "class": "bs-stepper-header", "role": "tablist" },
                        [
                            m("div", { "class": "step", "data-target": "#logins-part" },
                                m("button", { "class": "step-trigger", "type": "button", "role": "tab", "aria-controls": "logins-part", "id": "logins-part-trigger" },
                                    [
                                        m("span", { "class": "bs-stepper-circle" },
                                            "0.1"
                                        ),
                                        m("span", { "class": "bs-stepper-label" },
                                            "Order Details"
                                        )
                                    ]
                                )
                            )]
                    )]
            ),


            m("div", { "class": "form-group row" },
                [
                    m(input, {
                        name: 'Customer Name',
                        innitialValue: clientName,
                        onChange(value) {
                            vnode.state.clientName = value
                        }
                    }),
                    m(input, {
                        name: 'Customer Phone Number',
                        innitialValue: phone,
                        onChange(value) {
                            vnode.state.phone = value
                        }
                    }),
                    m(input, {
                        name: 'Customer Appartment Name',
                        innitialValue: appartmentName,
                        onChange(value) {
                            vnode.state.appartmentName = value
                        }
                    }),
                    m(input, {
                        name: 'Customer House Number',
                        innitialValue: houseNumber,
                        onChange(value) {
                            vnode.state.houseNumber = value
                        }
                    }),
                ]),

            m(".form-group.row", [
                m("div", { "class": "col-lg-4 col-md-8 col-sm-12" },
                    [
                        m("label",
                            "When would the customer like their Pickup? "
                        ),
                        m("br"),

                        m("div", { "class": "btn-group btn-group-toggle", "data-toggle": "buttons" },
                            [
                                dayRangeCalculator()
                                    .map((time) => {
                                        const { dayName, day, nth, date } = time

                                        return m("label", { "class": `btn btn-info ${pickupDay === date.format('L') ? "focus active" : ""}` },
                                            [
                                                m("input", {
                                                    "type": "radio",
                                                    "name": "pickupDay",
                                                    "id": pickupDay,
                                                    disabled: date.day() === 0,
                                                    "checked": pickupDay === date.format('L') ? true : false,
                                                    onchange: () => {
                                                        vnode.state.pickupDay = date.format('L')

                                                        let daysToAdd = 1
                                                        // increment time here to set drop off
                                                        if (moment(vnode.state.pickupDay).add(daysToAdd, 'days').day() == 0) {
                                                            daysToAdd = 2
                                                        }

                                                        vnode.state.dropOffDay = moment(vnode.state.pickupDay).add(daysToAdd, 'days').format('L')
                                                    }
                                                }),
                                                dayName + " " + day + nth
                                            ]
                                        )
                                    }),
                            ]
                        )
                    ]
                ),
                m("div", { "class": "col-lg-2 col-md-4 col-sm-4" },
                    [
                        m("label",
                            "Time of pickup:"
                        ),
                        m("div", { "class": "dropdown" },
                            [
                                m("button", { "class": "btn btn-secondary dropdown-toggle", "type": "button", "id": "dropdownMenuButton", "data-toggle": "dropdown", "aria-haspopup": "true", "aria-expanded": "false" },
                                    pickupTime
                                ),
                                m("div", { "class": "dropdown-menu", "aria-labelledby": "dropdownMenuButton" },
                                    [
                                        operationTimes.map(time => {
                                            return m(m.route.Link, {
                                                style: { "z-index": 10000 },
                                                onclick() {
                                                    vnode.state.pickupTime = time
                                                },
                                                "class": "dropdown-item",
                                            },
                                                time
                                            )
                                        })
                                    ]
                                )
                            ]
                        )
                    ]),
                m("div", { "class": "col-lg-4 col-md-8 col-sm-12" },
                    [
                        m("label",
                            "When would the customer like their DropOff?"
                        ),
                        m("br"),

                        m("div", {
                            "class": "btn-group btn-group-toggle",
                            "data-toggle": "buttons"
                        },
                            [
                                dayRangeCalculator(vnode.state.pickupDay)
                                    .map((time) => {
                                        const { dayName, day, nth, date } = time
                                        return m("label", { "class": `btn btn-info ${dropOffDay === date.format('L') ? "focus active" : ""}` },
                                            [
                                                m("input", {
                                                    "type": "radio",
                                                    "name": "dropOffDay",
                                                    "id": dropOffDay,
                                                    "checked": dropOffDay === date.format('L') ? true : false,
                                                    disabled: moment(vnode.state.pickupDay).day() == 0,
                                                    onchange: () => {
                                                        vnode.state.dropOffDay = date.format('L')
                                                    }
                                                }),
                                                dayName + " " + day + nth
                                            ]
                                        )
                                    }),
                            ]
                        )
                    ]
                ),
                m("div", { "class": "col-lg-2 col-md-4 col-sm-4" },
                    [
                        m("label",
                            "Time of DropOff:"
                        ),
                        m("div", { "class": "dropdown" },
                            [
                                m("button", { "class": "btn btn-secondary dropdown-toggle", "type": "button", "id": "dropdownMenuButton", "data-toggle": "dropdown", "aria-haspopup": "true", "aria-expanded": "false" },
                                    dropOffTime
                                ),
                                m("div", { "class": "dropdown-menu", "aria-labelledby": "dropdownMenuButton" },
                                    [
                                        operationTimes.map(time => {
                                            return m(m.route.Link, {
                                                style: { "z-index": 10000 },
                                                onclick() {
                                                    vnode.state.dropOffTime = time
                                                },
                                                "class": "dropdown-item",
                                            },
                                                time
                                            )
                                        })
                                    ]
                                )
                            ]
                        )
                    ]),
            ]),

            m("div", { "class": "bs-stepper" },
                [
                    m("div", { "class": "bs-stepper-header", "role": "tablist" },
                        [
                            m("div", { "class": "step", "data-target": "#logins-part" },
                                m("button", { "class": "step-trigger", "type": "button", "role": "tab", "aria-controls": "logins-part", "id": "logins-part-trigger" },
                                    [
                                        m("span", { "class": "bs-stepper-circle" },
                                            "0.2"
                                        ),
                                        m("span", { "class": "bs-stepper-label" },
                                            "Pricing Calculator"
                                        )
                                    ]
                                )
                            )]
                    )]
            ),


            m("div", { "class": "form-group row" },
                [
                    m(incrementableInput, {
                        name: 'Curtains',
                        charge: curtainsCharge || 200, // use this to set a default
                        amount: curtainsAmount || 0,
                        value: curtains,
                        pricing: [{
                            amount: 200,
                            label: '200'
                        }, {
                            amount: 250,
                            label: '250'
                        }, {
                            amount: 300,
                            label: '300'
                        }],
                        onChange({ amountValue, chargeValue }) {
                            console.log(amountValue, chargeValue)
                            vnode.state.curtainsCharge = chargeValue
                            vnode.state.curtainsAmount = amountValue
                        }
                    }),
                    m(incrementableInput, {
                        name: 'Blankets',
                        charge: blanketsCharge || 500,
                        amount: blanketsAmount || 0,
                        value: blankets,
                        pricing: [{
                            amount: 300,
                            label: '300'
                        }, {
                            amount: 350,
                            label: '350'
                        }, {
                            amount: 400,
                            label: '400'
                        }],

                        onChange({ amountValue, chargeValue }) {
                            vnode.state.blanketsCharge = chargeValue
                            vnode.state.blanketsAmount = amountValue
                        }
                    }),
                    m(incrementableInput, {
                        name: 'Duvets',
                        charge: duvetsCharge || 600,
                        amount: duvetsAmount || 0,
                        value: duvets,
                        pricing: [{
                            amount: 500,
                            label: '500'
                        }, {
                            amount: 600,
                            label: '600'
                        }, {
                            amount: 700,
                            label: '700'
                        }],
                        onChange({ amountValue, chargeValue }) {
                            vnode.state.duvetsCharge = chargeValue
                            vnode.state.duvetsAmount = amountValue
                        }
                    }),
                    m(incrementableInput, {
                        name: 'General Clothes in Kgs',
                        charge: generalKgsCharge || 91,
                        amount: generalKgsAmount || 0,
                        value: generalKgs,
                        pricing: [{
                            amount: 100,
                            label: '100'
                        }, {
                            amount: 150,
                            label: '150'
                        }, {
                            amount: 200,
                            label: '200'
                        }],

                        onChange({ amountValue, chargeValue }) {
                            vnode.state.generalKgsCharge = chargeValue
                            vnode.state.generalKgsAmount = amountValue
                        }
                    }),
                    m(incrementableInput, {
                        name: 'Shoes in Pairs',
                        charge: shoesCharge || 100,
                        amount: shoesAmount || 0,
                        value: shoes,
                        pricing: [{
                            amount: 100,
                            label: '100'
                        }, {
                            amount: 150,
                            label: '150'
                        }, {
                            amount: 200,
                            label: '200'
                        }],

                        onChange({ amountValue, chargeValue }) {
                            vnode.state.shoesCharge = chargeValue
                            vnode.state.shoesAmount = amountValue
                        }
                    }),

                    m("h3", { "class": "display-4" },

                        `This would cost around KSH ${(curtainsAmount * curtainsCharge || 0) + (blanketsAmount * blanketsCharge || 0) + (duvetsAmount * duvetsCharge || 0) + (generalKgsAmount * generalKgsCharge || 0) + (shoesAmount * shoesCharge || 0)}`

                    ),
                    m("p", { "class": "font-size-lg" },
                        `During Pickup a weigh will be done on premise to collect the exact details for a better estimate`
                    )
                ]),




            // m("div", { "class": "card card-custom gutter-b" },
            //     [

            //         m("div", { "class": "card-body pt-0 pb-4" },
            //             // content id
            //             [
            //                 m(".row", [
            //                     m(input, {
            //                         name: "Duvet Size 1",
            //                         // label: "The number of single units that are washable",
            //                         value: duvet_size_1,
            //                         size: 4,
            //                         charge: 600,
            //                         onChange(value) {
            //                             vnode.state.job.duvet_size_1 = value
            //                         }
            //                     }),

            //                     m(input, {
            //                         name: "Duvet Size 2",
            //                         // label: "The number of single units that are washable",
            //                         value: duvet_size_2,
            //                         size: 4,
            //                         charge: 600,
            //                         onChange(value) {
            //                             vnode.state.job.duvet_size_1 = value
            //                         }
            //                     }),

            //                     m(input, {
            //                         name: 'Coats/Hoods',
            //                         // label: "The number of single units that are washable",
            //                         value: coat_hoodie,
            //                         size: 4,
            //                         charge: 50,
            //                         onChange(value) {
            //                             vnode.state.job.coat_hoodie = value
            //                         }
            //                     }),
            //                 ]),

            //                 m(".row", [
            //                     m(input, {
            //                         name: 'Blankets',
            //                         // label: "The number of single units that are washable",
            //                         value: blankets,
            //                         size: 4,
            //                         charge: 500,
            //                         onChange(value) {
            //                             vnode.state.job.blankets = value
            //                         }
            //                     }),

            //                     m(input, {
            //                         name: 'Furry Blankets',
            //                         // label: "The number of single units that are washable",
            //                         value: furry_blankets,
            //                         size: 4,
            //                         charge: 600,
            //                         onChange(value) {
            //                             vnode.state.job.furry_blankets = value
            //                         }
            //                     }),

            //                     m(input, {
            //                         name: 'Bed Sheets',
            //                         // label: "The number of single units that are washable",
            //                         value: bed_sheets,
            //                         size: 4,
            //                         charge: 200,
            //                         onChange(value) {
            //                             vnode.state.job.bed_sheets = value
            //                         }
            //                     }),
            //                 ]),

            //                 m(".row", [
            //                     m(input, {
            //                         name: 'Curtains',
            //                         // label: "The number of single units that are washable",
            //                         value: curtains,
            //                         size: 4,
            //                         charge: 200,
            //                         onChange(value) {
            //                             vnode.state.job.curtains = value
            //                         }
            //                     }),

            //                     m(input, {
            //                         name: 'Towels',
            //                         // label: "The number of single units that are washable",
            //                         value: towels,
            //                         size: 4,
            //                         charge: 70,
            //                         onChange(value) {
            //                             vnode.state.job.towels = value
            //                         }
            //                     }),

            //                     m(input, {
            //                         name: 'Suits Type 1',
            //                         // label: "The number of single units that are washable",
            //                         value: suits_type1,
            //                         size: 4,
            //                         charge: 350,
            //                         onChange(value) {
            //                             vnode.state.job.suits_type1 = value
            //                         }
            //                     }),
            //                 ]),

            //                 m(".row", [
            //                     m(input, {
            //                         name: 'Suits Type 2',
            //                         // label: "The number of single units that are washable",
            //                         value: suits_type2,
            //                         size: 4,
            //                         charge: 350,
            //                         onChange(value) {
            //                             vnode.state.job.suits_type2 = value
            //                         }
            //                     }),
            //                     m(input, {
            //                         name: 'Clothes In KGs',
            //                         // label: "The number of single units that are washable",
            //                         value: generalKgs,
            //                         size: 4,
            //                         charge: 99,
            //                         onChange(value) {
            //                             vnode.state.job.generalKgs = value
            //                         }
            //                     }),

            //                     m(input, {
            //                         name: 'Ironing Shirts',
            //                         // label: "The number of single units that are washable",
            //                         value: ironing,
            //                         size: 4,
            //                         charge: 50,
            //                         onChange(value) {
            //                             vnode.state.job.ironing_shirts = value
            //                         }
            //                     }),

            //                     m(input, {
            //                         name: 'Ironing Trousers',
            //                         // label: "The number of single units that are washable",
            //                         value: ironing_trousers,
            //                         size: 4,
            //                         charge: 70,
            //                         onChange(value) {
            //                             vnode.state.ironing_trousers = value
            //                         }
            //                     }),
            //                 ])
            //             ]
            //         ),

            //     ]
            // ),

            // m("div", { "class": "card card-custom gutter-b" },
            //     [
            //         m("div", { "class": "card-header border-0 pt-7" },
            //             [
            //                 m("h3", { "class": "card-title align-items-start flex-column" },
            //                     [
            //                         m("span", { "class": "card-label font-weight-bold font-size-h4 text-dark-75" },
            //                             "Blacks Laundry Split"
            //                         ),
            //                         m("span", { "class": "text-muted mt-3 font-weight-bold font-size-sm" },
            //                             "Record how this load wll be split for the wash process queue"
            //                         )
            //                     ]
            //                 )
            //             ]
            //         ),

            //         // content id
            //         m("div", { "class": "card-body d-flex align-items-center" },
            //             [
            //                 m(input, {
            //                     name: 'KGs of Blacks',
            //                     label: "The amount of black clothes on this load in kgs",
            //                     value: 0,
            //                     value: blacks,
            //                     onChange(value) {
            //                         vnode.state.blacks = value
            //                     }
            //                 }),

            //                 m(input, {
            //                     name: 'How many washes do you estimate this will need',
            //                     label: "The number of single units that are washable",
            //                     value: 0,
            //                     value: black_wash_units,
            //                     onChange(value) {
            //                         vnode.state.black_wash_units = value
            //                     }
            //                 }),




            //             ]
            //         ),

            //         m("div", { "class": "card-body align-items-center" },
            //             [
            //                 m(".row", [
            //                     m(".col-xl-8", [
            //                         vnode.state.black_wash_units == 0 ? [] : Array(Number(vnode.state.black_wash_units))
            //                             .fill().map((e, i) => {
            //                                 return m(input, {
            //                                     name: 'Wash ' + ++i,
            //                                     label: "The number of kgs that will be washed on this wash",
            //                                     value: vnode.state[`black_wash_unit_${i}_kgs`] || 0,
            //                                     onChange(value) {
            //                                         vnode.state[`black_wash_unit_${i}_kgs`] = value
            //                                     }
            //                                 })
            //                             })
            //                     ]),
            //                     m(".col-xl-6", [

            //                     ])
            //                 ])
            //             ])

            //     ]
            // ),


            // m("div", { "class": "card card-custom gutter-b" },
            //     [
            //         m("div", { "class": "card-header border-0 pt-7" },
            //             [
            //                 m("h3", { "class": "card-title align-items-start flex-column" },
            //                     [
            //                         m("span", { "class": "card-label font-weight-bold font-size-h4 text-dark-75" },
            //                             "Whites Laundry Split"
            //                         ),
            //                         m("span", { "class": "text-muted mt-3 font-weight-bold font-size-sm" },
            //                             "Record how this load wll be split for the wash process queue"
            //                         )
            //                     ]
            //                 )
            //             ]
            //         ),

            //         // content id
            //         m("div", { "class": "card-body d-flex align-items-center" },
            //             [
            //                 m(input, {
            //                     name: 'KGs of Coloured',
            //                     label: "The amount of black clothes on this load in kgs",
            //                     value: 0,
            //                     value: whites,
            //                     onChange(value) {
            //                         vnode.state.whites = value
            //                     }
            //                 }),

            //                 m(input, {
            //                     name: 'How many washes do you estimate this will need',
            //                     label: "The number of single units that are washable",
            //                     value: 0,
            //                     value: whites_wash_units,
            //                     onChange(value) {
            //                         vnode.state.whites_wash_units = value
            //                     }
            //                 }),
            //             ]
            //         ),

            //         m("div", { "class": "card-body align-items-center" },
            //             [
            //                 m(".row", [
            //                     m(".col-xl-8", [
            //                         vnode.state.whites_wash_units == 0 ? [] : Array(Number(vnode.state.whites_wash_units))
            //                             .fill().map((e, i) => {
            //                                 return m(input, {
            //                                     name: 'Wash ' + ++i,
            //                                     label: "The number of kgs that will be washed on this wash",
            //                                     value: vnode.state[`whites_wash_unit_${i}_kgs`] || 0,
            //                                     onChange(value) {
            //                                         vnode.state[`whites_wash_unit_${i}_kgs`] = value
            //                                     }
            //                                 })
            //                             })
            //                     ]),
            //                     m(".col-xl-6", [

            //                     ])
            //                 ])
            //             ])

            //     ]
            // ),

            // m("div", { "class": "card card-custom gutter-b" },
            //     [
            //         m("div", { "class": "card-header border-0 pt-7" },
            //             [
            //                 m("h3", { "class": "card-title align-items-start flex-column" },
            //                     [
            //                         m("span", { "class": "card-label font-weight-bold font-size-h4 text-dark-75" },
            //                             "Coloured Laundry Split"
            //                         ),
            //                         m("span", { "class": "text-muted mt-3 font-weight-bold font-size-sm" },
            //                             "Record how this load wll be split for the wash process queue"
            //                         )
            //                     ]
            //                 )
            //             ]
            //         ),

            //         // content id
            //         m("div", { "class": "card-body d-flex align-items-center" },
            //             [
            //                 m(input, {
            //                     name: 'KGs of Whites',
            //                     label: "The amount of black clothes on this load in kgs",
            //                     value: 0,
            //                     value: coloured,
            //                     onChange(value) {
            //                         vnode.state.coloured = value
            //                     }
            //                 }),

            //                 m(input, {
            //                     name: 'How many washes do you estimate this will need',
            //                     label: "The number of single units that are washable",
            //                     value: 0,
            //                     value: coloured_wash_units,
            //                     onChange(value) {
            //                         vnode.state.coloured_wash_units = value
            //                     }
            //                 }),




            //             ]
            //         ),

            //         m("div", { "class": "card-body align-items-center" },
            //             [
            //                 m(".row", [
            //                     m(".col-xl-8", [
            //                         vnode.state.coloured_wash_units == 0 ? [] : Array(Number(vnode.state.coloured_wash_units))
            //                             .fill().map((e, i) => {
            //                                 return m(input, {
            //                                     name: 'Wash ' + ++i,
            //                                     label: "The number of kgs that will be washed on this wash",
            //                                     value: vnode.state[`coloured_wash_unit_${i}_kgs`] || 0,
            //                                     onChange(value) {
            //                                         vnode.state[`coloured_wash_unit_${i}_kgs`] = value
            //                                     }
            //                                 })
            //                             })
            //                     ]),
            //                     m(".col-xl-6", [

            //                     ])
            //                 ])
            //             ])

            //     ]
            // ),

            m("div", { "class": "col-lg-12 col-md-12 col-sm-12" },
                [
                    m("label",
                        `Currently ${!vnode.state?.statusInfo ? '' : vnode.state?.statusInfo[0].status} What Status Would You Like To Change This Job To? `
                    ),
                    m("br"),

                    m("div", { "class": "btn-group btn-group-toggle", "data-toggle": "buttons" },
                        [
                            [{
                                status: "PICK_UP",
                                label: 'PICK_UP'
                            }, {
                                status: "COLLECTED",
                                label: 'COLLECTED'
                            }, {
                                status: "PROCESSING",
                                label: 'PROCESSING'
                            }, {
                                status: "QUALITY_CHECK",
                                label: 'QUALITY_CHECK'
                            }, {
                                status: "DISPATCH",
                                label: 'DISPATCH'
                            }, {
                                status: "DELIVERED",
                                label: 'DELIVERED'
                            }, {
                                status: "BLOCKED",
                                label: 'BLOCKED'
                            }]
                              
                                .map((statusInfo) => {
                                    const { status, label } = statusInfo

                                    var currentStatus = !vnode.state?.statusInfo ? null : vnode.state?.statusInfo[0].status
                                    // console.log(currentStatus, status)
                                    return m("label", { "class": `btn btn-info ${currentStatus === status ? "focus active" : ""}` },
                                        [
                                            m("input", {
                                                "type": "radio",
                                                "name": "pickupDay",
                                                "id": `pickupDay_${status}`,
                                                //"id": pickupDay,
                                                // disabled: date.day() === 0,
                                                // "checked": pickupDay === date.format('L') ? true : false,
                                                onchange: () => {

                                                    console.log("Before Status Update - Selected StatusInfo:", vnode.state.statusInfo);


                                                    // preserve the previous status and keep the time of the change
                                                    vnode.state.statusInfo = !vnode.state.statusInfo ? [{
                                                        status,
                                                        createdAt: new Date()
                                                    }] : [{
                                                        status,
                                                        createdAt: new Date()
                                                    }, ...vnode.state.statusInfo]
                                                    console.log("After Status Update - Selected StatusInfo:", vnode.state.statusInfo);

                                                    m.request({
                                                        method: "PATCH",
                                                        url: `${url}/jobs/${_id}`,
                                                        headers: {
                                                            'Content-Type': 'application/json',
                                                            'authorization': localStorage.getItem('token')
                                                        },
                                                        data: {
                                                            status: vnode.state,
                                                            // Include other data you need to send to the server
                                                        },
                                                    }).then((response) => {
                                                        // Handle the response if needed
                                                        vnode.state.updateOrderOnServer(() => { });
                                                    }).catch((error) => {
                                                        console.error("Error making request:", error);

                                                        // Handle the error or provide appropriate feedback to the user
                                                    });


                                                }
                                            }),
                                            label
                                        ]
                                    )
                                }),
                        ]
                    )
                ]
            ),
              m("div", {class:"form-group row", style:{padding:"10px"}},
                                m("label", { for: "myCheckbox" }, "skip SMS"),
                                m("input", {
                                    type: "checkbox",
                                    checked: vnode.state.skipSms,
                                    id: "myCheckbox",
                                    onchange: (event) => {
                                        vnode.state.skipSms=event.target.checked;
                                        console.log("checked", event.target.checked)
                                    },
                                    style: {
                                        width: "20px",
                                        height: "20px",
                                    },

                                }),

                                ),

            // vnode.state?.job?.statusInfo ? m("rel", "Current Status: " + vnode.state?.job?.statusInfo[0].status) : [],
            m(".row", [
                m("div", { "class": "card-body" }, [
                    m("div", { "class": "form-group mb-1" },
                        [
                            m("label", { "for": "exampleTextarea" },
                                "More Details"
                            ),
                            m("textarea", {
                                oninput: (e) => {
                                    vnode.state.moreDetails = e.target.value
                                },
                                value: moreDetails,
                                "class": "form-control",
                                "id": "exampleTextarea",
                                "rows": "4",
                                "spellcheck": "true"
                            })
                        ]
                    )
                ])
            ]),

            m(".row", [
                m("div", { "class": "card-body" }, [
                    m("div", { "class": "form-group mb-1" },
                        [
                            m("label", { "for": "exampleTextarea" },
                                "Mpesa Confirmation message"
                            ),
                            m("textarea", {
                                oninput: (e) => {
                                    vnode.state.mpesaConfirmationCode = e.target.value
                                },
                                value: mpesaConfirmationCode,
                                "class": "form-control",
                                "id": "exampleTextarea",
                                "rows": "12",
                                "spellcheck": "true"
                            })
                        ]
                    )
                ])
            ]),

            m(".row", [
                // m(".col-lg-3", [
                //     m("div", { "class": "card card-custom gutter-b" },
                //         [

                //             m("div", { "class": "card-body pt-0 pb-4" },
                //                 // content id
                //                 vnode.state?.jobs && !vnode.state?.jobs[0] ? null : [
                //                     m("div", { "class": "card-body d-flex align-items-center py-5 py-lg-13" },
                //                         [
                //                             m("div", [
                //                                 m("button", {
                //                                     "class": "btn btn-primary btn-lg btn-block",
                //                                     "type": "button",
                //                                     disabled: vnode.state.jobs && vnode.state.jobs[0].assigned_to,
                //                                     onclick() {
                //                                         const options = {
                //                                             method: 'PATCH',
                //                                             url: url + `/jobs/${vnode.state.jobs[0]._id}`,
                //                                             headers: { 'Content-Type': 'application/json' },
                //                                             data: {
                //                                                 assigned_to: {
                //                                                     id: localStorage.getItem("authToken"),
                //                                                     name: localStorage.getItem("name")
                //                                                 }
                //                                             }
                //                                         };

                //                                         axios.request(options).then(function (response) {
                //                                             console.log(response.data);
                //                                             location.reload()
                //                                         }).catch(function (error) {
                //                                             console.error(error);
                //                                         });
                //                                     }
                //                                 },
                //                                     "Confirm Job as Closed"
                //                                 )
                //                             ])
                //                         ]
                //                     ),
                //                     vnode.state.jobs && !vnode.state.jobs[0].completed_upload ? null : m("div", { "class": "card-body d-flex align-items-center py-5 py-lg-13" },
                //                         [
                //                             m("div", [
                //                                 m("button", {
                //                                     "class": "btn btn-primary btn-lg btn-block", "type": "button",
                //                                     disabled: vnode.state.jobs && vnode.state.jobs[0].ready_for_review,
                //                                     onclick() {
                //                                         const options = {
                //                                             method: 'PATCH',
                //                                             url: url + `/jobs/${vnode.state.jobs[0]._id}`,
                //                                             headers: { 'Content-Type': 'application/json' },
                //                                             data: {
                //                                                 ready_for_review: true
                //                                             }
                //                                         };

                //                                         axios.request(options).then(function (response) {
                //                                             console.log(response.data);
                //                                             location.reload()
                //                                         }).catch(function (error) {
                //                                             console.error(error);
                //                                         });
                //                                     }
                //                                 },
                //                                     vnode.state.jobs && vnode.state.jobs[0].ready_for_review ? "Job is Submited for review" : "Job is Ready for Review"
                //                                 )
                //                             ])
                //                         ]
                //                     )
                //                 ]
                //             )
                //         ]
                //     )
                // ]),
                // vnode.state.jobs[0] && vnode.state.jobs[0].assigned_to && [vnode.state.jobs[0].assigned_to.id !== localStorage.getItem("authToken") ? [] : m(".col-lg-9", [
                //     m("div", { "class": "card card-custom gutter-b" },
                //         [
                //             m("div", { "class": "card-header border-0 pt-7" },
                //                 [
                //                     m("h3", { "class": "card-title align-items-start flex-column" },
                //                         [
                //                             m("span", { "class": "card-label font-weight-bold font-size-h4 text-dark-75" },
                //                                 "Upload Compleated Work"
                //                             ),
                //                             // m("span", { "class": "text-muted mt-3 font-weight-bold font-size-sm" },
                //                             //     "More than 400+ new members"
                //                             // )
                //                         ]
                //                     )
                //                 ]
                //             ),
                //             m("div", { "class": "card-body pt-0 pb-4" },
                //                 // content id
                //                 m("div", { "class": "card-body d-flex align-items-center py-5 py-lg-13" },
                //                     [

                //                         m("div", { "class": "m-0 text-dark-50 font-weight-bold font-size-lg" },
                //                             [
                //                                 m("div", { "class": "form-group" },
                //                                     [
                //                                         m("label",
                //                                             "Compleated Work"
                //                                         ),
                //                                         m("div"),
                //                                         m(uploader, {
                //                                             jobID: vnode.attrs.job,
                //                                             job: vnode.state.jobs[0],
                //                                             field: "completed_upload"
                //                                         })
                //                                     ]
                //                                 ),
                //                                 m("div", { "class": "form-group" },
                //                                     [
                //                                         m("label",
                //                                             "Plaegerism Report"
                //                                         ),
                //                                         m("div"),
                //                                         m(uploader, {
                //                                             jobID: vnode.attrs.job,
                //                                             job: vnode.state.jobs[0],
                //                                             field: "plaegerism_upload"
                //                                         })
                //                                     ]
                //                                 )
                //                             ]
                //                         ),
                //                     ]
                //                 )
                //             ),

                //         ]
                //     )
                // ])]
            ]),



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
                        m("button", {
                            type: "button",
                            "class": "btn btn-lg btn-info",
                            onclick() {
                                // alert("saving order")
                                console.log("Button clicked!");
                                vnode.state.updateOrderOnServer(() => location.reload())
                            }
                        }, [
                            m("i", { "class": "flaticon2-mail-1" }),
                            " Save My order"
                        ]),
                    ]),
                    // ])


                ])
        ]
    }
    // view(){
    //     return [];
    // }
}

export default order_item