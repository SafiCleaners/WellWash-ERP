import m from 'mithril';
import moment from 'moment';

// --- Constants for configuration and formats ---
const DISPLAY_FORMAT_SINGLE = 'ddd, Do MMM YYYY';
const DISPLAY_FORMAT_RANGE = 'Do MMM';
const STORAGE_FORMAT = 'YYYY-MM-DD';

// --- Helper function to update URL and localStorage ---
const updateUrlAndStorage = (params) => {
    const urlSearchParams = new URLSearchParams(window.location.search);

    // Preserve existing storeId if it exists
    const storeId = urlSearchParams.get('storeId');

    // Update params
    Object.keys(params).forEach(key => {
        if (params[key]) {
            urlSearchParams.set(key, params[key]);
            localStorage.setItem(key, params[key]);
        } else {
            urlSearchParams.delete(key);
            localStorage.removeItem(key);
        }
    });
    
    if (storeId) {
        urlSearchParams.set('storeId', storeId);
    }

    const updatedUrl = `${window.location.pathname}?${urlSearchParams.toString()}`;
    window.history.replaceState({}, '', updatedUrl);
};


export const DateRangePicker = {
    oninit: (vnode) => {
        vnode.state.isRange = window.location.href.includes('dash');
        const queryParams = m.parseQueryString(window.location.search);
        
        // --- Simplified State Initialization ---
        // Priority: URL Query -> localStorage -> Default
        if (vnode.state.isRange) {
            const startDateStr = queryParams.businessRangeStartDate || localStorage.getItem('businessRangeStartDate');
            const endDateStr = queryParams.businessRangeEndDate || localStorage.getItem('businessRangeEndDate');
            
            // Set state for the input's display value
            vnode.state.selectedStartDate = startDateStr ? moment(startDateStr, STORAGE_FORMAT) : moment();
            vnode.state.selectedEndDate = endDateStr ? moment(endDateStr, STORAGE_FORMAT) : moment();
        } else {
            const dateStr = queryParams.businessDate || localStorage.getItem('businessDate');
            
            // Set state for the input's display value
            vnode.state.selectedDate = dateStr ? moment(dateStr, STORAGE_FORMAT) : moment();
        }
    },

    onremove: () => {
        // Use a more specific selector to avoid conflicts
        jQuery(`#date-picker-input`).daterangepicker('remove');
    },
    
    // --- Render function for the single date picker ---
    renderSinglePicker(vnode) {
        const { attrs } = vnode;

        const datepickerOptions = {
            singleDatePicker: true,
            showDropdowns: true,
            minYear: 2022,
            maxYear: moment().add(1, 'day').year(),
            locale: { format: DISPLAY_FORMAT_SINGLE },
            opens: 'left',
            startDate: vnode.state.selectedDate, // FIX: Set the initial date
        };

        return m('input#date-picker-input', {
            ...attrs,
            placeholder: "Select Business Date:",
            // FIX: Display the formatted initial date
            value: vnode.state.selectedDate.format(DISPLAY_FORMAT_SINGLE),
            oncreate: (el_vnode) => {
                jQuery(el_vnode.dom).daterangepicker(datepickerOptions, (start) => {
                    const storageFormattedDate = start.format(STORAGE_FORMAT);
                    
                    updateUrlAndStorage({ businessDate: storageFormattedDate });
                    
                    // Manually update state and trigger redraw for Mithril
                    vnode.state.selectedDate = start;
                    m.redraw(); 

                    if (attrs.onChange) {
                        attrs.onChange(storageFormattedDate);
                    }
                });
            },
        });
    },
    
    // --- Render function for the date range picker ---
    renderRangePicker(vnode) {
        const { attrs } = vnode;

        const datepickerOptions = {
            showDropdowns: true,
            minYear: 2022,
            maxYear: moment().add(1, 'month').year(),
            locale: { format: DISPLAY_FORMAT_RANGE },
            opens: 'left',
            // FIX: Set the initial date range
            startDate: vnode.state.selectedStartDate,
            endDate: vnode.state.selectedEndDate,
            // IMPROVEMENT: Disable ranges UI via option, not timeout hack
            ranges: {} 
        };

        return m('input#date-picker-input', {
            ...attrs,
            placeholder: "Select Business Date Range:",
            // FIX: Display the formatted initial range
            value: `${vnode.state.selectedStartDate.format(DISPLAY_FORMAT_RANGE)} - ${vnode.state.selectedEndDate.format(DISPLAY_FORMAT_RANGE)}`,
            oncreate: (el_vnode) => {
                jQuery(el_vnode.dom).daterangepicker(datepickerOptions, (start, end) => {
                    const storageFormattedStartDate = start.format(STORAGE_FORMAT);
                    const storageFormattedEndDate = end.format(STORAGE_FORMAT);
                    
                    updateUrlAndStorage({
                        businessRangeStartDate: storageFormattedStartDate,
                        businessRangeEndDate: storageFormattedEndDate
                    });

                    // Manually update state and trigger redraw for Mithril
                    vnode.state.selectedStartDate = start;
                    vnode.state.selectedEndDate = end;
                    m.redraw();
                    
                    if (attrs.onChange) {
                        attrs.onChange({ 
                            start: storageFormattedStartDate, 
                            end: storageFormattedEndDate 
                        });
                    }
                });
            },
        });
    },

    view(vnode) {
        // Delegate rendering to the appropriate function
        if (vnode.state.isRange) {
            return this.renderRangePicker(vnode);
        }
        return this.renderSinglePicker(vnode);
    }
};