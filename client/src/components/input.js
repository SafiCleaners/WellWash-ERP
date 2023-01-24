import m from "mithril"


const dynamicPicker = {
    view(vnode) {
        console.log(vnode.attrs.options)
        return [
            m("label",
                `Pricing`
            ),
            m("br"),

            m("div", { "class": "btn-group btn-group-toggle", "data-toggle": "buttons" },
                [
                    vnode.attrs.options
                        .map((statusInfo) => {
                            const { status, label } = statusInfo

                            var currentStatus = !vnode.state?.statusInfo ? null : vnode.state?.statusInfo[0].status
                            // console.log(currentStatus, status)
                            return m("label", { "class": `btn btn-info ${currentStatus === status ? "active" : ""}` },
                                [
                                    m("input", {
                                        "type": "radio",
                                        "name": "price",
                                        // "id": pickupDay,
                                        // disabled: date.day() === 0,
                                        // "checked": pickupDay === date.format('L') ? true : false,
                                        onchange: () => {
                                            console.log(vnode.state)
                                            // preserve the previous status and keep the time of the change
                                            vnode.state.statusInfo = !vnode.state.statusInfo ? [{
                                                status,
                                                createdAt: new Date()
                                            }] : [{
                                                status,
                                                createdAt: new Date()
                                            }, ...vnode.state.statusInfo]

                                            vnode.state.updateOrderOnServer()
                                        }
                                    }),
                                    label
                                ]
                            )
                        }),
                ]
            )
        ]
    }
}


const input = {
    // oninit(vnode) {
    //     const { innitialValue, onChange } = vnode.attrs
    //     vnode.attrs.value = innitialValue
    // },
    view(vnode) {
        const { innitialValue, onChange, name, label, size = "4", pickerSize="2" } = vnode.attrs
        // console.log(vnode.attrs)
        return [
            m("div", { "class": `col-lg-${pickerSize} col-md-${pickerSize} col-sm-${pickerSize}` },[
                m(dynamicPicker,{
                    options: vnode.attrs.pricing
                })
            ]),
            m("div", { "class": `col-lg-${size} col-md-${size} col-sm-${size * 2}` },
                [
                    // powerpoint slides
                    m("label",
                        name
                    ),

                    m("div", { "class": "form-group" }, [

                        m("div", { "class": "input-group mb-3" },
                            [
                                m("div", { "class": "input-group-prepend" },
                                    m("button", {
                                        "class": "btn btn-outline-secondary", "type": "button", "id": "button-addon1",
                                        onclick() {
                                            if (Number(vnode.attrs.value) - 1 >= 0) {
                                                vnode.attrs.value = Number(vnode.attrs.value) - 1

                                                onChange(vnode.attrs.value)
                                            }
                                        }
                                    },
                                        "-"
                                    )
                                ),
                                m("input", {
                                    "class": "form-control", "type": "number", "aria-describedby": "button-addon1",
                                    value: vnode.attrs.value,
                                    oninput(e) {

                                        if (Math.sign(Number(e.target.innitialValue)) === 1) {
                                            vnode.attrs.value = Number(e.target.value)
                                            onChange(vnode.attrs.value)
                                        }
                                    }
                                }),
                                m("div", { "class": "input-group-append" },
                                    m("button", {
                                        "class": "btn btn-outline-secondary", "type": "button", "id": "button-addon1",
                                        onclick() {
                                            vnode.attrs.value = Number(vnode.attrs.value) + 1
                                            onChange(vnode.attrs.value)
                                        }
                                    },
                                        "+"
                                    )
                                )
                            ]
                        ),
                        label ? m("label", label) : m("label", [
                            `Charging:`,
                            m("b", ` KSH :${Number(vnode.attrs.charge)}`),
                            ` Each, will total to `,
                            m('b', ` KSH :${Number(vnode.attrs.charge) * Number(vnode.attrs.value)}`)
                        ]),
                    ]
                    ),
                ])]

    }
}

export default input