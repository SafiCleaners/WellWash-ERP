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

export default () => {
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
                activeOrder
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
                                            "Academic level:"
                                        ),
                                        m("br"),

                                        m("div", { "class": "btn-group btn-group-toggle", "data-toggle": "buttons" },
                                            [
                                                academicLevels.map(level => {
                                                    return m("label", { "class": `btn btn-info ${academicLevel == level ? "active" : ""}` },
                                                        [
                                                            m("input", {
                                                                "type": "radio",
                                                                "name": "academicLevels",
                                                                "id": level,
                                                                "checked": academicLevel == level ? true : false,
                                                                onchange: () => {
                                                                    vnode.state.academicLevel = level
                                                                }
                                                            }),
                                                            level
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
                                            "Type of service:"
                                        ),
                                        m("div", { "class": "dropdown" },
                                            [
                                                m("button", { "class": "btn btn-secondary dropdown-toggle", "type": "button", "id": "dropdownMenuButton", "data-toggle": "dropdown", "aria-haspopup": "true", "aria-expanded": "false" },
                                                    vnode.state.articleType.type
                                                ),
                                                m("div", { "class": "dropdown-menu", "aria-labelledby": "dropdownMenuButton" },
                                                    [
                                                        Object.keys(vnode.state.typesMapping).map(point => {
                                                            return vnode.state.typesMapping[point].map(type => {
                                                                return m("a", {
                                                                    style: { "z-index": 10000 },
                                                                    onclick() {
                                                                        vnode.state.articleType = {
                                                                            point,
                                                                            type
                                                                        }
                                                                    },
                                                                    "class": "dropdown-item",
                                                                },
                                                                    type
                                                                )
                                                            })
                                                        })
                                                    ]
                                                )
                                            ]
                                        )
                                    ]),

                                m("div", { "class": "col-lg-4 col-md-4 col-sm-4" },
                                    [
                                        m("label",
                                            "Document Limits:"
                                        ),
                                        m("div", { "class": "form-group" },
                                            [

                                                m("div", { "class": "form-check form-check-inline" },
                                                    [
                                                        m("input", {
                                                            "class": "form-check-input", "type": "radio", "name": "contentLimit", "id": "page", "value": "option2",
                                                            checked: vnode.state.contentLimit === contentTypePage,
                                                            onchange: () => {
                                                                // console.log("Changed to page limit")
                                                                vnode.state.contentLimit = contentTypePage
                                                                vnode.state.words = 0
                                                            }
                                                        }),
                                                        m("label", { "class": "form-check-label", "for": "contentLimit" },
                                                            "Paper's Page Limit"
                                                        )
                                                    ]
                                                ),
                                                m("div", { "class": "form-check form-check-inline" },
                                                    [
                                                        m("input", {
                                                            "class": "form-check-input", "type": "radio", "name": "contentLimit", "id": "word", "value": "option1",
                                                            checked: vnode.state.contentLimit === contentTypeWords,
                                                            onchange: () => {
                                                                // console.log("Changed to word limit")
                                                                vnode.state.contentLimit = contentTypeWords
                                                                vnode.state.pages = 0
                                                            }
                                                        }),
                                                        m("label", { "class": "form-check-label", "for": "contentLimit" },
                                                            "Paper's Word Limit"
                                                        )
                                                    ]
                                                ),
                                            ]
                                        ),
                                    ]),

                                m("div", { "class": "col-lg-4 col-md-4 col-sm-4" },
                                    [
                                        m("label",
                                            `Number of ${contentLimit == contentTypeWords ? "Words" : "Pages"}`
                                        ),
                                        m("div", { "class": "form-group" },
                                            m("div", { "class": "input-group mb-3" },
                                                [
                                                    m("div", { "class": "input-group-prepend" },
                                                        m("button", {
                                                            "class": "btn btn-outline-secondary", "type": "button", "id": "button-addon1",
                                                            onclick() {
                                                                if (contentLimit == contentTypeWords) {
                                                                    vnode.state.words = Number(vnode.state.words) - 1
                                                                } else {
                                                                    vnode.state.pages = Number(vnode.state.pages) - 1
                                                                }
                                                            }
                                                        },
                                                            "-"
                                                        )
                                                    ),
                                                    m("input", {
                                                        "class": "form-control", "type": "number", "placeholder": `No. of ${contentLimit == contentTypeWords ? "Words" : "Pages"}`, "aria-describedby": "button-addon1",
                                                        "value": words || pages,
                                                        oninput(e) {

                                                            if (contentLimit == contentTypeWords) {
                                                                vnode.state.words = e.target.value
                                                                vnode.state.pages = null
                                                            } else {
                                                                vnode.state.pages = e.target.value
                                                                vnode.state.words = null
                                                            }
                                                        }
                                                    }),
                                                    m("div", { "class": "input-group-append" },
                                                        m("button", {
                                                            "class": "btn btn-outline-secondary", "type": "button", "id": "button-addon1",
                                                            onclick() {
                                                                if (contentLimit == contentTypeWords) {
                                                                    vnode.state.words = Number(vnode.state.words) + 1
                                                                } else {
                                                                    vnode.state.pages = Number(vnode.state.pages) + 1
                                                                }
                                                            }
                                                        },
                                                            "+"
                                                        )
                                                    )
                                                ]
                                            )
                                        )
                                    ])
                            ]
                        ),

                        m("div", { "class": "form-group row" },
                            [
                                m("div", { "class": "col-lg-6 col-md-6 col-sm-6" },
                                    [
                                        m("label",
                                            "Document Spacing:"
                                        ),
                                        m("div", { "class": "form-group" },
                                            [

                                                m("div", { "class": "form-check form-check-inline" },
                                                    [
                                                        m("input", {
                                                            "class": "form-check-input",
                                                            "type": "radio",
                                                            "name": "spacingType",
                                                            "id": "contentSpacingTypeDouble",
                                                            "value": contentSpacingTypeDouble,
                                                            checked: vnode.state.spacingType === contentSpacingTypeDouble,
                                                            onchange: () => {
                                                                vnode.state.spacingType = contentSpacingTypeDouble
                                                            }
                                                        }),
                                                        m("label", { "class": "form-check-label", "for": "contentSpacingTypeDouble" },
                                                            "Double Spacing"
                                                        )
                                                    ]
                                                ),
                                                m("div", { "class": "form-check form-check-inline" },
                                                    [
                                                        m("input", {
                                                            "class": "form-check-input",
                                                            "type": "radio",
                                                            "name": "spacingType",
                                                            "id": "contentSpacingTypeSingle",
                                                            "value": contentSpacingTypeSingle,
                                                            checked: vnode.state.spacingType === contentSpacingTypeSingle,
                                                            onchange: () => {
                                                                vnode.state.spacingType = contentSpacingTypeSingle
                                                            }
                                                        }),
                                                        m("label", { "class": "form-check-label", "for": "contentSpacingTypeSingle" },
                                                            "Single Spacing"
                                                        )
                                                    ]
                                                ),
                                            ]
                                        )
                                    ]),
                                // m("div", { "class": "col-lg-4 col-md-4 col-sm-4" },
                                //     [
                                // m("label",
                                //     "Document Urgency:"
                                // ),
                                //         m("div", { "class": "form-group" },
                                //             [
                                //                 m("div", { "class": "form-check form-check-inline" },
                                //                     [
                                //                         m("input", {
                                //                             "class": "form-check-input", "type": "radio", "name": "urgencyType", "id": "day", "value": "option2",
                                //                             checked: vnode.state.timeLimit === timeTypeDay,
                                //                             onchange: () => {
                                //                                 console.log("Changed to day limit")
                                //                                 vnode.state.timeLimit = timeTypeDay
                                //                                 vnode.state.hrs = 0
                                //                             }
                                //                         }),
                                //                         m("label", { "class": "form-check-label", "for": "urgencyType" },
                                //                             "Urgency in Days"
                                //                         )
                                //                     ]
                                //                 ),
                                //                 m("div", { "class": "form-check form-check-inline" },
                                //                     [
                                //                         m("input", {
                                //                             "class": "form-check-input", "type": "radio", "name": "urgencyType", "id": "hr", "value": "option1",
                                //                             checked: vnode.state.timeLimit === timeTypeHr,
                                //                             onchange: () => {
                                //                                 console.log("Changed to hr limit")
                                //                                 vnode.state.timeLimit = timeTypeHr
                                //                                 vnode.state.days = 0
                                //                             }
                                //                         }),
                                //                         m("label", { "class": "form-check-label", "for": "urgencyType" },
                                //                             "Urgency in Hours"
                                //                         )
                                //                     ]
                                //                 ),
                                //             ]
                                //         ),
                                //     ]),
                                m("div", { "class": "col-lg-6 col-md-6 col-sm-6" },
                                    [
                                        // m("div", { "class": "form-group" }, [
                                        //     m("label",
                                        //         `Number of ${timeLimit == timeTypeDay ? "Days" : "Hours"}`
                                        //     ),
                                        //     m("div", { "class": "input-group mb-3" },
                                        //         [
                                        //             m("div", { "class": "input-group-prepend" },
                                        //                 m("button", {
                                        //                     "class": "btn btn-outline-secondary", "type": "button", "id": "button-addon1",
                                        //                     onclick() {
                                        //                         if (timeLimit == timeTypeDay) {
                                        //                             vnode.state.urgency = Number(vnode.state.days) - 1
                                        //                         } else {
                                        //                             vnode.state.hrs = Number(vnode.state.hrs) - 1
                                        //                         }
                                        //                     }
                                        //                 },
                                        //                     "-"
                                        //                 )
                                        //             ),
                                        //             m("input", {
                                        //                 "class": "form-control", "type": "number", "placeholder": `No. of ${timeLimit == timeTypeDay ? "Day" : "Hrs"}`, "aria-describedby": "button-addon1",
                                        //                 value: days || hrs,
                                        //                 oninput(e) {
                                        //                     if (timeLimit == timeTypeDay) {
                                        //                         vnode.state.days = e.target.value
                                        //                         vnode.state.hrs = null
                                        //                     } else {
                                        //                         vnode.state.hrs = e.target.value
                                        //                         vnode.state.days = null
                                        //                     }
                                        //                 }
                                        //             }),
                                        //             m("div", { "class": "input-group-append" },
                                        //                 m("button", {
                                        //                     "class": "btn btn-outline-secondary", "type": "button", "id": "button-addon1",
                                        //                     onclick() {
                                        //                         if (timeLimit == timeTypeDay) {
                                        //                             vnode.state.days = Number(vnode.state.days) + 1
                                        //                         } else {
                                        //                             vnode.state.hrs = Number(vnode.state.hrs) + 1
                                        //                         }
                                        //                     }
                                        //                 },
                                        //                     "+"
                                        //                 )
                                        //             )
                                        //         ]
                                        //     ),
                                        //     m("span", { "class": "form-text text-muted" },
                                        //         `Document needed in ${vnode.state.timeLimit != timeTypeHr ? vnode.state.days : vnode.state.hrs} ${vnode.state.timeLimit}s`
                                        //     )
                                        // ])

                                        m("div", { "class": "form-group row" },
                                            [
                                                m("label",
                                                    `Document Urgency: ${hrs} hrs`
                                                ),
                                                m("div", { "class": "input-group date", "id": "kt_datetimepicker_1", "data-target-input": "nearest" },
                                                    [
                                                        m("input", {
                                                            "class": "form-control datetimepicker-input",
                                                            "type": "text",
                                                            "placeholder": "Select Deadline Date & Time",
                                                            "data-target": "#kt_datetimepicker_1",
                                                            "value": deadline
                                                        }),
                                                        m("div", {
                                                            "class": "input-group-append",
                                                            "data-target": "#kt_datetimepicker_1",
                                                            "data-toggle": "datetimepicker"
                                                        },
                                                            m("span", { "class": "input-group-text" },
                                                                m("i", { "class": "ki ki-calendar" })
                                                            )
                                                        )
                                                    ]
                                                )
                                            ]
                                        )
                                    ])
                            ]),




                        m("div", { "class": "form-group row" },
                            [
                                m("div", { "class": "col-lg-6 col-md-6 col-sm-12" },
                                    [
                                        // sources
                                        m("label",
                                            "Sources:"
                                        ),

                                        m("div", { "class": "form-group" },
                                            m("div", { "class": "input-group mb-3" },
                                                [
                                                    m("div", { "class": "input-group-prepend" },
                                                        m("button", {
                                                            "class": "btn btn-outline-secondary", "type": "button", "id": "button-addon1",
                                                            onclick() {
                                                                vnode.state.sources = Number(vnode.state.sources) - 1
                                                            }
                                                        },
                                                            "-"
                                                        )
                                                    ),
                                                    m("input", {
                                                        "class": "form-control", "type": "number", "placeholder": `No. of Sources`, "aria-describedby": "button-addon1",
                                                        value: sources,
                                                        oninput(e) {
                                                            vnode.state.sources = e.target.value
                                                        }
                                                    }),
                                                    m("div", { "class": "input-group-append" },
                                                        m("button", {
                                                            "class": "btn btn-outline-secondary", "type": "button", "id": "button-addon1",
                                                            onclick() {
                                                                vnode.state.sources = Number(vnode.state.sources) + 1
                                                            }
                                                        },
                                                            "+"
                                                        )
                                                    )
                                                ]
                                            )
                                        )
                                    ]),

                                m("div", { "class": "col-lg-6 col-md-6 col-sm-12" },
                                    [
                                        // powerpoint slides
                                        m("label",
                                            "PowerPoint Slides"
                                        ),

                                        m("div", { "class": "form-group" },
                                            m("div", { "class": "input-group mb-3" },
                                                [
                                                    m("div", { "class": "input-group-prepend" },
                                                        m("button", {
                                                            "class": "btn btn-outline-secondary", "type": "button", "id": "button-addon1",
                                                            onclick() {
                                                                vnode.state.powerpoints = Number(vnode.state.powerpoints) - 1
                                                            }
                                                        },
                                                            "-"
                                                        )
                                                    ),
                                                    m("input", {
                                                        "class": "form-control", "type": "number", "placeholder": `No. of PowerPoint Slides`, "aria-describedby": "button-addon1",
                                                        value: powerpoints,
                                                        oninput(e) {
                                                            vnode.state.powerpoints = e.target.value
                                                        }
                                                    }),
                                                    m("div", { "class": "input-group-append" },
                                                        m("button", {
                                                            "class": "btn btn-outline-secondary", "type": "button", "id": "button-addon1",
                                                            onclick() {
                                                                vnode.state.powerpoints = Number(vnode.state.powerpoints) + 1
                                                            }
                                                        },
                                                            "+"
                                                        )
                                                    )
                                                ]
                                            )
                                        ),
                                    ])]),
                        m("div", { "class": "form-group" },
                            [
                                m("label", { "for": "exampleInputPassword1" },
                                    "Price (USD)"
                                ),
                                m("input", { "class": "form-control form-control-lg", "type": "price", "id": "price", "disabled": "disabled", "value": `$${vnode.state.calculatePrice()}` })
                            ]
                        ),

                        // order here

                        m("div", { "class": "form-group row" },
                            [
                                // m("div", { "class": "col-lg-6 col-md-6 col-sm-12" },
                                //     [
                                //         m("label",
                                //             "Academic level:"
                                //         ),
                                //         m("br"),

                                //         m("div", { "class": "btn-group btn-group-toggle", "data-toggle": "buttons" },
                                //             [
                                //                 academicLevels.map(level => {
                                //                     return m("label", { "class": `btn btn-info ${academicLevel == level ? "active" : ""}` },
                                //                         [
                                //                             m("input", {
                                //                                 "type": "radio",
                                //                                 "name": "options",
                                //                                 "id": "option1",
                                //                                 "checked": academicLevel == level ? true : false,
                                //                                 onchange: () => {
                                //                                     vnode.state.academicLevel = level
                                //                                 }
                                //                             }),
                                //                             level
                                //                         ]
                                //                     )
                                //                 }),
                                //             ]
                                //         )
                                //     ]
                                // ),
                                // m("div", { "class": "col-lg-3 col-md-6 col-sm-12" },
                                //     [
                                //         m("label",
                                //             "Type of service:"
                                //         ),
                                //         m("div", { "class": "dropdown" },
                                //             [
                                //                 m("button", { "class": "btn btn-secondary dropdown-toggle", "type": "button", "id": "dropdownMenuButton", "data-toggle": "dropdown", "aria-haspopup": "true", "aria-expanded": "false" },
                                //                     vnode.state.serviceType
                                //                 ),
                                //                 m("div", { "class": "dropdown-menu", "aria-labelledby": "dropdownMenuButton" },
                                //                     serviceTypes.map(type => m("a", {
                                //                         "class": "dropdown-item", onclick() {
                                //                             vnode.state.serviceType = type
                                //                         }
                                //                     },
                                //                         type
                                //                     ))
                                //                 )
                                //             ]
                                //         )
                                //     ]
                                // ),
                                m("div", { "class": "col-lg-3 col-md-6 col-sm-12" },
                                    [
                                        m("label",
                                            "Type of paper:"
                                        ),
                                        m("div", { "class": "dropdown" },
                                            [
                                                m("button", { "class": "btn btn-secondary dropdown-toggle", "type": "button", "id": "dropdownMenuButton", "data-toggle": "dropdown", "aria-haspopup": "true", "aria-expanded": "false" },
                                                    vnode.state.articleType ? vnode.state.articleType.type : "Type of paper:"
                                                ),
                                                m("div", { "class": "dropdown-menu", "aria-labelledby": "dropdownMenuButton" },
                                                    [
                                                        Object.keys(vnode.state.typesMapping).map(point => {
                                                            return vnode.state.typesMapping[point].map(type => {
                                                                return m("a", {
                                                                    style: { "z-index": 10000 },
                                                                    onclick() {
                                                                        vnode.state.articleType = {
                                                                            point,
                                                                            type
                                                                        }
                                                                    },
                                                                    "class": "dropdown-item",
                                                                },
                                                                    type
                                                                )
                                                            })
                                                        })
                                                    ]
                                                )
                                            ]
                                        )
                                    ]
                                ),
                                m("div", { "class": "col-lg-12" },
                                    [
                                        m("label",
                                            "Subject Area:"
                                        ),
                                        m("div", { "class": "dropdown" },
                                            [
                                                m("button", { "class": "btn btn-secondary dropdown-toggle", "type": "button", "id": "dropdownMenuButton", "data-toggle": "dropdown", "aria-haspopup": "true", "aria-expanded": "false" },
                                                    !vnode.state.subjectArea ? " Select Subject " : vnode.state.subjectArea.type
                                                ),
                                                m("div", { "class": "dropdown-menu", "aria-labelledby": "dropdownMenuButton" },
                                                    [
                                                        Object.keys(vnode.state.subjectAreaMapping).map(point => {
                                                            return vnode.state.subjectAreaMapping[point].map(type => {
                                                                return m("a", {
                                                                    style: { "z-index": 10000 },
                                                                    onclick() {
                                                                        vnode.state.subjectArea = {
                                                                            point,
                                                                            type
                                                                        }
                                                                    },
                                                                    "class": "dropdown-item",
                                                                },
                                                                    type
                                                                )
                                                            })
                                                        })
                                                    ]
                                                )
                                            ]
                                        )
                                    ]
                                ),
                                m("div", { "class": "col-lg-12" },
                                    [
                                        m("label",
                                            "Title:"
                                        ),
                                        m("div", { "class": "input-group" },
                                            [
                                                m("input", {
                                                    "class": "form-control", "type": "text", "placeholder": "Title to your paper",
                                                    "value": title,
                                                    oninput(e) {
                                                        vnode.state.title = e.target.value
                                                    }
                                                }),
                                                m("div", { "class": "input-group-append" },
                                                    m("span", { "class": "input-group-text" },
                                                        m("i", { "class": "la la-align-center" })
                                                    )
                                                )
                                            ]
                                        ),
                                        m("span", { "class": "form-text text-muted" },
                                            "The title to appear on your paper"
                                        )
                                    ]
                                ),
                                m("div", { "class": "col-lg-12" },
                                    [
                                        m("div", { "class": "form-group mb-1" },
                                            [
                                                m("label", { "for": "exampleTextarea" },
                                                    "Paper Instructions"
                                                ),
                                                m("textarea", {
                                                    "class": "form-control", "id": "exampleTextarea", "rows": "12", "spellcheck": "false",
                                                    "value": instructions,
                                                    oninput(e) {
                                                        vnode.state.instructions = e.target.value
                                                    }
                                                })
                                            ]
                                        )
                                    ]
                                ),
                                m("br"),
                                m("div", { "class": "col-lg-12" },
                                    [
                                        m("div", { "class": "alert alert-custom alert-default", "role": "alert" },
                                            [
                                                m("div", { "class": "alert-icon" },
                                                    m("span", { "class": "svg-icon svg-icon-primary svg-icon-xl" },
                                                        m("svg", { "xmlns": "http://www.w3.org/2000/svg", "xmlns:xlink": "http://www.w3.org/1999/xlink", "width": "24px", "height": "24px", "viewBox": "0 0 24 24", "version": "1.1" },
                                                            m("g", { "stroke": "none", "stroke-width": "1", "fill": "none", "fill-rule": "evenodd" },
                                                                [
                                                                    m("rect", { "x": "0", "y": "0", "width": "24", "height": "24" }),
                                                                    m("path", { "d": "M7.07744993,12.3040451 C7.72444571,13.0716094 8.54044565,13.6920474 9.46808594,14.1079953 L5,23 L4.5,18 L7.07744993,12.3040451 Z M14.5865511,14.2597864 C15.5319561,13.9019016 16.375416,13.3366121 17.0614026,12.6194459 L19.5,18 L19,23 L14.5865511,14.2597864 Z M12,3.55271368e-14 C12.8284271,3.53749572e-14 13.5,0.671572875 13.5,1.5 L13.5,4 L10.5,4 L10.5,1.5 C10.5,0.671572875 11.1715729,3.56793164e-14 12,3.55271368e-14 Z", "fill": "#000000", "opacity": "0.3" }),
                                                                    m("path", { "d": "M12,10 C13.1045695,10 14,9.1045695 14,8 C14,6.8954305 13.1045695,6 12,6 C10.8954305,6 10,6.8954305 10,8 C10,9.1045695 10.8954305,10 12,10 Z M12,13 C9.23857625,13 7,10.7614237 7,8 C7,5.23857625 9.23857625,3 12,3 C14.7614237,3 17,5.23857625 17,8 C17,10.7614237 14.7614237,13 12,13 Z", "fill": "#000000", "fill-rule": "nonzero" })
                                                                ]
                                                            )
                                                        )
                                                    )
                                                ),
                                                m("div", { "class": "alert-text" },
                                                    [
                                                        "PLEASE DON'T INCLUDE YOUR ", m("code",
                                                            "PERSONAL INFORMATION (Phone Number, Email Address) in the instructions section"
                                                        ), ". The information is always kept private and we won't share it"
                                                    ]
                                                )
                                            ]
                                        )]),
                                m("br"),
                                m("br"),
                                m("div", { "class": "col-lg-4" },
                                    m("div", { "class": "form-group mb-1" },
                                        [
                                            m("label", { "for": "exampleTextarea" },
                                                "Attatch additional material 1"
                                            ),

                                            m(uploader, {
                                                jobID: vnode.state.id,
                                                job: vnode.state,
                                                field: "additional_material_1",
                                                uploadedFile: vnode.state["additional_material_1"],
                                                cb: (url) => {
                                                    vnode.state["additional_material_1"] = url
                                                }
                                            })
                                        ])
                                ),
                                m("div", { "class": "col-lg-4" },
                                    m("div", { "class": "form-group mb-1" },
                                        [
                                            m("label", { "for": "exampleTextarea" },
                                                "Attatch additional material 2"
                                            ),

                                            m(uploader, {
                                                jobID: vnode.state.id,
                                                job: vnode.state,
                                                field: "additional_material_2",
                                                uploadedFile: vnode.state["additional_material_2"],
                                                cb: (url) => {
                                                    vnode.state["additional_material_2"] = url
                                                }
                                            })
                                        ])
                                ),
                                m("div", { "class": "col-lg-4" },
                                    m("div", { "class": "form-group mb-1" },
                                        [
                                            m("label", { "for": "exampleTextarea" },
                                                "Attatch additional material 3"
                                            ),

                                            m(uploader, {
                                                jobID: vnode.state.id,
                                                job: vnode.state,
                                                uploadedFile: vnode.state["additional_material_3"],
                                                field: "additional_material_3",
                                                cb: (url) => {
                                                    vnode.state["additional_material_3"] = url
                                                }
                                            })
                                        ])
                                ),

                                m("br"),
                                m("div", { "class": "col-lg-12" },
                                    [
                                        m("label",
                                            "Paper format:"
                                        ),
                                        m("br"),
                                        m("div", { "class": "btn-group btn-group-toggle", "data-toggle": "buttons" },
                                            [
                                                paperFormats.map(format => {
                                                    return m("label", { "class": `btn btn-info ${paperFormat == format ? "active" : ""}` },
                                                        [
                                                            m("input", {
                                                                "type": "radio",
                                                                "name": "options",
                                                                "id": "option1",
                                                                "checked": paperFormat == format ? true : false,
                                                                onchange: () => {
                                                                    vnode.state.paperFormat = format
                                                                }
                                                            }),
                                                            format
                                                        ]
                                                    )
                                                }),
                                            ]
                                        )
                                    ]
                                ),
                                m("div", { "class": "col-lg-12" },
                                    [
                                        m("label",
                                            "Preferred writer's ID:"
                                        ),
                                        m("div", { "class": "input-group" },
                                            [
                                                m("input", {
                                                    "class": "form-control", "type": "text", "placeholder": "Preferred writer's ID",
                                                    "value": writer_id,
                                                    oninput(e) {
                                                        vnode.state.writer_id = e.target.value
                                                    }
                                                }),
                                                m("div", { "class": "input-group-append" },
                                                    m("span", { "class": "input-group-text" },
                                                        m("i", { "class": "la la-align-center" })
                                                    )
                                                )
                                            ]
                                        ),
                                        m("span", { "class": "form-text text-muted" },
                                            "If there is a writer you prefer to work with before, put in his ID from past email exchanges"
                                        )
                                    ]
                                ),

                                m("div", { "class": "col-lg-12" },
                                    [
                                        m("div", { "class": "form-group" },
                                            [
                                                m("label",
                                                    "Additional Services"
                                                ),
                                                m("div", { "class": "checkbox-list" },
                                                    [
                                                        m("label", { "class": "checkbox" },
                                                            [
                                                                m("p", [
                                                                    m("input", {
                                                                        "type": "checkbox", "name": "Additional",
                                                                        "value": writer_samples,
                                                                        oninput(e) {
                                                                            vnode.state.writer_samples = e.target.value
                                                                        }
                                                                    }),
                                                                    m("span"),
                                                                    "Get Writer Samples ($5)",
                                                                ]),
                                                                m("p", [
                                                                    m("input", {
                                                                        "type": "checkbox", "name": "Additional",
                                                                        "value": get_sources_copy,
                                                                        oninput(e) {
                                                                            vnode.state.get_sources_copy = e.target.value
                                                                        }
                                                                    }),
                                                                    m("span"),
                                                                    "Get Copy of Sources $20",
                                                                ]),

                                                                m("p", [
                                                                    m("input", {
                                                                        "type": "checkbox", "name": "Additional",
                                                                        "value": progressive_deliverly,
                                                                        oninput(e) {
                                                                            vnode.state.progressive_deliverly = e.target.value
                                                                        }
                                                                    }),
                                                                    m("span"),
                                                                    "Progressive Delivery $5/page",
                                                                ])

                                                            ]
                                                        ),
                                                    ]
                                                )
                                            ]
                                        )
                                    ]),

                                m("div", { "class": "col-lg-12" },
                                    [
                                        m("label",
                                            "Is this related to another assigbment we have done?:"
                                        ),
                                        m("div", { "class": "input-group" },
                                            [
                                                m("input", {
                                                    "class": "form-control", "type": "text", "placeholder": "Older Order ID",
                                                    "value": related_assignent,
                                                    oninput(e) {
                                                        vnode.state.related_assignent = e.target.value
                                                    }
                                                }),
                                                m("div", { "class": "input-group-append" },
                                                    m("span", { "class": "input-group-text" },
                                                        m("i", { "class": "la la-align-center" })
                                                    )
                                                )
                                            ]
                                        ),
                                        m("span", { "class": "form-text text-muted" },
                                            "If this is related, input the ORDER ID"
                                        ),

                                        m("br"),
                                        m("br"),
                                        m("br"),

                                        m("div", { "class": "alert alert-custom alert-default", "role": "alert" },
                                            [
                                                m("div", { "class": "alert-icon" },
                                                    m("span", { "class": "svg-icon svg-icon-primary svg-icon-xl" },
                                                        m("svg", { "xmlns": "http://www.w3.org/2000/svg", "xmlns:xlink": "http://www.w3.org/1999/xlink", "width": "24px", "height": "24px", "viewBox": "0 0 24 24", "version": "1.1" },
                                                            m("g", { "stroke": "none", "stroke-width": "1", "fill": "none", "fill-rule": "evenodd" },
                                                                [
                                                                    m("rect", { "x": "0", "y": "0", "width": "24", "height": "24" }),
                                                                    m("path", { "d": "M7.07744993,12.3040451 C7.72444571,13.0716094 8.54044565,13.6920474 9.46808594,14.1079953 L5,23 L4.5,18 L7.07744993,12.3040451 Z M14.5865511,14.2597864 C15.5319561,13.9019016 16.375416,13.3366121 17.0614026,12.6194459 L19.5,18 L19,23 L14.5865511,14.2597864 Z M12,3.55271368e-14 C12.8284271,3.53749572e-14 13.5,0.671572875 13.5,1.5 L13.5,4 L10.5,4 L10.5,1.5 C10.5,0.671572875 11.1715729,3.56793164e-14 12,3.55271368e-14 Z", "fill": "#000000", "opacity": "0.3" }),
                                                                    m("path", { "d": "M12,10 C13.1045695,10 14,9.1045695 14,8 C14,6.8954305 13.1045695,6 12,6 C10.8954305,6 10,6.8954305 10,8 C10,9.1045695 10.8954305,10 12,10 Z M12,13 C9.23857625,13 7,10.7614237 7,8 C7,5.23857625 9.23857625,3 12,3 C14.7614237,3 17,5.23857625 17,8 C17,10.7614237 14.7614237,13 12,13 Z", "fill": "#000000", "fill-rule": "nonzero" })
                                                                ]
                                                            )
                                                        )
                                                    )
                                                ),
                                                m("div", { "class": "alert-text" }, [
                                                    "IMPORTANT NOTE: After placing your order", m("code", "please countercheck that the instructions are clear and all files are attached on the order files section below leaing site.")
                                                ])
                                            ]
                                        )
                                    ]
                                ),
                            ]
                        ),
                        // m("button", {
                        //     disabled: uploading,
                        //     "class": "btn btn-info btn-lg btn-fluid", "type": "button", onclick() {

                        //         const order = {
                        //             hrs,
                        //             days,
                        //             pages,
                        //             words,
                        //             sources,
                        //             powerpoints,
                        //             price: priceString,
                        //             timeLimit,
                        //             writerType,
                        //             contentLimit,
                        //             paymentsType,
                        //             academicLevel,
                        //             spacingType,
                        //             articleType: {
                        //                 type,
                        //                 point
                        //             },
                        //             articleLevel,
                        //             partial: true
                        //         }

                        //         const options = {
                        //             method: 'POST',
                        //             url: url + "/jobs",
                        //             headers: {
                        //                 'Content-Type': 'application/json',
                        //                 'authorization': localStorage.getItem('token')
                        //             },
                        //             data: order
                        //         };

                        //         vnode.state.uploading = true
                        //         axios.request(options).then(function (response) {
                        //             order.id = response.data.insertedId

                        //             vnode.state.uploading = false
                        //             vnode.state.saved = false
                        //             // add toastr notification
                        //             // m.route.set("/order2", {
                        //             //     order
                        //             // })
                        //         }).catch(function (error) {
                        //             order.id = null
                        //             order.retry_innitial_send = true
                        //             vnode.state.uploading = false
                        //             vnode.state.saved = false
                        //             // m.route.set("/order2", {
                        //             //     order
                        //             // })
                        //         });

                        //     }
                        // },
                        //     !uploading ? "Save My order" : "Uploading your order...just a sec..."
                        // ),


                        m(".row", [
                            m("div.col-md-6", m("div", { "class": "card card-custom gutter-b" },
                                m("div", { "class": "card-body d-flex align-items-center py-5 py-lg-10" },
                                    [
                                        m("div",
                                            [

                                                m("p", { "class": "m-0 text-dark-50 font-weight-bold font-size-lg" },
                                                    [
                                                        `Order Id: ${activeOrder.id}`
                                                    ]
                                                ),
                                                m("p", { "class": "m-0 text-dark-50 font-weight-bold font-size-lg" },
                                                    [
                                                        `Saved this order ${moment.duration(moment(vnode.state.lastSyncTime).diff(moment(new Date()))).humanize()} ago`
                                                    ]
                                                ),

                                                m("br"),
                                                m("h3", { "class": "pb-1 text-dark-75 font-weight-bolder font-size-h5" },
                                                    `Quick Quote - ${academicLevel}`
                                                ),
                                                m("p", { "class": "m-0 text-dark-50 font-weight-bold font-size-lg" },
                                                    [
                                                        articleType.type
                                                    ]
                                                ),

                                                m("p", { "class": "m-0 text-dark-50 font-weight-bold font-size-lg" },
                                                    [`${contentLimit == contentTypePage ? pages : words} ${contentLimit} * ${paymentsType} ${pricepage}`, "=", m("b", `$${vnode.state.calculatePrice()}`)]
                                                ),

                                                // powerpoints && powerpoints == 0 ? null : m("p", { "class": "m-0 text-dark-50 font-weight-bold font-size-lg" },
                                                //     [`${powerpoints} PPT slides * USD 2`, "=", m("b", `$${price}`)]
                                                // ),

                                                m("hr"),
                                                m("p", { "class": "m-0 text-dark-50 font-weight-bold font-size-lg" },
                                                    ["Total", "=", m("b", `$${vnode.state.calculatePrice()}`)]
                                                ),

                                                m("br"),
                                                m("br"),
                                                m("button", {
                                                    class: `btn btn-lg ${vnode.state.readyForReview === true ? 'btn-success' : 'btn-info'}`,
                                                    type: "button",
                                                    onclick() {
                                                        vnode.state.readyForReview = true
                                                    }
                                                }, !vnode.state.readyForReview ? "Save my order" : "Order Saved!"),
                                            ]
                                        )
                                    ]
                                )
                            )),

                            m("div.col-md-6", m("div", { "class": "card card-custom gutter-b" },
                                m("div", { "class": "card-body d-flex align-items-center py-5 py-lg-10" },
                                    [
                                        m("div",
                                            [
                                                // m("div", { "class": "alert alert-custom alert-default", "role": "alert" },
                                                //     [
                                                //         m("div", { "class": "alert-icon" },
                                                //             m("span", { "class": "svg-icon svg-icon-primary svg-icon-xl" },
                                                //                 m("svg", { "xmlns": "http://www.w3.org/2000/svg", "xmlns:xlink": "http://www.w3.org/1999/xlink", "width": "24px", "height": "24px", "viewBox": "0 0 24 24", "version": "1.1" },
                                                //                     m("g", { "stroke": "none", "stroke-width": "1", "fill": "none", "fill-rule": "evenodd" },
                                                //                         [
                                                //                             m("rect", { "x": "0", "y": "0", "width": "24", "height": "24" }),
                                                //                             m("path", { "d": "M7.07744993,12.3040451 C7.72444571,13.0716094 8.54044565,13.6920474 9.46808594,14.1079953 L5,23 L4.5,18 L7.07744993,12.3040451 Z M14.5865511,14.2597864 C15.5319561,13.9019016 16.375416,13.3366121 17.0614026,12.6194459 L19.5,18 L19,23 L14.5865511,14.2597864 Z M12,3.55271368e-14 C12.8284271,3.53749572e-14 13.5,0.671572875 13.5,1.5 L13.5,4 L10.5,4 L10.5,1.5 C10.5,0.671572875 11.1715729,3.56793164e-14 12,3.55271368e-14 Z", "fill": "#000000", "opacity": "0.3" }),
                                                //                             m("path", { "d": "M12,10 C13.1045695,10 14,9.1045695 14,8 C14,6.8954305 13.1045695,6 12,6 C10.8954305,6 10,6.8954305 10,8 C10,9.1045695 10.8954305,10 12,10 Z M12,13 C9.23857625,13 7,10.7614237 7,8 C7,5.23857625 9.23857625,3 12,3 C14.7614237,3 17,5.23857625 17,8 C17,10.7614237 14.7614237,13 12,13 Z", "fill": "#000000", "fill-rule": "nonzero" })
                                                //                         ]
                                                //                     )
                                                //                 )
                                                //             )
                                                //         ),
                                                //         m("div", { "class": "alert-text" }, [
                                                //             "IMPORTANT NOTE: After placing your order", m("code", "You dont have to pay emmediately. we will reach out if we cant actually execute on the work"),
                                                //         ])
                                                //     ]
                                                // ),
                                                m("div", { style: { "padding-top": "20px" } }, [
                                                    m("#paypal_button")
                                                ]),
                                                m("button", {
                                                    class: "btn btn-info",
                                                    type: "button",
                                                    onclick() {
                                                        vnode.state.paypalTestMode = !vnode.state.paypalTestMode
                                                    }
                                                }, "toggle testing mode (set price to $2 ~ 200kes)")
                                            ]
                                        )
                                    ]
                                )
                            )),
                        ]),


                        // order ends here 
                    ]
                )
            )
        }
    }
}