import m from "mithril"
const input = {
    oninit(vnode) {
        const { value, onChange } = vnode.attrs
        vnode.state.value = value
    },
    view(vnode) {
        const { value, onChange, name, label, size="6" } = vnode.attrs
        return m("div", { "class": `col-lg-${size} col-md-${size} col-sm-${size * 2}` },
            [
                // powerpoint slides
                m("label",
                    name
                ),

                m("div", { "class": "form-group" }, [

                    m("div", { "class": "input-group mb-3" },
                        [
                            // m("div", { "class": "input-group-prepend" },
                            //     m("button", {
                            //         "class": "btn btn-outline-secondary", "type": "button", "id": "button-addon1",
                            //         onclick() {
                            //             if (Number(vnode.state.value) - 1 >= 0) {
                            //                 vnode.state.value = Number(vnode.state.value) - 1

                            //                 onChange(vnode.state.value)
                            //             }
                            //         }
                            //     },
                            //         "-"
                            //     )
                            // ),
                            m("input", {
                                "class": "form-control", "type": "number", "aria-describedby": "button-addon1",
                                value: vnode.state.value,
                                oninput(e) {

                                    if (Math.sign(Number(e.target.value)) === 1) {
                                        vnode.state.value = Number(e.target.value)
                                        onChange(vnode.state.value)
                                    }
                                }
                            }),
                            // m("div", { "class": "input-group-append" },
                            //     m("button", {
                            //         "class": "btn btn-outline-secondary", "type": "button", "id": "button-addon1",
                            //         onclick() {
                            //             vnode.state.value = Number(vnode.state.value) + 1
                            //             onChange(vnode.state.value)
                            //         }
                            //     },
                            //         "+"
                            //     )
                            // )
                        ]
                    ),
                    // label ? m("label", label) : m("label", [
                    //     `We Charge:`,
                    //     m("b", ` KSH :${Number(vnode.attrs.charge)}`),
                    //     ` Each, and thus will cost you `,
                    //     m('b', ` KSH :${Number(vnode.attrs.charge) * Number(vnode.state.value)}`)
                    // ]),
                ]
                ),
            ])

    }
}

export default input