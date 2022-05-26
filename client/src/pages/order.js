import {
    typesMapping,
    subjectAreaMapping,
    academicLevels,
    serviceTypes,

    pricepage,
    contentTypePage,
    paperFormats,
    url
} from "../constants"
import m from "mithril"
import steps from "../components/steps"
import axios from "axios"
import uploader from "../components/uploader"

const order = {
    oninit(vnode) {
        const {
            id,
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
            articleType,
            articleLevel
        } = vnode.attrs.order

        Object.assign(vnode.state, {
            id,
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
            subjectAreaMapping,
            subjectArea: {
                point: 1,
                type: "Any"
            },
            articleType,
            articleLevel,
            serviceType: serviceTypes[0],
            paperFormat: paperFormats[0],

            title: "",
            instructions: "",
            writer_id: "",
            writer_samples: false,
            get_sources_copy: false,
            progressive_deliverly: false,
            related_assignent: "",

            lastJobDetails: {}
        })

    },
    oncreate(vnode) {
        const {
            price,
        } = vnode.state

        window.$("html, body").animate({ scrollTop: 0 }, "fast");
    },
    view: function (vnode) {
        const {
            pages,
            words,
            powerpoints,
            price,
            contentLimit,
            paymentsType,
            academicLevel,
            articleType,
            paperFormat,

            title,
            instructions,
            writer_id,
            writer_samples,
            get_sources_copy,
            progressive_deliverly,
            related_assignent
        } = vnode.state

        return m("div.row", [
            m(steps),
            m("div.col-md-8", [

                m("div", { "class": "card card-custom gutter-b example example-compact" },
                    [
                        m("div", { "class": "card-header" },
                            [
                                m("h3", { "class": "card-title" },
                                    "Tell us more about your paper on the form below,"
                                ),

                            ]
                        ),
                        m("form", { "class": "form" },
                            [
                                m("div", { "class": "card-body" },
                                    [
                                        m("div", { "class": "form-group row" },
                                            [
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
                                                                                "name": "options",
                                                                                "id": "option1",
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
                                                m("div", { "class": "col-lg-3 col-md-6 col-sm-12" },
                                                    [
                                                        m("label",
                                                            "Type of service:"
                                                        ),
                                                        m("div", { "class": "dropdown" },
                                                            [
                                                                m("button", { "class": "btn btn-secondary dropdown-toggle", "type": "button", "id": "dropdownMenuButton", "data-toggle": "dropdown", "aria-haspopup": "true", "aria-expanded": "false" },
                                                                    vnode.state.serviceType
                                                                ),
                                                                m("div", { "class": "dropdown-menu", "aria-labelledby": "dropdownMenuButton" },
                                                                    serviceTypes.map(type => m("a", {
                                                                        "class": "dropdown-item", onclick() {
                                                                            vnode.state.serviceType = type
                                                                        }
                                                                    },
                                                                        type
                                                                    ))
                                                                )
                                                            ]
                                                        )
                                                    ]
                                                ),
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
                                                                        m("i", { "class": "la la-map-marker" })
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
                                                                field: "additional_material_1"
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
                                                                field: "additional_material_2"
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
                                                                field: "additional_material_3"
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
                                                                        m("i", { "class": "la la-map-marker" })
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
                                                                        m("i", { "class": "la la-map-marker" })
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
                                    ]
                                ),

                            ]
                        )
                    ]
                ),
            ]),
            m("div.col-md-4", m("div", { "class": "card card-custom gutter-b" },
                m("div", { "class": "card-body d-flex align-items-center py-5 py-lg-10" },
                    [
                        m("div",
                            [
                                m("h3", { "class": "pb-1 text-dark-75 font-weight-bolder font-size-h5" },
                                    `Quick Quote - ${academicLevel}`
                                ),
                                m("p", { "class": "m-0 text-dark-50 font-weight-bold font-size-lg" },
                                    [
                                        articleType.type
                                    ]
                                ),

                                m("p", { "class": "m-0 text-dark-50 font-weight-bold font-size-lg" },
                                    [`${contentLimit == contentTypePage ? pages : words} ${contentLimit} * ${paymentsType} ${pricepage}`, "=", m("b", `$${price}`)]
                                ),

                                powerpoints && powerpoints == 0 ? null : m("p", { "class": "m-0 text-dark-50 font-weight-bold font-size-lg" },
                                    [`${powerpoints} PPT slides`, "=", m("b", `$${price}`)]
                                ),

                                m("hr"),
                                m("p", { "class": "m-0 text-dark-50 font-weight-bold font-size-lg" },
                                    ["Total", "=", m("b", `$${price}`)]
                                ),
                                m("div", { style: { "padding-top": "20px" } }, [
                                    m("#paypal_button")
                                ])
                            ]
                        )
                    ]
                )
            ))
        ])
    }
}


export default order