import axios from "axios";
import {
    typesMapping,

    academicLevels,
    paymentTypes,

    timeTypeDay,
    timeTypeHr,
    paperFormats,
    pricepage,

    contentTypeWords,
    subjectAreaMapping,
    contentTypePage,
    writerType,
    contentSpacingTypeSingle,
    contentSpacingTypeDouble,
    url,
    serviceTypes
} from "../constants"
import uploader from "../components/uploader"

var calculator = () => {
    var initialData
    var priceMapping = {
        24: 25,
        72: 18,
    }

    var timeLimit = timeTypeDay
    var contentLimit = contentTypePage

    var days = 1
    var pages = 1

    return {
        oncreate(vnode) {
            // Datetimepicker
            $('#kt_datetimepicker_1').datetimepicker({
                pickerPosition: 'bottom-left',
                todayHighlight: true,
                autoclose: true
            });

            $('#kt_datetimepicker_1').on('change.datetimepicker', function (e) {
                var deadline = $("#kt_datetimepicker_1").find("input").val();
                vnode.state.deadline = deadline

                const startTime = moment(new Date())
                const end = moment(deadline)
                var duration = moment.duration(end.diff(startTime));
                var hours = duration.asHours();
                // console.log({ hours })
                vnode.state.hrs = Math.floor(hours)
                m.redraw()
            });

            // paypal
            window.$("html, body").animate({ scrollTop: 0 }, "fast");
            paypal.Buttons({
                createOrder: function (data, actions) {
                    // Set up the transaction
                    return actions.order.create({
                        purchase_units: [{
                            amount: {
                                value: vnode.state.calculatePrice()
                            }
                        }],
                        application_context: {
                            shipping_preference: 'NO_SHIPPING'
                        }
                    });
                },
                onApprove: async (data, actions) => {
                    // Authorize the transaction
                    actions.order.authorize().then(async function (authorization) {

                        // Get the authorization id
                        var authorizationID = authorization.purchase_units[0]
                            .payments.authorizations[0].id

                        const {
                            id,
                            hrs,
                            days,
                            pages,
                            words,
                            sources,
                            powerpoints,
                            price,
                            timeLimit,
                            writerType,
                            contentLimit,
                            paymentsType,
                            academicLevel,
                            spacingType,
                            typesMapping,
                            subjectArea,
                            articleType,
                            articleLevel,
                            paperFormat,
                            title,
                            instructions
                        } = vnode.state

                        const job = {
                            hrs,
                            days,
                            pages,
                            words,
                            sources,
                            powerpoints,
                            price,
                            timeLimit,
                            writerType,
                            contentLimit,
                            paymentsType,
                            academicLevel,
                            spacingType,
                            articleType,
                            articleLevel,
                            paperFormat,
                            subjectArea,
                            title,
                            instructions
                        }

                        try {
                            // Call your server to validate and capture the transaction
                            await fetch(url + '/payments', {
                                method: 'post',
                                headers: {
                                    'content-type': 'application/json'
                                },
                                body: JSON.stringify({
                                    jobID: vnode.state.id,
                                    paypalOrderID: data.orderID,
                                    authorizationID: authorizationID,
                                    paypal_cb_data: data
                                })
                            });

                            job.partial = false
                            job.paid = true

                            axios.patch(url + "/jobs/" + id, job).then(function (response) {
                                vnode.state.lastJobDetails = job
                                m.route.set("/thankyou")
                            }).catch(function (error) {
                                console.error(error);
                            });
                        } catch (err) {
                            job.partial = false
                            job.paid = false

                            axios.patch(url + "/jobs/" + id, job).then(function (response) {
                                // console.log(response)
                                vnode.state.lastJobDetails = job
                                m.route.set("/thankyou")
                            }).catch(function (error) {
                                console.error(error);
                            });
                        }
                    });
                }
            }).render(document.getElementById("paypal_button"));

        },
        oninit: function (vnode) {
            var priceString = priceMapping[24]
            var cost = 0
            var price = 0
            vnode.state = Object.assign(vnode.state, {
                activeOrder: {},
                hrs: 0,
                days,
                pages,
                words: 0,
                sources: 0,
                powerpoints: 0,
                price: priceString,
                timeLimit,
                writerType,
                contentLimit,
                paymentsType: paymentTypes[0],
                academicLevel: academicLevels[0],
                spacingType: contentSpacingTypeDouble,
                typesMapping,
                articleType: {
                    type: typesMapping[1][0]
                },
                serviceType: serviceTypes[0],
                paperFormat: paperFormats[0],
                // deadline,
                subjectAreaMapping,
                articleLevel: "High School",
                paypalTestMode: false,
                calculatePrice() {
                    if (vnode.state.paypalTestMode) {
                        return 2
                    }

                    var {
                        hrs,
                        days,
                        pages,
                        words,
                        price: priceString,
                        timeLimit,
                        contentLimit
                    } = vnode.state

                    if (timeLimit === timeTypeHr) {
                        if (hrs >= 25 && hrs <= 49) {
                            price = 18
                            if (contentLimit === contentTypePage) {
                                cost = price * Number(pages)
                            } else {
                                cost = price * Number(words)
                            }
                        } else if (hrs < 25) {
                            price = 13
                            if (contentLimit === contentTypePage) {
                                cost = price * Number(pages)
                            } else {
                                cost = price * Number(words)
                            }
                        } else {
                            price = 15
                            if (contentLimit === contentTypePage) {
                                cost = price * Number(pages)
                            } else {
                                cost = price * Number(words)
                            }
                        }
                    } else if (timeLimit === timeTypeDay) {
                        hrs = 24 * Number(days)

                        if (hrs >= 25 && hrs <= 49) {
                            price = 18
                            if (contentLimit === contentTypePage) {
                                cost = price * Number(pages)
                            } else {
                                cost = price * Number(words)
                            }
                        } else if (hrs < 25) {
                            price = 13
                            if (contentLimit === contentTypePage) {
                                cost = price * Number(pages)
                            } else {
                                cost = price * Number(words)
                            }
                        } else {
                            price = 15
                            if (contentLimit === contentTypePage) {
                                cost = price * Number(pages)
                            } else {
                                cost = price * Number(words)
                            }
                        }
                    }

                    return cost
                },
                uploading: false,
            }, JSON.parse(localStorage.getItem("activeOrder")))



            // create an order if there was not one already running
            // cache order in local storage even accross refreshes
            const activeOrderId = localStorage.getItem("activeOrderId")
            const activeOrder = JSON.parse(localStorage.getItem("activeOrder"))

            if (activeOrderId) {
                vnode.state.id = activeOrderId
            }


            const updateOrderOnServerPeriodically = (period) => {
                setInterval(() => {
                    // console.log(vnode.state.activeOrder)
                    const order = Object.assign({}, vnode.state, {
                        typesMapping: undefined,
                        subjectAreaMapping: undefined,
                        oninit: undefined,
                        oncreate: undefined,
                        view: undefined,
                        activeOrder: undefined
                    })

                    // console.log(order)

                    const options = {
                        method: 'PATCH',
                        url: url + "/jobs/" + activeOrderId,
                        headers: {
                            'Content-Type': 'application/json',
                            'authorization': localStorage.getItem('token')
                        },
                        data: order
                    };

                    vnode.state.uploading = true
                    axios.request(options).then(function (response) {
                        vnode.state.activeOrder = order
                        localStorage.setItem("activeOrder", JSON.stringify(order))

                        vnode.state.uploading = false
                        vnode.state.saved = false
                        vnode.state.lastSyncTime = new Date()
                        // add toastr notification
                        // m.route.set("/order2", {
                        //     order
                        // })
                    }).catch(function (error) {
                        order.id = null
                        order.retry_innitial_send = true
                        // vnode.state.activeOrder = order
                        vnode.state.uploading = false
                        vnode.state.saved = false
                        // m.route.set("/order2", {
                        //     order
                        // })
                    });

                }, period);
            }

            if (!activeOrderId) {
                const order = {
                    hrs: 0,
                    days,
                    pages,
                    words: 0,
                    sources: 0,
                    powerpoints: 0,
                    price: priceString,
                    timeLimit,
                    writerType,
                    contentLimit,
                    paymentsType: paymentTypes[0],
                    academicLevel: academicLevels[0],
                    spacingType: contentSpacingTypeDouble,
                    typesMapping,
                    articleType: {
                        type: typesMapping[1][0]
                    },
                    serviceType: serviceTypes[0],
                    paperFormat: paperFormats[0],
                    // deadline,
                    subjectAreaMapping,
                    articleLevel: "High School",
                    partial: true
                }

                const options = {
                    method: 'POST',
                    url: url + "/jobs",
                    headers: {
                        'Content-Type': 'application/json',
                        'authorization': localStorage.getItem('token')
                    },
                    data: order
                };

                vnode.state.uploading = true
                axios.request(options).then(function (response) {
                    order.id = response.data.insertedId

                    vnode.state.activeOrder = order
                    localStorage.setItem("activeOrderId", order.id)
                    localStorage.setItem("activeOrder", JSON.stringify(order))

                    vnode.state.uploading = false
                    vnode.state.saved = false
                    // add toastr notification
                    // m.route.set("/order2", {
                    //     order
                    // })

                    updateOrderOnServerPeriodically(3000)
                }).catch(function (error) {
                    order.id = null
                    order.retry_innitial_send = true
                    // vnode.state.activeOrder = order
                    vnode.state.uploading = false
                    vnode.state.saved = false
                    // m.route.set("/order2", {
                    //     order
                    // })
                });
            } else {
                vnode.state.activeOrder = activeOrder

                updateOrderOnServerPeriodically(3000)
            }
        },
        view(vnode) {
            var {
                hrs,
                days,
                pages,
                words,
                sources,
                powerpoints,
                price: priceString,
                timeLimit,
                writerType,
                contentLimit,
                paymentsType,
                academicLevel,
                spacingType,
                typesMapping,
                deadline,
                articleType: {
                    type,
                    point
                },
                articleLevel,
                uploading,

                price,

                articleType,
                paperFormat,

                title,
                instructions,
                writer_id,
                writer_samples,
                get_sources_copy,
                progressive_deliverly,
                related_assignent,
                activeOrder,



                pickupDay,
                pickupTime,
                dropOffTime
            } = vnode.state



            return m("div", { "class": "card-body" },

                m("form",
                    [
                        m("div", { "class": "form-group row" },
                            [
                                // m("div", { "class": "col-lg-2 col-md-4 col-sm-4" },
                                //     [
                                //         m("label",
                                //             "Academic Level:"
                                //         ),
                                //         m("div", { "class": "dropdown" },
                                //             [
                                //                 m("button", { "class": "btn btn-secondary dropdown-toggle", "type": "button", "id": "dropdownMenuButton", "data-toggle": "dropdown", "aria-haspopup": "true", "aria-expanded": "false" },
                                //                     vnode.state.academicLevel
                                //                 ),
                                //                 m("div", { "class": "dropdown-menu", "aria-labelledby": "dropdownMenuButton" },
                                //                     academicLevels.map(level => m("a", {
                                //                         "class": "dropdown-item",
                                //                         onclick() {
                                //                             vnode.state.academicLevel = level
                                //                         },
                                //                     },
                                //                         level
                                //                     ))
                                //                 )
                                //             ]
                                //         )
                                //     ]),
                                m("div", { "class": "col-lg-6 col-md-6 col-sm-12" },
                                    [
                                        m("label",
                                            "When would you like your Pickup?"
                                        ),
                                        m("br"),

                                        m("div", { "class": "btn-group btn-group-toggle", "data-toggle": "buttons" },
                                            [
                                                [
                                                    "Saturday",
                                                    // "Sunday",
                                                    "Monday",
                                                    "Teusday",
                                                    "Wednesday",
                                                    "Thursday",
                                                    "Friday"
                                                ].map(day => {
                                                    return m("label", { "class": `btn btn-info ${pickupDay == day ? "active" : ""}` },
                                                        [
                                                            m("input", {
                                                                "type": "radio",
                                                                "name": "academicLevels",
                                                                "id": day,
                                                                "checked": pickupDay == day ? true : false,
                                                                onchange: () => {
                                                                    vnode.state.pickupDay = day
                                                                }
                                                            }),
                                                            day
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
                                                    vnode.state.pickupTime
                                                ),
                                                m("div", { "class": "dropdown-menu", "aria-labelledby": "dropdownMenuButton" },
                                                    [
                                                        [
                                                            "7am - 8am"
                                                        ].map(time => {
                                                            return m("a", {
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
                                m("div", { "class": "col-lg-6 col-md-6 col-sm-12" },
                                    [
                                        m("label",
                                            "When would you like your DropOff?"
                                        ),
                                        m("br"),

                                        m("div", { "class": "btn-group btn-group-toggle", "data-toggle": "buttons" },
                                            [
                                                [
                                                    "Saturday",
                                                    // "Sunday",
                                                    "Monday",
                                                    "Teusday",
                                                    "Wednesday",
                                                    "Thursday",
                                                    "Friday"
                                                ].map(day => {
                                                    return m("label", { "class": `btn btn-info ${pickupDay == day ? "active" : ""}` },
                                                        [
                                                            m("input", {
                                                                "type": "radio",
                                                                "name": "academicLevels",
                                                                "id": day,
                                                                "checked": pickupDay == day ? true : false,
                                                                onchange: () => {
                                                                    vnode.state.pickupDay = day
                                                                }
                                                            }),
                                                            day
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
                                                vnode.state.dropOffTime
                                            ),
                                            m("div", { "class": "dropdown-menu", "aria-labelledby": "dropdownMenuButton" },
                                                [
                                                    [
                                                        "7am - 8am"
                                                    ].map(time => {
                                                        return m("a", {
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


                            ]
                        ),





                        // order ends here 
                    ]
                )
            )
        }
    }
}


export default calculator