// src/utils/validateSignup.js

// Pure, framework-free validation for the signup form. Returns a
// fieldErrors-shaped object: {} means valid.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateSignup({ name, email, password, confirmPassword }) {
    const errors = {};

    const trimmedName = (name || '').trim();
    if (trimmedName.length < 2 || trimmedName.length > 60) {
        errors.name = 'Name must be between 2 and 60 characters.';
    }

    const trimmedEmail = (email || '').trim();
    if (!trimmedEmail) {
        errors.email = 'Email is required.';
    } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
        errors.email = 'Enter a valid email address.';
    }

    if (!password) {
        errors.password = 'Password is required.';
    } else if (password.length < 12) {
        errors.password = 'Password must be at least 12 characters.';
    }

    if (!confirmPassword) {
        errors.confirmPassword = 'Please confirm your password.';
    } else if (confirmPassword !== password) {
        errors.confirmPassword = 'Passwords do not match.';
    }

    return errors;
}