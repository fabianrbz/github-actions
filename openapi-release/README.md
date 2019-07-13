# Release OpenAPI on Push

Whenever we make a change to an OpenAPI document we'd like Github to tag a
release. This can be used by people watching the repo, but also as a hook for
other Github actions.

## Usage

Add the following to `.github/main.workflow`:

```
workflow "OpenAPI Release" {
  resolves = ["Release OAS"]
  on = "push"
}

action "Release OAS" {
  uses = "nexmo/github-actions/openapi-release"
  secrets = [
    "GH_ADMIN_TOKEN"
  ]
}
```

## Configuration

* `GH_ADMIN_TOKEN` - a custom github token to use to make API requests. This is needed as if Github actions creates a release, it doesn't trigger the release event for actions
* `OAS_RELEASE_ACTIVE_BRANCH` - check if the push was to this branch before continuing (usually `master`)
