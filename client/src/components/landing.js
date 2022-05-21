export default () => {
    return {
        view() {
            return m("div", { "class": "p-5 text-center bg-image rounded-3", "style": { "    background-image": "url('https", "height": "400px" } },
                m("div",
                    m("div", { "class": "d-flex justify-content-center align-items-center h-100" },
                        m("div", { "class": "text-black" },
                            [
                                m("div", { "class": "d-flex flex-row justify-content-center align-items-center" }, m("img", {
                                    src: "assets/media/schoolLogo.svg.png",
                                    style: {
                                        "max-width": "30%"
                                    }
                                })),
                                m("h1", { "class": "mb-3" },
                                    "Laundry Service From Industry Experts"
                                ),
                                m("h4", { "class": "mb-3" },
                                    "Make an order for Laundry Pickup Today"
                                ),
                                m("h4", { "class": "mb-3" },
                                    "Laundry Service for people who want to see results fast!"
                                ),
                                m("a", {
                                    "class": "btn btn-info btn-lg", "role": "button",
                                    onclick() {
                                        m.route.set("/order1")
                                    }
                                },
                                    "Pick up my Laundry!"
                                )
                            ]
                        )
                    )
                )
            )
        }
    }
}