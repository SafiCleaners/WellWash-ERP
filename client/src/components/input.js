const input = {
    oninit(vnode) {
        vnode.state.value = 0
    },
    view(vnode) {
        return m("div", { "class": "col-lg-6 col-md-6 col-sm-12" },
            [
                // powerpoint slides
                m("label",
                    vnode.attrs.name
                ),

                m("div", { "class": "form-group" }, [

                    m("div", { "class": "input-group mb-3" },
                        [
                            m("div", { "class": "input-group-prepend" },
                                m("button", {
                                    "class": "btn btn-outline-secondary", "type": "button", "id": "button-addon1",
                                    onclick() {
                                        if (Number(vnode.state.value) - 1 >= 0) {
                                            vnode.state.value = Number(vnode.state.value) - 1
                                        }
                                    }
                                },
                                    "-"
                                )
                            ),
                            m("input", {
                                "class": "form-control", "type": "number", "placeholder": `No. of PowerPoint Slides`, "aria-describedby": "button-addon1",
                                value: vnode.state.value,
                                oninput(e) {
                                
                                    if (Math.sign(Number(e.target.value)) === 1) {
                                        vnode.state.value = Number(e.target.value)
                                    }
                                }
                            }),
                            m("div", { "class": "input-group-append" },
                                m("button", {
                                    "class": "btn btn-outline-secondary", "type": "button", "id": "button-addon1",
                                    onclick() {
                                        vnode.state.value = Number(vnode.state.value) + 1
                                    }
                                },
                                    "+"
                                )
                            )
                        ]
                    ),
                    m("label", [
                        `We Charge:`,
                        m("b", ` KSH :${Number(vnode.attrs.charge)}`),
                        ` Each, and thus will cost you `,
                        m('b', ` KSH :${Number(vnode.attrs.charge) * Number(vnode.state.value)}`)
                    ]),
                ]
                ),
            ])

    }
}

export default input