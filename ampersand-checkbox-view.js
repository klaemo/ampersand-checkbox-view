/*$AMPERSAND_VERSION*/
var View = require('ampersand-view');
var domify = require('domify');
var dom = require('ampersand-dom');


// can be overwritten by anything with:
// <input>, <label> and the same `data-hook` attributes
var template = [
    '<label class="checkbox">',
        '<input type="checkbox"><span data-hook="label"></span>',
        '<div data-hook="message-container" class="message message-below message-error">',
            '<p data-hook="message-text"></p>',
        '</div>',
    '</label>'
].join('');

module.exports = View.extend({
    initialize: function(opts) {
        if (!opts || !opts.name) throw new Error('must pass in a name');

        // settings
        this.el = opts.el;
        this.name = opts.name;
        this.startingValue = !!opts.value;
        this.value = this.startingValue;
        this.label = opts.label || opts.name;
        this.required = (typeof opts.required === 'boolean') ? opts.required : false;
        this.validClass = opts.validClass || 'input-valid';
        this.invalidClass = opts.invalidClass || 'input-invalid';
        this.requiredMessage = opts.requiredMessage || 'This box must be checked.';
        this.parent = opts.parent || this.parent;
        this.autoRender = opts.autoRender;
        this.template = opts.template || template;
        this.beforeSubmit = opts.beforeSubmit || this.beforeSubmit;

        this.setValue(this.value);
    },
    clear: function () {
        return this.setValue(false);
    },
    reset: function () {
        return this.setValue(this.startingValue);
    },
    remove: function () {
        if (this.input) this.input.removeEventListener('change', this.handleInputEvent, false);
        View.prototype.remove.call(this);
    },
    render: function () {
        // only allow this to be called once
        if (this.rendered) return;
        var newDom = domify(this.template);
        var parent = this.el && this.el.parentNode;
        if (parent) parent.replaceChild(newDom, this.el);
        this.el = newDom;
        this.input = this.el.querySelector('input');
        this.labelEl = this.el.querySelector('[data-hook~=label]');
        this.messageContainer = this.el.querySelector('[data-hook~=message-container]');
        this.messageEl = this.el.querySelector('[data-hook~=message-text]');

        // bind event handlers
        this.handleInputEvent = this.handleInputEvent.bind(this);

        // add our event handlers
        this.input.addEventListener('change', this.handleInputEvent, false);

        this.setMessage(this.message);
        this.input.checked = !!this.value;
        this.input.name = this.name;
        this.labelEl.textContent = this.label;
    },
    // handle input events and show appropriate errors
    handleInputEvent: function () {
        // track whether user has edited directly
        if (document.activeElement === this.input) this.directlyEdited = true;
        this.value = this.input ? this.input.checked : this.value;
        this.test();
        if (this.parent) this.parent.update(this);
    },
    // set the error message if exists
    // hides the message container entirely otherwise
    setMessage: function (message) {
        var input = this.input;
        if (!input) return;
        this.message = message;
        // there is an error
        if (message && this.shouldValidate) {
            this.messageContainer.style.display = 'block';
            this.messageEl.textContent = message;
            dom.addClass(input, this.invalidClass);
            dom.removeClass(input, this.validClass);
        } else {
            this.messageContainer.style.display = 'none';
            if (this.shouldValidate && this.editedDirectly) {
                dom.addClass(input, this.validClass);
                dom.removeClass(input, this.invalidClass);
            }
        }
    },
    setValue: function (value) {
        if (this.input) this.input.checked = !!value;
        return this.handleInputEvent();
    },
    beforeSubmit: function () {
        this.shouldValidate = true;
        return this.handleInputEvent();
    },
    test: function () {
        var valid = !this.required || !!this.value;
        if (valid) this.shouldValidate = true;
        this.valid = valid;
        if (this.shouldValidate && !valid) {
            this.setMessage(this.requiredMessage);
        } else {
            this.setMessage('');
        }
        return valid;
    }
});
