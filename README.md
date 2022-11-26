# JSCrypt

A simple password manager written using electron and JS. **This package is not intended for end-users, and is only a proof-of-concept to demonstrate how such an application can be created using electron.**

## Setup

Install dependencies with:

`npm install`

Then to create the JSCrypt distributable:

`npx electron-packager . jscrypt`

You will need to create an empty directory located at `%userData%/jscrypt/Store/` to store saved passwords.
