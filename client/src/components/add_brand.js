import axios from "axios";

import {
    url,
} from "../constants"

import m from "mithril"


const AddBrandForm = {
    showModal: false,
    unitType: '',
    formData: {
        title: '',
        image: '',
    },

    openModal: function () {
        this.showModal = true;
    },

    closeModal: function () {
        this.showModal = false;
    },

    handleInputChange: function (field, value) {
        this.formData[field] = value;
    },

    handleSubmit: function () {
        // Handle form submission logic here
        console.log('Form Submitted:', this.formData);
        const fileInput = document.getElementById('logoInput');
        const file = fileInput.files[0];
    
        if (file) {
            const reader = new FileReader();
    
            reader.onloadend = function () {
                // Get the base64 string without the data:image/png;base64, prefix
                const base64String = reader.result.split(',')[1]; 
    
                // Call the function to upload the base64 string to the server using Axios
                this.formData.image = base64String;
            };
    
            reader.readAsDataURL(file);
        } 

        const options = {
            method: 'POST',
            url: `${url}/brands/`,
            headers: {
                'Content-Type': 'application/json',
                'authorization': localStorage.getItem('token')
            },
            data: this.formData,
        };

        axios.request(options).then(function (response) {
            console.log(response.data);
            location.reload()
        }).catch(function (error) {
            console.error(error);
        });

        // Close the modal after submission
        // this.closeModal();
    },

    view: function () {
        return m('div', [
            // Open Modal Button
            m('button', { "class": "btn btn-lg btn-info", onclick: () => this.openModal() }, [
                m("i", { "class": "flaticon-add-circular-button" }),
                "Add Brand"
            ]),

            // Modal
            this.showModal && m('.modal', [
                m('.modal-content', [
                    m("div", { "class": "row" }, [
                        m("div", { "class": "col-11" }, [
                            m('h4', 'Add Brand'),
                        ]),
                        m("div", { "class": "col-1" }, [
                            m('span', { onclick: () => this.closeModal(), class: 'close' }, 'x'),
                        ]),
                        m("span", { "class": "border-bottom mb-4" }),
                        m("div", { "class": "col-12 my-2" }, [
                            m('label', 'Title:'),
                            m('input[type=text]', {
                                "class": "form-control form-control-solid",
                                "placeholder": "Enter title",
                                value: this.formData.title,
                                oninput: (e) => this.handleInputChange('title', e.target.value),
                            }),
                        ]),
                        m("div", { "class": "col-12 my-2" }, [
                            m('label', 'Logo:'),
                            m('input[type=file]', {
                                "class": "form-control form-control-solid",
                                "id": "logoInput",
                                "placeholder": "Upload logo",
                            }),
                        ]),
                        m("span", { "class": "border-top mt-4" }),
                        m("div", { "class": "pt-2 align-right" }, [
                            m('button', { "class": "btn btn-danger font-weight-bolder font-size-sm px-6 mr-3", onclick: () => this.closeModal() }, 'Close'),
                            m('button', { "class": "btn btn-info font-weight-bolder font-size-sm px-6", onclick: () => this.handleSubmit() }, 'Save'),
                        ])
                    ]),
                ]),
            ]),
        ]);
    },
};

export default AddBrandForm;
