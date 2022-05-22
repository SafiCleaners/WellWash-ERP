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
import map from "./map";

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
                dropOffDay,
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
                                m("div", { "class": "bs-stepper d-md-block" },
                                    [
                                        m("div", { "class": "bs-stepper-header", "role": "tablist" },
                                            [
                                                m("div", { "class": "step", "data-target": "#logins-part" },
                                                    m("button", { "class": "step-trigger", "type": "button", "role": "tab", "aria-controls": "logins-part", "id": "logins-part-trigger" },
                                                        [
                                                            m("span", { "class": "bs-stepper-circle" },
                                                                "1"
                                                            ),
                                                            m("span", { "class": "bs-stepper-label" },
                                                                "Pickup and DropOff Time"
                                                            )
                                                        ]
                                                    )
                                                )]
                                        )]
                                ),



                                m("div", { "class": "col-lg-4 col-md-4 col-sm-12" },
                                    [
                                        m("label",
                                            "When would you like your Pickup? (12st May - 26th May) "
                                        ),
                                        m("br"),

                                        m("div", { "class": "btn-group btn-group-toggle", "data-toggle": "buttons" },
                                            [
                                                [
                                                    "Saturday",
                                                    // "Sunday",
                                                    "Mon",
                                                    "Teu",
                                                    "Wed",
                                                    "Thur",
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
                                m("div", { "class": "col-lg-4 col-md-4 col-sm-12" },
                                    [
                                        m("label",
                                            "When would you like your DropOff? (12st May - 26th May)"
                                        ),
                                        m("br"),

                                        m("div", { "class": "btn-group btn-group-toggle", "data-toggle": "buttons" },
                                            [
                                                [
                                                    "Saturday",
                                                    // "Sunday",
                                                    "Mon",
                                                    "Teu",
                                                    "Wed",
                                                    "Thur",
                                                    "Friday"
                                                ].map(day => {
                                                    return m("label", { "class": `btn btn-info ${dropOffDay == day ? "active" : ""}` },
                                                        [
                                                            m("input", {
                                                                "type": "radio",
                                                                "name": "academicLevels",
                                                                "id": day,
                                                                "checked": dropOffDay == day ? true : false,
                                                                onchange: () => {
                                                                    vnode.state.dropOffDay = day
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


                                m("div", { "class": "bs-stepper" },
                                    [
                                        m("div", { "class": "bs-stepper-header", "role": "tablist" },
                                            [
                                                m("div", { "class": "step", "data-target": "#logins-part" },
                                                    m("button", { "class": "step-trigger", "type": "button", "role": "tab", "aria-controls": "logins-part", "id": "logins-part-trigger" },
                                                        [
                                                            m("span", { "class": "bs-stepper-circle" },
                                                                "2"
                                                            ),
                                                            m("span", { "class": "bs-stepper-label" },
                                                                "Where to pickup and drop off"
                                                            )
                                                        ]
                                                    )
                                                )]
                                        )]
                                ),
                               

                                m("div", { "class": "form-group row" },
                                    [
                                        m(map),
                                        m("div", { "class": "col-lg-12" },
                                            [
                                                m("label",
                                                    "Appartment's Name:"
                                                ),
                                                m("div", { "class": "input-group" },
                                                    [
                                                        m("input", { "class": "form-control", "type": "text", "placeholder": "What is your apprtment commonly called?" }),
                                                        m("div", { "class": "input-group-append" },
                                                            m("span", { "class": "input-group-text" },
                                                                m("i", { "class": "la la-align-center" })
                                                            )
                                                        )
                                                    ]
                                                ),
                                                m("span", { "class": "form-text text-muted" },
                                                    "The name of the appartment to find"
                                                )
                                            ]
                                        ),
                                        m("div", { "class": "col-lg-12" },
                                            [
                                                m("label",
                                                    "House Number:"
                                                ),
                                                m("div", { "class": "input-group" },
                                                    [
                                                        m("input", { "class": "form-control", "type": "text", "placeholder": "Whats the house number?" }),
                                                        m("div", { "class": "input-group-append" },
                                                            m("span", { "class": "input-group-text" },
                                                                m("i", { "class": "la la-align-center" })
                                                            )
                                                        )
                                                    ]
                                                ),
                                                m("span", { "class": "form-text text-muted" },
                                                    "The name of the house in the appartment"
                                                )
                                            ]
                                        ),
                                        m("div", { "class": "col-lg-12" },
                                            m("div", { "class": "form-group mb-1" },
                                                [
                                                    m("label", { "for": "exampleTextarea" },
                                                        "Any more details you would like us to know about the pickup and dropoff?"
                                                    ),
                                                    m("textarea", { "class": "form-control", "id": "exampleTextarea", "rows": "12", "spellcheck": "true" })
                                                ]
                                            )
                                        ),
                                        m("br"),
                                        m("br"),
                                        // m("div", { "class": "col-lg-12" },
                                        //     m("div", { "class": "alert alert-custom alert-default", "role": "alert" },
                                        //         [
                                        //             m("div", { "class": "alert-icon" },
                                        //                 m("span", { "class": "svg-icon svg-icon-primary svg-icon-xl" },
                                        //                     m("svg", { "xmlns": "http://www.w3.org/2000/svg", "xmlns:xlink": "http://www.w3.org/1999/xlink", "width": "24px", "height": "24px", "viewBox": "0 0 24 24", "version": "1.1" },
                                        //                         m("g", { "stroke": "none", "stroke-width": "1", "fill": "none", "fill-rule": "evenodd" },
                                        //                             [
                                        //                                 m("rect", { "x": "0", "y": "0", "width": "24", "height": "24" }),
                                        //                                 m("path", { "d": "M7.07744993,12.3040451 C7.72444571,13.0716094 8.54044565,13.6920474 9.46808594,14.1079953 L5,23 L4.5,18 L7.07744993,12.3040451 Z M14.5865511,14.2597864 C15.5319561,13.9019016 16.375416,13.3366121 17.0614026,12.6194459 L19.5,18 L19,23 L14.5865511,14.2597864 Z M12,3.55271368e-14 C12.8284271,3.53749572e-14 13.5,0.671572875 13.5,1.5 L13.5,4 L10.5,4 L10.5,1.5 C10.5,0.671572875 11.1715729,3.56793164e-14 12,3.55271368e-14 Z", "fill": "#000000", "opacity": "0.3" }),
                                        //                                 m("path", { "d": "M12,10 C13.1045695,10 14,9.1045695 14,8 C14,6.8954305 13.1045695,6 12,6 C10.8954305,6 10,6.8954305 10,8 C10,9.1045695 10.8954305,10 12,10 Z M12,13 C9.23857625,13 7,10.7614237 7,8 C7,5.23857625 9.23857625,3 12,3 C14.7614237,3 17,5.23857625 17,8 C17,10.7614237 14.7614237,13 12,13 Z", "fill": "#000000", "fill-rule": "nonzero" })
                                        //                             ]
                                        //                         )
                                        //                     )
                                        //                 )
                                        //             ),
                                        //             m("div", { "class": "alert-text" },
                                        //                 [
                                        //                     "PLEASE DON'T INCLUDE YOUR ",
                                        //                     m("code",
                                        //                         "PERSONAL INFORMATION (Phone Number, Email Address) in the instructions section"
                                        //                     ),
                                        //                     ". The information is always kept private and we won't share it"
                                        //                 ]
                                        //             )
                                        //         ]
                                        //     )
                                        // ),

                                    ]
                                )
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