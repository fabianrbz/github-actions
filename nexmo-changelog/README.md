# Headway Changelog

This action is triggered whenever a new release is created on Github and copies the text from the Release notes to our public changelog. This enables changelogs to be shared from both public and private repos in a single place.

When creating a release, the release title should generally be a version number (we'll automatically add the repo name when creating a changelog entry). The content you add in `Describe this release` will be used directly, so make sure to write good release notes.

Here's a suggested format (feel free to delete any sections you don't need):

````
# BREAKING CHANGES

#### Replaced the Foobit with a Barbit

Previously you did X:

```javascript
// foo
```

Now you need to do Y:

```javascript
// bar
```

# New

* Added the WuzzBit to FooBit
* Emit new FizzEvent when user joins

```javascript
listener.on('fizz', (event) => {
    // Handle event
});
```

* Did some other thing

# Fixes

* `event` now consistently contains the `type` field
* Fix `this` scope binding for Media objects

````

## Installation

Create a file at `.github/main.workflow` with the following contents:

```hcl
workflow "New release" {
  on = "release"
  resolves = ["Add Changelog"]
}

action "Add Changelog" {
  uses = "nexmo/github-actions/headway-changelog@master"
  secrets = ["HEADWAY_USERNAME", "HEADWAY_PASSWORD"]
  env = {
    HEADWAY_CATEGORY = "YOUR_CATEGORY (see below)"
  }
}
```

Make sure to set a category and to set any additional environment variables (see below) if required e.g. `DISABLE_REPO_LINK`

## Configuration

To use this action you must configure the username/password as secrets, and *may* configure the behaviour of the action using environment variables

### Secrets

* `HEADWAY_USERNAME` - The username to log in with
* `HEADWAY_PASSWORD` - The password to log in with

### ENV variables

* `HEADWAY_RELEASE_TITLE` - Specify the title to be used for changelog entries (Defaults to the repository name)
* `HEADWAY_DISABLE_REPO_LINK` - By default a link to the release on Github is added to the changelog content. Set to `true` to disable this functionality (Defaults to `false`)
* `HEADWAY_CATEGORY` - Choose the category to use. Must be one of: `Client SDK`, `Server SDK`, `API`, `General`. (Defaults to `General`)
* `HEADWAY_AUTO_PUBLISH` - If enabled, the post will automatically be published. If not it wil be added as a draft ready for review. (Defaults to `false`)

## Troubleshooting

This action uses Puppeteer to log in and add an entry using headless Chrome. This is a temporary workaround until the API is ready. If you encounter issues, speak to @mheap


