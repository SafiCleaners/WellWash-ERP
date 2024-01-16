import m from "mithril"

const dynamicPicker = {
    oninit(vnode) {
        if (!vnode.attrs.options[0])
            return;

        const sortedOptions = vnode.attrs.options.slice(); // Make a shallow copy to avoid modifying the original array

        sortedOptions.sort((a, b) => Number(b.amount) - Number(a.amount));

        vnode.state.sortedOptions = sortedOptions

        console.log(vnode.attrs)
        if (!vnode.state.selectedCharge){
            vnode.state = Object.assign(vnode.state, {
                selectedCharge: vnode.state.sortedOptions[0].amount || vnode.attrs.charge
            })
            vnode.attrs.onChange(vnode.state.selectedCharge)
        }
        // if (!vnode.state.selectedCharge)
        //     vnode.state.sortedOptions[0]?.amount)
        
    },
    view(vnode) {
        

        return [
            m("label", m("b", `Pricing ~/` + vnode.attrs.amount + " ,each at " + vnode.state.selectedCharge + " = " + (Number(vnode.state.selectedCharge) * Number(vnode.attrs.amount)))),
            m("br"),
            m("div", { "class": "btn-group btn-group-toggle", "data-toggle": "buttons" },
                vnode.state.sortedOptions?.map((statusInfo) => {
                    const { amount: charge, label, selectedCharge } = statusInfo
                    return m("label", { "class": `btn btn-info ${selectedCharge ? "active" : (charge == vnode.state.selectedCharge ? "active" : "")}` },
                        [
                            m("input", {
                                "type": "radio",
                                "name": "price" + vnode.attrs.name,
                                onchange: () => {
                                    console.log("selected price;", charge)
                                    vnode.attrs.charge = charge
                                    vnode.state.selectedCharge = charge
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
    oninit(vnode) {
        // console.log(vnode.state, vnode.attrs)
        vnode.state = Object.assign(vnode.state, {
            amount: vnode.attrs.amount,
            value: vnode.attrs.amount
        })
        // console.log(vnode.state, vnode.attrs)
    },
    view(vnode) {

        return [

            m("div", { "class": `col-lg-${vnode.attrs.pickerSizeLG} col-md-${vnode.attrs.pickerSizeMD} col-sm-${vnode.attrs.pickerSize}` },
                [
                    m("label", m("b", vnode.attrs.name)),
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
            ),
            m("div", { "class": `col-lg-${vnode.attrs.pickerSizeLG} col-md-${vnode.attrs.pickerSizeMD} col-sm-${vnode.attrs.pickerSize}` }, [
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
        ]
    }
}

export default input;