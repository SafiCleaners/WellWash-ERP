// daterangepicker.js
import m from 'mithril';

export const DateRangePicker = {
    oninit(vnode) {
        vnode.state.selectedDate = null;
    },
    view(vnode) {
        const attrs = vnode.attrs; // Access attributes from vnode
        console.log(attrs);
        return m('input', {
            ...attrs, // Apply all attributes to the input element
            "placeholder": "Select filter date:",
            value: vnode.state.selectedDate,
            oncreate: (el) => {
                jQuery(`#${attrs.id}`).daterangepicker({
                    singleDatePicker: true,
                    showDropdowns: true,
                    minYear: 2022,
                    maxYear: moment().add(1, 'year').year(),
                    locale: {
                        format: 'YYYY-MM-DD'
                    },
                    opens: 'left',
                }, (start, end, label) => {
                    // console.log({ start: start.format('YYYY-MM-DD'), end: start.format('YYYY-MM-DD') })
                    vnode.state.selectedDate = start;
                    attrs.onChange(start.format('YYYY-MM-DD'))
                });
            },
            onremove: (el) => {
                jQuery(`#${attrs.id}`).daterangepicker('remove')
            },
        });
    },
};
