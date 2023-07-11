import m from "mithril"

const dynamicPicker = {
    oncreate(vnode) {
        console.log(vnode)
        vnode.state = Object.assign(vnode.state, {
            selectedCharge: vnode.attrs.charge
        })
    },
    view(vnode) {
        console.log(vnode)
        return [
            m("label", `Pricing ~/` + vnode.attrs.amount + " ,each at " +  vnode.attrs.charge + " = " + (Number(vnode.attrs.charge) * Number(vnode.attrs.amount)) ),
            m("br"),
            m("div", { "class": "btn-group btn-group-toggle", "data-toggle": "buttons" },
                vnode.attrs.options.map((statusInfo) => {
                    const { amount:charge, label } = statusInfo
                    return m("label", { "class": `btn btn-info ${charge === vnode.state.selectedCharge ? " active" : ""}` },
                        [
                            m("input", {
                                "type": "radio",
                                "name": "price" + vnode.attrs.name,
                                onchange: () => {
                                    vnode.attrs.charge = charge
                                    vnode.attrs.onChange(charge)
                                }
                            }),
                            label
                        ]
                    )
                })
            )
        ]
    }
}

const input = {
    oncreate(vnode) {
        vnode.state = Object.assign(vnode.state, {
            value: vnode.attrs.value
        })
    },
    view(vnode) {
        console.log(vnode)
        return [
            m("div", { "class": `col-lg-${vnode.attrs.pickerSize} col-md-${vnode.attrs.pickerSize} col-sm-${vnode.attrs.pickerSize}` }, [
                m(dynamicPicker, {
                    options: vnode.attrs.pricing,
                    charge: vnode.state.chargeValue || vnode.attrs.charge,
                    amount: vnode.attrs.amount,
                    name: vnode.attrs.name,
                    onChange(charge) {
                        // console.log(charge)
                        vnode.state.chargeValue = charge

                        vnode.attrs.onChange({
                            amountValue: vnode.state.value,
                            chargeValue: vnode.state.chargeValue
                        })
                    }
                })
            ]),
            m("div", { "class": `col-lg-${vnode.attrs.size} col-md-${vnode.attrs.size} col-sm-${vnode.attrs.size * 2}` },
                [
                    m("label", vnode.attrs.name),
                    m("div", { "class": "form-group" }, [
                        m("div", { "class": "input-group mb-3" },
                            [
                                m("div", { "class": "input-group-prepend" },
                                    m("button", {
                                        "class": "btn btn-outline-secondary", "type": "button", "id": "button-addon1",
                                        onclick() {
                                            if (Number(vnode.state.value) - 1 >= 0) {
                                                vnode.state.value = Number(vnode.state.value) - 1
                                                vnode.attrs.onChange({
                                                    amountValue: vnode.state.value,
                                                    chargeValue: vnode.state.chargeValue
                                                })
                                                m.redraw()
                                            }
                                        }
                                    },
                                        "-"
                                    )
                                ),
                                m("input", {
                                    "class": "form-control", "type": "number", "aria-describedby": "button-addon1",
                                    value: vnode.state.value,
                                    oninput(e) {
                                        if (Math.sign(Number(e.target.value)) === 1) {
                                            vnode.state.value = Number(e.target.value)
                                            vnode.attrs.onChange({
                                                amountValue: vnode.state.value,
                                                chargeValue: vnode.state.chargeValue
                                            })
                                        }
                                    }
                                }),
                                m("div", { "class": "input-group-append" },
                                    m("button", {
                                        "class": "btn btn-outline-secondary", "type": "button", "id": "button-addon1",
                                        onclick() {
                                            vnode.state.value = Number(vnode.state.value) + 1
                                            vnode.attrs.onChange({
                                                amountValue: vnode.state.value,
                                                chargeValue: vnode.state.chargeValue
                                            })
                                        }
                                    },
                                        "+"
                                    )
                                )
                            ]
                        )
                    ])
                ]
            )
        ]
    }
}

export default input;