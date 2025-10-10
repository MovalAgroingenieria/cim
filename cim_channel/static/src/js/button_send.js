odoo.define("cim_channel.animation", function (require) {
    "use strict";

    var ajax = require("web.ajax");
    var snippet_animation = require("website.content.snippets.animation");
    const dom = require("web.dom");
    const session = require("web.session");
    const concurrency = require("web.concurrency");
    const {_t} = require("web.core");

    snippet_animation.registry.s_website_form.include({
        /**
         * Handle tracking code response for complaints
         * @param {Object} result_data - The result data from server response
         * @param {Object} self - The form instance
         */
        _handleTrackingCodeComplaint: function (result_data, self) {
            if (!result_data.id || !result_data.tracking_code_new_complaint) {
                this.updateStatus("error");
                if (result_data.error_fields && result_data.error_fields.length) {
                    this.checkErrorFields(result_data.error_fields);
                }
            } else {
                const tracking_code_url =
                    "/tracking-code?code=" + result_data.tracking_code_new_complaint;
                window.location.href = tracking_code_url;
                self.update_status("success");
                self.$target[0].reset();
                self.restoreBtnLoading();
            }
        },

        /**
         * Handle tracking code response for communications
         * @param {Object} result_data - The result data from server response
         * @param {Object} self - The form instance
         */
        _handleTrackingCodeCommunication: function (result_data, self) {
            if (!result_data.id || !result_data.tracking_code_new_communication) {
                this.updateStatus("error");
                if (result_data.error_fields && result_data.error_fields.length) {
                    this.checkErrorFields(result_data.error_fields);
                }
            } else {
                self.update_status("success");
                self.$target[0].reset();
                self.restoreBtnLoading();
            }
        },

        /**
         * Handle form submission errors
         * @param {Object} result_data - The result data from server response
         * @param {Object} self - The form instance
         */
        _handleFormError: function (result_data, self) {
            self.update_status("error", result_data.error ? result_data.error : false);
            if (result_data.error_fields) {
                // If the server return a list of bad fields, show these fields for users
                self.check_error_fields(result_data.error_fields);
            }
        },

        /**
         * Handle successful form submission
         * @param {Object} self - The form instance
         */
        _handleFormSuccess: async function (self) {
            let successMode = self.$target[0].dataset.successMode;
            let successPage = self.$target[0].dataset.successPage;
            if (!successMode) {
                // Compatibility
                successPage = self.$target.attr("data-success_page");
                successMode = successPage ? "redirect" : "nothing";
            }
            switch (successMode) {
                case "redirect":
                    await this._handleRedirect(successPage);
                    return;
                case "message":
                    await this._handleMessage(self);
                    break;
                default:
                    await this._handleDefault(self);
                    break;
            }

            self.$target[0].reset();
            self.restoreBtnLoading();
        },

        /**
         * Handle redirect success mode
         * @param {String} successPage - The success page URL or anchor
         */
        _handleRedirect: async function (successPage) {
            let processedPage = successPage;
            let hashIndex = processedPage.indexOf("#");
            if (hashIndex > 0) {
                let currentUrlPath = window.location.pathname;
                if (!currentUrlPath.endsWith("/")) {
                    currentUrlPath += "/";
                }
                if (processedPage.includes("#") && !processedPage.includes("/#")) {
                    processedPage = processedPage.replace("#", "/#");
                    hashIndex++;
                }
                if (
                    [processedPage, "/" + session.lang_url_code + processedPage].some(
                        (link) => link.startsWith(currentUrlPath + "#")
                    )
                ) {
                    processedPage = processedPage.substring(hashIndex);
                }
            }
            if (processedPage.charAt(0) === "#") {
                const successAnchorEl = document.getElementById(
                    processedPage.substring(1)
                );
                if (successAnchorEl) {
                    await dom.scrollTo(successAnchorEl, {
                        duration: 500,
                        extraOffset: 0,
                    });
                }
                return;
            }
            $(window.location).attr("href", processedPage);
        },

        /**
         * Handle message success mode
         * @param {Object} self - The form instance
         */
        _handleMessage: async function (self) {
            await concurrency.delay(dom.DEBOUNCE);
            self.$target[0].classList.add("d-none");
            self.$target[0].parentElement
                .querySelector(".s_website_form_end_message")
                .classList.remove("d-none");
        },

        /**
         * Handle default success mode
         * @param {Object} self - The form instance
         */
        _handleDefault: async function (self) {
            await concurrency.delay(dom.DEBOUNCE);
            self.update_status("success");
        },

        /**
         * Handle Ajax response and route to appropriate handler
         * @param {String} raw_result_data - The raw JSON response from server
         * @param {jQuery} $button - The submit button element
         * @param {Object} self - The form instance
         */
        _handleAjaxResponse: async function (raw_result_data, $button, self) {
            // Restore send button behavior
            $button.removeAttr("disabled").removeClass("disabled");
            const result_data = JSON.parse(raw_result_data);

            // Check if we have tracking codes to handle
            if (this._hasTrackingCodes(result_data)) {
                this._processTrackingCodes(result_data, self);
                return;
            }

            // Check if form submission failed (no ID returned)
            if (!result_data.id) {
                this._handleFormError(result_data, self);
                return;
            }

            // Handle successful form submission
            await this._handleFormSuccess(self);
        },

        /**
         * Check if result data contains tracking codes
         * @param {Object} result_data - The result data from server response
         * @returns {Boolean} True if tracking codes are present
         */
        _hasTrackingCodes: function (result_data) {
            return (
                "tracking_code_new_complaint" in result_data ||
                "tracking_code_new_communication" in result_data
            );
        },

        /**
         * Process tracking codes in result data
         * @param {Object} result_data - The result data from server response
         * @param {Object} self - The form instance
         */
        _processTrackingCodes: function (result_data, self) {
            if ("tracking_code_new_complaint" in result_data) {
                this._handleTrackingCodeComplaint(result_data, self);
            }
            if ("tracking_code_new_communication" in result_data) {
                this._handleTrackingCodeCommunication(result_data, self);
            }
        },

        /**
         * @override
         */
        send: async function (e) {
            // Prevent the default submit behavior
            e.preventDefault();
            // Prevent users from crazy clicking
            const $button = this.$target.find(
                ".s_website_form_send, .o_website_form_send"
            );
            // !compatibility
            $button.addClass("disabled").attr("disabled", "disabled");
            this.restoreBtnLoading = dom.addButtonLoadingEffect($button[0]);

            var self = this;

            // !compatibility
            self.$target.find("#s_website_form_result, #o_website_form_result").empty();
            if (!self.check_error_fields({})) {
                self.update_status("error", _t("Please fill in the form correctly."));
                return false;
            }

            // Prepare form inputs
            this.form_fields = this.$target.serializeArray();
            $.each(
                this.$target.find("input[type=file]:not([disabled])"),
                (outer_index, input) => {
                    $.each($(input).prop("files"), function (index, file) {
                        // Index field name as ajax won't accept arrays of files
                        // when aggregating multiple files into a single field value
                        self.form_fields.push({
                            name: input.name + "[" + outer_index + "][" + index + "]",
                            value: file,
                        });
                    });
                }
            );

            // Serialize form inputs into a single object
            // Aggregate multiple values into arrays
            var form_values = {};
            _.each(this.form_fields, function (input) {
                if (input.name in form_values) {
                    // If a value already exists for this field,
                    // we are facing a x2many field, so we store
                    // the values in an array.
                    if (Array.isArray(form_values[input.name])) {
                        form_values[input.name].push(input.value);
                    } else {
                        form_values[input.name] = [
                            form_values[input.name],
                            input.value,
                        ];
                    }
                } else if (input.value !== "") {
                    form_values[input.name] = input.value;
                }
            });

            // Force server date format usage for existing fields
            this.$target
                .find(".s_website_form_field:not(.s_website_form_custom)")
                .find(".s_website_form_date, .s_website_form_datetime")
                .each(function () {
                    const inputEl = this.querySelector("input");

                    // Datetimepicker('viewDate') will return `new Date()` if the
                    // input is empty but we want to keep the empty value
                    if (!inputEl.value) {
                        return;
                    }

                    var date = $(this).datetimepicker("viewDate").clone().locale("en");
                    var format = "YYYY-MM-DD";
                    if ($(this).hasClass("s_website_form_datetime")) {
                        date = date.utc();
                        format = "YYYY-MM-DD HH:mm:ss";
                    }
                    form_values[inputEl.getAttribute("name")] = date.format(format);
                });

            if (this._recaptchaLoaded) {
                const tokenObj = await this._recaptcha.getToken("website_form");
                if (tokenObj.token) {
                    form_values.recaptcha_token_response = tokenObj.token;
                } else if (tokenObj.error) {
                    self.update_status("error", tokenObj.error);
                    return false;
                }
            }

            // Post form and handle result
            ajax.post(
                this.$target.attr("action") +
                    (this.$target.data("force_action") ||
                        this.$target.data("model_name")),
                form_values
            )
                .then(async (raw_result_data) => {
                    return this._handleAjaxResponse(raw_result_data, $button, self);
                })
                .guardedCatch((error) => {
                    this.update_status(
                        "error",
                        error.status && error.status === 413
                            ? _t("Uploaded file is too large.")
                            : ""
                    );
                });
        },
    });
});
