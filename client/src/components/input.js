import m from "mithril"
const input = {
    // oninit(vnode) {
    //     const { innitialValue, onChange } = vnode.attrs
    //     vnode.attrs.value = innitialValue
    // },
    view(vnode) {
        const { innitialValue, onChange, name, label, size="6" } = vnode.attrs
        // console.log(vnode.attrs)
        return m("div", { "class": `col-lg-${size} col-md-${size} col-sm-${size * 2}` },
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
                        `We Charge:`,
                        m("b", ` KSH :${Number(vnode.attrs.charge)}`),
                        ` Each, and thus will total to `,
                        m('b', ` KSH :${Number(vnode.attrs.charge) * Number(vnode.attrs.value)}`)
                    ]),
                ]
                ),
            ])

    }
}

export default input