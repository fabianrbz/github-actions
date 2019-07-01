# Auto-raise Github PRs on commit to master

We use submodules for some of our projects to allow for a single soure of truth. Keeping our main project up to date with these changes can be quite painful. This action runs on `push` to a repo's master branch, and updates the submodule in another repo automatically and raises a pull request

## Usage

Add the following to `.github/main.workflow`:

```
workflow "Push" {
  resolves = ["Update Submodules"]
  on = "push"
}

action "Update Submodules" {
  uses = "@TODO"
  secrets = [
    "GH_ADMIN_TOKEN",
  ]
}
```

## Configuration

* `GH_ADMIN_TOKEN` - a custom github token to use to make API requests. The default `GITHUB_TOKEN` provided is scoped to the current repo, and we want to change other repos
* `PR_TARGET_ORG` - the name of the organisation that owns the repo that a PR will be created on
* `PR_TARGET_REPO` - the name of the repo that a PR will be created on
* `PR_SUBMODULE_PATH` - the path to the submodule that needs updating
* `PR_BRANCH_NAME` - the name of the branch to create when updating submodules
* `PR_TITLE` - the title to use for the PR. This will also be your commit message
* `PR_TARGET_BRANCH` - the branch that we want to merge our PR in to
* `PR_ACTIVE_BRANCH` - check if the push was to this branch before continuing (usually `master`)
