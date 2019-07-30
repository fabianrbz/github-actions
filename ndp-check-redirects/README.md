# NDP Check Redirects

When deleting/renaming content on Nexmo Developer, sometimes we forget to add redirects to replacement content and customers get a 404 on their saved links. This action fails the build when it detects a rename without a redirect added

## Usage

Add the following to `.github/main.workflow`:

```
workflow "Check Redirects" {
  resolves = ["check-redirects"]
  on = "pull_request"
}

action "check-redirects" {
  uses = "nexmo/github-actions/ndp-check-redirects@master"
  secrets = [
    "GITHUB_TOKEN"
  ]
}
```

## Configuration

None required. This action is designed to work specifically with [Nexmo Developer](https://github.com/nexmo/nexmo-developer)
