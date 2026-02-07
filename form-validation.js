/**
 * Shared Form Validation Utilities
 * Straatambassadeurs Vathorst & Hooglanderveen
 */

const FormValidation = {
    // ========================
    // Phone validation (Dutch)
    // ========================
    isValidPhone(value) {
        const stripped = value.replace(/[\s\-]/g, '');
        // +31 6 XXXXXXXX (12 digits with +31)
        if (/^\+316\d{8}$/.test(stripped)) return true;
        // 06 XXXXXXXX (10 digits)
        if (/^06\d{8}$/.test(stripped)) return true;
        return false;
    },

    // ========================
    // Email validation
    // ========================
    isValidEmail(value) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
    },

    // ========================
    // IBAN validation (NL)
    // ========================
    isValidIBAN(value) {
        const clean = value.replace(/\s/g, '').toUpperCase();
        if (clean.length !== 18) return false;
        if (!clean.startsWith('NL')) return false;
        if (!/^[A-Z]{2}\d{2}[A-Z]{4}\d{10}$/.test(clean)) return false;
        // Mod-97 checksum
        return this.mod97Check(clean);
    },

    mod97Check(iban) {
        // Move first 4 chars to end
        const rearranged = iban.substring(4) + iban.substring(0, 4);
        // Convert letters to numbers (A=10, B=11, ..., Z=35)
        let numStr = '';
        for (const ch of rearranged) {
            if (ch >= 'A' && ch <= 'Z') {
                numStr += (ch.charCodeAt(0) - 55).toString();
            } else {
                numStr += ch;
            }
        }
        // Mod 97 on large number (process in chunks)
        let remainder = 0;
        for (let i = 0; i < numStr.length; i++) {
            remainder = (remainder * 10 + parseInt(numStr[i])) % 97;
        }
        return remainder === 1;
    },

    formatIBAN(value) {
        const clean = value.replace(/\s/g, '').toUpperCase();
        // Format as: NL00 BANK 0000 0000 00
        return clean.replace(/(.{4})/g, '$1 ').trim();
    },

    // ========================
    // Error display helpers
    // ========================
    showError(field, message) {
        this.clearError(field);
        field.classList.add('field-error');
        const errorEl = document.createElement('div');
        errorEl.className = 'error-msg';
        errorEl.textContent = message;
        // Insert after the field (or after field-hint if present)
        const hint = field.parentElement.querySelector('.field-hint');
        if (hint) {
            hint.insertAdjacentElement('afterend', errorEl);
        } else {
            field.insertAdjacentElement('afterend', errorEl);
        }
    },

    clearError(field) {
        field.classList.remove('field-error');
        const existing = field.parentElement.querySelector('.error-msg');
        if (existing) existing.remove();
    },

    // Show error for checkbox (special case)
    showCheckboxError(container, message) {
        this.clearCheckboxError(container);
        container.classList.add('checkbox-error');
        const errorEl = document.createElement('div');
        errorEl.className = 'error-msg';
        errorEl.textContent = message;
        container.insertAdjacentElement('afterend', errorEl);
    },

    clearCheckboxError(container) {
        container.classList.remove('checkbox-error');
        const existing = container.parentElement.querySelector('.error-msg');
        if (existing) existing.remove();
    },

    // ========================
    // Validation runners
    // ========================
    validateRequired(field, label, minLength = 1) {
        const val = field.value.trim();
        if (!val) {
            this.showError(field, `${label} is verplicht`);
            return false;
        }
        if (val.length < minLength) {
            this.showError(field, `${label} moet minimaal ${minLength} tekens zijn`);
            return false;
        }
        this.clearError(field);
        return true;
    },

    validatePhone(field) {
        const val = field.value.trim();
        if (!val) {
            this.showError(field, 'Telefoonnummer is verplicht');
            return false;
        }
        if (!this.isValidPhone(val)) {
            this.showError(field, 'Ongeldig telefoonnummer (bijv. 06-12345678 of +31612345678)');
            return false;
        }
        this.clearError(field);
        return true;
    },

    validateEmailRequired(field) {
        const val = field.value.trim();
        if (!val) {
            this.showError(field, 'E-mailadres is verplicht');
            return false;
        }
        if (!this.isValidEmail(val)) {
            this.showError(field, 'Ongeldig e-mailadres');
            return false;
        }
        this.clearError(field);
        return true;
    },

    validateEmailOptional(field) {
        const val = field.value.trim();
        if (!val) {
            this.clearError(field);
            return true; // Optional, empty is fine
        }
        if (!this.isValidEmail(val)) {
            this.showError(field, 'Ongeldig e-mailadres');
            return false;
        }
        this.clearError(field);
        return true;
    },

    validateIBAN(field) {
        const val = field.value.trim();
        if (!val) {
            this.showError(field, 'IBAN is verplicht');
            return false;
        }
        if (!this.isValidIBAN(val)) {
            const clean = val.replace(/\s/g, '').toUpperCase();
            if (!clean.startsWith('NL')) {
                this.showError(field, 'IBAN moet beginnen met NL');
            } else if (clean.length !== 18) {
                this.showError(field, 'IBAN moet 18 tekens zijn (zonder spaties)');
            } else {
                this.showError(field, 'Ongeldig IBAN nummer');
            }
            return false;
        }
        this.clearError(field);
        return true;
    },

    // ========================
    // Attach blur listeners
    // ========================
    attachBlurValidation(field, validatorFn) {
        field.addEventListener('blur', () => validatorFn());
        // Clear error on input
        field.addEventListener('input', () => {
            if (field.classList.contains('field-error')) {
                this.clearError(field);
            }
        });
    }
};
