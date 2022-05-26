import m from "mithril"
import {
    url
} from "../constants"
import { post, patch } from 'axios';


const fileUpload = (file) => {
    const formData = new FormData();
    formData.append('upload', file)
    const config = {
        headers: {
            'content-type': 'multipart/form-data'
        }
    }
    return post(url + "/upload", formData, config)
}

export default {
    oninit(vnode){
        vnode.state.state = "Waiting to upload."
    },
    view(vnode) {
        const {
            jobID,
            job,
            field,
            cb,
            uploadedFile
        } = vnode.attrs

        const {
            file
        } = vnode.state
        return m("div", { "class": "custom-file" },
            [
                m("input", {
                    "class": "custom-file-input", "type": "file", "id": "customFile",
                    async onchange(e) {
                        const file = e.target.files[0]
                        vnode.state.state = "uploading file..."
                        await fileUpload(file)
                        patch(url + "/jobs/" + jobID, {
                            [field]: `https://temp-uploads-storage.fra1.digitaloceanspaces.com/${file.name}`
                        }).then(function (response) {
                            // location.reload()
                            m.redraw()
                            vnode.state.state = "upload compleate &#128076;"
                            cb(`https://temp-uploads-storage.fra1.digitaloceanspaces.com/${file.name}`)
                        }).catch(function (error) {
                            vnode.state.state = `upload failed - ${error}`
                            console.error(error);
                        });
                    }
                }),
                m("label", { "class": "custom-file-label", "for": "customFile" },
                    "Choose file"
                ),

                file && m("a", { href: `https://temp-uploads-storage.fra1.digitaloceanspaces.com/${file.name}` }, `Download ${file.name}`),
                uploadedFile && m("a", { href: uploadedFile }, `Download ${uploadedFile.split("/").pop()}`),
                // job && job[field] && m("a", { href: job[field] }, `Download last Uploaded file`),
                m("i",!uploadedFile ? vnode.state.state : ""),
            ]
        )
    }
}