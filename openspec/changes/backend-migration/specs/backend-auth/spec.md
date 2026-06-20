# Backend Auth Specification

## Purpose

Define session authentication and account flows for the custom backend.

## Requirements

### Requirement: Cookie session authentication

The system MUST authenticate users with httpOnly cookie-backed sessions and expose the current user profile to the frontend.

#### Scenario: Current user lookup

- GIVEN a valid session cookie
- WHEN the client requests the current user
- THEN the API returns user id, email, display name, and avatar URL when available.

#### Scenario: Expired session

- GIVEN an expired or missing session cookie
- WHEN the client requests the current user
- THEN the API returns 401 with a stable error code.

### Requirement: Supported sign-in and verification flows

The system MUST support email/password auth, Google OAuth, OTP email verification, and a three-step password reset flow.

#### Scenario: Password reset success

- GIVEN a registered user receives a reset OTP
- WHEN the user requests reset, verifies the OTP, and confirms a new password
- THEN the password is changed and the reset token cannot be reused.

#### Scenario: Invalid reset verification

- GIVEN an invalid or expired reset OTP
- WHEN the user verifies the OTP
- THEN the API rejects the request with a stable validation error.

### Requirement: Avatar upload

The system MUST allow an authenticated user to upload an image avatar and persist the resulting avatar URL in their profile.

#### Scenario: Valid avatar upload

- GIVEN an authenticated user and a valid image file
- WHEN the user uploads the avatar
- THEN the API stores it and returns the new avatar URL.

#### Scenario: Invalid avatar upload

- GIVEN an authenticated user and a non-image file
- WHEN the user uploads the avatar
- THEN the API rejects it with a validation error.
