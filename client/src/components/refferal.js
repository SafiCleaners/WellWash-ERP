import m from "mithril"
import axios from "axios"

import { url } from '../constants';

const refferal = () => {
    return {
        async oninit(vnode) {
            const { owned_by, discount_code, REFEERED_BY, DISCOUNT_CODE } = vnode.attrs || m.route.get();

            console.log({ owned_by, discount_code, REFEERED_BY, DISCOUNT_CODE })

            const options = {
                method: 'POST',
                url: `${url}/track-refferals`,
                headers: {
                    'Content-Type': 'application/json',
                },
                data: {
                    REFEERED_BY: REFEERED_BY || owned_by,
                    DISCOUNT_CODE: DISCOUNT_CODE || discount_code
                },
            };
            const { data: { shortId } } = await axios.request(options);

            console.log(shortId)
            const customerMessage = `Hello WELLWASH team!, 
                                        %0a%0aCould you come pick up my laundry? 
                                        %0aI was reffered to you guys by ${REFEERED_BY || owned_by} and the discount code i would like to use is ${DISCOUNT_CODE || discount_code} 
                                        %0a%0aMy Order Id is wellwash.online/q/${shortId}
                                        
                                        %0a(i will send my location pin), I am currently located ....`

            console.log({ customerMessage })
            setTimeout(() => {
                window.location.replace(`https://api.whatsapp.com/send?phone=+254701173735&text=${customerMessage}`)
            }, 6000)
        },
        view(vnode) {
            const { owned_by, discount_code, REFEERED_BY, DISCOUNT_CODE } = vnode.attrs || m.route.get();


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
                                                `Wellcome to Wellwash.Online, we are reffering you to whatsapp in a minute`, m('b', ` ${REFEERED_BY || owned_by} will Get 25% commision from your order`)
                                            ),
                                            m("h4", { "class": "mb-3" },
                                                `We cant wait to serve you, you'll get a discount `, m("b", `for using ${DISCOUNT_CODE || discount_code} as the discount code`)
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
                    ]
                )
            )
        },
    }
}

export default refferal;