import m from "mithril"

const chat = () => {
    return {
        oninit(vnode) {
            setTimeout(()=>{
                window.location.replace(`https://api.whatsapp.com/send?phone=+254701173735&text=Hello!, can you help me with my laundry? \nI was reffered to you guys by ${vnode.attrs.REFEERED_BY}`)
            }, 5000)
        },
        view(vnode) {
            var {
                pickupDay,
                dropOffDay,
                pickupTime,
                dropOffTime,
                appartmentName,
                houseNumber,
                moreDetails,
                curtains,
                blankets,
                duvets,
                generalKgs,
                mpesaPhoneNumber,
                phone,
                mpesaConfirmationCode,
                name
            } = vnode.state

            // console.table({
            //     pickupDay,
            //     dropOffDay,
            //     pickupTime,
            //     dropOffTime,
            //     appartmentName,
            //     houseNumber,
            //     moreDetails,
            //     curtains,
            //     blankets,
            //     duvets,
            //     generalKgs,
            //     mpesaPhoneNumber,
            //     phone,
            //     mpesaConfirmationCode,
            //     name
            // })

            return m("div", { "class": "card-body" },

                m("form",
                    [
                        m("div", { "class": "form-group row" },
                            [
                                m("div", { "class": "bs-stepper" },
                                    [
                                        m("div", { "class": "bs-stepper-header", "role": "tablist" },
                                            [
                                                m("div", { "class": "step", "data-target": "#logins-part" },
                                                    m("button", { "class": "step-trigger", "type": "button", "role": "tab", "aria-controls": "logins-part", "id": "logins-part-trigger" },
                                                        [
                                                            m("span", { "class": "bs-stepper-circle" },
                                                                "#"
                                                            ),
                                                            m("span", { "class": "bs-stepper-label" },
                                                                "Your order was received successfully"
                                                            )
                                                        ]
                                                    )
                                                )]
                                        )]
                                ),
                            ]
                        ),
                        m("div", { "class": "p-5 text-center bg-image rounded-3", "style": { "    background-image": "url('https", "height": "400px" } },
                            m("div",
                                m("div", { "class": "d-flex justify-content-center align-items-center h-200" },
                                    m("div", { "class": "text-black" },
                                        [
                                            m("div", { "class": "d-flex flex-row justify-content-center align-items-center" }, m("img", {
                                                src: "assets/media/washer-logo.png",
                                                style: {
                                                    "max-width": "30%"
                                                }
                                            })),
                                            m("h1", { "class": "mb-3" },
                                                `Wellcome to Wellwash.Online, we are reffering you to whatsapp in a minute, ${vnode.attrs.REFEERED_BY} will Get 25% of your order`
                                            ),
                                            m("h4", { "class": "mb-3" },
                                                "We cant wait to serve you"
                                            ),
                                            m("h4", { "class": "mb-3" },
                                                "For further tracking please check the details on the messages that you receive."
                                            ),
                                            m("h5", { "class": "mb-3" },
                                                "Make sure to sign in with google and to keep all your order history"
                                            )
                                        ]
                                    )
                                )
                            )
                        )


                        // order ends here 
                    ]
                )
            )
        },
    }
}

export default chat;