import m from 'mithril';
import moment from 'moment';

const displayFormat = 'ddd, Do MMM YYYY';
const storageFormat = 'YYYY-MM-DD';

export const DateRangePicker = {
    oninit(vnode) {
        // Retrieve the selectedDate from localStorage if available
        const storedDate = localStorage.getItem("businessDate");

        // Set the selectedDate in state using the display format or null if not present
        vnode.state.selectedDate = storedDate ? moment(storedDate).format(displayFormat) : null;
    },
    view(vnode) {
        const attrs = vnode.attrs;
        console.log(attrs);
        return m('input', {
            ...attrs,
            "placeholder": "Select Business Date:",
            value: vnode.state.selectedDate,
            oncreate: (el) => {
                jQuery(`#${attrs.id}`).daterangepicker({
                    singleDatePicker: true,
                    showDropdowns: true,
                    minYear: 2022,
                    maxYear: moment().add(1, 'day').day(),
                    locale: {
                        format: displayFormat
                    },
                    opens: 'left',
                }, (start, end, label) => {
                    // Format the date for display using the custom format
                    const formattedDate = start.format(displayFormat);

                    // Format the date for storage using the standard format
                    const storageFormattedDate = start.format(storageFormat);

                    console.log({storageFormattedDate})
                    // Set the formatted date in the state
                    vnode.state.selectedDate = formattedDate;

                    // Save the selectedDate to localStorage in the standard format
                    localStorage.setItem("businessDate", storageFormattedDate);

                    // Call onChange with the formatted date
                    attrs.onChange(formattedDate);
                });

                // Remove the <div class="ranges"></div> element
                setTimeout(() => {
                    jQuery(`.ranges`).remove();
                    jQuery('.daterangepicker').css('z-index', 10000);
                }, 1000);
            },
            onremove: (el) => {
                jQuery(`#${attrs.id}`).daterangepicker('remove');
            },
        });
    },
};
