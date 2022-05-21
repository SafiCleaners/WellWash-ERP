export default {
    view() {
        return m("div", { "class": "ph-item" },
            [
                m("div",
                    m("div", { "class": "ph-row" },
                        [
                            m("div", { "class": "ph-col-4" }),
                            m("div", { "class": "ph-col-8 empty" }),
                            m("div", { "class": "ph-col-6" }),
                            m("div", { "class": "ph-col-6 empty" }),
                            m("div", { "class": "ph-col-2" }),
                            m("div", { "class": "ph-col-10 empty" })
                        ]
                    )
                ),
                m("div", { "class": "ph-col-12" },
                    [
                        m("div", { "class": "ph-picture" }),
                        m("div", { "class": "ph-row" },
                            [
                                m("div", { "class": "ph-col-10 big" }),
                                m("div", { "class": "ph-col-2 empty big" }),
                                m("div", { "class": "ph-col-4" }),
                                m("div", { "class": "ph-col-8 empty" }),
                                m("div", { "class": "ph-col-6" }),
                                m("div", { "class": "ph-col-6 empty" }),
                                m("div", { "class": "ph-col-12" })
                            ]
                        )
                    ]
                )
            ]
        )
    }
}