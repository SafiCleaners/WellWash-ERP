import m from 'mithril';
import moment from 'moment';

const displayFormat = 'ddd, Do MMM YYYY';
const rangeDisplayFormat = 'Do MMM'
const storageFormat = 'YYYY-MM-DD';

let deferredPrompt


export const DateRangePicker = {
    oninit: (vnode) => {
        // Function to retrieve query parameters from URL
        const queryParams = m.parseQueryString(window.location.search.substring(1));

        // Retrieve values from query parameters or use defaults
        const businessDateQueryParam = queryParams.businessDate || '';
        const businessRangeStartDateQueryParam = queryParams.businessRangeStartDate || '';
        const businessRangeEndDateQueryParam = queryParams.businessRangeEndDate || '';
        const storeIdQueryParam = queryParams.storeId || '';

        // Retrieve values from localStorage if available
        const storedBusinessDate = localStorage.getItem('businessDate') || '';
        const storedBusinessRangeStartDate = localStorage.getItem('businessRangeStartDate') || '';
        const storedBusinessRangeEndDate = localStorage.getItem('businessRangeEndDate') || '';
        const storedStoreId = localStorage.getItem('storeId') || '';

        // Set component state based on query parameters or localStorage values
        vnode.state.businessDate = businessDateQueryParam || storedBusinessDate || '';
        vnode.state.businessRangeStartDate = businessRangeStartDateQueryParam || storedBusinessRangeStartDate || '';
        vnode.state.businessRangeEndDate = businessRangeEndDateQueryParam || storedBusinessRangeEndDate || '';
        vnode.state.storeId = storeIdQueryParam || storedStoreId || '';

        // Update localStorage with the latest values if retrieved from query parameters
        if (businessDateQueryParam) {
            localStorage.setItem('businessDate', businessDateQueryParam);
        }
        if (businessRangeStartDateQueryParam) {
            localStorage.setItem('businessRangeStartDate', businessRangeStartDateQueryParam);
        }
        if (businessRangeEndDateQueryParam) {
            localStorage.setItem('businessRangeEndDate', businessRangeEndDateQueryParam);
        }
        if (storeIdQueryParam) {
            localStorage.setItem('storeId', storeIdQueryParam);
        }
    },
    onremove: (el) => {
        // console.log("removing range")
        jQuery(`#range`).daterangepicker('remove');
        jQuery(`#single`).daterangepicker('remove');
    },
    view(vnode) {
        const attrs = vnode.attrs;

        const currentRoute = window.location.href;
        // console.log('Current Route:', currentRoute);

        // console.log(vnode.state)

        if (currentRoute.includes('dash')) {
            return m('input', {
                ...attrs,
                "id":"range",
                "placeholder": "Select Business Date Range:",
                // value: `${vnode.state.selectedStartDate} - ${vnode.state.selectedEndDate}`,
                oncreate: (el) => {
                    const datepickerOptions = {
                        singleDatePicker: false,
                        showDropdowns: true,
                        minYear: 2022,
                        maxYear: moment().add(1, 'month').year(),
                        locale: {
                            format: rangeDisplayFormat
                        },
                        opens: 'left',
                    };

                    vnode.state.selectedStartDate ? Object.assign(datepickerOptions,{
                        startDate: vnode.state.selectedStartDate,
                        endDate: vnode.state.selectedEndDate
                    }) : null

                    jQuery(`#range`).daterangepicker(datepickerOptions, (start, end, label) => {
                        const formattedStartDate = start.format(rangeDisplayFormat);
                        const formattedEndDate = end.format(rangeDisplayFormat);
                    
                        const storageFormattedStartDate = start.format(storageFormat);
                        const storageFormattedEndDate = end.format(storageFormat);
                    
                        vnode.state.selectedStartDate = formattedStartDate;
                        vnode.state.selectedEndDate = formattedEndDate;
                    
                        // Retrieve existing query parameters from the URL
                        const urlSearchParams = new URLSearchParams(window.location.search);
                    
                        // Preserve existing storeId if it exists in the URL
                        const storeId = urlSearchParams.get('storeId');
                    
                        // Set or update the businessRangeStartDate and businessRangeEndDate query parameters
                        urlSearchParams.set('businessRangeStartDate', storageFormattedStartDate);
                        urlSearchParams.set('businessRangeEndDate', storageFormattedEndDate);
                    
                        // If storeId exists, set it back into the updated URLSearchParams
                        if (storeId) {
                            urlSearchParams.set('storeId', storeId);
                        }
                    
                        // Construct the updated URL with the new query parameters
                        const updatedUrl = `${window.location.pathname}?${urlSearchParams.toString()}`;
                    
                        // Replace the current URL with the updated URL containing the modified query parameters
                        window.history.replaceState({}, '', updatedUrl);
                    
                        // Update localStorage with the selected date range
                        localStorage.setItem("businessRangeStartDate", storageFormattedStartDate);
                        localStorage.setItem("businessRangeEndDate", storageFormattedEndDate);
                    
                        // Trigger onChange event with formatted date range
                        attrs.onChange(`${formattedStartDate} - ${formattedEndDate}`);
                    });
                    
                    

                    // Remove the <div class="ranges"></div> element
                    setTimeout(() => {
                        jQuery(`.ranges`).remove();
                        jQuery('.daterangepicker').css('z-index', 10000);
                    }, 1000);
                },
               
            })
        }

        return m('input', {
            ...attrs,
            id: "single",
            "placeholder": "Select Business Date:",
            value: vnode.state.selectedDate,
            oncreate: (el) => {
                const datepickerOptions = {
                    singleDatePicker: true,
                    showDropdowns: true,
                    minYear: 2022,
                    maxYear: moment().add(1, 'day').year(),
                    locale: {
                        format: displayFormat
                    },
                    opens: 'left',
                };

                jQuery(`#single`).daterangepicker(datepickerOptions, (start, end, label) => {
                    // Format the date for display using the custom format
                    const formattedDate = start.format(displayFormat);
                
                    // Format the date for storage using the standard format
                    const storageFormattedDate = start.format(storageFormat);
                
                    // Set the formatted date in the component state
                    vnode.state.selectedDate = formattedDate;
                
                    // Save the selectedDate to localStorage in the standard format
                    localStorage.setItem("businessDate", storageFormattedDate);
                
                    // Update the URL query parameter with the selected date
                    const urlSearchParams = new URLSearchParams(window.location.search);
                    urlSearchParams.set('businessDate', storageFormattedDate);
                
                    // Construct the updated URL with the new query parameters
                    const updatedUrl = `${window.location.pathname}?${urlSearchParams.toString()}`;
                
                    // Replace the current URL with the updated URL containing the modified query parameter
                    window.history.replaceState({}, '', updatedUrl);
                
                    // Call onChange with the formatted date
                    attrs.onChange(formattedDate);
                });
                

                // Remove the <div class="ranges"></div> element
                setTimeout(() => {
                    jQuery(`.ranges`).remove();
                    jQuery('.daterangepicker').css('z-index', 10000);
                }, 1000);
            },
            
        })
    }
};