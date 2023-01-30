import m from "mithril"

const dynamicPicker = {
    oncreate(vnode) {
        vnode.state = Object.assign(vnode.state, {
            selectedCharge: vnode.attrs.charge
        })
    },
    view(vnode) {
        return [
            m("label", `Pricing ~/` + vnode.attrs.charge),
            m("br"),
            m("div", { "class": "btn-group btn-group-toggle", "data-toggle": "buttons" },
                vnode.attrs.options.map((statusInfo) => {
                    const { amount, label } = statusInfo
                    return m("label", { "class": `btn btn-info ${amount === vnode.state.selectedCharge ? " active" : ""}` },
                        [
                            m("input", {
                                "type": "radio",
                                "name": "price",
                                onchange: () => {
                                    vnode.attrs.charge = amount
                                    vnode.attrs.onChange(amount)
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
        console.log({ stateInput: vnode.state })
        return [
            m("div", { "class": `col-lg-${vnode.attrs.pickerSize} col-md-${vnode.attrs.pickerSize} col-sm-${vnode.attrs.pickerSize}` }, [
                m(dynamicPicker, {
                    options: vnode.attrs.pricing,
                    charge: vnode.state.value,
                    onChange(charge) {
                        vnode.state.value = charge
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
                                                vnode.attrs.onChange(vnode.state.value)
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
                                            vnode.attrs.onChange(vnode.state.value)
                                        }
                                    }
                                }),
                                m("div", { "class": "input-group-append" },
                                    m("button", {
                                        "class": "btn btn-outline-secondary", "type": "button", "id": "button-addon1",
                                        onclick() {
                                            vnode.state.value = Number(vnode.state.value) + 1
                                            vnode.attrs.onChange(vnode.state.value)
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