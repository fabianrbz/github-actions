const { Toolkit } = require("actions-toolkit");
const Octokit = require("@octokit/rest");
const fetch = require("node-fetch");

(async () => {
  const owner = process.env.PR_TARGET_ORG;
  const repo = process.env.PR_TARGET_REPO;
  const submodulePath = process.env.PR_SUBMODULE_PATH;
  const targetBranch = process.env.PR_TARGET_BRANCH;
  const automationBranchName = process.env.PR_BRANCH_NAME;
  const prTitle = process.env.PR_TITLE;
  const requiredActiveBranch = process.env.PR_ACTIVE_BRANCH;

  const tools = new Toolkit({
    event: "push",
    secrets: ["GH_ADMIN_TOKEN"]
  });

  tools.log.debug(`Job configuration:`);
  tools.log.debug(`---------------------------`);
  tools.log.debug(`Required active branch: ${requiredActiveBranch}`);
  tools.log.debug(`Target Org: ${owner}`);
  tools.log.debug(`Target Repo: ${repo}`);
  tools.log.debug(`Target Submodule Path: ${submodulePath}`);
  tools.log.debug(`Target branch name: ${targetBranch}`);
  tools.log.debug(`New branch name: ${automationBranchName}`);
  tools.log.debug(`New PR title: ${prTitle}`);
  tools.log.debug(`---------------------------`);

  // Make sure that this is a push to the target branch (usually master)
  tools.log.info(`Running on ${tools.context.ref}`);
  if (tools.context.ref != `refs/heads/${requiredActiveBranch}`) {
    tools.exit.failure(
      `Expected refs/heads/${requiredActiveBranch}, got ${tools.context.ref}`
    );
  }

  // Overwrite the access token to be one with more permissions
  tools.github = new Octokit({ auth: process.env.GH_ADMIN_TOKEN });

  tools.log.pending("Fetching commit data");
  const newCommitHash = tools.context.payload.after;

  tools.log.complete("Available data:");
  tools.log.complete(`Commit: ${newCommitHash}`);

  try {
    tools.log.pending(`Fetching ${targetBranch} branch info`);
    const targetBranchSha = (await tools.github.repos.getBranch({
      owner,
      repo,
      branch: targetBranch
    })).data.commit.sha;
    tools.log.complete(`Current ${targetBranch}: ${targetBranchSha}`);

    tools.log.pending("Updating submodule");
    const updatedCommitSha = (await tools.github.git.createTree({
      base_tree: targetBranchSha,
      owner,
      repo,
      tree: [
        {
          path: submodulePath,
          mode: "160000",
          type: "commit",
          sha: newCommitHash
        }
      ]
    })).data.sha;
    tools.log.complete(`New submodule: ${newCommitHash}`);

    // Committing tree
    tools.log.pending(`Committing SHA: ${updatedCommitSha}`);
    const commit = await tools.github.git.createCommit({
      owner,
      repo,
      message: prTitle,
      tree: updatedCommitSha,
      parents: [targetBranchSha]
    });
    tools.log.complete(`SHA committed: ${updatedCommitSha}`);

    // Check if the branch exists
    let ref = `heads/${automationBranchName}`;
    const branchAlreadyExists = (await tools.github.git.listRefs({
      owner,
      repo,
      namespace: ref
    })).data.length;

    // If not, create it, otherwise update it
    let action;
    let baseRef;
    if (!branchAlreadyExists) {
      tools.log.pending("Creating branch");
      action = "createRef";
      baseRef = "refs/";
    } else {
      tools.log.pending("Updating branch");
      baseRef = "";
      action = "updateRef";
    }

    await tools.github.git[action]({
      owner,
      repo,
      force: true,
      ref: baseRef + ref,
      sha: commit.data.sha
    });
    tools.log.complete("Branch updated");

    // Create a PR with this commit hash if it doesn't exist
    const prAlreadyExists = (await tools.github.pulls.list({
      owner,
      repo,
      head: `${owner}:${automationBranchName}`
    })).data.length;

    if (!prAlreadyExists) {
      tools.log.pending("Creating PR");
      const pr = await tools.github.pulls.create({
        owner,
        repo,
        title: prTitle,
        head: automationBranchName,
        base: targetBranch
      });
      tools.log.success("PR created");
    } else {
      tools.log.warn("PR already exists. Not creating another");
    }
  } catch (e) {
    console.log(e);
    tools.exit.failure("Error updating submodule");
  }
})();
